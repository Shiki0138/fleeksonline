import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './errorHandler';

// Helper function to handle validation results
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : error.type,
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errorMessages,
      statusCode: 400,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
}

// User validation schemas
export const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name is required and must be less than 100 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name is required and must be less than 100 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be admin, manager, or user'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  update: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name must be less than 100 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name must be less than 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role must be admin, manager, or user'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    handleValidationErrors
  ]
};

// Organization validation schemas
export const organizationValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Organization name is required and must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Website must be a valid URL'),
    body('industry')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Industry must be less than 100 characters'),
    body('size')
      .optional()
      .isIn(['startup', 'small', 'medium', 'large', 'enterprise'])
      .withMessage('Size must be one of: startup, small, medium, large, enterprise'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Organization name must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Website must be a valid URL'),
    body('industry')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Industry must be less than 100 characters'),
    body('size')
      .optional()
      .isIn(['startup', 'small', 'medium', 'large', 'enterprise'])
      .withMessage('Size must be one of: startup, small, medium, large, enterprise'),
    handleValidationErrors
  ]
};

// Project validation schemas
export const projectValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name is required and must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('status')
      .optional()
      .isIn(['planning', 'active', 'paused', 'completed', 'cancelled'])
      .withMessage('Status must be one of: planning, active, paused, completed, cancelled'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Priority must be one of: low, medium, high, critical'),
    body('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Start date must be a valid date'),
    body('dueDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Due date must be a valid date'),
    body('budget')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget must be a positive number'),
    body('organizationId')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('managerId')
      .optional()
      .isUUID()
      .withMessage('Manager ID must be a valid UUID'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('status')
      .optional()
      .isIn(['planning', 'active', 'paused', 'completed', 'cancelled'])
      .withMessage('Status must be one of: planning, active, paused, completed, cancelled'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Priority must be one of: low, medium, high, critical'),
    body('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Start date must be a valid date'),
    body('dueDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Due date must be a valid date'),
    body('budget')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget must be a positive number'),
    body('managerId')
      .optional()
      .isUUID()
      .withMessage('Manager ID must be a valid UUID'),
    handleValidationErrors
  ]
};

// Task validation schemas
export const taskValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Task title is required and must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('status')
      .optional()
      .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
      .withMessage('Status must be one of: todo, in_progress, review, done, cancelled'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Priority must be one of: low, medium, high, critical'),
    body('estimatedHours')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Estimated hours must be a positive number'),
    body('dueDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Due date must be a valid date'),
    body('projectId')
      .isUUID()
      .withMessage('Project ID must be a valid UUID'),
    body('assigneeId')
      .optional()
      .isUUID()
      .withMessage('Assignee ID must be a valid UUID'),
    body('parentTaskId')
      .optional()
      .isUUID()
      .withMessage('Parent task ID must be a valid UUID'),
    handleValidationErrors
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Task title must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('status')
      .optional()
      .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
      .withMessage('Status must be one of: todo, in_progress, review, done, cancelled'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Priority must be one of: low, medium, high, critical'),
    body('estimatedHours')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Estimated hours must be a positive number'),
    body('actualHours')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Actual hours must be a positive number'),
    body('dueDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Due date must be a valid date'),
    body('assigneeId')
      .optional()
      .isUUID()
      .withMessage('Assignee ID must be a valid UUID'),
    handleValidationErrors
  ]
};

// Parameter validation
export const paramValidation = {
  uuid: [
    param('id').isUUID().withMessage('ID must be a valid UUID'),
    handleValidationErrors
  ],
  
  organizationId: [
    param('organizationId').isUUID().withMessage('Organization ID must be a valid UUID'),
    handleValidationErrors
  ],
  
  projectId: [
    param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
    handleValidationErrors
  ],
  
  taskId: [
    param('taskId').isUUID().withMessage('Task ID must be a valid UUID'),
    handleValidationErrors
  ]
};

// Query parameter validation
export const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('Sort by must be a string'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    handleValidationErrors
  ]
};