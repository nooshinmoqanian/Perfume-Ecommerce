import { StorageService } from '../services';
import InventoryService from '../services';
import { BadRequestError } from '../errors/app-errors';

export async function handleProductImageUpload(file: any, productId: string, storage: typeof StorageService, inventory: typeof InventoryService): Promise<string> {
  if (!file || !file.buffer || !file.originalname) throw new BadRequestError('Invalid file');
  const fileId = await storage.uploadBuffer(file.buffer, file.originalname, file.mimetype);
  await inventory.setProductImage(productId, fileId);
  return fileId;
}

export const handleCreateImageUpload = handleProductImageUpload;

export default { handleCreateImageUpload, handleProductImageUpload };
