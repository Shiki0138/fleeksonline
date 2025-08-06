import { Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export class UserController {
  /**
   * Get all users (admin only)
   * GET /api/v1/users
   */
  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (status === 'active') {
      whereConditions.push(`is_active = true`);
    } else if (status === 'inactive') {
      whereConditions.push(`is_active = false`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
      queryParams
    );
    const totalUsers = parseInt(countResult.rows[0].count);

    // Get users with pagination
    const usersResult = await query(
      `SELECT id, email, first_name, last_name, role, is_active, email_verified, last_login, created_at, updated_at
       FROM users 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    const users = usersResult.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const totalPages = Math.ceil(totalUsers / Number(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalUsers,
          limit: Number(limit),
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    });
  });

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      throw new ForbiddenError('Access denied');
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, email_verified, last_login, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });
  });

  /**
   * Update user
   * PUT /api/v1/users/:id
   */
  static updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { firstName, lastName, email, role } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      throw new ForbiddenError('Access denied');
    }

    // Non-admin users cannot change roles
    if (req.user?.role !== 'admin' && role) {
      throw new ForbiddenError('Cannot change user role');
    }

    // Build update query
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (firstName) {
      updateFields.push(`first_name = $${paramIndex}`);
      queryParams.push(firstName);
      paramIndex++;
    }

    if (lastName) {
      updateFields.push(`last_name = $${paramIndex}`);
      queryParams.push(lastName);
      paramIndex++;
    }

    if (email) {
      updateFields.push(`email = $${paramIndex}`);
      queryParams.push(email);
      paramIndex++;
    }

    if (role && req.user?.role === 'admin') {
      updateFields.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No valid fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    queryParams.push(id);

    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, role, is_active, email_verified, updated_at`,
      queryParams
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = result.rows[0];

    logger.info('User updated successfully', {
      userId: id,
      updatedBy: req.user?.id,
      fields: updateFields
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          updatedAt: user.updated_at
        }
      }
    });
  });

  /**
   * Delete user (admin only)
   * DELETE /api/v1/users/:id
   */
  static deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if user exists
    const checkResult = await query('SELECT id, email FROM users WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Cannot delete yourself
    if (req.user?.id === id) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    // Soft delete by setting is_active to false
    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    logger.info('User deactivated', {
      userId: id,
      deletedBy: req.user?.id,
      userEmail: checkResult.rows[0].email
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  });

  /**
   * Reactivate user (admin only)
   * POST /api/v1/users/:id/activate
   */
  static reactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING id, email, first_name, last_name`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = result.rows[0];

    logger.info('User reactivated', {
      userId: id,
      reactivatedBy: req.user?.id,
      userEmail: user.email
    });

    res.json({
      success: true,
      message: 'User reactivated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });
  });

  /**
   * Get user's organizations
   * GET /api/v1/users/:id/organizations
   */
  static getUserOrganizations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Users can only view their own organizations unless they're admin
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      throw new ForbiddenError('Access denied');
    }

    const result = await query(
      `SELECT o.id, o.name, o.description, o.industry, o.size, om.role, om.joined_at
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND o.is_active = true
       ORDER BY om.joined_at DESC`,
      [id]
    );

    const organizations = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      industry: row.industry,
      size: row.size,
      memberRole: row.role,
      joinedAt: row.joined_at
    }));

    res.json({
      success: true,
      data: { organizations }
    });
  });

  /**
   * Get user's projects
   * GET /api/v1/users/:id/projects
   */
  static getUserProjects = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.query;

    // Users can only view their own projects unless they're admin
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      throw new ForbiddenError('Access denied');
    }

    let whereClause = 'pm.user_id = $1';
    let queryParams = [id];

    if (status) {
      whereClause += ' AND p.status = $2';
      queryParams.push(status as string);
    }

    const result = await query(
      `SELECT p.id, p.name, p.description, p.status, p.priority, p.start_date, p.due_date, 
              pm.role as member_role, o.name as organization_name
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       JOIN organizations o ON p.organization_id = o.id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC`,
      queryParams
    );

    const projects = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      priority: row.priority,
      startDate: row.start_date,
      dueDate: row.due_date,
      memberRole: row.member_role,
      organizationName: row.organization_name
    }));

    res.json({
      success: true,
      data: { projects }
    });
  });
}