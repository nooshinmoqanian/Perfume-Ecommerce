import { Request, Response } from 'express';
import InventoryService from '../services';
import { StorageService } from '../services';
import { CreateProductDto, validateCreateProductDto } from '../dtos/create-product.dto';
import { BadRequestError, NotFoundError } from '../errors/app-errors';
import { validateReserveDto } from '../dtos/reserve.dto';
import { buildProductPatch } from '../utils/product-patch';
import { handleProductImageUpload } from '../utils/product-image';

export async function listProducts(req: Request, res: Response) {
  const products = await InventoryService.listProducts();
  res.json(products);
}

export async function listCategories(req: Request, res: Response) {
  const cats = await InventoryService.getCategories();
  res.json(cats);
}

export async function createCategoryRoute(req: Request, res: Response) {
  const body = req.body || {};
  if (!body.name || typeof body.name !== 'string') throw new BadRequestError('name required');
  const created = await InventoryService.createCategory(body.name.trim());
  res.status(201).json(created);
}

export async function deleteCategoryRoute(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) throw new BadRequestError('missing id');
  const ok = await InventoryService.deleteCategory(id);
  if (!ok) throw new NotFoundError('not found');
  res.json({ deleted: true });
}

export async function createProduct(req: Request, res: Response) {
  const payload = validateCreateProductDto(req.body || {}) as CreateProductDto;
  const created = await InventoryService.createProduct(payload);

  // handle optional file upload
  const file = (req as any).file;
  if (file && file.buffer && file.originalname) {
    const fileId = await handleProductImageUpload(file, created.id, StorageService, InventoryService);
    (created as any).imageId = fileId;
  }

  res.status(201).json(created);
}

export async function reserveRoute(req: Request, res: Response) {
  const { productId, quantity } = validateReserveDto(req.body || {});
  await InventoryService.reserve(productId, quantity);
  res.json({ status: 'reserved' });
}

export async function uploadProductImageRoute(req: Request, res: Response) {
  const productId = req.params.id;
  if (!productId) throw new BadRequestError('Missing product id');

  const file = (req as any).file;
  if (!file || !file.buffer) throw new BadRequestError('No file uploaded');

  const fileId = await handleProductImageUpload(file, productId, StorageService, InventoryService);
  res.json({ imageId: fileId });
}

export async function getProductImageRoute(req: Request, res: Response) {
  const productId = req.params.id;
  const product = await InventoryService.getProductById(productId);
  if (!product) throw new NotFoundError('Product not found');

  // prefer image stored in DB
  if ((product as any).imageId) {
    const imageId = (product as any).imageId;
    const download = await StorageService.openDownloadStreamById(imageId);
    download.pipe(res);
    return;
  }

  // fallback to external URL
  if (product.imageUrl) return res.redirect(product.imageUrl);
  throw new NotFoundError('No image');
}

export async function getProductById(req: Request, res: Response) {
  const productId = req.params.id;
  if (!productId) throw new BadRequestError('Missing product id');
  const product = await InventoryService.getProductById(productId);
  res.json(product);
}

export async function updateProductRoute(req: Request, res: Response) {
  const productId = req.params.id;
  if (!productId) throw new BadRequestError('Missing product id');

  const patch = buildProductPatch(req.body || {});
  const result = await InventoryService.updateProduct(productId, patch);
  res.json(result);
}

export async function deleteProductRoute(req: Request, res: Response) {
  const productId = req.params.id;
  if (!productId) throw new BadRequestError('Missing product id');
  const result = await InventoryService.deleteProduct(productId);
  res.json({ deleted: result.modified });
}
