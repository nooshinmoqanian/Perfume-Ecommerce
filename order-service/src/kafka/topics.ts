export const ORDER_TOPICS = {
  ORDERS: 'orders',
  INVENTORY_EVENTS: 'inventory-events',
} as const;

export type OrderTopic = (typeof ORDER_TOPICS)[keyof typeof ORDER_TOPICS];

export const ORDER_CONSUMER_TOPICS = [ORDER_TOPICS.INVENTORY_EVENTS] as const;

export type OrderConsumerTopic = (typeof ORDER_CONSUMER_TOPICS)[number];
