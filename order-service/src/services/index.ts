import OrderServiceImpl from './order.service';
import type { OrderServiceInterface } from './order-service.interface';

const OrderServiceInstance: OrderServiceInterface = OrderServiceImpl;

export default OrderServiceInstance;
export { OrderServiceInstance };
