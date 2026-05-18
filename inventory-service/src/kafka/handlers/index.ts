import type { KafkaTopicHandler } from '../topic-handler';
import { INVENTORY_TOPICS, type InventoryConsumerTopic } from '../topics';
import { handleOrdersTopic } from './orders.handler';
import { handleInventoryCommitsTopic } from './inventory-commits.handler';

export const defaultTopicHandlers: Record<InventoryConsumerTopic, KafkaTopicHandler> = {
  [INVENTORY_TOPICS.ORDERS]: handleOrdersTopic,
  [INVENTORY_TOPICS.INVENTORY_COMMITS]: handleInventoryCommitsTopic,
};
