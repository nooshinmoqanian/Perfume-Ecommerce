import { Router } from 'express';
import createOrderController from '../controllers/order.controller';
import type { OrderServiceInterface } from '../services/order-service.interface';
import { authRequired } from '../../../libs/common/middleware/auth';

export default function createOrderRoutes(orderService: OrderServiceInterface) {
	const { createOrder, listOrders } = createOrderController(orderService);
	const router = Router();

	router.get('/orders', authRequired, listOrders);
	router.post('/orders', authRequired, createOrder);

	return router;
}
