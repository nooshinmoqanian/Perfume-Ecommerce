import { Router } from 'express';
import createOrderController from '../controllers/order.controller';
import type { OrderServiceInterface } from '../services/order-service.interface';

export default function createOrderRoutes(orderService: OrderServiceInterface) {
	const { createOrder, listOrders } = createOrderController(orderService);
	const router = Router();

	router.get('/orders', listOrders);
	router.post('/orders', createOrder);

	return router;
}
