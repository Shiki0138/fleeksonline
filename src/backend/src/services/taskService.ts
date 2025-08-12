import prisma from '../utils/db';
import { 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskWithDetails,
  TaskFilterQuery,
  TaskStatus,
  TaskPriority 
} from '../types';
import { 
  NotFoundError, 
  ForbiddenError, 
  BadRequestError 
} from '../utils/errors';
import { ActivityService } from './activityService';

export class TaskService {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  async createTask(
    userId: string, 
    projectId: string, 
    data: CreateTaskRequest
  ): Promise<TaskWithDetails> {
    // Check if user has access to the project
    await this.checkProjectAccess(userId, projectId, 'MEMBER');

    // Validate assignee if provided
    if (data.assigneeId) {
      await this.validateAssignee(data.assigneeId, projectId);
    }

    // Get next position
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (lastTask?.position || 0) + 1;

    const task = await prisma.task.create({
      data: {
        ...data,
        projectId,
        createdById: userId,
        position,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    });

    // Add labels if provided
    if (data.labelIds && data.labelIds.length > 0) {
      await this.addLabelsToTask(task.id, data.labelIds);
    }

    // Log activity
    await this.activityService.logActivity({
      type: 'TASK_CREATED',
      description: `Created task "${task.title}"`,
      userId,
      projectId,
      taskId: task.id,
    });

    // Log assignment if task was assigned
    if (data.assigneeId) {
      await this.activityService.logActivity({
        type: 'TASK_ASSIGNED',
        description: `Assigned task "${task.title}" to ${task.assignee?.firstName} ${task.assignee?.lastName}`,
        userId,
        projectId,
        taskId: task.id,
        metadata: { assigneeId: data.assigneeId },
      });
    }

    return task;
  }

  async getTasks(
    userId: string, 
    projectId: string, 
    filters: TaskFilterQuery = {}
  ): Promise<{ tasks: TaskWithDetails[]; total: number }> {
    // Check if user has access to the project
    await this.checkProjectAccess(userId, projectId, 'VIEWER');

    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assigneeId,
      search,
      labelIds,
      sortBy = 'position',
      sortOrder = 'asc',
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      projectId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(labelIds && labelIds.length > 0 && {
        labels: {
          some: {
            labelId: {
              in: Array.isArray(labelIds) ? labelIds : [labelIds],
            },
          },
        },
      }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          assignee: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3, // Only get latest 3 comments for list view
          },
          attachments: true,
          labels: {
            include: {
              label: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy === 'priority' 
          ? [{ priority: 'desc' }, { position: 'asc' }]
          : { [sortBy]: sortOrder },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async getTaskById(userId: string, taskId: string): Promise<TaskWithDetails> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Check if user has access to the project
    await this.checkProjectAccess(userId, task.project.id, 'VIEWER');

    return task;
  }

  async updateTask(
    userId: string, 
    taskId: string, 
    data: UpdateTaskRequest
  ): Promise<TaskWithDetails> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        title: true, 
        status: true, 
        assigneeId: true, 
        projectId: true 
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Check if user has access to the project
    await this.checkProjectAccess(userId, task.projectId, 'MEMBER');

    // Validate assignee if provided
    if (data.assigneeId !== undefined) {
      if (data.assigneeId) {
        await this.validateAssignee(data.assigneeId, task.projectId);
      }
    }

    const updateData: any = { ...data };
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Handle status change completion
    if (data.status === 'DONE' && task.status !== 'DONE') {
      updateData.completedAt = new Date();
    } else if (data.status && data.status !== 'DONE' && task.status === 'DONE') {
      updateData.completedAt = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    });

    // Log activities for significant changes
    if (data.status && data.status !== task.status) {
      await this.activityService.logActivity({
        type: 'TASK_STATUS_CHANGED',
        description: `Changed task "${updatedTask.title}" status from ${task.status} to ${data.status}`,
        userId,
        projectId: task.projectId,
        taskId: task.id,
        metadata: { oldStatus: task.status, newStatus: data.status },
      });
    }

    if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
      await this.activityService.logActivity({
        type: 'TASK_ASSIGNED',
        description: data.assigneeId 
          ? `Assigned task "${updatedTask.title}" to ${updatedTask.assignee?.firstName} ${updatedTask.assignee?.lastName}`
          : `Unassigned task "${updatedTask.title}"`,
        userId,
        projectId: task.projectId,
        taskId: task.id,
        metadata: { oldAssigneeId: task.assigneeId, newAssigneeId: data.assigneeId },
      });
    }

    // General update activity
    await this.activityService.logActivity({
      type: 'TASK_UPDATED',
      description: `Updated task "${updatedTask.title}"`,
      userId,
      projectId: task.projectId,
      taskId: task.id,
      metadata: { changes: data },
    });

    return updatedTask;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        title: true, 
        projectId: true, 
        createdById: true 
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Check if user has access to the project
    await this.checkProjectAccess(userId, task.projectId, 'MEMBER');

    // Only task creator or project admin can delete the task
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: task.projectId,
        },
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { createdById: true },
    });

    const canDelete = task.createdById === userId || 
                     project?.createdById === userId ||
                     membership?.role === 'ADMIN';

    if (!canDelete) {
      throw new ForbiddenError('Only task creator or project admin can delete the task');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Log activity
    await this.activityService.logActivity({
      type: 'TASK_DELETED',
      description: `Deleted task "${task.title}"`,
      userId,
      projectId: task.projectId,
      taskId: task.id,
    });
  }

  async reorderTasks(
    userId: string, 
    projectId: string, 
    taskOrders: { taskId: string; position: number }[]
  ): Promise<void> {
    // Check if user has access to the project
    await this.checkProjectAccess(userId, projectId, 'MEMBER');

    // Update positions in a transaction
    await prisma.$transaction(
      taskOrders.map(({ taskId, position }) =>
        prisma.task.update({
          where: { id: taskId },
          data: { position },
        })
      )
    );
  }

  async addLabelsToTask(taskId: string, labelIds: string[]): Promise<void> {
    // Remove existing labels
    await prisma.taskLabel.deleteMany({
      where: { taskId },
    });

    // Add new labels
    if (labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: labelIds.map(labelId => ({
          taskId,
          labelId,
        })),
      });
    }
  }

  async getTasksByUser(
    userId: string, 
    filters: Omit<TaskFilterQuery, 'assigneeId'> = {}
  ): Promise<{ tasks: TaskWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      search,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      assigneeId: userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          assignee: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          attachments: true,
          labels: {
            include: {
              label: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  private async checkProjectAccess(
    userId: string, 
    projectId: string, 
    minRole: 'VIEWER' | 'MEMBER' | 'ADMIN' = 'VIEWER'
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
    const roleHierarchy = {
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

  private async validateAssignee(assigneeId: string, projectId: string): Promise<void> {
    // Check if assignee exists and has access to the project
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new BadRequestError('Assignee not found');
    }

    // Check if assignee is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: assigneeId,
          projectId,
        },
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    const hasAccess = membership || project?.createdById === assigneeId;

    if (!hasAccess) {
      throw new BadRequestError('Assignee does not have access to this project');
    }
  }
}