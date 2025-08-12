import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { JWTPayload } from '../types';

export class AuthUtils {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT tokens
  generateTokens(payload: JWTPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.fastify.jwt.sign(
      payload,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        algorithm: 'HS256'
      }
    );

    const refreshToken = this.fastify.jwt.sign(
      payload,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        algorithm: 'HS256'
      }
    );

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      return this.fastify.jwt.verify(token) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authorization?: string): string {
    if (!authorization) {
      throw new Error('Authorization header is required');
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }

  // Generate random string for tokens
  generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create user payload for JWT
  createUserPayload(user: { id: string; email: string; username: string }): JWTPayload {
    return {
      userId: user.id,
      email: user.email,
      username: user.username,
    };
  }
}

// Utility functions that can be used without FastifyInstance
export const authUtils = {
  hashPassword: async (password: string): Promise<string> => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  },

  verifyPassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
  },

  generateRandomString: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  extractTokenFromHeader: (authorization?: string): string => {
    if (!authorization) {
      throw new Error('Authorization header is required');
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }
};

// Password validation utility
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 100) {
    errors.push('Password must not exceed 100 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};