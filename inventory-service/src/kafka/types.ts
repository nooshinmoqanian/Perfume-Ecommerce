/**
 * Kafka event types and interfaces
 */

export interface OrderReserveRequest {
  id: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface InventoryRequestPayload {
  productId: string;
  quantity: number;
  requestedAt: string;
}

export interface InventoryEventPayload {
  type: 'stock_changed';
  productId: string;
  reason: 'release' | 'finalize' | 'update';
  delta: number;
  stock: number | null;
  at: string;
}

export interface OrderApprovalEventPayload {
  orderId: string;
  status: 'approved' | 'partial_failed';
  items: Array<{
    productId: string;
    quantity: number;
    status: 'reserved' | 'failed';
    reason?: string;
  }>;
}

export interface InventoryCommitPayload {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface KafkaMessageHeaders {
  [key: string]: string;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidItem(value: unknown): value is { productId: string; quantity: number } {
  if (!isObjectLike(value)) return false;
  return typeof value.productId === 'string' && typeof value.quantity === 'number';
}

export function isOrderReserveRequest(payload: unknown): payload is OrderReserveRequest {
  if (!isObjectLike(payload)) return false;
  if (typeof payload.id !== 'string') return false;
  if (!Array.isArray(payload.items)) return false;
  return payload.items.every(isValidItem);
}

export function isInventoryCommitPayload(payload: unknown): payload is InventoryCommitPayload {
  if (!isObjectLike(payload)) return false;
  if (typeof payload.orderId !== 'string') return false;
  if (!Array.isArray(payload.items)) return false;
  return payload.items.every(isValidItem);
}
