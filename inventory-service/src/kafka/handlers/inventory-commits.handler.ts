import type { TopicHandlerContext } from '../topic-handler';
import InventoryService from '../../services';
import { isInventoryCommitPayload } from '../types';

export async function handleInventoryCommitsTopic({ payload, requestId }: TopicHandlerContext): Promise<void> {
  if (!isInventoryCommitPayload(payload)) {
    console.warn('[inventory:kafka] Ignoring invalid inventory commit payload');
    return;
  }

  const commit = payload;
  console.log(
    '[inventory:kafka] Received inventory commit',
    commit.orderId,
    requestId ? `(requestId=${requestId})` : ''
  );

  if (!commit.items.length) {
    console.warn('[inventory:kafka] Inventory commit has empty items, skipping', { orderId: commit.orderId });
    return;
  }

  await InventoryService.finalizeOrder(commit.orderId, commit.items);
  console.log('[inventory:kafka] Finalized stock for order', commit.orderId);
}
