const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const redis = require('../config/redis');
const logger = require('../config/logger');

class AuthService {
  // Generate JWT tokens
  static generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'fleeks-api',
        audience: 'fleeks-client',
      }
    );

    const refreshToken = jwt.sign(
      { ...payload, tokenId: uuidv4() },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'fleeks-api',
        audience: 'fleeks-client',
      }
    );

    return { accessToken, refreshToken };
  }

  // Login user
  static async login(email, password, ip = null, userAgent = null) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      // Verify password
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens(user);

      // Store refresh token in Redis with user info
      const refreshTokenKey = `refresh_token:${user.id}`;
      const tokenData = {
        userId: user.id,
        email: user.email,
        refreshToken,
        ip,
        userAgent,
        createdAt: new Date().toISOString(),
      };

      await redis.set(
        refreshTokenKey,
        tokenData,
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      // Update last login
      await user.updateLastLogin();

      logger.info(`User logged in: ${email} from ${ip}`);

      return {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        },
      };
    } catch (error) {
      logger.error('Login error:', error.message);
      throw error;
    }
  }

  // Register new user
  static async register(userData) {
    try {
      const { email, password, firstName, lastName, role = 'user' } = userData;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw new Error('All fields are required');
      }

      // Validate password strength
      if (!AuthService.isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }

      // Create user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens(user);

      // Store refresh token
      const refreshTokenKey = `refresh_token:${user.id}`;
      const tokenData = {
        userId: user.id,
        email: user.email,
        refreshToken,
        createdAt: new Date().toISOString(),
      };

      await redis.set(
        refreshTokenKey,
        tokenData,
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      logger.info(`User registered: ${email}`);

      return {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        },
      };
    } catch (error) {
      logger.error('Registration error:', error.message);
      throw error;
    }
  }

  // Refresh access token
  static async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Check if refresh token exists in Redis
      const refreshTokenKey = `refresh_token:${decoded.userId}`;
      const storedTokenData = await redis.get(refreshTokenKey);

      if (!storedTokenData || storedTokenData.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = AuthService.generateTokens(user);

      // Update stored refresh token
      const newTokenData = {
        ...storedTokenData,
        refreshToken: tokens.refreshToken,
        updatedAt: new Date().toISOString(),
      };

      await redis.set(
        refreshTokenKey,
        newTokenData,
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        user: user.toJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        },
      };
    } catch (error) {
      logger.error('Token refresh error:', error.message);
      throw error;
    }
  }

  // Logout user
  static async logout(userId, accessToken, refreshToken) {
    try {
      // Add access token to blacklist
      if (accessToken) {
        // Calculate TTL based on token expiration
        const decoded = jwt.decode(accessToken);
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.set(`blacklist:${accessToken}`, true, ttl);
        }
      }

      // Add refresh token to blacklist
      if (refreshToken) {
        const decoded = jwt.decode(refreshToken);
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.set(`blacklist:${refreshToken}`, true, ttl);
        }
      }

      // Remove refresh token from storage
      const refreshTokenKey = `refresh_token:${userId}`;
      await redis.del(refreshTokenKey);

      logger.info(`User logged out: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Logout error:', error.message);
      throw error;
    }
  }

  // Validate password strength
  static isValidPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  // Get user sessions
  static async getUserSessions(userId) {
    try {
      const refreshTokenKey = `refresh_token:${userId}`;
      const tokenData = await redis.get(refreshTokenKey);

      if (!tokenData) {
        return [];
      }

      return [
        {
          ip: tokenData.ip,
          userAgent: tokenData.userAgent,
          createdAt: tokenData.createdAt,
          updatedAt: tokenData.updatedAt,
        },
      ];
    } catch (error) {
      logger.error('Error getting user sessions:', error.message);
      return [];
    }
  }

  // Revoke all user sessions
  static async revokeAllSessions(userId) {
    try {
      const refreshTokenKey = `refresh_token:${userId}`;
      await redis.del(refreshTokenKey);

      logger.info(`All sessions revoked for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error revoking sessions:', error.message);
      throw error;
    }
  }
}

module.exports = AuthService;