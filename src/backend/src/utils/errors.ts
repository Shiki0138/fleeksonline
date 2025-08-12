import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, true, details);
  }
}

// Error handler middleware
export const errorHandler = (
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error
  if (error instanceof AppError) {
    if (!error.isOperational) {
      request.log.error(error);
    } else {
      request.log.warn(error);
    }
  } else {
    request.log.error(error);
  }

  // Handle Prisma errors
  if (error.code === 'P2002') {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: 'A record with this data already exists',
      details: isDevelopment ? { prismaError: error.message } : undefined,
    });
  }

  if (error.code === 'P2025') {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'The requested resource was not found',
      details: isDevelopment ? { prismaError: error.message } : undefined,
    });
  }

  // Handle validation errors from Fastify
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: {
        validation: error.validation,
        validationContext: error.validationContext,
      },
    });
  }

  // Handle JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing authorization header',
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token expired',
    });
  }

  if (error.code?.startsWith('FST_JWT_')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: getErrorName(error.statusCode),
      message: error.message,
      details: isDevelopment ? error.details : undefined,
    });
  }

  // Handle other FastifyError instances
  if ('statusCode' in error && error.statusCode) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: getErrorName(error.statusCode),
      message: error.message,
      details: isDevelopment ? { stack: error.stack } : undefined,
    });
  }

  // Default to 500 Internal Server Error
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    details: isDevelopment ? { stack: error.stack } : undefined,
  });
};

// Helper function to get error name from status code
function getErrorName(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return errorNames[statusCode] || 'Unknown Error';
}

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await fn(request, reply);
    } catch (error) {
      throw error;
    }
  };
};

// Utility function to create standardized API responses
export const createResponse = {
  success: <T>(data: T, message?: string) => ({
    success: true,
    message,
    data,
  }),

  error: (message: string, statusCode: number = 500, details?: Record<string, any>) => ({
    success: false,
    error: getErrorName(statusCode),
    message,
    statusCode,
    details,
  }),

  paginated: <T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string
  ) => ({
    success: true,
    message,
    data,
    pagination,
  }),
};