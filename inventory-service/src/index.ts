import app from './app';
import { connectToDatabase, disconnectDatabase } from './database';
import ProductRepository from './repositories/product.repository';
import InventoryLogRepository from './repositories/inventory-log.repository';
import CategoryRepository from './repositories/category.repository';
import InventoryService from './services';
import InventoryEventPublisher from './kafka/inventory-event.publisher';
import { initConsumer, runConsumer, disconnectConsumer, initProducer, disconnectProducer } from './kafka';

async function start() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

  try {
    const { client, db, collections } = await connectToDatabase(mongoUri);
    const productRepo = new ProductRepository(collections.products as any);
    const logRepo = new InventoryLogRepository(collections.inventoryLogs as any);
    const categoryRepo = new CategoryRepository(collections.categories as any);
    InventoryService.setRepositories(productRepo, logRepo, categoryRepo, InventoryEventPublisher);

    // Create unique index on categories.name
    try {
      await (collections.categories as any).createIndex({ name: 1 }, { unique: true });
    } catch (e) { /* ignore */ }

    // Sync existing product category names into categories collection and set categoryId on products
    try {
      const distinct: string[] = await (collections.products as any).distinct('category');
      for (const name of distinct.filter(Boolean)) {
        // upsert category
        const res = await (collections.categories as any).findOneAndUpdate(
          { name },
          { $setOnInsert: { name, createdAt: new Date().toISOString() } },
          { upsert: true, returnDocument: 'after' }
        );
        const catDoc = res.value;
        if (catDoc && catDoc._id) {
          // update products that have this category name to set categoryId
          await (collections.products as any).updateMany({ category: name }, { $set: { categoryId: catDoc._id.toHexString ? catDoc._id.toHexString() : String(catDoc._id) } });
        }
      }
    } catch (e) {
      console.warn('[inventory] category sync failed', e);
    }
  } catch (e) {
    console.error('Failed to connect to DB', e);
    throw e;
  }

  await initProducer();
  await initConsumer();

  // start consumer processing in background
  runConsumer().catch(err => {
    console.error('Consumer failed', err);
    process.exit(1);
  });

  const port = Number(process.env.PORT || 3002);
  const server = app.listen(port, () => {
    console.log(`Inventory service listening on port ${port}`);
  });

  async function shutdown() {
    console.log('Shutting down inventory-service');
    try { await disconnectConsumer(); } catch (e) {}
    try { await disconnectProducer(); } catch (e) {}
    try { await disconnectDatabase(); } catch (e) {}
    server.close(() => process.exit(0));
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(err => {
  console.error('Failed to start inventory-service:', err);
  process.exit(1);
});
