import { InsertOneResult, ObjectId, ClientSession } from 'mongodb';
import { Category } from '../models/category.model';

export interface ICategoryRepository {
  create(cat: Category, session?: ClientSession): Promise<InsertOneResult<Category>>;
  findByName(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  upsertByName(name: string, session?: ClientSession): Promise<ObjectId>;
  deleteById(id: string, session?: ClientSession): Promise<boolean>;
}

export default ICategoryRepository;
