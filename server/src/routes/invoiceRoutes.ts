import { Router } from 'express';
import invoiceController from '../controllers/invoiceController';
import { validateRequest } from '../middleware/validateRequest';
import { invoiceSchema, invoiceUpdateSchema, invoiceIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', invoiceController.getAll);

// Specific routes must come before parameterized routes
router.get('/status/:status', invoiceController.getByStatus);
router.get('/simplified', invoiceController.getSimplified);

// Parameterized routes
router.get('/:id', validateRequest(invoiceIdSchema), invoiceController.getById);
router.post('/', validateRequest(invoiceSchema), invoiceController.create);
router.put('/:id', validateRequest(invoiceUpdateSchema), invoiceController.update);
router.delete('/:id', validateRequest(invoiceIdSchema), invoiceController.delete);
router.patch('/:id/status', validateRequest(invoiceIdSchema), invoiceController.updateStatus);

export default router; 