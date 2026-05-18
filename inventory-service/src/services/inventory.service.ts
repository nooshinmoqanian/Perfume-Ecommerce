import type { IProductRepository } from '../interfaces/product-repository.interface';
import type { IInventoryLogRepository } from '../interfaces/inventory-log-repository.interface';
import type { ICategoryRepository } from '../interfaces/category-repository.interface';
import type { IInventoryEventPublisher } from '../interfaces/inventory-event-publisher.interface';
import { InventoryLog } from '../models/inventory-log.model';
import { Product } from '../models/product.model';
import type { InventoryServiceInterface } from './inventory-service.interface';
import { AppError } from '../errors/app-errors';
import MESSAGES from '../errors/messages';
import type { InventoryEventPayload, InventoryRequestPayload } from '../kafka/types';
import { CreateProductDto } from '../dtos/create-product.dto';
import { startSession } from '../database';
import { ObjectId } from 'mongodb';

class InventoryService implements InventoryServiceInterface {
  private productRepo?: IProductRepository;
  private logRepo?: IInventoryLogRepository;
  private categoryRepo?: ICategoryRepository;
  private eventPublisher?: IInventoryEventPublisher;

  setRepositories(
    productRepo: IProductRepository,
    logRepo?: IInventoryLogRepository,
    categoryRepo?: ICategoryRepository,
    eventPublisher?: IInventoryEventPublisher
  ) {
    this.productRepo = productRepo;
    this.logRepo = logRepo;
    this.categoryRepo = categoryRepo;
    this.eventPublisher = eventPublisher;
  }

  private async publishInventoryRequest(payload: InventoryRequestPayload): Promise<void> {
    if (!this.eventPublisher) {
      console.warn('[inventory] Inventory event publisher is not configured, skipping inventory request event');
      return;
    }

    await this.eventPublisher.publishInventoryRequest(payload, undefined, payload.productId);
  }

  private async publishInventoryStockEvent(payload: InventoryEventPayload): Promise<void> {
    if (!this.eventPublisher) {
      console.warn('[inventory] Inventory event publisher is not configured, skipping inventory stock event');
      return;
    }

    await this.eventPublisher.publishInventoryEvent(payload, undefined, payload.productId);
  }

  async reserve(productId: string, quantity: number): Promise<boolean> {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);

