import { Router } from 'express';
import authController from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema, forgotPasswordSchema } from '../config/schemas';

const router = Router();

// Auth routes
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/register', validateRequest(registerSchema), authController.register);
router.get('/validate', authController.validate);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/logout', authController.logout);

export default router; 