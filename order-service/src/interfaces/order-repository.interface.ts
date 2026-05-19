import type { Filter, InsertOneResult } from 'mongodb';
import { Order } from '../models/order.model';

export type UpdateSummary = { matched: boolean; modified: boolean };

export interface IOrderRepository {
  create(order: Order): Promise<InsertOneResult<Order>>;
  findById(id: string): Promise<Order | null>;
  findAll(filter?: Filter<Order>): Promise<Order[]>;
  update(id: string, patch: Partial<Order>): Promise<UpdateSummary>;
  updateStatus(id: string, status: Order['status']): Promise<UpdateSummary>;
}

export default IOrderRepository;
