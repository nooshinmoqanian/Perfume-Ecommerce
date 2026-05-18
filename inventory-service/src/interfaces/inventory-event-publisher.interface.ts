import type {
  InventoryEventPayload,
  InventoryRequestPayload,
  KafkaMessageHeaders,
  OrderApprovalEventPayload,
} from '../kafka/types';

export interface IInventoryEventPublisher {
  publishInventoryRequest(
    payload: InventoryRequestPayload,
    headers?: KafkaMessageHeaders,
    key?: string
  ): Promise<void>;

  publishInventoryEvent(
    payload: InventoryEventPayload | OrderApprovalEventPayload,
    headers?: KafkaMessageHeaders,
    key?: string
  ): Promise<void>;
}

export default IInventoryEventPublisher;
