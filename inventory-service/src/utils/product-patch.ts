import { BadRequestError } from '../errors/app-errors';
import { Product } from '../models/product.model';
import { normalizeFeaturesValue } from './normalize-features';

export function buildProductPatch(body: any): Partial<Product> {
  const patch: Partial<Product> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string') throw new BadRequestError('name must be a string');
    patch.name = body.name.trim();
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string') throw new BadRequestError('category must be a string');
    patch.category = body.category.trim();
  }

  if (body.sku !== undefined) {
    if (typeof body.sku !== 'string') throw new BadRequestError('sku must be a string');
    patch.sku = body.sku.trim();
  }

  if (body.stock !== undefined) {
    const n = Number(body.stock);
    if (!Number.isFinite(n)) throw new BadRequestError('stock must be a number');
    patch.stock = n;
  }

  if (body.price !== undefined) {
    const n = Number(body.price);
    if (!Number.isFinite(n)) throw new BadRequestError('price must be a number');
    patch.price = n;
  }

  if (body.imageUrl !== undefined) {
    if (typeof body.imageUrl !== 'string') throw new BadRequestError('imageUrl must be a string');
    patch.imageUrl = body.imageUrl.trim();
  }

  if (body.features !== undefined) {
    let normalizedFeatures: string[] = [];
    if (Array.isArray(body.features)) {
      if (!body.features.every((featureItem: any) => typeof featureItem === 'string')) throw new BadRequestError('features must be an array of strings');
      normalizedFeatures = normalizeFeaturesValue(body.features) || [];
    } else if (typeof body.features === 'string') {
      normalizedFeatures = normalizeFeaturesValue(body.features) || [];
    } else {
      throw new BadRequestError('features must be an array or comma-separated string');
    }
    patch.features = normalizedFeatures as any;
  }

  if (body.extraDescription !== undefined) {
    if (typeof body.extraDescription !== 'string') throw new BadRequestError('extraDescription must be a string');
    patch.extraDescription = body.extraDescription.trim();
  }

  return patch;
}

export default buildProductPatch;
