import { Collection, Filter, InsertOneResult, ObjectId } from 'mongodb';
import type { IOrderRepository, UpdateSummary } from '../interfaces/order-repository.interface';
import { Order } from '../models/order.model';
import { dbGuard } from '../../../libs/common/db-guard';

export class OrderRepository implements IOrderRepository {
  constructor(private readonly collection: Collection<Order>) {}

  async create(order: Order): Promise<InsertOneResult<Order>> {
    return dbGuard(() => this.collection.insertOne(order));
  }

  async findById(id: string) {
    if (ObjectId.isValid(id)) {
      return dbGuard(() => this.collection.findOne({ _id: new ObjectId(id) } as Filter<Order>));
    }

    return dbGuard(() => this.collection.findOne({ id } as Filter<Order>));
  }

  async findAll(filter: Filter<Order> = {}) {
    return dbGuard(() => this.collection.find(filter).toArray());
  }

  async update(id: string, patch: Partial<Order>): Promise<UpdateSummary> {
    const filter = ObjectId.isValid(id)
      ? ({ _id: new ObjectId(id) } as Filter<Order>)
      : ({ id } as Filter<Order>);

    return dbGuard(async () => {
      const res = await this.collection.updateOne(filter, { $set: patch });
      return {
        matched: (res.matchedCount ?? 0) > 0,
        modified: (res.modifiedCount ?? 0) > 0,
      };
    });
  }

  async updateStatus(id: string, status: Order['status']) {
    return this.update(id, { status });
  }
}

export default OrderRepository;
