import { CreateOrderDto } from '../dtos/create-order.dto';
import { AppError } from '../errors/app-errors';
import MESSAGES from '../errors/messages';
import type { IOrderEventPublisher } from '../interfaces/order-event-publisher.interface';
import type { IOrderItemRepository } from '../interfaces/order-item-repository.interface';
import type { IOrderRepository } from '../interfaces/order-repository.interface';
import type { InventoryStatusEventPayload } from '../kafka/types';
import { Order } from '../models/order.model';
import type { Filter } from 'mongodb';
import type { OrderServiceInterface } from './order-service.interface';

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

  async createOrder(payload: CreateOrderDto, requestId?: string): Promise<Order> {
    const eventPublisher = this.getEventPublisher();

    this.getOrderRepo();
    this.getOrderItemRepo();

    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const order: Order = {
      id,
      createdAt: new Date().toISOString(),
      status: 'processing',
      ...payload,
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

    try {
      await repo.updateStatus(orderId, newStatus);
      console.log(`[order] Updated order ${orderId} -> ${newStatus}`);
    } catch {
      throw new AppError(MESSAGES.ORDER_STATUS_UPDATE_FAILED);
    }
  }
}

export default new OrderService();
