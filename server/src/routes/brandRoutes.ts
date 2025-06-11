import { Router } from 'express';
import brandController from '../controllers/brandController';
import { validateRequest } from '../middleware/validateRequest';
import { brandSchema, brandUpdateSchema, brandIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', brandController.getAll);
router.get('/:id', validateRequest(brandIdSchema), brandController.getById);
router.post('/', validateRequest(brandSchema), brandController.create);
router.put('/:id', validateRequest(brandUpdateSchema), brandController.update);
router.delete('/:id', validateRequest(brandIdSchema), brandController.delete);

export default router; 