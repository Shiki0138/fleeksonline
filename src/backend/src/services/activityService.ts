import prisma from '../utils/db';
import { ActivityType, ActivityLog } from '../types';

export interface CreateActivityData {
  type: ActivityType;
  description: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

export class ActivityService {
  async logActivity(data: CreateActivityData): Promise<ActivityLog> {
    return prisma.activityLog.create({
      data: {
        type: data.type,
        description: data.description,
        userId: data.userId,
        projectId: data.projectId,
        taskId: data.taskId,
        metadata: data.metadata,
      },
    });
  }

  async getProjectActivities(
    userId: string,
    projectId: string,
    options: {
      page?: number;
      limit?: number;
      types?: ActivityType[];
    } = {}
  ): Promise<{ activities: (ActivityLog & { user: any })[]; total: number }> {
    const { page = 1, limit = 20, types } = options;
    const skip = (page - 1) * limit;

    const where = {
      projectId,
      ...(types && types.length > 0 && { type: { in: types } }),
    };

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { activities, total };
  }

  async getTaskActivities(
    userId: string,
    taskId: string,
    options: {
      page?: number;
      limit?: number;
      types?: ActivityType[];
    } = {}
  ): Promise<{ activities: (ActivityLog & { user: any })[]; total: number }> {
    const { page = 1, limit = 20, types } = options;
    const skip = (page - 1) * limit;

    const where = {
      taskId,
      ...(types && types.length > 0 && { type: { in: types } }),
    };

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { activities, total };
  }

  async getUserActivities(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      types?: ActivityType[];
      projectIds?: string[];
    } = {}
  ): Promise<{ activities: (ActivityLog & { user: any; project?: any })[]; total: number }> {
    const { page = 1, limit = 20, types, projectIds } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(types && types.length > 0 && { type: { in: types } }),
      ...(projectIds && projectIds.length > 0 && { projectId: { in: projectIds } }),
    };

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
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
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { activities, total };
  }

  async getRecentActivities(
    userId: string,
    limit: number = 10
  ): Promise<(ActivityLog & { user: any; project?: any })[]> {
    // Get user's project memberships
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const createdProjects = await prisma.project.findMany({
      where: { createdById: userId },
      select: { id: true },
    });

    const projectIds = [
      ...memberships.map(m => m.projectId),
      ...createdProjects.map(p => p.id),
    ];

    if (projectIds.length === 0) {
      return [];
    }

    return prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds },
      },
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
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteActivitiesForProject(projectId: string): Promise<void> {
    await prisma.activityLog.deleteMany({
      where: { projectId },
    });
  }

  async deleteActivitiesForTask(taskId: string): Promise<void> {
    await prisma.activityLog.deleteMany({
      where: { taskId },
    });
  }

  async getActivityStats(
    userId: string,
    projectId?: string,
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalActivities: number;
    activitiesByType: Record<ActivityType, number>;
    activitiesByDay: { date: string; count: number }[];
  }> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const where = {
      userId,
      createdAt: { gte: startDate },
      ...(projectId && { projectId }),
    };

    const [totalActivities, activitiesByType] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
    ]);

    // Get activities by day
    const activitiesByDay = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM activity_logs
      WHERE user_id = ${userId}
        AND created_at >= ${startDate}
        ${projectId ? `AND project_id = ${projectId}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const activitiesByTypeMap = activitiesByType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<ActivityType, number>);

    return {
      totalActivities,
      activitiesByType: activitiesByTypeMap,
      activitiesByDay: activitiesByDay.map(item => ({
        date: item.date,
        count: Number(item.count),
      })),
    };
  }
}