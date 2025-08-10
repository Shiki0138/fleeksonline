import { Router } from 'express';
import { OrganizationController } from '../controllers/OrganizationController';
import { organizationValidation, paramValidation, queryValidation } from '../middleware/validation';
import { requireOrganizationAccess } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Get all organizations
router.get('/', queryValidation.pagination, OrganizationController.getOrganizations);

// Create new organization
router.post('/', organizationValidation.create, OrganizationController.createOrganization);

// Get organization by ID
router.get('/:id', paramValidation.uuid, OrganizationController.getOrganizationById);

// Update organization
router.put('/:id', paramValidation.uuid, organizationValidation.update, OrganizationController.updateOrganization);

// Delete organization
router.delete('/:id', paramValidation.uuid, OrganizationController.deleteOrganization);

// Organization members routes
router.get('/:id/members', paramValidation.uuid, OrganizationController.getOrganizationMembers);

router.post('/:id/members', 
  paramValidation.uuid,
  [
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('role').optional().isIn(['owner', 'admin', 'manager', 'member']).withMessage('Invalid role'),
    handleValidationErrors
  ],
  OrganizationController.addOrganizationMember
);

router.put('/:id/members/:userId',
  [
    paramValidation.uuid[0], // for organization ID
    body('role').isIn(['owner', 'admin', 'manager', 'member']).withMessage('Invalid role'),
    handleValidationErrors
  ],
  OrganizationController.updateMemberRole
);

router.delete('/:id/members/:userId', paramValidation.uuid, OrganizationController.removeOrganizationMember);

export default router;