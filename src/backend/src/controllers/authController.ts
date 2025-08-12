import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { 
  LoginRequest, 
  RegisterRequest,
  CreateCommentRequest,
  UpdateUserSchema
} from '../types';
import { 
  validateData, 
  loginSchema, 
  registerSchema,
  updateUserSchema 
} from '../utils/validation';
import { createResponse, asyncHandler } from '../utils/errors';
import prisma from '../utils/db';

export class AuthController {
  private authService: AuthService;

  constructor(fastify: any) {
    this.authService = new AuthService(fastify);
  }

  register = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const data = validateData(registerSchema, request.body);
    const result = await this.authService.register(data);

    reply.status(201).send(createResponse.success(result, 'User registered successfully'));
  });

  login = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const data = validateData(loginSchema, request.body);
    const result = await this.authService.login(data);

    reply.send(createResponse.success(result, 'Login successful'));
  });

  refreshToken = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    
    if (!refreshToken) {
      return reply.status(400).send(createResponse.error('Refresh token is required', 400));
    }

    const result = await this.authService.refreshToken(refreshToken);
    reply.send(createResponse.success(result, 'Token refreshed successfully'));
  });

  logout = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // In a stateless JWT implementation, logout is handled client-side
    // Here you could implement token blacklisting if needed
    reply.send(createResponse.success(null, 'Logged out successfully'));
  });

  getProfile = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    reply.send(createResponse.success(profile, 'Profile retrieved successfully'));
  });

  updateProfile = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const data = validateData(updateUserSchema, request.body);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    reply.send(createResponse.success(updatedUser, 'Profile updated successfully'));
  });

  changePassword = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { currentPassword, newPassword } = request.body as { 
      currentPassword: string; 
      newPassword: string; 
    };

    if (!currentPassword || !newPassword) {
      return reply.status(400).send(
        createResponse.error('Current password and new password are required', 400)
      );
    }

    await this.authService.changePassword(user.id, currentPassword, newPassword);
    reply.send(createResponse.success(null, 'Password changed successfully'));
  });

  requestPasswordReset = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as { email: string };

    if (!email) {
      return reply.status(400).send(createResponse.error('Email is required', 400));
    }

    await this.authService.resetPasswordRequest(email);
    reply.send(createResponse.success(null, 'Password reset email sent if account exists'));
  });

  resetPassword = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, newPassword } = request.body as { token: string; newPassword: string };

    if (!token || !newPassword) {
      return reply.status(400).send(
        createResponse.error('Token and new password are required', 400)
      );
    }

    await this.authService.resetPassword(token, newPassword);
    reply.send(createResponse.success(null, 'Password reset successfully'));
  });

  validateToken = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as { token: string };

    if (!token) {
      return reply.status(400).send(createResponse.error('Token is required', 400));
    }

    try {
      const payload = await this.authService.validateToken(token);
      const user = await this.authService.getUserByToken(token);
      
      reply.send(createResponse.success({ payload, user }, 'Token is valid'));
    } catch (error) {
      reply.status(401).send(createResponse.error('Invalid token', 401));
    }
  });

  deactivateAccount = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    await this.authService.deactivateAccount(user.id);
    reply.send(createResponse.success(null, 'Account deactivated successfully'));
  });

  // Admin only endpoints
  listUsers = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 20, search } = request.query as {
      page?: number;
      limit?: number;
      search?: string;
    };

    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    reply.send(createResponse.paginated(users, {
      page,
      limit,
      total,
      totalPages,
    }, 'Users retrieved successfully'));
  });

  getUserById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        createdProjects: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send(createResponse.error('User not found', 404));
    }

    reply.send(createResponse.success(user, 'User retrieved successfully'));
  });

  reactivateUser = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.authService.reactivateAccount(id);
    reply.send(createResponse.success(null, 'User reactivated successfully'));
  });

  deactivateUser = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.authService.deactivateAccount(id);
    reply.send(createResponse.success(null, 'User deactivated successfully'));
  });
}