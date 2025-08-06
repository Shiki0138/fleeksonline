import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, requestLogger } from '../config/logger';

interface RequestWithId extends Request {
  requestId?: string;
  startTime?: number;
}

export function requestLoggerMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Skip logging for health checks and static assets
  const skipLogging = [
    '/health',
    '/favicon.ico',
    '/robots.txt'
  ].some(path => req.path.startsWith(path));

  if (skipLogging) {
    return next();
  }

  // Log request start
  logger.info('📥 Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    contentLength: req.get('Content-Length'),
    contentType: req.get('Content-Type')
  });

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log response details
    requestLogger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id,
      contentLength: res.get('Content-Length')
    });

    // Log performance warnings
    if (responseTime > 5000) {
      logger.warn('⚠️  Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        responseTime: responseTime
      });
    }

    // Log error responses
    if (res.statusCode >= 400) {
      logger.error('❌ Error response', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: responseTime,
        userId: (req as any).user?.id
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding, callback);
  };

  next();
}

// Middleware to add security headers
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Remove server header for security
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

// Request timeout middleware
export function timeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('⏰ Request timeout', {
          method: req.method,
          url: req.originalUrl,
          timeout: timeoutMs,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });

        res.status(408).json({
          error: 'Request Timeout',
          message: `Request timed out after ${timeoutMs}ms`,
          statusCode: 408,
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalSend = res.send;
    res.send = function(body: any) {
      clearTimeout(timeout);
      return originalSend.call(this, body);
    };

    next();
  };
}

export { requestLoggerMiddleware as requestLogger };