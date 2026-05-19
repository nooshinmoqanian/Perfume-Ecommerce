import { OrderItem } from './order-item.model';

export type OrderStatus = 'processing' | 'completed' | 'failed';

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  cartId?: string;
  userId?: string;
  recipientName?: string;
  phone: string;
  shippingAddress: string;
  postalCode?: string;
};
