import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database';
import { asyncHandler, NotFoundError, ForbiddenError, ConflictError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export class OrganizationController {
  /**
   * Get all organizations (admin only) or user's organizations
   * GET /api/v1/organizations
   */
  static getOrganizations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, search, industry, size } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = ['o.is_active = true'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // If not admin, only show organizations user belongs to
    if (req.user?.role !== 'admin') {
      whereConditions.push(`om.user_id = $${paramIndex}`);
      queryParams.push(req.user?.id);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`o.name ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (industry) {
      whereConditions.push(`o.industry = $${paramIndex}`);
      queryParams.push(industry);
      paramIndex++;
    }

    if (size) {
      whereConditions.push(`o.size = $${paramIndex}`);
      queryParams.push(size);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    const joinClause = req.user?.role !== 'admin' 
      ? 'JOIN organization_members om ON o.id = om.organization_id'
      : 'LEFT JOIN organization_members om ON o.id = om.organization_id AND om.user_id = $1';

    // Get total count
    const countQuery = req.user?.role === 'admin'
      ? `SELECT COUNT(DISTINCT o.id) FROM organizations o WHERE o.is_active = true ${search ? `AND o.name ILIKE $1` : ''} ${industry ? `AND o.industry = $${search ? 2 : 1}` : ''} ${size ? `AND o.size = $${search && industry ? 3 : search || industry ? 2 : 1}` : ''}`
      : `SELECT COUNT(DISTINCT o.id) FROM organizations o ${joinClause} WHERE ${whereClause}`;

    const countResult = await query(countQuery, req.user?.role === 'admin' ? queryParams.slice(1) : queryParams);
    const totalOrganizations = parseInt(countResult.rows[0].count);

    // Get organizations with pagination
    const orgsQuery = `
      SELECT DISTINCT o.id, o.name, o.description, o.website, o.industry, o.size, 
             o.owner_id, o.created_at, o.updated_at,
             ${req.user?.role !== 'admin' ? 'om.role as member_role' : 'NULL as member_role'},
             u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM organizations o
      ${joinClause}
      LEFT JOIN users u ON o.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const orgsResult = await query(orgsQuery, [...queryParams, limit, offset]);

    const organizations = orgsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      website: row.website,
      industry: row.industry,
      size: row.size,
      ownerId: row.owner_id,
      ownerName: `${row.owner_first_name} ${row.owner_last_name}`,
      memberRole: row.member_role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const totalPages = Math.ceil(totalOrganizations / Number(limit));

    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalOrganizations,
          limit: Number(limit),
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    });
  });

  /**
   * Get organization by ID
   * GET /api/v1/organizations/:id
   */
  static getOrganizationById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if user has access to this organization
    let orgResult;
    if (req.user?.role === 'admin') {
      orgResult = await query(
        `SELECT o.*, u.first_name as owner_first_name, u.last_name as owner_last_name
         FROM organizations o
         LEFT JOIN users u ON o.owner_id = u.id
         WHERE o.id = $1`,
        [id]
      );
    } else {
      orgResult = await query(
        `SELECT o.*, u.first_name as owner_first_name, u.last_name as owner_last_name, om.role as member_role
         FROM organizations o
         LEFT JOIN users u ON o.owner_id = u.id
         JOIN organization_members om ON o.id = om.organization_id
         WHERE o.id = $1 AND om.user_id = $2`,
        [id, req.user?.id]
      );
    }

    if (orgResult.rows.length === 0) {
      throw new NotFoundError('Organization not found or access denied');
    }

    const org = orgResult.rows[0];

    // Get member count
    const memberCountResult = await query(
      'SELECT COUNT(*) FROM organization_members WHERE organization_id = $1',
      [id]
    );

    // Get project count
    const projectCountResult = await query(
      'SELECT COUNT(*) FROM projects WHERE organization_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        organization: {
          id: org.id,
          name: org.name,
          description: org.description,
          website: org.website,
          industry: org.industry,
          size: org.size,
          ownerId: org.owner_id,
          ownerName: `${org.owner_first_name} ${org.owner_last_name}`,
          memberRole: org.member_role || null,
          isActive: org.is_active,
          memberCount: parseInt(memberCountResult.rows[0].count),
          projectCount: parseInt(projectCountResult.rows[0].count),
          createdAt: org.created_at,
          updatedAt: org.updated_at
        }
      }
    });
  });

  /**
   * Create new organization
   * POST /api/v1/organizations
   */
  static createOrganization = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, website, industry, size } = req.body;
    const ownerId = req.user!.id;

    await transaction(async (client) => {
      // Create organization
      const orgId = uuidv4();
      const orgResult = await client.query(
        `INSERT INTO organizations (id, name, description, website, industry, size, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [orgId, name, description, website, industry, size, ownerId]
      );

      // Add owner as organization member
      await client.query(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [orgId, ownerId]
      );

      const organization = orgResult.rows[0];

      logger.info('Organization created', {
        organizationId: orgId,
        name,
        ownerId
      });

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: {
          organization: {
            id: organization.id,
            name: organization.name,
            description: organization.description,
            website: organization.website,
            industry: organization.industry,
            size: organization.size,
            ownerId: organization.owner_id,
            isActive: organization.is_active,
            createdAt: organization.created_at,
            updatedAt: organization.updated_at
          }
        }
      });
    });
  });

  /**
   * Update organization
   * PUT /api/v1/organizations/:id
   */
  static updateOrganization = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, website, industry, size } = req.body;

    // Check if user can update this organization
    const accessResult = await query(
      `SELECT om.role FROM organization_members om
       WHERE om.organization_id = $1 AND om.user_id = $2`,
      [id, req.user?.id]
    );

    if (accessResult.rows.length === 0 && req.user?.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    const userRole = accessResult.rows[0]?.role;
    if (userRole !== 'owner' && userRole !== 'admin' && req.user?.role !== 'admin') {
      throw new ForbiddenError('Only organization owners/admins can update organization');
    }

    // Build update query
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex}`);
      queryParams.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(description);
      paramIndex++;
    }

    if (website !== undefined) {
      updateFields.push(`website = $${paramIndex}`);
      queryParams.push(website);
      paramIndex++;
    }

    if (industry) {
      updateFields.push(`industry = $${paramIndex}`);
      queryParams.push(industry);
      paramIndex++;
    }

    if (size) {
      updateFields.push(`size = $${paramIndex}`);
      queryParams.push(size);
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
      `UPDATE organizations SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      queryParams
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Organization not found');
    }

    const organization = result.rows[0];

    logger.info('Organization updated', {
      organizationId: id,
      updatedBy: req.user?.id,
      fields: updateFields
    });

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          description: organization.description,
          website: organization.website,
          industry: organization.industry,
          size: organization.size,
          ownerId: organization.owner_id,
          isActive: organization.is_active,
          updatedAt: organization.updated_at
        }
      }
    });
  });

  /**
   * Delete organization (owner/admin only)
   * DELETE /api/v1/organizations/:id
   */
  static deleteOrganization = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if user can delete this organization
    const orgResult = await query(
      'SELECT owner_id FROM organizations WHERE id = $1',
      [id]
    );

    if (orgResult.rows.length === 0) {
      throw new NotFoundError('Organization not found');
    }

    const isOwner = orgResult.rows[0].owner_id === req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('Only organization owner or admin can delete organization');
    }

    // Soft delete by setting is_active to false
    await query(
      'UPDATE organizations SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    logger.info('Organization deleted', {
      organizationId: id,
      deletedBy: req.user?.id
    });

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  });

  /**
   * Get organization members
   * GET /api/v1/organizations/:id/members
   */
  static getOrganizationMembers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Verify access to organization
    if (req.user?.role !== 'admin') {
      const accessResult = await query(
        'SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [id, req.user?.id]
      );

      if (accessResult.rows.length === 0) {
        throw new ForbiddenError('Access denied');
      }
    }

    const result = await query(
      `SELECT om.role, om.joined_at, u.id, u.email, u.first_name, u.last_name, u.is_active
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at ASC`,
      [id]
    );

    const members = result.rows.map(row => ({
      userId: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      joinedAt: row.joined_at
    }));

    res.json({
      success: true,
      data: { members }
    });
  });

  /**
   * Add member to organization
   * POST /api/v1/organizations/:id/members
   */
  static addOrganizationMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;

    // Check if user can add members
    const accessResult = await query(
      `SELECT om.role FROM organization_members om
       WHERE om.organization_id = $1 AND om.user_id = $2`,
      [id, req.user?.id]
    );

    if (accessResult.rows.length === 0 && req.user?.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    const userRole = accessResult.rows[0]?.role;
    if (!['owner', 'admin'].includes(userRole) && req.user?.role !== 'admin') {
      throw new ForbiddenError('Only organization owners/admins can add members');
    }

    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Add member
    try {
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [id, userId, role]
      );

      logger.info('Organization member added', {
        organizationId: id,
        userId,
        role,
        addedBy: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'Member added to organization successfully'
      });

    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('User is already a member of this organization');
      }
      throw error;
    }
  });

  /**
   * Update member role
   * PUT /api/v1/organizations/:id/members/:userId
   */
  static updateMemberRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id, userId } = req.params;
    const { role } = req.body;

    // Check if user can update member roles
    const accessResult = await query(
      `SELECT om.role FROM organization_members om
       WHERE om.organization_id = $1 AND om.user_id = $2`,
      [id, req.user?.id]
    );

    if (accessResult.rows.length === 0 && req.user?.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    const userRole = accessResult.rows[0]?.role;
    if (userRole !== 'owner' && req.user?.role !== 'admin') {
      throw new ForbiddenError('Only organization owner can update member roles');
    }

    const result = await query(
      `UPDATE organization_members SET role = $1
       WHERE organization_id = $2 AND user_id = $3
       RETURNING *`,
      [role, id, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Member not found in organization');
    }

    logger.info('Organization member role updated', {
      organizationId: id,
      userId,
      newRole: role,
      updatedBy: req.user?.id
    });

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });
  });

  /**
   * Remove member from organization
   * DELETE /api/v1/organizations/:id/members/:userId
   */
  static removeOrganizationMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id, userId } = req.params;

    // Check if user can remove members
    const accessResult = await query(
      `SELECT om.role FROM organization_members om
       WHERE om.organization_id = $1 AND om.user_id = $2`,
      [id, req.user?.id]
    );

    if (accessResult.rows.length === 0 && req.user?.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    const userRole = accessResult.rows[0]?.role;
    const canRemove = ['owner', 'admin'].includes(userRole) || req.user?.role === 'admin' || req.user?.id === userId;

    if (!canRemove) {
      throw new ForbiddenError('Access denied');
    }

    // Cannot remove organization owner
    const ownerResult = await query(
      'SELECT owner_id FROM organizations WHERE id = $1',
      [id]
    );

    if (ownerResult.rows[0]?.owner_id === userId) {
      throw new ForbiddenError('Cannot remove organization owner');
    }

    const result = await query(
      'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Member not found in organization');
    }

    logger.info('Organization member removed', {
      organizationId: id,
      userId,
      removedBy: req.user?.id
    });

    res.json({
      success: true,
      message: 'Member removed from organization successfully'
    });
  });
}