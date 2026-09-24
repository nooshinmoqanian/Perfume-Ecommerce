import { CreateOrderDto } from '../dtos/create-order.dto';
import { AppError, BadRequestError } from '../errors/app-errors';
import MESSAGES from '../errors/messages';
import type { IOrderEventPublisher } from '../interfaces/order-event-publisher.interface';
import type { IOrderItemRepository } from '../interfaces/order-item-repository.interface';
import type { IOrderRepository } from '../interfaces/order-repository.interface';
import type { InventoryStatusEventPayload } from '../kafka/types';
import { Order } from '../models/order.model';
import type { Filter } from 'mongodb';
import type { OrderBuyer, OrderServiceInterface } from './order-service.interface';
import { effectiveUnitPrice, fetchProduct } from './catalog.client';
import { randomBytes } from 'crypto';

class OrderService implements OrderServiceInterface {
  private orderRepo?: IOrderRepository;
  private orderItemRepo?: IOrderItemRepository;
  private eventPublisher?: IOrderEventPublisher;

  private getOrderRepo(): IOrderRepository {
    if (!this.orderRepo) {
      throw new AppError(MESSAGES.ORDER_REPO_NOT_CONFIGURED);
    }

    return this.orderRepo;
  }

  private getOrderItemRepo(): IOrderItemRepository {
    if (!this.orderItemRepo) {
      throw new AppError(MESSAGES.ORDER_ITEM_REPO_NOT_CONFIGURED);
    }

    return this.orderItemRepo;
  }

  private getEventPublisher(): IOrderEventPublisher {
    if (!this.eventPublisher) {
      throw new AppError(MESSAGES.ORDER_EVENT_PUBLISHER_NOT_CONFIGURED);
    }

    return this.eventPublisher;
  }

  setDependencies(
    orderRepo: IOrderRepository,
    orderItemRepo: IOrderItemRepository,
    eventPublisher: IOrderEventPublisher
  ) {
    this.orderRepo = orderRepo;
    this.orderItemRepo = orderItemRepo;
    this.eventPublisher = eventPublisher;
  }

  async listOrders(filter: Filter<Order> = {}): Promise<Order[]> {
    const repo = this.getOrderRepo();

    try {
      return await repo.findAll(filter);
    } catch {
      throw new AppError(MESSAGES.ORDER_LIST_FAILED);
    }
  }

  private async persistOrder(order: Order): Promise<void> {
    const repo = this.getOrderRepo();

    try {
      await repo.create(order);
    } catch {
      throw new AppError(MESSAGES.ORDER_PERSIST_FAILED);
    }
  }

  private async persistOrderItems(order: Order): Promise<void> {
    const itemRepo = this.getOrderItemRepo();

    const items = order.items.map((it) => ({
      ...it,
      orderId: order.id,
      createdAt: new Date().toISOString(),
    }));

    try {
      await Promise.all(items.map((it) => itemRepo.create(it)));
    } catch {
      throw new AppError(MESSAGES.ORDER_ITEMS_PERSIST_FAILED);
    }
  }

  // Merge duplicate lines and price every item from the catalog.
  private async priceItems(items: CreateOrderDto['items']): Promise<Order['items']> {
    const quantities = new Map<string, number>();
    for (const it of items) {
      quantities.set(it.productId, (quantities.get(it.productId) || 0) + it.quantity);
    }

    return Promise.all(
      Array.from(quantities, async ([productId, quantity]) => {
        const product = await fetchProduct(productId);
        return { productId, name: product.name, quantity, price: effectiveUnitPrice(product) };
      })
    );
  }

  async createOrder(payload: CreateOrderDto, buyer: OrderBuyer, requestId?: string): Promise<Order> {
    const eventPublisher = this.getEventPublisher();

    this.getOrderRepo();
    this.getOrderItemRepo();

    const items = await this.priceItems(payload.items);
    const total = items.reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0);
    if (total <= 0) {
      throw new BadRequestError(MESSAGES.ORDER_EMPTY_TOTAL);
    }

    const id = `${Date.now()}-${randomBytes(3).toString('hex')}`;

    const order: Order = {
      id,
      createdAt: new Date().toISOString(),
      status: 'processing',
      cartId: payload.cartId,
      recipientName: payload.recipientName,
      phone: payload.phone,
      shippingAddress: payload.shippingAddress,
      postalCode: payload.postalCode,
      items,
      total,
      userId: buyer.id,
      customerEmail: buyer.email?.toLowerCase(),
    };

    await this.persistOrder(order);
    await this.persistOrderItems(order);

    const headers = requestId ? { 'x-request-id': requestId } : undefined;
    await eventPublisher.publishOrderCreated(order, headers, order.id);

    return order;
  }

  async handleInventoryEvent(event: InventoryStatusEventPayload): Promise<void> {
    const repo = this.getOrderRepo();

    const orderId = event.orderId;
    if (!orderId) {
      return;
    }

    if (event.status !== 'approved' && event.status !== 'partial_failed') {
      return;
    }

    const newStatus: Order['status'] = event.status === 'approved' ? 'completed' : 'failed';

    // Only a still-processing order may move on, so a redelivered event
    // can never commit the same stock twice.
    let moved: boolean;
    try {
      moved = await repo.transitionStatus(orderId, 'processing', newStatus);
    } catch {
      throw new AppError(MESSAGES.ORDER_STATUS_UPDATE_FAILED);
    }

    if (!moved) {
      console.log(`[order] Ignoring inventory event for order ${orderId}: not processing`);
      return;
    }
    console.log(`[order] Updated order ${orderId} -> ${newStatus}`);

    if (newStatus === 'completed') {
      const items = (event.items || [])
        .filter((it) => it.status === 'reserved')
        .map(({ productId, quantity }) => ({ productId, quantity }));

      await this.getEventPublisher().publishInventoryCommit({ orderId, items }, undefined, orderId);
    }
  }
}

export default new OrderService();
