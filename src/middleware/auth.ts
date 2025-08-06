import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication configuration error'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    
    // Get user information from database
    const userResult = await query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account is deactivated'
      });
      return;
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['admin'])(req, res, next);
}

export function requireManagerOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['admin', 'manager'])(req, res, next);
}

// Middleware to check if user belongs to organization
export async function requireOrganizationAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.params.organizationId || req.body.organizationId;
    
    if (!organizationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Organization ID is required'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    // Check if user is admin (can access any organization)
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user is member of the organization
    const memberResult = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [organizationId, req.user.id]
    );

    if (memberResult.rows.length === 0) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this organization'
      });
      return;
    }

    // Attach organization info to request
    req.user.organizationId = organizationId;
    
    next();

  } catch (error) {
    logger.error('Organization access middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify organization access'
    });
  }
}

// Middleware to check if user has access to project
export async function requireProjectAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Project ID is required'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    // Check if user is admin (can access any project)
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user has access to the project through organization or direct membership
    const accessResult = await query(`
      SELECT p.id 
      FROM projects p
      LEFT JOIN organization_members om ON p.organization_id = om.organization_id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1 
      AND (om.user_id = $2 OR pm.user_id = $2)
    `, [projectId, req.user.id]);

    if (accessResult.rows.length === 0) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this project'
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('Project access middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify project access'
    });
  }
}