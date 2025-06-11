import { Router } from 'express';
import orderController from '../controllers/orderController';
import { validateRequest } from '../middleware/validateRequest';
import { orderSchema, orderUpdateSchema, orderIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', orderController.getAll);
router.get('/:id', validateRequest(orderIdSchema), orderController.getById);
router.post('/', validateRequest(orderSchema), orderController.create);
router.put('/:id', validateRequest(orderUpdateSchema), orderController.update);
router.delete('/:id', validateRequest(orderIdSchema), orderController.delete);

// Additional routes
router.get('/status/:status', orderController.getByStatus);
router.patch('/:id/status', validateRequest(orderIdSchema), orderController.updateStatus);
router.post('/:id/create-invoice', validateRequest(orderIdSchema), orderController.createInvoice);
router.get('/:id/logs', validateRequest(orderIdSchema), orderController.getOrderLogs);

export default router; 