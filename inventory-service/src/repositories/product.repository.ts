import { Collection, InsertOneResult, ClientSession } from 'mongodb';
import { Product } from '../models/product.model';
import { dbGuard } from '../../../libs/common/db-guard';
import { IProductRepository, UpdateSummary } from '../interfaces/product-repository.interface';
import { BaseRepository } from './base.repository';
import { normalizeFeatures } from '../utils/normalize-features';

export type { UpdateSummary, IProductRepository } from '../interfaces/product-repository.interface';

export class ProductRepository extends BaseRepository<Product> implements IProductRepository {
  constructor(collection: Collection<Product>) {
    super(collection);
  }

  async create(product: Product, session?: ClientSession): Promise<InsertOneResult<Product>> {
    product.createdAt = product.createdAt || new Date().toISOString();
    product.reserved = product.reserved || 0;
    normalizeFeatures(product);
    return this.insertOne(product, session);
  }

  async findById(id: string, session?: ClientSession): Promise<Product | null> {
    return this.findOneById(id, session);
  }

  async reserveIfAvailable(id: string, quantity: number, session?: ClientSession): Promise<boolean> {
    const result = await dbGuard(() =>
      this.collection.updateOne(
        {
          id,
          $expr: {
            $gte: [
              {
                $subtract: [
                  { $ifNull: ['$stock', 0] },
                  { $ifNull: ['$reserved', 0] },
                ],
              },
              quantity,
            ],
          },
        } as any,
        { $inc: { reserved: quantity } },
        this.buildSessionOpts(session)
      )
    );

    return (result.modifiedCount ?? 0) > 0;
  }

  async updateStock(id: string, delta: number, session?: ClientSession): Promise<UpdateSummary> {
    const res = await this.updateOneById(id, { $inc: { stock: delta } } as any, session);
    return this.toUpdateSummary(res);
  }

  async updateReserved(id: string, delta: number, session?: ClientSession): Promise<UpdateSummary> {
    const res = await this.updateOneById(id, { $inc: { reserved: delta } } as any, session);
    return this.toUpdateSummary(res);
  }

  async updateImage(id: string, imageId: string, session?: ClientSession): Promise<UpdateSummary> {
    const res = await this.updateOneById(id, { $set: { imageId } } as any, session);
    return this.toUpdateSummary(res);
  }

  async findAll(session?: ClientSession): Promise<Product[]> {
    return this.findAllDocs(session);
  }

  async update(id: string, patch: Partial<Product>, session?: ClientSession): Promise<UpdateSummary> {
    normalizeFeatures(patch);
    const res = await this.updateOneById(id, { $set: patch } as any, session);
    return this.toUpdateSummary(res);
  }

  async delete(id: string, session?: ClientSession): Promise<UpdateSummary> {
    const res = await this.deleteOneById(id, session);
    return this.toUpdateSummary(res);
  }
}

export default ProductRepository;
