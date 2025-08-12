import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService } from '../services/projectService';
import { 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectFilterQuery,
  Role 
} from '../types';
import { 
  validateData, 
  createProjectSchema, 
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  idParamSchema 
} from '../utils/validation';
import { createResponse, asyncHandler } from '../utils/errors';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const data = validateData(createProjectSchema, request.body);
    
    const project = await this.projectService.createProject(user.id, data);
    reply.status(201).send(createResponse.success(project, 'Project created successfully'));
  });

  getProjects = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const filters = request.query as ProjectFilterQuery;
    
    const { projects, total } = await this.projectService.getProjects(user.id, filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    reply.send(createResponse.paginated(projects, {
      page,
      limit,
      total,
      totalPages,
    }, 'Projects retrieved successfully'));
  });

  getProjectById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    const project = await this.projectService.getProjectById(user.id, id);
    reply.send(createResponse.success(project, 'Project retrieved successfully'));
  });

  updateProject = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    const data = validateData(updateProjectSchema, request.body);
    
    const project = await this.projectService.updateProject(user.id, id, data);
    reply.send(createResponse.success(project, 'Project updated successfully'));
  });

  deleteProject = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    await this.projectService.deleteProject(user.id, id);
    reply.status(204).send();
  });

  addMember = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    const { userId, role } = validateData(addProjectMemberSchema, request.body);
    
    await this.projectService.addMember(user.id, id, userId, role);
    reply.status(201).send(createResponse.success(null, 'Member added successfully'));
  });

  removeMember = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id, userId } = request.params as { id: string; userId: string };
    
    await this.projectService.removeMember(user.id, id, userId);
    reply.status(204).send();
  });

  updateMemberRole = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id, userId } = request.params as { id: string; userId: string };
    const { role } = validateData(updateProjectMemberSchema, request.body);
    
    await this.projectService.updateMemberRole(user.id, id, userId, role);
    reply.send(createResponse.success(null, 'Member role updated successfully'));
  });

  getProjectMembers = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    const members = await this.projectService.getProjectMembers(user.id, id);
    reply.send(createResponse.success(members, 'Project members retrieved successfully'));
  });

  archiveProject = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    const project = await this.projectService.updateProject(user.id, id, { isArchived: true });
    reply.send(createResponse.success(project, 'Project archived successfully'));
  });

  unarchiveProject = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    const project = await this.projectService.updateProject(user.id, id, { isArchived: false });
    reply.send(createResponse.success(project, 'Project unarchived successfully'));
  });

  getProjectStats = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    // Verify access to project
    await this.projectService.getProjectById(user.id, id);
    
    // Get project statistics
    const stats = await this.getProjectStatistics(id);
    reply.send(createResponse.success(stats, 'Project statistics retrieved successfully'));
  });

  private async getProjectStatistics(projectId: string) {
    const prisma = require('../utils/db').default;
    
    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      totalMembers,
      recentActivities,
    ] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { priority: true },
      }),
      prisma.projectMember.count({ where: { projectId } }),
      prisma.activityLog.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const tasksByStatusMap = tasksByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriorityMap = tasksByPriority.reduce((acc, item) => {
      acc[item.priority] = item._count.priority;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks,
      totalMembers,
      tasksByStatus: tasksByStatusMap,
      tasksByPriority: tasksByPriorityMap,
      recentActivities,
      completionRate: totalTasks > 0 
        ? ((tasksByStatusMap.DONE || 0) / totalTasks * 100).toFixed(1)
        : '0.0',
    };
  }
}