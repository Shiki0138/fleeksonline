const Joi = require('joi');
const User = require('../models/User');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class UserController {
  // User update validation schema
  static updateUserSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
    }),
    lastName: Joi.string().min(2).max(50).messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
    }),
    role: Joi.string().valid('user', 'admin', 'moderator'),
    isActive: Joi.boolean(),
    emailVerified: Joi.boolean(),
  });

  // Query validation schema
  static querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'email', 'first_name', 'last_name').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().allow(''),
    role: Joi.string().valid('user', 'admin', 'moderator'),
    isActive: Joi.boolean(),
  });

  // Get all users (admin only)
  static getUsers = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw createError('Insufficient permissions', 403);
    }

    // Validate query parameters
    const { error, value } = UserController.querySchema.validate(req.query);
    if (error) {
      throw createError('Invalid query parameters', 400, error.details);
    }

    // Get users
    const result = await User.findAll(value);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  });

  // Get user by ID
  static getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw createError('Insufficient permissions', 403);
    }

    const user = await User.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: user.toJSON(),
      },
    });
  });

  // Update user
  static updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw createError('Insufficient permissions', 403);
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Validate request body
    const { error, value } = UserController.updateUserSchema.validate(req.body);
    if (error) {
      throw createError('Validation failed', 400, error.details);
    }

    // Non-admin users cannot change certain fields
    if (req.user.role !== 'admin') {
      delete value.role;
      delete value.isActive;
      delete value.emailVerified;
    }

    // Update user
    const updatedUser = await user.update({
      first_name: value.firstName,
      last_name: value.lastName,
      role: value.role,
      is_active: value.isActive,
      email_verified: value.emailVerified,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser.toJSON(),
      },
    });
  });

  // Delete user (soft delete)
  static deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Only admins can delete users
    if (req.user.role !== 'admin') {
      throw createError('Insufficient permissions', 403);
    }

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      throw createError('Cannot delete your own account', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    await user.delete();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  });

  // Restore deleted user
  static restoreUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Only admins can restore users
    if (req.user.role !== 'admin') {
      throw createError('Insufficient permissions', 403);
    }

    const user = await User.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.isActive) {
      throw createError('User is already active', 400);
    }

    await user.update({ is_active: true });

    res.json({
      success: true,
      message: 'User restored successfully',
      data: {
        user: user.toJSON(),
      },
    });
  });

  // Get user statistics (admin only)
  static getUserStats = asyncHandler(async (req, res) => {
    // Only admins can view stats
    if (req.user.role !== 'admin') {
      throw createError('Insufficient permissions', 403);
    }

    const database = require('../config/database');

    // Get user statistics
    const [totalUsers] = await database.table('users').count('* as count');
    const [activeUsers] = await database.table('users').where('is_active', true).count('* as count');
    const [inactiveUsers] = await database.table('users').where('is_active', false).count('* as count');
    const [verifiedUsers] = await database.table('users').where('email_verified', true).count('* as count');

    // Get users by role
    const roleStats = await database.table('users')
      .select('role')
      .count('* as count')
      .groupBy('role');

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentRegistrations] = await database.table('users')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as count');

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        stats: {
          total: parseInt(totalUsers.count),
          active: parseInt(activeUsers.count),
          inactive: parseInt(inactiveUsers.count),
          verified: parseInt(verifiedUsers.count),
          recentRegistrations: parseInt(recentRegistrations.count),
          roleDistribution: roleStats.reduce((acc, item) => {
            acc[item.role] = parseInt(item.count);
            return acc;
          }, {}),
        },
      },
    });
  });

  // Search users
  static searchUsers = asyncHandler(async (req, res) => {
    // Only admins can search all users
    if (req.user.role !== 'admin') {
      throw createError('Insufficient permissions', 403);
    }

    const { q: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw createError('Search query is required', 400);
    }

    // Validate query parameters
    const { error, value } = UserController.querySchema.validate(req.query);
    if (error) {
      throw createError('Invalid query parameters', 400, error.details);
    }

    // Set search parameter
    value.search = searchQuery.trim();

    // Search users
    const result = await User.findAll(value);

    res.json({
      success: true,
      message: 'User search completed successfully',
      data: result,
    });
  });
}

module.exports = UserController;