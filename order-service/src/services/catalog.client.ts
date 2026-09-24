import { AppError, BadRequestError, ServiceUnavailableError } from '../errors/app-errors';
import MESSAGES from '../errors/messages';

// Reads authoritative product data (price / discount) from inventory-service so
// order totals never depend on what the client sends.

export type CatalogProduct = {
  id: string;
  name: string;
  price?: number;
  discount?: number;
};

const INVENTORY_BASE = (process.env.INVENTORY_BASE || 'http://inventory-service:3002').replace(/\/+$/, '');

export async function fetchProduct(productId: string): Promise<CatalogProduct> {
  let res: Response;
  try {
    res = await fetch(`${INVENTORY_BASE}/api/products/${encodeURIComponent(productId)}`);
  } catch (err) {
    console.error('[order] inventory-service unreachable', err);
    throw new ServiceUnavailableError(MESSAGES.CATALOG_UNAVAILABLE);
  }

  if (res.status === 404) {
    throw new BadRequestError(`${MESSAGES.PRODUCT_NOT_FOUND}: ${productId}`);
  }
  if (!res.ok) {
    throw new AppError(MESSAGES.CATALOG_UNAVAILABLE, 502);
  }

  return (await res.json()) as CatalogProduct;
}

// Same rule as the storefront's effectivePrice (frontend/src/utils/format.ts):
// a percentage discount, rounded to whole toman only when one applies.
export function effectiveUnitPrice(product: CatalogProduct): number {
  const price = Number(product.price || 0);
  const off = Math.min(100, Math.max(0, Number(product.discount || 0)));
  return off > 0 ? Math.max(0, Math.round(price * (1 - off / 100))) : price;
}
