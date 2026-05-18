import { Collection, InsertOneResult, ClientSession } from 'mongodb';
import { InventoryLog } from '../models/inventory-log.model';
import { IInventoryLogRepository } from '../interfaces/inventory-log-repository.interface';
import { BaseRepository } from './base.repository';

export type { IInventoryLogRepository } from '../interfaces/inventory-log-repository.interface';

export class InventoryLogRepository extends BaseRepository<InventoryLog> implements IInventoryLogRepository {
  constructor(collection: Collection<InventoryLog>) {
    super(collection);
  }

  async create(log: InventoryLog, session?: ClientSession): Promise<InsertOneResult<InventoryLog>> {
    log.createdAt = log.createdAt || new Date().toISOString();
    return this.insertOne(log, session);
  }

  async findAll(session?: ClientSession): Promise<InventoryLog[]> {
    return this.findAllDocs(session);
  }
}

export default InventoryLogRepository;
