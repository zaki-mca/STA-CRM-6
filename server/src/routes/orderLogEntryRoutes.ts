import { Router } from 'express';
import orderLogEntryController from '../controllers/orderLogEntryController';
import { validateRequest } from '../middleware/validateRequest';
import { orderLogEntrySchema, orderLogEntryBatchSchema, orderLogEntryIdSchema } from '../config/schemas';

const router = Router();

// Get entries for a specific log
router.get('/log/:logId', orderLogEntryController.getEntriesByLogId);

// Add a single order to a log
router.post('/', validateRequest(orderLogEntrySchema), orderLogEntryController.addOrderToLog);

// Add multiple orders to a log in a batch
router.post('/batch', validateRequest(orderLogEntryBatchSchema), orderLogEntryController.addOrdersBatch);

// Remove an order from a log
router.delete('/:id', validateRequest(orderLogEntryIdSchema), orderLogEntryController.removeOrderFromLog);

export default router; 