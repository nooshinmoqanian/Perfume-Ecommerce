import { MongoClient, Db, Collection, ClientSession } from 'mongodb';

export interface DbCollections {
  products: Collection;
  inventoryLogs: Collection;
  categories: Collection;
}

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connects to MongoDB if not already connected and returns client/db/collections.
 * Safe to call multiple times; it will reuse the existing connection.
 */
export async function connectToDatabase(mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory') {
  if (client && db) return { client, db, collections: { products: db.collection('products'), inventoryLogs: db.collection('inventoryLogs'), categories: db.collection('categories') } };

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB for inventory-service');

  return { client, db, collections: { products: db.collection('products'), inventoryLogs: db.collection('inventoryLogs'), categories: db.collection('categories') } };
}

/**
 * Return connected MongoClient, connecting automatically if needed.
 */
export async function getClient(mongoUri?: string): Promise<MongoClient> {
  if (!client) {
    const res = await connectToDatabase(mongoUri);
    return res.client;
  }
  return client;
}

/**
 * Return connected Db instance, connecting automatically if needed.
 */
export async function getDb(mongoUri?: string): Promise<Db> {
  if (!db) {
    const res = await connectToDatabase(mongoUri);
    return res.db;
  }
  return db as Db;
}

export async function getCollections(mongoUri?: string): Promise<DbCollections> {
  const database = await getDb(mongoUri);
  return { products: database.collection('products'), inventoryLogs: database.collection('inventoryLogs'), categories: database.collection('categories') };
}

/**
 * Start a client session. Ensures there's a connected client first.
 */
export async function startSession(mongoUri?: string): Promise<ClientSession> {
  const c = await getClient(mongoUri);
  return c.startSession();
}

export async function disconnectDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed for inventory-service');
  }
}
