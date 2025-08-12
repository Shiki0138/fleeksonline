import { Server as SocketIOServer, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { SocketEvents, JWTPayload } from '../types';
import prisma from '../utils/db';

export class SocketHandlers {
  private io: SocketIOServer;
  private fastify: FastifyInstance;

  constructor(io: SocketIOServer, fastify: FastifyInstance) {
    this.io = io;
    this.fastify = fastify;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware for Socket.IO
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const payload = this.fastify.jwt.verify(token) as JWTPayload;
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        // Attach user to socket
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User ${socket.data.user.username} connected: ${socket.id}`);

      // Join user-specific rooms
      this.handleJoinRooms(socket);

      // Task-related events
      this.handleTaskEvents(socket);

      // Comment-related events
      this.handleCommentEvents(socket);

      // Project-related events
      this.handleProjectEvents(socket);

      // User presence events
      this.handlePresenceEvents(socket);

      // Typing events
      this.handleTypingEvents(socket);

      // Notification events
      this.handleNotificationEvents(socket);

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`User ${socket.data.user.username} disconnected: ${socket.id}`);
        this.handleUserOffline(socket);
      });
    });
  }

  private async handleJoinRooms(socket: Socket) {
    const userId = socket.data.user.id;

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join rooms for projects the user is a member of
    const projectMemberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const createdProjects = await prisma.project.findMany({
      where: { createdById: userId },
      select: { id: true },
    });

    const projectIds = [
      ...projectMemberships.map(m => m.projectId),
      ...createdProjects.map(p => p.id),
    ];

    projectIds.forEach(projectId => {
      socket.join(`project:${projectId}`);
    });

    // Send initial online users list
    socket.on('get_online_users', async (projectId: string) => {
      const onlineUsers = await this.getOnlineUsersInProject(projectId);
      socket.emit('online_users', onlineUsers);
    });
  }

  private handleTaskEvents(socket: Socket) {
    // Task creation
    socket.on('task:create', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:created', data);
    });

    // Task updates
    socket.on('task:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    // Task deletion
    socket.on('task:delete', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:deleted', data);
    });

    // Task assignment
    socket.on('task:assign', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:assigned', data);
      
      // Notify the assigned user specifically
      if (data.assigneeId) {
        socket.to(`user:${data.assigneeId}`).emit('notification:new', {
          id: `task_assigned_${Date.now()}`,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `You have been assigned to task: ${data.title}`,
          userId: data.assigneeId,
          data: { taskId: data.taskId, projectId: data.projectId },
        });
      }
    });

    // Task status change
    socket.on('task:status_change', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:status_changed', data);
    });

    // Real-time task collaboration
    socket.on('task:join_editing', (taskId: string) => {
      socket.join(`task:${taskId}`);
      socket.to(`task:${taskId}`).emit('task:user_joined_editing', {
        userId: socket.data.user.id,
        username: socket.data.user.username,
      });
    });

    socket.on('task:leave_editing', (taskId: string) => {
      socket.leave(`task:${taskId}`);
      socket.to(`task:${taskId}`).emit('task:user_left_editing', {
        userId: socket.data.user.id,
        username: socket.data.user.username,
      });
    });
  }

  private handleCommentEvents(socket: Socket) {
    // Comment creation
    socket.on('comment:create', (data) => {
      socket.to(`task:${data.taskId}`).emit('comment:created', data);
    });

    // Comment updates
    socket.on('comment:update', (data) => {
      socket.to(`task:${data.taskId}`).emit('comment:updated', data);
    });

    // Comment deletion
    socket.on('comment:delete', (data) => {
      socket.to(`task:${data.taskId}`).emit('comment:deleted', data);
    });
  }

  private handleProjectEvents(socket: Socket) {
    // Project updates
    socket.on('project:update', (data) => {
      socket.to(`project:${data.id}`).emit('project:updated', data);
    });

    // Member added to project
    socket.on('project:member_added', (data) => {
      socket.to(`project:${data.projectId}`).emit('project:member_added', data);
      
      // Make the new member join the project room
      this.io.sockets.sockets.forEach(memberSocket => {
        if (memberSocket.data.user?.id === data.member.userId) {
          memberSocket.join(`project:${data.projectId}`);
        }
      });

      // Notify the added member
      socket.to(`user:${data.member.userId}`).emit('notification:new', {
        id: `member_added_${Date.now()}`,
        type: 'project_member_added',
        title: 'Added to Project',
        message: `You have been added to project: ${data.projectName}`,
        userId: data.member.userId,
        data: { projectId: data.projectId },
      });
    });

    // Member removed from project
    socket.on('project:member_removed', (data) => {
      socket.to(`project:${data.projectId}`).emit('project:member_removed', data);
      
      // Make the removed member leave the project room
      this.io.sockets.sockets.forEach(memberSocket => {
        if (memberSocket.data.user?.id === data.userId) {
          memberSocket.leave(`project:${data.projectId}`);
        }
      });
    });
  }

  private handlePresenceEvents(socket: Socket) {
    // User comes online
    socket.on('user:online', async () => {
      const userId = socket.data.user.id;
      
      // Update user's online status in connected projects
      const projectMemberships = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });

      projectMemberships.forEach(membership => {
        socket.to(`project:${membership.projectId}`).emit('user:online', {
          userId,
          username: socket.data.user.username,
          firstName: socket.data.user.firstName,
          lastName: socket.data.user.lastName,
        });
      });
    });

    // User activity (typing, viewing, etc.)
    socket.on('user:activity', (data) => {
      socket.to(`project:${data.projectId}`).emit('user:activity', {
        userId: socket.data.user.id,
        activity: data.activity,
        context: data.context,
        timestamp: new Date(),
      });
    });
  }

  private handleTypingEvents(socket: Socket) {
    // Typing in comments
    socket.on('typing:start', (data) => {
      socket.to(`task:${data.taskId}`).emit('typing:user_start', {
        userId: socket.data.user.id,
        username: socket.data.user.username,
        taskId: data.taskId,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`task:${data.taskId}`).emit('typing:user_stop', {
        userId: socket.data.user.id,
        taskId: data.taskId,
      });
    });
  }

  private handleNotificationEvents(socket: Socket) {
    // Mark notification as read
    socket.on('notification:read', (notificationId: string) => {
      // In a real app, you'd update the notification status in the database
      console.log(`Notification ${notificationId} marked as read by user ${socket.data.user.id}`);
    });

    // Get unread notifications count
    socket.on('notifications:get_unread_count', async () => {
      // In a real app, you'd query the database for unread notifications
      const unreadCount = 0; // Placeholder
      socket.emit('notifications:unread_count', unreadCount);
    });
  }

  private handleUserOffline(socket: Socket) {
    const userId = socket.data.user.id;
    
    // Broadcast user offline status to connected projects
    prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    }).then(memberships => {
      memberships.forEach(membership => {
        socket.to(`project:${membership.projectId}`).emit('user:offline', {
          userId,
          username: socket.data.user.username,
        });
      });
    });
  }

  private async getOnlineUsersInProject(projectId: string): Promise<any[]> {
    const onlineUsers: any[] = [];
    
    // Get all sockets in the project room
    const projectRoom = this.io.sockets.adapter.rooms.get(`project:${projectId}`);
    
    if (projectRoom) {
      for (const socketId of projectRoom) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && socket.data.user) {
          onlineUsers.push({
            id: socket.data.user.id,
            username: socket.data.user.username,
            firstName: socket.data.user.firstName,
            lastName: socket.data.user.lastName,
          });
        }
      }
    }
    
    return onlineUsers;
  }

  // Utility methods for emitting events from outside the socket handlers
  public emitToProject(projectId: string, event: string, data: any) {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToTask(taskId: string, event: string, data: any) {
    this.io.to(`task:${taskId}`).emit(event, data);
  }

  public broadcastNotification(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.io.to(`user:${userId}`).emit('notification:new', notification);
    });
  }
}