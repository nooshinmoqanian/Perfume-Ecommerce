import * as zod from 'zod';
import { BadRequestError } from '../errors/app-errors';
import MESSAGES from '../errors/messages';

export const CreateOrderItemSchema = zod.object({
  productId: zod.string().min(1),
  quantity: zod.number().int().positive(),
  price: zod.number().optional(),
});

export const CreateOrderSchema = zod.object({
  items: zod.array(CreateOrderItemSchema).min(1),
  total: zod.number().nonnegative(),
  cartId: zod.string().optional(),
  userId: zod.string().optional(),
  customerEmail: zod.string().optional(),
  recipientName: zod.string().optional(),
  phone: zod.string().min(3),
  shippingAddress: zod.string().min(5),
  postalCode: zod.string().optional(),
});

export type CreateOrderDto = zod.infer<typeof CreateOrderSchema>;

export function validateCreateOrderDto(payload: unknown): CreateOrderDto {
  const parsed = CreateOrderSchema.safeParse(payload);
  if (!parsed.success) {
    throw new BadRequestError(`${MESSAGES.INVALID_PAYLOAD}: ${parsed.error.message}`);
  }

  return parsed.data;
}
