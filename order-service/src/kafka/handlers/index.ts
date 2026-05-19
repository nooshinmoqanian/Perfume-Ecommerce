import type { KafkaTopicHandler } from '../topic-handler';
import { ORDER_TOPICS, type OrderConsumerTopic } from '../topics';
import { handleInventoryEventsTopic } from './inventory-events.handler';

export const defaultTopicHandlers: Record<OrderConsumerTopic, KafkaTopicHandler> = {
  [ORDER_TOPICS.INVENTORY_EVENTS]: handleInventoryEventsTopic,
};
