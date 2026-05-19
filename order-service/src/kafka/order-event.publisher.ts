import type { IOrderEventPublisher } from '../interfaces/order-event-publisher.interface';
import type { KafkaMessageHeaders, OrderCreatedEventPayload } from './types';
import { ORDER_TOPICS } from './topics';
import { sendKafkaEvent } from './producer';

class KafkaOrderEventPublisher implements IOrderEventPublisher {
  async publishOrderCreated(
    payload: OrderCreatedEventPayload,
    headers?: KafkaMessageHeaders,
    key?: string
  ): Promise<void> {
    await sendKafkaEvent(ORDER_TOPICS.ORDERS, payload, headers, key);
  }
}

export default new KafkaOrderEventPublisher();
