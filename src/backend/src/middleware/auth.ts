import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { JWTPayload, Role } from '../types';
import prisma from '../utils/db';

// Authentication middleware
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Get token from Authorization header
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedError('Authorization header is required');
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = parts[1];

    // Verify token
    const payload = request.server.jwt.verify(token) as JWTPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    // Attach user to request
    request.user = user;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
};

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return; // No token provided, continue without user
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return; // Invalid format, continue without user
    }

    const token = parts[1];
    const payload = request.server.jwt.verify(token) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      request.user = user;
    }
  } catch (error) {
    // Ignore errors in optional authentication
    return;
  }
};

// Project member authorization middleware
export const requireProjectMember = (minRole: Role = 'VIEWER') => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const projectId = (request.params as { projectId?: string }).projectId;
    if (!projectId) {
      throw new Error('Project ID is required in route parameters');
    }

    // Check if user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: request.user.id,
          projectId: projectId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            createdById: true,
          },
        },
      },
    });

    if (!membership) {
      // Check if user is the project creator
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdById: true },
      });

      if (!project || project.createdById !== request.user.id) {
        throw new ForbiddenError('Access denied to this project');
      }
    } else {
      // Check role requirements
      const roleHierarchy: Record<Role, number> = {
        VIEWER: 1,
        MEMBER: 2,
        ADMIN: 3,
      };

      const userRoleLevel = roleHierarchy[membership.role];
      const requiredRoleLevel = roleHierarchy[minRole];

      if (userRoleLevel < requiredRoleLevel) {
        throw new ForbiddenError(`${minRole} role or higher is required`);
      }
    }
  };
};

// Task access authorization middleware
export const requireTaskAccess = (requireWrite: boolean = false) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const taskId = (request.params as { taskId?: string }).taskId || 
                  (request.params as { id?: string }).id;
    
    if (!taskId) {
      throw new Error('Task ID is required in route parameters');
    }

    // Get task with project information
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            createdById: true,
          },
        },
      },
    });

    if (!task) {
      throw new ForbiddenError('Task not found or access denied');
    }

    // Check if user has access to the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: request.user.id,
          projectId: task.project.id,
        },
      },
    });

    const isProjectCreator = task.project.createdById === request.user.id;

    if (!membership && !isProjectCreator) {
      throw new ForbiddenError('Access denied to this task');
    }

    // For write operations, check if user has sufficient permissions
    if (requireWrite && membership) {
      const roleHierarchy: Record<Role, number> = {
        VIEWER: 1,
        MEMBER: 2,
        ADMIN: 3,
      };

      const userRoleLevel = roleHierarchy[membership.role];
      if (userRoleLevel < roleHierarchy.MEMBER) {
        throw new ForbiddenError('Member role or higher is required to modify tasks');
      }
    }
  };
};

// Admin-only middleware
export const requireAdmin = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // For now, we'll consider the first user or users with specific email patterns as admin
    // In a real application, you might have an isAdmin field in the user table
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(request.user.email);

    if (!isAdmin) {
      throw new ForbiddenError('Admin access required');
    }
  };
};

// Rate limiting middleware for authentication endpoints
export const authRateLimit = {
  max: 5, // Maximum number of requests
  timeWindow: '15 minutes', // Per time window
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later',
  }),
};

// Middleware to check if user owns the resource
export const requireResourceOwner = (resourceType: 'comment' | 'attachment') => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const resourceId = (request.params as { id?: string }).id;
    if (!resourceId) {
      throw new Error(`${resourceType} ID is required in route parameters`);
    }

    let resource;
    switch (resourceType) {
      case 'comment':
        resource = await prisma.comment.findUnique({
          where: { id: resourceId },
          select: { authorId: true },
        });
        break;
      case 'attachment':
        resource = await prisma.attachment.findUnique({
          where: { id: resourceId },
          select: { uploadedBy: true },
        });
        break;
    }

    if (!resource) {
      throw new ForbiddenError(`${resourceType} not found or access denied`);
    }

    const ownerId = resourceType === 'comment' ? resource.authorId : resource.uploadedBy;
    if (ownerId !== request.user.id) {
      throw new ForbiddenError(`You can only modify your own ${resourceType}s`);
    }
  };
};