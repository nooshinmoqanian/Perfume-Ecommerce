import { CreateOrderDto } from '../dtos/create-order.dto';
import { Order } from '../models/order.model';
import type { Filter } from 'mongodb';
import type { IOrderRepository } from '../interfaces/order-repository.interface';
import type { IOrderItemRepository } from '../interfaces/order-item-repository.interface';
import type { IOrderEventPublisher } from '../interfaces/order-event-publisher.interface';
import type { InventoryStatusEventPayload } from '../kafka/types';

export type OrderBuyer = { id: string; email?: string };

export interface OrderServiceInterface {
  setDependencies(
    orderRepo: IOrderRepository,
    orderItemRepo: IOrderItemRepository,
    eventPublisher: IOrderEventPublisher
  ): void;
  listOrders(filter?: Filter<Order>): Promise<Order[]>;
  createOrder(payload: CreateOrderDto, buyer: OrderBuyer, requestId?: string): Promise<Order>;
  handleInventoryEvent(event: InventoryStatusEventPayload): Promise<void>;
}

export default OrderServiceInterface;
