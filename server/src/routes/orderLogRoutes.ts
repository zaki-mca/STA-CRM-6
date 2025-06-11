import { Router } from 'express';
import orderLogController from '../controllers/orderLogController';
import { validateRequest } from '../middleware/validateRequest';
import { orderLogSchema, orderLogUpdateSchema, orderLogIdSchema } from '../config/schemas';

const router = Router();

// Additional routes - these must come BEFORE the parameterized routes
router.get('/order/:orderId', orderLogController.getLogsByOrder);
router.get('/date-range', orderLogController.getLogsByDateRange);
router.get('/today', orderLogController.getTodayLogs);

// Standard CRUD routes
router.get('/', orderLogController.getAll);
router.get('/:id', validateRequest(orderLogIdSchema), orderLogController.getById);
router.post('/', validateRequest(orderLogSchema), orderLogController.create);
router.put('/:id', validateRequest(orderLogUpdateSchema), orderLogController.update);
router.delete('/:id', validateRequest(orderLogIdSchema), orderLogController.delete);

export default router; 