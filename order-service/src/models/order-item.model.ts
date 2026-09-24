export type OrderItem = {
  orderId?: string;
  productId: string;
  // Product name captured at purchase time (for order history display).
  name?: string;
  quantity: number;
  price?: number;
  createdAt?: string;
};
