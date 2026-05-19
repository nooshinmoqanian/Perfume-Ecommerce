import { Collection, Filter, InsertOneResult } from 'mongodb';
import type { IOrderItemRepository } from '../interfaces/order-item-repository.interface';
import { OrderItem } from '../models/order-item.model';
import { dbGuard } from '../../../libs/common/db-guard';

export class OrderItemRepository implements IOrderItemRepository {
  constructor(private readonly collection: Collection<OrderItem>) {}

  async create(item: OrderItem): Promise<InsertOneResult<OrderItem>> {
    return dbGuard(() => this.collection.insertOne(item));
  }

  async findByOrderId(orderId: string) {
    return dbGuard(() => this.collection.find({ orderId } as Filter<OrderItem>).toArray());
  }

  async findAll() {
    return dbGuard(() => this.collection.find({}).toArray());
  }
}

export default OrderItemRepository;
