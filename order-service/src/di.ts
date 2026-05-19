import type { DatabaseCollections } from './database';
import OrderEventPublisher from './kafka/order-event.publisher';
import OrderItemRepository from './repositories/order-item.repository';
import OrderRepository from './repositories/order.repository';
import OrderService from './services';
import type { OrderServiceInterface } from './services/order-service.interface';

export const orderService: OrderServiceInterface = OrderService;

export function wireOrderDependencies(collections: DatabaseCollections) {
  const orderRepo = new OrderRepository(collections.orders);
  const orderItemRepo = new OrderItemRepository(collections.orderItems);

  orderService.setDependencies(orderRepo, orderItemRepo, OrderEventPublisher);
}

export default { wireOrderDependencies, orderService };
