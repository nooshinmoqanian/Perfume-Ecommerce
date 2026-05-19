const MESSAGES = {
  ORDER_REPO_NOT_CONFIGURED: 'Order repository not configured',
  ORDER_ITEM_REPO_NOT_CONFIGURED: 'Order item repository not configured',
  ORDER_EVENT_PUBLISHER_NOT_CONFIGURED: 'Order event publisher not configured',
  ORDER_PERSIST_FAILED: 'Failed to persist order',
  ORDER_ITEMS_PERSIST_FAILED: 'Failed to persist order items',
  ORDER_CREATE_FAILED: 'Failed to create order',
  ORDER_LIST_FAILED: 'Failed to list orders',
  ORDER_STATUS_UPDATE_FAILED: 'Failed to update order status',
  DB_ERROR: 'Database error',
  INTERNAL_ERROR: 'Internal error',
  INVALID_PAYLOAD: 'Invalid request payload',
} as const;

export default MESSAGES;
