import type { TopicHandlerContext } from '../topic-handler';
import OrderService from '../../services';
import type { InventoryStatusEventPayload } from '../types';

function isInventoryStatusPayload(payload: unknown): payload is InventoryStatusEventPayload {
  if (!payload || typeof payload !== 'object') return false;
  const value = payload as Record<string, unknown>;
  return 'orderId' in value && 'status' in value;
}

export async function handleInventoryEventsTopic({
  payload,
  requestId,
}: TopicHandlerContext): Promise<void> {
  if (!isInventoryStatusPayload(payload)) {
    console.warn('[order:kafka] Ignoring invalid inventory event payload');
    return;
  }

  const event = payload as InventoryStatusEventPayload;
  console.log(
    '[order:kafka] Received inventory event',
    event.orderId,
    event.status,
    requestId ? `(requestId=${requestId})` : ''
  );

  await OrderService.handleInventoryEvent(event);
}
