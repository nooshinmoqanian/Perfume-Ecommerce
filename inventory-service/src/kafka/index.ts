export {
  initProducer,
  sendInventoryEvent,
  disconnectProducer,
} from './producer';

export { default as InventoryEventPublisher } from './inventory-event.publisher';

export {
  initConsumer,
  runConsumer,
  disconnectConsumer,
  registerTopicHandler,
  unregisterTopicHandler,
} from './consumer';

export {
  INVENTORY_TOPICS,
  INVENTORY_CONSUMER_TOPICS,
} from './topics';

export type {
  InventoryTopic,
  InventoryConsumerTopic,
} from './topics';

export type {
  TopicHandlerContext,
  KafkaTopicHandler,
} from './topic-handler';

export type {
  OrderReserveRequest,
  InventoryRequestPayload,
  InventoryEventPayload,
  OrderApprovalEventPayload,
  InventoryCommitPayload,
  KafkaMessageHeaders,
} from './types';
