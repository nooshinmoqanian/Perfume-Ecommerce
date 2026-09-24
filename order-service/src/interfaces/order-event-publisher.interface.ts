import { InventoryCommitEventPayload, KafkaMessageHeaders, OrderCreatedEventPayload } from '../kafka/types';

export interface IOrderEventPublisher {
  publishOrderCreated(
    payload: OrderCreatedEventPayload,
    headers?: KafkaMessageHeaders,
    key?: string
  ): Promise<void>;
  publishInventoryCommit(
    payload: InventoryCommitEventPayload,
    headers?: KafkaMessageHeaders,
    key?: string
  ): Promise<void>;
}

export default IOrderEventPublisher;
