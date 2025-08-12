const Joi = require('joi');

/**
 * Common validation schemas and utilities
 */

// Email validation
const emailSchema = Joi.string().email().required().messages({
  'string.email': 'Please provide a valid email address',
  'any.required': 'Email is required',
});

// Password validation
const passwordSchema = Joi.string().min(8).required().messages({
  'string.min': 'Password must be at least 8 characters long',
  'any.required': 'Password is required',
});

// Strong password validation
const strongPasswordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
  });

// Name validation
const nameSchema = Joi.string().min(2).max(50).required().messages({
  'string.min': 'Name must be at least 2 characters long',
  'string.max': 'Name cannot exceed 50 characters',
  'any.required': 'Name is required',
});

// UUID validation
const uuidSchema = Joi.string().uuid().required().messages({
  'string.uuid': 'Invalid ID format',
  'any.required': 'ID is required',
});

// Pagination validation
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow('').default(''),
});

// Role validation
const roleSchema = Joi.string().valid('user', 'admin', 'moderator').default('user');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Replace the original data with validated/sanitized data
    req[property] = value;
    next();
  };
};

/**
 * Sanitize string input
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Sanitize object inputs recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - Whether UUID is valid
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Common validation schemas for export
 */
const schemas = {
  email: emailSchema,
  password: passwordSchema,
  strongPassword: strongPasswordSchema,
  name: nameSchema,
  uuid: uuidSchema,
  pagination: paginationSchema,
  role: roleSchema,
};

module.exports = {
  validate,
  sanitizeString,
  sanitizeObject,
  isValidEmail,
  isValidUUID,
  schemas,
};