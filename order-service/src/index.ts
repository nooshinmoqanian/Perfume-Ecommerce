import app from './app';
import { connectToDatabase, disconnectDatabase } from './database';
import { initProducer, disconnectProducer } from './kafka/producer';
import { initConsumer, runConsumer, disconnectConsumer } from './kafka/consumer';
import { wireOrderDependencies } from './di';

async function start() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/orders';

  try {
    const { client, collections } = await connectToDatabase(mongoUri);

    wireOrderDependencies(collections);

    (globalThis as { _mongoClient?: unknown })._mongoClient = client;
  } catch (mongoErr) {
    console.error('Failed to connect to MongoDB:', mongoErr);
  }

  await initProducer();
  await initConsumer();

  runConsumer().catch((err) => {
    console.error('Order consumer failed', err);
    process.exit(1);
  });

  const port = Number(process.env.PORT || 3001);
  const server = app.listen(port, () => {
    console.log(`Order service listening on port ${port}`);
  });

  async function shutdown() {
    console.log('Shutting down...');

    try {
      await disconnectConsumer();
    } catch {
      // ignore
    }

    try {
      await disconnectProducer();
    } catch {
      // ignore
    }

    try {
      await disconnectDatabase();
    } catch {
      // ignore
    }

    server.close(() => process.exit(0));
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start order-service:', err);
  process.exit(1);
});
