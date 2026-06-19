import { Router } from 'express';
import multer from 'multer';
import { listProducts, reserveRoute, createProduct, uploadProductImageRoute, getProductImageRoute, getProductById, updateProductRoute, deleteProductRoute, listCategories, createCategoryRoute, deleteCategoryRoute } from '../controllers/product.controller';
import { asyncHandler } from '../../../libs/common/middleware/async-handler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/products', asyncHandler(listProducts));
router.get('/categories', asyncHandler(listCategories));
// POST path changed to /categories/add to avoid collision with GET
router.post('/categories/add', asyncHandler(createCategoryRoute));
router.delete('/categories/:id', asyncHandler(deleteCategoryRoute));
router.get('/products/:id', asyncHandler(getProductById));
router.post('/products', upload.single('image'), asyncHandler(createProduct));
router.put('/products/:id', asyncHandler(updateProductRoute));
router.delete('/products/:id', asyncHandler(deleteProductRoute));
router.post('/products/reserve', asyncHandler(reserveRoute));

// upload and fetch product image
router.post('/products/:id/image', upload.single('image'), asyncHandler(uploadProductImageRoute));
router.get('/products/:id/image', asyncHandler(getProductImageRoute));

export default router;
