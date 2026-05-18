import InventoryServiceImpl, { InventoryService } from './inventory.service';
import type { InventoryServiceInterface } from './inventory-service.interface';
import StorageService from './storage.service';

const InventoryServiceInstance: InventoryServiceInterface = InventoryServiceImpl;

export default InventoryServiceInstance;
export { InventoryServiceInstance };

export { InventoryService };

export { StorageService };
