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

  const listOrders = asyncHandler(async (_req: Request, res: Response) => {
    const orders = await orderService.listOrders();
    return res.json(orders);
  });

  return { createOrder, listOrders };
}

export default createOrderController;
