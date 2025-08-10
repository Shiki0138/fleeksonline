const express = require('express');
const UserController = require('../controllers/UserController');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require authentication (applied in server.js)

// User management routes
router.get('/', UserController.getUsers); // Admin only
router.get('/search', UserController.searchUsers); // Admin only
router.get('/stats', UserController.getUserStats); // Admin only
router.get('/:id', UserController.getUserById); // User can view own profile, admin can view any
router.put('/:id', UserController.updateUser); // User can update own profile, admin can update any
router.delete('/:id', authorize('admin'), UserController.deleteUser); // Admin only
router.post('/:id/restore', authorize('admin'), UserController.restoreUser); // Admin only

module.exports = router;