    const didReserve = await this.productRepo.reserveIfAvailable(productId, quantity);
    if (!didReserve) {
      const product = await this.productRepo.findById(productId);
      if (!product) throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, 404);
      throw new AppError(MESSAGES.INSUFFICIENT_STOCK, 409);
    }

    // Instead of immediately decrementing stock or marking reserved locally,
    // publish a reservation request to Kafka so the system can process it
    // asynchronously and confirm/cancel later.
    try {
      await this.publishInventoryRequest({
        productId,
        quantity,
        requestedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      try {
        await this.productRepo.updateReserved(productId, -quantity);
      } catch (rollbackError) {
        console.error('[inventory] failed to rollback reserved quantity after enqueue error', rollbackError);
      }
      console.error(MESSAGES.ENQUEUE_RESERVATION_FAILED, err);
      throw new AppError(MESSAGES.ENQUEUE_RESERVATION_FAILED);
    }

    // record a pending reservation log (delta 0 indicates pending)
    if (this.logRepo) {
      const log: InventoryLog = { productId, delta: 0, reason: 'reserve_requested', createdAt: new Date().toISOString() };
      try { await this.logRepo.create(log); } catch (e) { console.warn('Failed to write inventory log', e); }
    }

    return true;
  }

  async release(productId: string, quantity: number): Promise<boolean> {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    let session: any = undefined;
    try {
      session = await startSession();
      await session.withTransaction(async () => {
        // release reserved quantity back to available: decrement reserved, increment stock
        await this.productRepo!.updateReserved(productId, -quantity, session);
        await this.productRepo!.updateStock(productId, quantity, session);

        if (this.logRepo) {
          const log: InventoryLog = {
            productId,
            delta: quantity,
            reason: 'release',
            createdAt: new Date().toISOString(),
          };
          await this.logRepo.create(log, session);
        }
      }, {
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
      });
    } catch (error) {
      console.error('[inventory] release transaction failed', error);
      throw new AppError(MESSAGES.PRODUCT_UPDATE_FAILED);
    } finally {
      try { if (session) await session.endSession(); } catch (endSessionError) { /* ignore */ }
    }

    // publish inventory event for stock change so other services (notifications, orders) can react
    try {
      const updated = await this.productRepo!.findById(productId);
      await this.publishInventoryStockEvent({
        type: 'stock_changed',
        productId,
        reason: 'release',
        delta: quantity,
        stock: updated?.stock ?? null,
        at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[inventory] failed to send stock_changed event', e);
    }

    return true;
  }

  // Finalize an order: decrement stock and reserved quantities for each item atomically.
  async finalizeOrder(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    if (!Array.isArray(items) || items.length === 0) return true;

    let session: any = undefined;
    const eventsToPublish: Array<{ productId: string; delta: number; stock: number | null }> = [];
    try {
      session = await startSession();
      await session.withTransaction(async () => {
        for (const it of items) {
          const { productId, quantity } = it;
          if (!productId || typeof quantity !== 'number' || quantity <= 0) continue;

          const before = await this.productRepo!.findById(productId, session);
          if (!before) {
            throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, 404);
          }

          const currentStock = before.stock || 0;
          const currentReserved = typeof (before as any).reserved === 'number' ? (before as any).reserved : 0;

          // Ensure there is enough stock or reserved to finalize
          if (currentStock < quantity && currentReserved < quantity) {
            throw new AppError(MESSAGES.INSUFFICIENT_STOCK, 409);
          }

          // Decrement stock by quantity
          await this.productRepo!.updateStock(productId, -quantity, session);
          // Decrement reserved by quantity if possible (allow negative guarded by DB/state)
          await this.productRepo!.updateReserved(productId, -Math.min(currentReserved, quantity), session);

          if (this.logRepo) {
            const log: InventoryLog = { productId, delta: -quantity, reason: 'finalize', createdAt: new Date().toISOString() };
            await this.logRepo.create(log, session);
          }

          const updated = await this.productRepo!.findById(productId, session);
          eventsToPublish.push({
            productId,
            delta: -quantity,
            stock: updated?.stock ?? null,
          });
        }
      }, {
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
      });

      for (const pendingEvent of eventsToPublish) {
        try {
          await this.publishInventoryStockEvent({
            type: 'stock_changed',
            productId: pendingEvent.productId,
            reason: 'finalize',
            delta: pendingEvent.delta,
            stock: pendingEvent.stock,
            at: new Date().toISOString(),
          });
        } catch (eventError) {
          console.warn('[inventory] failed to send stock_changed event after finalize commit', eventError);
        }
      }

      return true;
    } catch (err: any) {
      console.error('[inventory] finalizeOrder transaction failed', err);
      throw new AppError(MESSAGES.PRODUCT_UPDATE_FAILED);
    } finally {
      try { if (session) await session.endSession(); } catch (e) { /* ignore */ }
    }
  }

  async listProducts(): Promise<Product[]> {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    return this.productRepo.findAll();
  }

  async getCategories(): Promise<Array<{ id: string; name: string }>> {
    // return categories as objects with id and name when possible
    if (this.categoryRepo) {
      const cats = await this.categoryRepo.findAll();
      return cats
        .filter((category) => Boolean(category.id))
        .map((category) => ({ id: String(category.id), name: category.name }));
    }
    // Fallback: derive from products
    const products = await this.listProducts();
    const names = Array.from(new Set(products.map(p => (p as any).category).filter(Boolean)));
    return names.map(n => ({ id: n as any, name: n as string }));
  }

  async createCategory(name: string): Promise<{ id: string; name: string }> {
    if (!this.categoryRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    const oid = await this.categoryRepo.upsertByName(name);
    return { id: oid.toHexString(), name };
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!this.categoryRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    try {
      return await this.categoryRepo.deleteById(id);
    } catch (e) {
      console.warn('[inventory] failed to delete category', e);
      return false;
    }
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const product: Product = {
      id: new ObjectId().toHexString(),
      name: dto.name ?? '',
      category: dto.category,
      sku: dto.sku,
      stock: dto.stock as number,
      price: dto.price,
      features: dto.features,
      extraDescription: dto.extraDescription,
      imageUrl: dto.imageUrl,
      createdAt: new Date().toISOString(),
      reserved: 0,
    };
    let session = undefined as any;
    try {
      session = await startSession();
      let created: Product | null = null;
      await session.withTransaction(async () => {
        console.info('[inventory] Creating product (transaction via repositories)', { productId: product.id, sku: product.sku });

        if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
        // ensure category exists and attach categoryId when possible
        if (product.category && this.categoryRepo) {
          try {
            const oid = await this.categoryRepo.upsertByName(product.category, session);
            product.categoryId = oid.toHexString();
          } catch (e) {
            console.warn('[inventory] failed to upsert category', e);
          }
        }

        await this.productRepo.create(product, session);

        if (this.logRepo) {
          const log: InventoryLog = { productId: product.id, delta: product.stock ?? 0, reason: 'create', createdAt: new Date().toISOString() };
          await this.logRepo.create(log, session);
        }

        created = product;
      }, {
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
      });

      if (!created) {
        console.error('[inventory] Transaction completed but product not created', { productId: product.id });
        throw new AppError(MESSAGES.PRODUCT_CREATE_FAILED);
      }

      console.info('[inventory] Product created', { productId: product.id });
      return created;
    } catch (err: any) {
      console.error('[inventory] Product create transaction failed', err);
      throw new AppError(MESSAGES.PRODUCT_CREATE_FAILED);
    } finally {
      try { if (session) await session.endSession(); } catch (e) { /* ignore */ }
    }
  }

  async getProductById(id: string): Promise<Product> {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(MESSAGES.PRODUCT_NOT_FOUND, 404);
    return product;
  }

  async updateProduct(id: string, patch: Partial<Product>) {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    // basic sanitization: remove undefined fields
    const clean: Partial<Product> = {};
    for (const k of Object.keys(patch) as Array<keyof Product>) {
      const v = (patch as any)[k];
      if (v !== undefined) (clean as any)[k] = v;
    }
    // If category was provided, ensure category exists and attach categoryId
    if ((clean as any).category && this.categoryRepo) {
      try {
        const oid = await this.categoryRepo.upsertByName((clean as any).category as string);
        (clean as any).categoryId = oid.toHexString();
      } catch (e) {
        console.warn('[inventory] failed to upsert category during update', e);
      }
    }

    const before = await this.productRepo.findById(id);
    const result = await this.productRepo.update(id, clean);

    // if stock changed, emit inventory event
    try {
      if (clean.stock !== undefined) {
        const after = await this.productRepo.findById(id);
        const delta = (after?.stock || 0) - (before?.stock || 0);
        await this.publishInventoryStockEvent({
          type: 'stock_changed',
          productId: id,
          reason: 'update',
          delta,
          stock: after?.stock ?? null,
          at: new Date().toISOString(),
        });
      }
    } catch (e) { console.warn('[inventory] failed to send stock changed event', e); }

    return result;
  }

  async deleteProduct(id: string) {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    // Optionally: remove associated image from GridFS (not implemented here)
    return this.productRepo.delete(id);
  }

  async setProductImage(productId: string, imageId: string): Promise<boolean> {
    if (!this.productRepo) throw new AppError(MESSAGES.PRODUCT_REPO_NOT_CONFIGURED);
    const res = await this.productRepo.updateImage(productId, imageId);
    return res.matched && res.modified;
  }
}

export default new InventoryService();

export { InventoryService };
