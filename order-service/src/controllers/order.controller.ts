import { Request, Response } from 'express';
import { asyncHandler } from '../../../libs/common/middleware/async-handler';
import { validateCreateOrderDto } from '../dtos/create-order.dto';
import type { OrderServiceInterface } from '../services/order-service.interface';
import type { Filter } from 'mongodb';
import type { Order } from '../models/order.model';

// Orders placed before they were linked to a user id only carry the email.
function buildCustomerFilter(userId: string, email: string): Filter<Order> {
  const clauses: Filter<Order>[] = [];
  if (userId) clauses.push({ userId });
  if (email) clauses.push({ userId: { $exists: false }, customerEmail: email.toLowerCase() });
  if (!clauses.length) return {};
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

export function createOrderController(orderService: OrderServiceInterface) {
  const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const payload = validateCreateOrderDto(req.body);
    const requestHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestHeader)
      ? requestHeader[0]
      : requestHeader || req.requestId;

    const auth = req.auth!;
    const order = await orderService.createOrder(payload, { id: auth.id, email: auth.email }, requestId);
    return res.status(201).json(order);
  });

  const listOrders = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth!;

    // Regular users only ever see their own orders; admins see everything
    // and may narrow it to one customer via ?userId= / ?customerEmail=.
    const scope =
      auth.role === 'admin'
        ? {
            userId: typeof req.query.userId === 'string' ? req.query.userId.trim() : '',
            email: typeof req.query.customerEmail === 'string' ? req.query.customerEmail.trim() : '',
          }
        : { userId: auth.id, email: auth.email || '' };

    const orders = await orderService.listOrders(buildCustomerFilter(scope.userId, scope.email));
    return res.json(orders);
  });

  return { createOrder, listOrders };
}

export default createOrderController;
