import { Router } from 'express';
import categoryController from '../controllers/categoryController';
import { validateRequest } from '../middleware/validateRequest';
import { categorySchema, categoryUpdateSchema, categoryIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', categoryController.getAll);
router.get('/:id', validateRequest(categoryIdSchema), categoryController.getById);
router.post('/', validateRequest(categorySchema), categoryController.create);
router.put('/:id', validateRequest(categoryUpdateSchema), categoryController.update);
router.delete('/:id', validateRequest(categoryIdSchema), categoryController.delete);

export default router; 