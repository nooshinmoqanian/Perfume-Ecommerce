import { Collection, Db, MongoClient } from 'mongodb';
import { Order } from './models/order.model';
import { OrderItem } from './models/order-item.model';

let client: MongoClient | null = null;
let db: Db | null = null;

export type DatabaseCollections = {
  orders: Collection<Order>;
  orderItems: Collection<OrderItem>;
};

export async function connectToDatabase(
  mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/orders'
): Promise<{ client: MongoClient; db: Db; collections: DatabaseCollections }> {
  if (client && db) {
    return {
      client,
      db,
      collections: {
        orders: db.collection<Order>('orders'),
        orderItems: db.collection<OrderItem>('orderItems'),
      },
    };
  }

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db();

  console.log('Connected to MongoDB for order-service');

  return {
    client,
    db,
    collections: {
      orders: db.collection<Order>('orders'),
      orderItems: db.collection<OrderItem>('orderItems'),
    },
  };
}

export async function disconnectDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed for order-service');
  }
}
