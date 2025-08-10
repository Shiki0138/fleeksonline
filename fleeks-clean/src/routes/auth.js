const express = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/auth');
const { verifyRefreshToken } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', verifyRefreshToken, AuthController.refreshToken);

// Protected routes (authentication required)
router.use(authMiddleware); // Apply auth middleware to all routes below

router.get('/profile', AuthController.getProfile);
router.post('/logout', AuthController.logout);
router.get('/sessions', AuthController.getSessions);
router.post('/revoke-sessions', AuthController.revokeAllSessions);
router.post('/change-password', AuthController.changePassword);
router.get('/verify-token', AuthController.verifyToken);

module.exports = router;