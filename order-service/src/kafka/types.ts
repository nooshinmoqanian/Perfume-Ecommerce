import { Order } from '../models/order.model';

export type KafkaMessageHeaders = Record<string, string>;

export type OrderCreatedEventPayload = Order;

// Tells inventory-service to turn an approved reservation into a stock decrement.
export type InventoryCommitEventPayload = {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type InventoryStatusEventPayload = {
  orderId?: string;
  status?: 'approved' | 'partial_failed' | string;
  items?: Array<{
    productId: string;
    quantity: number;
    status: 'reserved' | 'failed';
    reason?: string;
  }>;
};
