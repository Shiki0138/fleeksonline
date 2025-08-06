import prisma from '../utils/db';
import { 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectWithMembers,
  ProjectFilterQuery,
  Role 
} from '../types';
import { 
  NotFoundError, 
  ForbiddenError, 
  ConflictError,
  BadRequestError 
} from '../utils/errors';
import { ActivityService } from './activityService';

export class ProjectService {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  async createProject(userId: string, data: CreateProjectRequest): Promise<ProjectWithMembers> {
    const project = await prisma.project.create({
      data: {
        ...data,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    // Log activity
    await this.activityService.logActivity({
      type: 'PROJECT_CREATED',
      description: `Created project "${project.name}"`,
      userId,
      projectId: project.id,
    });

    return project;
  }

  async getProjects(
    userId: string, 
    filters: ProjectFilterQuery = {}
  ): Promise<{ projects: ProjectWithMembers[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      isArchived,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        {
          OR: [
            { createdById: userId },
            { members: { some: { userId } } },
          ],
        },
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {},
        isArchived !== undefined ? { isArchived } : {},
      ],
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  }

  async getProjectById(userId: string, projectId: string): Promise<ProjectWithMembers> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Check if user has access to this project
    const hasAccess = project.createdById === userId || 
                     project.members.some(member => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenError('Access denied to this project');
    }

    return project;
  }

  async updateProject(
    userId: string, 
    projectId: string, 
    data: UpdateProjectRequest
  ): Promise<ProjectWithMembers> {
    // Check if user has admin access to the project
    await this.checkProjectAccess(userId, projectId, 'ADMIN');

    const project = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    // Log activity
    await this.activityService.logActivity({
      type: 'PROJECT_UPDATED',
      description: `Updated project "${project.name}"`,
      userId,
      projectId: project.id,
      metadata: { changes: data },
    });

    return project;
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    // Check if user is the project creator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true, name: true },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.createdById !== userId) {
      throw new ForbiddenError('Only the project creator can delete the project');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    // Log activity
    await this.activityService.logActivity({
      type: 'PROJECT_DELETED',
      description: `Deleted project "${project.name}"`,
      userId,
      projectId,
    });
  }

  async addMember(
    userId: string, 
    projectId: string, 
    memberUserId: string, 
    role: Role = 'MEMBER'
  ): Promise<void> {
    // Check if user has admin access to the project
    await this.checkProjectAccess(userId, projectId, 'ADMIN');

    // Check if user to be added exists
    const memberUser = await prisma.user.findUnique({
      where: { id: memberUserId },
      select: { id: true, username: true, firstName: true, lastName: true },
    });

    if (!memberUser) {
      throw new NotFoundError('User to be added');
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this project');
    }

    await prisma.projectMember.create({
      data: {
        userId: memberUserId,
        projectId,
        role,
      },
    });

    // Log activity
    await this.activityService.logActivity({
      type: 'MEMBER_ADDED',
      description: `Added ${memberUser.firstName} ${memberUser.lastName} to the project`,
      userId,
      projectId,
      metadata: { addedUserId: memberUserId, role },
    });
  }

  async removeMember(
    userId: string, 
    projectId: string, 
    memberUserId: string
  ): Promise<void> {
    // Check if user has admin access to the project
    await this.checkProjectAccess(userId, projectId, 'ADMIN');

    // Check if user is the project creator (cannot be removed)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === memberUserId) {
      throw new BadRequestError('Project creator cannot be removed from the project');
    }

    // Get member info for logging
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId,
        },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Project member');
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId,
        },
      },
    });

    // Log activity
    await this.activityService.logActivity({
      type: 'MEMBER_REMOVED',
      description: `Removed ${member.user.firstName} ${member.user.lastName} from the project`,
      userId,
      projectId,
      metadata: { removedUserId: memberUserId },
    });
  }

  async updateMemberRole(
    userId: string, 
    projectId: string, 
    memberUserId: string, 
    newRole: Role
  ): Promise<void> {
    // Check if user has admin access to the project
    await this.checkProjectAccess(userId, projectId, 'ADMIN');

    // Check if trying to change project creator's role
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === memberUserId) {
      throw new BadRequestError('Cannot change project creator\'s role');
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Project member');
    }

    await prisma.projectMember.update({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId,
        },
      },
      data: { role: newRole },
    });

    // Log activity
    await this.activityService.logActivity({
      type: 'PROJECT_UPDATED',
      description: `Updated member role to ${newRole}`,
      userId,
      projectId,
      metadata: { memberUserId, oldRole: member.role, newRole },
    });
  }

  async getProjectMembers(userId: string, projectId: string) {
    // Check if user has access to the project
    await this.checkProjectAccess(userId, projectId, 'VIEWER');

    return prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }

  private async checkProjectAccess(
    userId: string, 
    projectId: string, 
    minRole: Role = 'VIEWER'
  ): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Project creator has all permissions
    if (project.createdById === userId) {
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('Access denied to this project');
    }

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
}