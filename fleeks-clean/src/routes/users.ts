import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { userValidation, paramValidation, queryValidation } from '../middleware/validation';
import { requireAdmin, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', requireAdmin, queryValidation.pagination, UserController.getUsers);

// Get user by ID
router.get('/:id', paramValidation.uuid, UserController.getUserById);

// Update user
router.put('/:id', paramValidation.uuid, userValidation.update, UserController.updateUser);

// Delete/deactivate user (admin only)
router.delete('/:id', requireAdmin, paramValidation.uuid, UserController.deleteUser);

// Reactivate user (admin only)
router.post('/:id/activate', requireAdmin, paramValidation.uuid, UserController.reactivateUser);

// Get user's organizations
router.get('/:id/organizations', paramValidation.uuid, UserController.getUserOrganizations);

// Get user's projects
router.get('/:id/projects', paramValidation.uuid, UserController.getUserProjects);

export default router;