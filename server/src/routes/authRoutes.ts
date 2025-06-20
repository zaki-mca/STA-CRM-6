import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, validateSession } from '../middleware/authMiddleware';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);
router.get('/verify-email/:token', authLimiter, AuthController.verifyEmail);

// Protected routes (require authentication)
router.use(authenticateToken);
router.use(validateSession);

router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export default router; 