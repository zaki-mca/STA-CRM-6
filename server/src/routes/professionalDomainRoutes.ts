import { Router } from 'express';
import professionalDomainController from '../controllers/professionalDomainController';
import { validateRequest } from '../middleware/validateRequest';
import { professionalDomainSchema, professionalDomainUpdateSchema, professionalDomainIdSchema } from '../config/schemas';

const router = Router();

// Standard CRUD routes
router.get('/', professionalDomainController.getAll);
router.get('/:id', validateRequest(professionalDomainIdSchema), professionalDomainController.getById);
router.post('/', validateRequest(professionalDomainSchema), professionalDomainController.create);
router.put('/:id', validateRequest(professionalDomainUpdateSchema), professionalDomainController.update);
router.delete('/:id', validateRequest(professionalDomainIdSchema), professionalDomainController.delete);

// Additional routes
router.get('/:id/clients', validateRequest(professionalDomainIdSchema), professionalDomainController.getClientsByDomain);

export default router; 