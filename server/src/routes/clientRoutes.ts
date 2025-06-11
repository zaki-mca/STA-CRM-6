import { Router } from 'express';
import clientController from '../controllers/clientController';
import { validateRequest } from '../middleware/validateRequest';
import { clientSchema, clientUpdateSchema, clientIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', clientController.getAll);
router.get('/:id', validateRequest(clientIdSchema), clientController.getById);
router.post('/', validateRequest(clientSchema), clientController.create);
router.put('/:id', validateRequest(clientUpdateSchema), clientController.update);
router.delete('/:id', validateRequest(clientIdSchema), clientController.delete);

// Additional routes
router.get('/:id/orders', validateRequest(clientIdSchema), clientController.getClientOrders);
router.get('/:id/invoices', validateRequest(clientIdSchema), clientController.getClientInvoices);
router.get('/:id/logs', validateRequest(clientIdSchema), clientController.getClientLogs);

export default router; 