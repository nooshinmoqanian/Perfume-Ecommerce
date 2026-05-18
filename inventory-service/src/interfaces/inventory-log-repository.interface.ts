import { InsertOneResult, ClientSession } from 'mongodb';
import { InventoryLog } from '../models/inventory-log.model';

export interface IInventoryLogRepository {
  create(log: InventoryLog, session?: ClientSession): Promise<InsertOneResult<InventoryLog>>;
  findAll(session?: ClientSession): Promise<InventoryLog[]>;
}

export default IInventoryLogRepository;
