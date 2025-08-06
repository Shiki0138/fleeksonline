import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Import utilities and middleware
import { errorHandler } from './utils/errors';
import { authenticate, optionalAuthenticate, requireProjectMember, requireTaskAccess } from './middleware/auth';

// Import controllers
import { AuthController } from './controllers/authController';
import { ProjectController } from './controllers/projectController';
import { TaskController } from './controllers/taskController';

// Import socket handlers
import { SocketHandlers } from './sockets/socketHandlers';

// Load environment variables
dotenv.config();

const server: FastifyInstance = Fastify({
  logger: true
});

// Socket.IO server
const io = new SocketIOServer(server.server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

async function buildServer() {
  try {
    // Register plugins
    await server.register(helmet, {
      contentSecurityPolicy: false, // Disable for Swagger UI
    });

    await server.register(cors, {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    });

    await server.register(rateLimit, {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
      errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
      }),
    });

    await server.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });

    // Swagger documentation
    await server.register(swagger, {
      swagger: {
        info: {
          title: 'Task Management API',
          description: 'API for Task Management & Collaboration Platform',
          version: '1.0.0',
        },
        host: 'localhost:3000',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
      },
    });

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });

    // Initialize controllers
    const authController = new AuthController(server);
    const projectController = new ProjectController();
    const taskController = new TaskController();

    // Initialize socket handlers
    const socketHandlers = new SocketHandlers(io, server);

    // Global error handler
    server.setErrorHandler(errorHandler);

    // Health check route
    server.get('/health', async (request, reply) => {
      return { status: 'OK', timestamp: new Date().toISOString() };
    });

    // API routes
    await server.register(async function (fastify) {
      // Authentication routes (public)
      fastify.post('/auth/register', authController.register);
      fastify.post('/auth/login', authController.login);
      fastify.post('/auth/refresh', authController.refreshToken);
      fastify.post('/auth/logout', authController.logout);
      fastify.post('/auth/forgot-password', authController.requestPasswordReset);
      fastify.post('/auth/reset-password', authController.resetPassword);
      fastify.post('/auth/validate-token', authController.validateToken);

      // Protected authentication routes
      fastify.register(async function (protectedFastify) {
        protectedFastify.addHook('preHandler', authenticate);
        
        protectedFastify.get('/auth/profile', authController.getProfile);
        protectedFastify.put('/auth/profile', authController.updateProfile);
        protectedFastify.post('/auth/change-password', authController.changePassword);
        protectedFastify.delete('/auth/account', authController.deactivateAccount);
      });

      // User management routes (admin only)
      fastify.register(async function (adminFastify) {
        adminFastify.addHook('preHandler', authenticate);
        // Add admin check middleware here if needed
        
        adminFastify.get('/users', authController.listUsers);
        adminFastify.get('/users/:id', authController.getUserById);
        adminFastify.post('/users/:id/reactivate', authController.reactivateUser);
        adminFastify.delete('/users/:id', authController.deactivateUser);
      });

      // Project routes
      fastify.register(async function (projectFastify) {
        projectFastify.addHook('preHandler', authenticate);
        
        // Project CRUD
        projectFastify.post('/projects', projectController.createProject);
        projectFastify.get('/projects', projectController.getProjects);
        projectFastify.get('/projects/:id', projectController.getProjectById);
        projectFastify.put('/projects/:id', projectController.updateProject);
        projectFastify.delete('/projects/:id', projectController.deleteProject);
        
        // Project management
        projectFastify.post('/projects/:id/archive', projectController.archiveProject);
        projectFastify.post('/projects/:id/unarchive', projectController.unarchiveProject);
        projectFastify.get('/projects/:id/stats', projectController.getProjectStats);
        
        // Project members
        projectFastify.get('/projects/:id/members', projectController.getProjectMembers);
        projectFastify.post('/projects/:id/members', projectController.addMember);
        projectFastify.delete('/projects/:id/members/:userId', projectController.removeMember);
        projectFastify.put('/projects/:id/members/:userId', projectController.updateMemberRole);
      });

      // Task routes
      fastify.register(async function (taskFastify) {
        taskFastify.addHook('preHandler', authenticate);
        
        // Task CRUD
        taskFastify.post('/projects/:projectId/tasks', taskController.createTask);
        taskFastify.get('/projects/:projectId/tasks', taskController.getTasks);
        taskFastify.get('/tasks/:id', taskController.getTaskById);
        taskFastify.put('/tasks/:id', taskController.updateTask);
        taskFastify.delete('/tasks/:id', taskController.deleteTask);
        
        // Task management
        taskFastify.post('/projects/:projectId/tasks/reorder', taskController.reorderTasks);
        taskFastify.post('/tasks/:id/assign', taskController.assignTask);
        taskFastify.post('/tasks/:id/unassign', taskController.unassignTask);
        taskFastify.put('/tasks/:id/status', taskController.updateTaskStatus);
        taskFastify.post('/tasks/:id/labels', taskController.addLabelsToTask);
        taskFastify.post('/tasks/:id/duplicate', taskController.duplicateTask);
        
        // Task queries
        taskFastify.get('/my-tasks', taskController.getMyTasks);
        taskFastify.get('/projects/:projectId/tasks/stats', taskController.getTaskStats);
        taskFastify.get('/projects/:projectId/tasks/overdue', taskController.getOverdueTasks);
        
        // Bulk operations
        taskFastify.put('/tasks/bulk', taskController.bulkUpdateTasks);
      });

      // Admin routes (admin authentication required)
      fastify.register(async function (adminFastify) {
        const adminRoutes = await import('./routes/admin');
        adminFastify.register(adminRoutes.default, { prefix: '/admin' });
      });

      // Comment routes (would be implemented similarly)
      // Label routes (would be implemented similarly)
      // Attachment routes (would be implemented similarly)
      // Activity routes (would be implemented similarly)

    }, { prefix: '/api' });

    // WebSocket endpoint info
    server.get('/socket.io-info', async (request, reply) => {
      return {
        endpoint: '/socket.io',
        transports: ['websocket', 'polling'],
        authentication: 'Bearer token required',
        events: {
          connection: 'Client connects with JWT token',
          'task:*': 'Task-related events',
          'comment:*': 'Comment-related events',
          'project:*': 'Project-related events',
          'user:*': 'User presence events',
          'notification:*': 'Notification events',
        },
      };
    });

    return server;
  } catch (error) {
    server.log.error(error);
    throw error;
  }
}

// Start server
async function start() {
  try {
    const serverInstance = await buildServer();
    
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await serverInstance.listen({ port, host });
    
    console.log(`
🚀 Server ready at: http://${host}:${port}
📚 API Documentation: http://${host}:${port}/docs
🔌 WebSocket endpoint: ws://${host}:${port}/socket.io
💻 Environment: ${process.env.NODE_ENV || 'development'}
    `);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await server.close();
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  start();
}

export default buildServer;