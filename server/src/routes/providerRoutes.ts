import { Router } from 'express';
import providerController from '../controllers/providerController';
import { validateRequest } from '../middleware/validateRequest';
import { providerSchema, providerUpdateSchema, providerIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', providerController.getAll);
router.get('/:id', validateRequest(providerIdSchema), providerController.getById);
router.post('/', validateRequest(providerSchema), providerController.create);
router.put('/:id', validateRequest(providerUpdateSchema), providerController.update);
router.delete('/:id', validateRequest(providerIdSchema), providerController.delete);

// Additional routes
router.get('/:id/products', validateRequest(providerIdSchema), providerController.getProviderProducts);
router.get('/:id/orders', validateRequest(providerIdSchema), providerController.getProviderOrders);

export default router; 