export const INVENTORY_TOPICS = {
  ORDERS: 'orders',
  INVENTORY_REQUESTS: 'inventory-requests',
  INVENTORY_EVENTS: 'inventory-events',
  INVENTORY_COMMITS: 'inventory-commits',
} as const;

export type InventoryTopic = (typeof INVENTORY_TOPICS)[keyof typeof INVENTORY_TOPICS];

export const INVENTORY_CONSUMER_TOPICS = [
  INVENTORY_TOPICS.ORDERS,
  INVENTORY_TOPICS.INVENTORY_COMMITS,
] as const;

export type InventoryConsumerTopic = (typeof INVENTORY_CONSUMER_TOPICS)[number];
