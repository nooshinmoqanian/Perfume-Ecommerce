import { Product } from '../models/product.model';
import type { IProductRepository, UpdateSummary } from '../interfaces/product-repository.interface';
import type { IInventoryLogRepository } from '../interfaces/inventory-log-repository.interface';
import type { ICategoryRepository } from '../interfaces/category-repository.interface';
import type { IInventoryEventPublisher } from '../interfaces/inventory-event-publisher.interface';
import type { CreateProductDto } from '../dtos/create-product.dto';

export interface InventoryServiceInterface {
  setRepositories(
    productRepo: IProductRepository,
    logRepo?: IInventoryLogRepository,
    categoryRepo?: ICategoryRepository,
    eventPublisher?: IInventoryEventPublisher
  ): void;
  reserve(productId: string, quantity: number): Promise<boolean>;
  release(productId: string, quantity: number): Promise<boolean>;
  finalizeOrder(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean>;
  listProducts(): Promise<Product[]>;
  createProduct(dto: CreateProductDto): Promise<Product>;
  getCategories(): Promise<Array<{ id: string; name: string }>>;
  createCategory(name: string): Promise<{ id: string; name: string }>;
  deleteCategory(id: string): Promise<boolean>;
  getProductById(id: string): Promise<Product>;
  updateProduct(id: string, patch: Partial<Product>): Promise<UpdateSummary>;
  deleteProduct(id: string): Promise<UpdateSummary>;
  setProductImage(productId: string, imageId: string): Promise<boolean>;
}

export default InventoryServiceInterface;
