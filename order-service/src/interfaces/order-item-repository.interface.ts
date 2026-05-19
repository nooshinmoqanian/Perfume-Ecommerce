import type { InsertOneResult } from 'mongodb';
import { OrderItem } from '../models/order-item.model';

export interface IOrderItemRepository {
  create(item: OrderItem): Promise<InsertOneResult<OrderItem>>;
  findByOrderId(orderId: string): Promise<OrderItem[]>;
  findAll(): Promise<OrderItem[]>;
}

export default IOrderItemRepository;
