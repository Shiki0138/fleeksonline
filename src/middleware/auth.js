const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const redis = require('../config/redis');
const User = require('../models/User');

class AuthMiddleware {
  // JWT token verification middleware
  static async verifyToken(req, res, next) {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'No token provided',
        });
      }

      // Extract token from "Bearer <token>"
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      if (!token) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Invalid token format',
        });
      }

      // Check if token is blacklisted
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Token has been revoked',
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'User not found',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Account is disabled',
        });
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };
      req.token = token;

      next();
    } catch (error) {
      logger.logError(error, req);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Invalid token',
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Token expired',
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Authentication failed',
      });
    }
  }

  // Role-based authorization middleware
  static authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }

      next();
    };
  }

  // Optional authentication (won't fail if no token)
  static async optionalAuth(req, res, next) {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader) {
        return next();
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      if (!token) {
        return next();
      }

      // Check if token is blacklisted
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return next();
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        };
        req.token = token;
      }

      next();
    } catch (error) {
      // Silent fail for optional auth
      next();
    }
  }

  // Refresh token validation
  static async verifyRefreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Refresh token required',
        });
      }

      // Check if refresh token is blacklisted
      const isBlacklisted = await redis.exists(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Refresh token has been revoked',
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Invalid refresh token',
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };
      req.refreshToken = refreshToken;

      next();
    } catch (error) {
      logger.logError(error, req);
      
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid refresh token',
      });
    }
  }
}

module.exports = AuthMiddleware.verifyToken;
module.exports.authorize = AuthMiddleware.authorize;
module.exports.optionalAuth = AuthMiddleware.optionalAuth;
module.exports.verifyRefreshToken = AuthMiddleware.verifyRefreshToken;