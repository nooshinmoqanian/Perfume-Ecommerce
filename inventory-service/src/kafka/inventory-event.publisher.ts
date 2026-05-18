import type { IInventoryEventPublisher } from '../interfaces/inventory-event-publisher.interface';
import {
  type InventoryEventPayload,
  type InventoryRequestPayload,
  type KafkaMessageHeaders,
  type OrderApprovalEventPayload,
} from './types';
import { INVENTORY_TOPICS } from './topics';
import { sendInventoryEvent } from './producer';

class KafkaInventoryEventPublisher implements IInventoryEventPublisher {
  async publishInventoryRequest(
    payload: InventoryRequestPayload,
    headers?: KafkaMessageHeaders,
    key?: string
  ): Promise<void> {
    await sendInventoryEvent(INVENTORY_TOPICS.INVENTORY_REQUESTS, payload, headers, key);
  }

  async publishInventoryEvent(
    payload: InventoryEventPayload | OrderApprovalEventPayload,
    headers?: KafkaMessageHeaders,
    key?: string
  ): Promise<void> {
    await sendInventoryEvent(INVENTORY_TOPICS.INVENTORY_EVENTS, payload, headers, key);
  }
}

export default new KafkaInventoryEventPublisher();
