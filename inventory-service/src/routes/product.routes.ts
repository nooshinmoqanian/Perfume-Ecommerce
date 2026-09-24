import { Router } from 'express';
import multer from 'multer';
import { listProducts, reserveRoute, createProduct, uploadProductImageRoute, getProductImageRoute, getProductById, updateProductRoute, deleteProductRoute, listCategories, createCategoryRoute, deleteCategoryRoute } from '../controllers/product.controller';
import { asyncHandler } from '../../../libs/common/middleware/async-handler';
import { adminOnly } from '../../../libs/common/middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/products', asyncHandler(listProducts));
router.get('/categories', asyncHandler(listCategories));
// POST path changed to /categories/add to avoid collision with GET
router.post('/categories/add', adminOnly, asyncHandler(createCategoryRoute));
router.delete('/categories/:id', adminOnly, asyncHandler(deleteCategoryRoute));
router.get('/products/:id', asyncHandler(getProductById));
router.post('/products', adminOnly, upload.single('image'), asyncHandler(createProduct));
router.put('/products/:id', adminOnly, asyncHandler(updateProductRoute));
router.delete('/products/:id', adminOnly, asyncHandler(deleteProductRoute));
// Manual reservation is an admin tool; shoppers reserve through the order flow (Kafka).
router.post('/products/reserve', adminOnly, asyncHandler(reserveRoute));

// upload and fetch product image
router.post('/products/:id/image', adminOnly, upload.single('image'), asyncHandler(uploadProductImageRoute));
router.get('/products/:id/image', asyncHandler(getProductImageRoute));

export default router;
