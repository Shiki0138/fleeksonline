const Joi = require('joi');
const AuthService = require('../services/AuthService');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class AuthController {
  // Register validation schema
  static registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required',
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required',
    }),
    role: Joi.string().valid('user', 'admin', 'moderator').default('user'),
  });

  // Login validation schema
  static loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  });

  // Refresh token validation schema
  static refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  });

  // Register new user
  static register = asyncHandler(async (req, res) => {
    // Validate request body
    const { error, value } = AuthController.registerSchema.validate(req.body);
    if (error) {
      throw createError('Validation failed', 400, error.details);
    }

    const { email, password, firstName, lastName, role } = value;

    // Register user
    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  });

  // Login user
  static login = asyncHandler(async (req, res) => {
    // Validate request body
    const { error, value } = AuthController.loginSchema.validate(req.body);
    if (error) {
      throw createError('Validation failed', 400, error.details);
    }

    const { email, password } = value;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Login user
    const result = await AuthService.login(email, password, ip, userAgent);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  // Refresh access token
  static refreshToken = asyncHandler(async (req, res) => {
    // Validate request body
    const { error, value } = AuthController.refreshTokenSchema.validate(req.body);
    if (error) {
      throw createError('Validation failed', 400, error.details);
    }

    const { refreshToken } = value;

    // Refresh token
    const result = await AuthService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  });

  // Logout user
  static logout = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const accessToken = req.token;
    const { refreshToken } = req.body;

    // Logout user
    await AuthService.logout(userId, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  });

  // Get current user profile
  static getProfile = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user,
      },
    });
  });

  // Get user sessions
  static getSessions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const sessions = await AuthService.getUserSessions(userId);

    res.json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: {
        sessions,
      },
    });
  });

  // Revoke all sessions
  static revokeAllSessions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await AuthService.revokeAllSessions(userId);

    res.json({
      success: true,
      message: 'All sessions revoked successfully',
    });
  });

  // Change password
  static changePassword = asyncHandler(async (req, res) => {
    const changePasswordSchema = Joi.object({
      currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required',
      }),
      newPassword: Joi.string().min(8).required().messages({
        'string.min': 'New password must be at least 8 characters long',
        'any.required': 'New password is required',
      }),
    });

    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      throw createError('Validation failed', 400, error.details);
    }

    const { currentPassword, newPassword } = value;
    const userId = req.user.id;

    // Get user from database
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isValidCurrentPassword = await user.verifyPassword(currentPassword);
    if (!isValidCurrentPassword) {
      throw createError('Current password is incorrect', 400);
    }

    // Validate new password strength
    if (!AuthService.isValidPassword(newPassword)) {
      throw createError(
        'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400
      );
    }

    // Update password
    await user.updatePassword(newPassword);

    // Revoke all sessions to force re-login
    await AuthService.revokeAllSessions(userId);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  });

  // Verify token (health check for authentication)
  static verifyToken = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
        tokenValid: true,
      },
    });
  });
}

module.exports = AuthController;