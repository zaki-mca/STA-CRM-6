import { Router } from 'express';
import clientLogController from '../controllers/clientLogController';
import { validateRequest } from '../middleware/validateRequest';
import { clientLogSchema, clientLogUpdateSchema, clientLogIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', clientLogController.getAll);
router.get('/:id', validateRequest(clientLogIdSchema), clientLogController.getById);
router.post('/', validateRequest(clientLogSchema), clientLogController.create);
router.put('/:id', validateRequest(clientLogUpdateSchema), clientLogController.update);
router.delete('/:id', validateRequest(clientLogIdSchema), clientLogController.delete);

// Additional routes
router.get('/client/:clientId', clientLogController.getLogsByClient);
router.get('/date-range', clientLogController.getLogsByDateRange);
router.get('/today', clientLogController.getTodayLogs);

export default router; 