import { Request, Response } from 'express';
import { asyncHandler } from '../../../libs/common/middleware/async-handler';
import { validateCreateOrderDto } from '../dtos/create-order.dto';
import type { OrderServiceInterface } from '../services/order-service.interface';

export function createOrderController(orderService: OrderServiceInterface) {
  const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const payload = validateCreateOrderDto(req.body);
    const requestHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestHeader)
      ? requestHeader[0]
      : requestHeader || req.requestId;

    const order = await orderService.createOrder(payload, requestId);
    return res.status(201).json(order);
  });

  const listOrders = asyncHandler(async (req: Request, res: Response) => {
    // Optional filters so a signed-in user can list only their own orders.
    // (Admin/dev tooling calls without filters to get everything.)
    const { userId, customerEmail } = req.query;
    const filter: Record<string, unknown> = {};
    if (typeof userId === 'string' && userId.trim()) {
      filter.userId = userId.trim();
    }
    if (typeof customerEmail === 'string' && customerEmail.trim()) {
      filter.customerEmail = customerEmail.trim().toLowerCase();
    }

    const orders = await orderService.listOrders(filter);
    return res.json(orders);
  });

  return { createOrder, listOrders };
}

export default createOrderController;
