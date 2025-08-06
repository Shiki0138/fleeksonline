import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { userValidation } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', userValidation.register, AuthController.register);
router.post('/login', userValidation.login, AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.getProfile);
router.post('/change-password', authMiddleware, userValidation.changePassword, AuthController.changePassword);
router.post('/verify', authMiddleware, AuthController.verifyToken);

export default router;