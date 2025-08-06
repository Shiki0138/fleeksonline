import { FastifyRequest, FastifyReply } from 'fastify';
import { TaskService } from '../services/taskService';
import { 
  CreateTaskRequest, 
  UpdateTaskRequest,
  TaskFilterQuery 
} from '../types';
import { 
  validateData, 
  createTaskSchema, 
  updateTaskSchema,
  taskFilterSchema,
  idParamSchema 
} from '../utils/validation';
import { createResponse, asyncHandler } from '../utils/errors';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  createTask = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };
    const data = validateData(createTaskSchema, request.body);
    
    const task = await this.taskService.createTask(user.id, projectId, data);
    reply.status(201).send(createResponse.success(task, 'Task created successfully'));
  });

  getTasks = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };
    const filters = validateData(taskFilterSchema, request.query);
    
    const { tasks, total } = await this.taskService.getTasks(user.id, projectId, filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    reply.send(createResponse.paginated(tasks, {
      page,
      limit,
      total,
      totalPages,
    }, 'Tasks retrieved successfully'));
  });

  getTaskById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    const task = await this.taskService.getTaskById(user.id, id);
    reply.send(createResponse.success(task, 'Task retrieved successfully'));
  });

  updateTask = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    const data = validateData(updateTaskSchema, request.body);
    
    const task = await this.taskService.updateTask(user.id, id, data);
    reply.send(createResponse.success(task, 'Task updated successfully'));
  });

  deleteTask = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    await this.taskService.deleteTask(user.id, id);
    reply.status(204).send();
  });

  reorderTasks = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };
    const { taskOrders } = request.body as { 
      taskOrders: { taskId: string; position: number }[] 
    };
    
    if (!taskOrders || !Array.isArray(taskOrders)) {
      return reply.status(400).send(
        createResponse.error('taskOrders array is required', 400)
      );
    }
    
    await this.taskService.reorderTasks(user.id, projectId, taskOrders);
    reply.send(createResponse.success(null, 'Tasks reordered successfully'));
  });

  assignTask = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    const { assigneeId } = request.body as { assigneeId: string };
    
    const task = await this.taskService.updateTask(user.id, id, { assigneeId });
    reply.send(createResponse.success(task, 'Task assigned successfully'));
  });

  unassignTask = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    const task = await this.taskService.updateTask(user.id, id, { assigneeId: null });
    reply.send(createResponse.success(task, 'Task unassigned successfully'));
  });

  updateTaskStatus = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    const { status } = request.body as { status: any };
    
    if (!status) {
      return reply.status(400).send(createResponse.error('Status is required', 400));
    }
    
    const task = await this.taskService.updateTask(user.id, id, { status });
    reply.send(createResponse.success(task, 'Task status updated successfully'));
  });

  addLabelsToTask = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    const { labelIds } = request.body as { labelIds: string[] };
    
    if (!labelIds || !Array.isArray(labelIds)) {
      return reply.status(400).send(createResponse.error('labelIds array is required', 400));
    }
    
    await this.taskService.addLabelsToTask(id, labelIds);
    const task = await this.taskService.getTaskById(user.id, id);
    
    reply.send(createResponse.success(task, 'Labels added to task successfully'));
  });

  getMyTasks = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const filters = validateData(taskFilterSchema, request.query);
    
    const { tasks, total } = await this.taskService.getTasksByUser(user.id, filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    reply.send(createResponse.paginated(tasks, {
      page,
      limit,
      total,
      totalPages,
    }, 'My tasks retrieved successfully'));
  });

  getTaskStats = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };
    
    const stats = await this.getTaskStatistics(user.id, projectId);
    reply.send(createResponse.success(stats, 'Task statistics retrieved successfully'));
  });

  bulkUpdateTasks = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { taskIds, updates } = request.body as { 
      taskIds: string[]; 
      updates: Partial<UpdateTaskRequest> 
    };
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return reply.status(400).send(createResponse.error('taskIds array is required', 400));
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return reply.status(400).send(createResponse.error('updates object is required', 400));
    }
    
    const updatedTasks = await Promise.all(
      taskIds.map(taskId => this.taskService.updateTask(user.id, taskId, updates))
    );
    
    reply.send(createResponse.success(updatedTasks, 'Tasks updated successfully'));
  });

  duplicateTask = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = validateData(idParamSchema, request.params);
    
    // Get the original task
    const originalTask = await this.taskService.getTaskById(user.id, id);
    
    // Create a new task with the same data
    const newTaskData: CreateTaskRequest = {
      title: `${originalTask.title} (Copy)`,
      description: originalTask.description,
      priority: originalTask.priority,
      dueDate: originalTask.dueDate?.toISOString(),
      assigneeId: originalTask.assigneeId,
      labelIds: originalTask.labels.map(l => l.label.id),
    };
    
    const duplicatedTask = await this.taskService.createTask(
      user.id, 
      originalTask.project.id, 
      newTaskData
    );
    
    reply.status(201).send(createResponse.success(duplicatedTask, 'Task duplicated successfully'));
  });

  getOverdueTasks = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };
    
    const filters: TaskFilterQuery = {
      ...request.query as TaskFilterQuery,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    };
    
    // This would need to be implemented in the service to filter by overdue tasks
    const { tasks, total } = await this.taskService.getTasks(user.id, projectId, filters);
    
    // Filter overdue tasks on the backend
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'DONE'
    );
    
    reply.send(createResponse.success({
      tasks: overdueTasks,
      count: overdueTasks.length,
    }, 'Overdue tasks retrieved successfully'));
  });

  private async getTaskStatistics(userId: string, projectId: string) {
    const prisma = require('../utils/db').default;
    
    // Verify user has access to the project
    await this.taskService.getTasks(userId, projectId, { limit: 1 });
    
    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      completedThisWeek,
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
      prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
      prisma.task.count({
        where: {
          projectId,
          status: 'DONE',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
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
      tasksByStatus: tasksByStatusMap,
      tasksByPriority: tasksByPriorityMap,
      overdueTasks,
      completedThisWeek,
      completionRate: totalTasks > 0 
        ? ((tasksByStatusMap.DONE || 0) / totalTasks * 100).toFixed(1)
        : '0.0',
    };
  }
}