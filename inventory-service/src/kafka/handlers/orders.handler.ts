import type { TopicHandlerContext } from '../topic-handler';
import InventoryService from '../../services';
import InventoryEventPublisher from '../inventory-event.publisher';
import { isOrderReserveRequest, type OrderApprovalEventPayload, type OrderReserveRequest } from '../types';

interface ReservationResultItem {
  productId: string;
  quantity: number;
  status: 'reserved' | 'failed';
  reason?: string;
}

export async function handleOrdersTopic({ payload, requestId, headers }: TopicHandlerContext): Promise<void> {
  if (!isOrderReserveRequest(payload)) {
    console.warn('[inventory:kafka] Ignoring invalid order payload');
    return;
  }

  const order = payload as OrderReserveRequest;
  console.log('[inventory:kafka] Received order', order.id, requestId ? `(requestId=${requestId})` : '');

  let allReserved = true;
  const reservationResults: ReservationResultItem[] = [];

  for (const item of order.items) {
    try {
      await InventoryService.reserve(item.productId, item.quantity);
      reservationResults.push({
        productId: item.productId,
        quantity: item.quantity,
        status: 'reserved',
      });
    } catch (error: any) {
      const reason = error?.message || String(error);
      reservationResults.push({
        productId: item.productId,
        quantity: item.quantity,
        status: 'failed',
        reason,
      });
      allReserved = false;
      console.warn('[inventory:kafka] Item reserve failed', {
        productId: item.productId,
        quantity: item.quantity,
        requestId,
        reason,
      });
    }
  }

  // Compensate: an order that cannot be fully reserved must not keep holding
  // the items that did reserve.
  if (!allReserved) {
    for (const item of reservationResults) {
      if (item.status !== 'reserved') continue;
      try {
        await InventoryService.release(item.productId, item.quantity);
      } catch (error: any) {
        console.error('[inventory:kafka] Failed to release reservation', {
          orderId: order.id,
          productId: item.productId,
          error: error?.message || String(error),
        });
      }
    }
  }

  const approvalEvent: OrderApprovalEventPayload = {
    orderId: order.id,
    status: allReserved ? 'approved' : 'partial_failed',
    items: reservationResults,
  };

  await InventoryEventPublisher.publishInventoryEvent(approvalEvent, headers, order.id);
  console.log('[inventory:kafka] Published inventory approval event for order', order.id);
}
