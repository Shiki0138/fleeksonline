import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../utils/db';
import { AuthUtils } from '../utils/auth';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  JWTPayload 
} from '../types';
import { 
  ConflictError, 
  UnauthorizedError, 
  ValidationError,
  NotFoundError 
} from '../utils/errors';

export class AuthService {
  private fastify: FastifyInstance;
  private authUtils: AuthUtils;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.authUtils = new AuthUtils(fastify);
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, username, firstName, lastName, password } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('User with this email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictError('User with this username already exists');
      }
    }

    // Hash password
    const hashedPassword = await this.authUtils.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
      },
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
      }
    });

    // Generate tokens
    const payload = this.authUtils.createUserPayload(user);
    const tokens = this.authUtils.generateTokens(payload);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.authUtils.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const payload = this.authUtils.createUserPayload(user);
    const tokens = this.authUtils.generateTokens(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = await this.authUtils.verifyToken(refreshToken);

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true,
        }
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is inactive');
      }

      // Generate new access token
      const newPayload = this.authUtils.createUserPayload(user);
      const tokens = this.authUtils.generateTokens(newPayload);

      return {
        accessToken: tokens.accessToken,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.authUtils.verifyPassword(
      currentPassword, 
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.authUtils.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  async resetPasswordRequest(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send email with reset link
    
    // For now, we'll just log that a reset was requested
    console.log(`Password reset requested for user: ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // In a real application, you would:
    // 1. Verify the reset token
    // 2. Check if it's not expired
    // 3. Update the user's password
    // 4. Invalidate the reset token
    
    throw new Error('Password reset functionality not implemented');
  }

  async deactivateAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async reactivateAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  async validateToken(token: string): Promise<JWTPayload> {
    return this.authUtils.verifyToken(token);
  }

  async getUserByToken(token: string) {
    const payload = await this.validateToken(token);
    
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
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    return user;
  }
}