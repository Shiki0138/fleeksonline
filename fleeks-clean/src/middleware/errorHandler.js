const logger = require('../config/logger');

class ErrorHandler {
  static handleError(error, req, res, next) {
    logger.logError(error, req);

    // Default error response
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let details = null;

    // Handle specific error types
    switch (error.name) {
      case 'ValidationError':
        statusCode = 400;
        message = 'Validation failed';
        details = ErrorHandler.extractValidationErrors(error);
        break;

      case 'CastError':
        statusCode = 400;
        message = 'Invalid data format';
        break;

      case 'JsonWebTokenError':
        statusCode = 401;
        message = 'Invalid token';
        break;

      case 'TokenExpiredError':
        statusCode = 401;
        message = 'Token expired';
        break;

      case 'MulterError':
        statusCode = 400;
        message = ErrorHandler.getMulterErrorMessage(error);
        break;

      case 'SequelizeValidationError':
      case 'SequelizeUniqueConstraintError':
        statusCode = 400;
        message = 'Database validation failed';
        details = ErrorHandler.extractSequelizeErrors(error);
        break;

      case 'SequelizeForeignKeyConstraintError':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        break;

      case 'SequelizeConnectionError':
      case 'SequelizeDatabaseError':
        statusCode = 500;
        message = 'Database error';
        break;

      default:
        // Handle HTTP errors
        if (error.status) {
          statusCode = error.status;
        }
        break;
    }

    // Don't leak sensitive information in production
    if (process.env.NODE_ENV === 'production') {
      if (statusCode === 500) {
        message = 'Internal server error';
        details = null;
      }
    }

    // Build error response
    const errorResponse = {
      error: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    // Add details if available
    if (details) {
      errorResponse.details = details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    // Add request information for debugging
    if (process.env.NODE_ENV === 'development') {
      errorResponse.request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
      };
    }

    res.status(statusCode).json(errorResponse);
  }

  static extractValidationErrors(error) {
    if (error.details) {
      // Joi validation errors
      return error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));
    }

    // Other validation errors
    return Object.keys(error.errors || {}).map(key => ({
      field: key,
      message: error.errors[key].message,
    }));
  }

  static extractSequelizeErrors(error) {
    if (error.errors) {
      return error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));
    }
    return null;
  }

  static getMulterErrorMessage(error) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return 'File too large';
      case 'LIMIT_FILE_COUNT':
        return 'Too many files';
      case 'LIMIT_FIELD_KEY':
        return 'Field name too long';
      case 'LIMIT_FIELD_VALUE':
        return 'Field value too long';
      case 'LIMIT_FIELD_COUNT':
        return 'Too many fields';
      case 'LIMIT_UNEXPECTED_FILE':
        return 'Unexpected file field';
      default:
        return 'File upload error';
    }
  }

  // 404 handler
  static notFound(req, res, next) {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
  }

  // Async error wrapper
  static asyncHandler(fn) {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  }

  // Create custom error
  static createError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (details) {
      error.details = details;
    }
    return error;
  }
}

module.exports = ErrorHandler.handleError;
module.exports.notFound = ErrorHandler.notFound;
module.exports.asyncHandler = ErrorHandler.asyncHandler;
module.exports.createError = ErrorHandler.createError;