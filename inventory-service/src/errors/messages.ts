// Centralized error / user-facing messages for inventory-service
const MESSAGES = {
  PRODUCT_REPO_NOT_CONFIGURED: 'Product repository not configured',
  PRODUCT_NOT_FOUND: 'Product not found',
  INSUFFICIENT_STOCK: 'Insufficient stock to reserve',
  ENQUEUE_RESERVATION_FAILED: 'Failed to enqueue reservation request',
  PRODUCT_CREATE_FAILED: 'Failed to create product',
  PRODUCT_CREATE_LOG_FAILED: 'Failed to write product creation log',
  PRODUCT_UPDATE_FAILED: 'Failed to update product',
};

export default MESSAGES;
