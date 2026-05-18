import { Collection, InsertOneResult, ObjectId, ClientSession } from 'mongodb';
import { Category } from '../models/category.model';
import { dbGuard } from '../../../libs/common/db-guard';
import { ICategoryRepository } from '../interfaces/category-repository.interface';
import { BaseRepository } from './base.repository';

export type { ICategoryRepository } from '../interfaces/category-repository.interface';

export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
  constructor(collection: Collection<Category>) {
    super(collection);
  }

  private toCategory(doc: any): Category {
    return {
      id: doc?._id?.toHexString ? doc._id.toHexString() : String(doc?._id ?? ''),
      name: String(doc?.name ?? ''),
      createdAt: typeof doc?.createdAt === 'string' ? doc.createdAt : undefined,
    };
  }

  async create(cat: Category, session?: ClientSession): Promise<InsertOneResult<Category>> {
    cat.createdAt = cat.createdAt || new Date().toISOString();
    return this.insertOne(cat, session);
  }

  async findByName(name: string): Promise<Category | null> {
    return dbGuard(async () => {
      const doc = await this.collection.findOne({ name } as any);
      return doc ? this.toCategory(doc) : null;
    });
  }

  async findAll(): Promise<Category[]> {
    return dbGuard(async () => {
      const docs = await this.collection.find({}).toArray();
      return docs.map((doc) => this.toCategory(doc));
    });
  }

  async upsertByName(name: string, session?: ClientSession): Promise<ObjectId> {
    return dbGuard(async () => {
      const res = await this.collection.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, createdAt: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after', session: session as any }
      );
      const doc = res.value as any;
      return doc._id instanceof ObjectId ? doc._id : new ObjectId(doc._id);
    });
  }

  async deleteById(id: string, session?: ClientSession): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    const res = await dbGuard(() =>
      this.collection.deleteOne({ _id: new ObjectId(id) } as any, this.buildSessionOpts(session))
    );
    return (res.deletedCount || 0) > 0;
  }
}

export default CategoryRepository;
