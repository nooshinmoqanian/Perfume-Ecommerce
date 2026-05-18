import { InsertOneResult, ClientSession } from 'mongodb';
import { Product } from '../models/product.model';

export type UpdateSummary = { matched: boolean; modified: boolean };

export interface IProductRepository {
  create(product: Product, session?: ClientSession): Promise<InsertOneResult<Product>>;
  findById(id: string, session?: ClientSession): Promise<Product | null>;
  reserveIfAvailable(id: string, quantity: number, session?: ClientSession): Promise<boolean>;
  updateStock(id: string, delta: number, session?: ClientSession): Promise<UpdateSummary>;
  updateReserved(id: string, delta: number, session?: ClientSession): Promise<UpdateSummary>;
  updateImage(id: string, imageId: string, session?: ClientSession): Promise<UpdateSummary>;
  findAll(session?: ClientSession): Promise<Product[]>;
  update(id: string, patch: Partial<Product>, session?: ClientSession): Promise<UpdateSummary>;
  delete(id: string, session?: ClientSession): Promise<UpdateSummary>;
}

export default IProductRepository;
