import { Router } from 'express';
import productController from '../controllers/productController';
import { validateRequest } from '../middleware/validateRequest';
import { productSchema, productUpdateSchema, productIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', productController.getAll);
router.get('/:id', validateRequest(productIdSchema), productController.getById);
router.post('/', validateRequest(productSchema), productController.create);
router.put('/:id', validateRequest(productUpdateSchema), productController.update);
router.delete('/:id', validateRequest(productIdSchema), productController.delete);

// Additional routes
router.get('/category/:categoryId', productController.getByCategory);
router.get('/brand/:brandId', productController.getByBrand);
router.get('/low-stock', productController.getLowStock);
router.patch('/:id/quantity', validateRequest(productIdSchema), productController.updateQuantity);

export default router; 