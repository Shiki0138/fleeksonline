# System Integration Architecture

## Component Communication Patterns

### Frontend-Backend Communication

#### API Client Service
```typescript
// services/api-service.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/auth-store'

class ApiService {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': 'v1',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const { tokens } = useAuthStore.getState()
        
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId()
        
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const { tokens, setTokens, clearAuth } = useAuthStore.getState()
            
            if (tokens?.refreshToken) {
              const response = await this.refreshToken(tokens.refreshToken)
              setTokens(response.tokens)
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${response.tokens.accessToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            useAuthStore.getState().clearAuth()
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data.data
  }

  private async refreshToken(refreshToken: string) {
    const response = await axios.post(`${this.baseURL}/auth/refresh`, {
      refreshToken
    })
    return response.data.data
  }
}

export const apiService = new ApiService()

// Type definitions
interface ApiResponse<T> {
  success: boolean
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### Real-time Communication with WebSockets

#### WebSocket Service
```typescript
// services/websocket-service.ts
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth-store'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect() {
    const { tokens, user } = useAuthStore.getState()
    
    if (!tokens?.accessToken || !user) {
      console.warn('Cannot connect WebSocket: User not authenticated')
      return
    }

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        token: tokens.accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      
      // Join user-specific room
      const { user } = useAuthStore.getState()
      if (user) {
        this.socket?.emit('join-user-room', user.id)
      }
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
      }
    })

    // Authentication error
    this.socket.on('auth_error', () => {
      console.error('WebSocket authentication failed')
      this.disconnect()
      useAuthStore.getState().clearAuth()
    })
  }

  joinProjectRoom(projectId: string) {
    this.socket?.emit('join-project-room', projectId)
  }

  leaveProjectRoom(projectId: string) {
    this.socket?.emit('leave-project-room', projectId)
  }

  joinOrganizationRoom(organizationId: string) {
    this.socket?.emit('join-organization-room', organizationId)
  }

  // Task updates
  onTaskUpdate(callback: (task: Task) => void) {
    this.socket?.on('task-updated', callback)
  }

  onTaskCreated(callback: (task: Task) => void) {
    this.socket?.on('task-created', callback)
  }

  // Project updates
  onProjectUpdate(callback: (project: Project) => void) {
    this.socket?.on('project-updated', callback)
  }

  // User activity
  onUserActivity(callback: (activity: UserActivity) => void) {
    this.socket?.on('user-activity', callback)
  }

  // Notifications
  onNotification(callback: (notification: Notification) => void) {
    this.socket?.on('notification', callback)
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const websocketService = new WebSocketService()
```

#### Backend WebSocket Server
```typescript
// services/websocket-server.ts
import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import { UserService } from './user-service'

export class WebSocketServer {
  private io: SocketIOServer
  private userService: UserService

  constructor(httpServer: HttpServer, userService: UserService) {
    this.userService = userService
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
      transports: ['websocket'],
    })

    this.setupAuthentication()
    this.setupEventHandlers()
  }

  private setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any
        const user = await this.userService.findById(decoded.sub)
        
        if (!user) {
          return next(new Error('User not found'))
        }

        socket.data.user = user
        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user
      console.log(`User ${user.id} connected`)

      // Join user-specific room
      socket.on('join-user-room', (userId: string) => {
        if (userId === user.id) {
          socket.join(`user:${userId}`)
          console.log(`User ${userId} joined their room`)
        }
      })

      // Join project room
      socket.on('join-project-room', async (projectId: string) => {
        // Verify user has access to project
        const hasAccess = await this.verifyProjectAccess(user.id, projectId)
        if (hasAccess) {
          socket.join(`project:${projectId}`)
          console.log(`User ${user.id} joined project ${projectId}`)
        }
      })

      // Leave project room
      socket.on('leave-project-room', (projectId: string) => {
        socket.leave(`project:${projectId}`)
        console.log(`User ${user.id} left project ${projectId}`)
      })

      // Join organization room
      socket.on('join-organization-room', async (organizationId: string) => {
        const hasAccess = await this.verifyOrganizationAccess(user.id, organizationId)
        if (hasAccess) {
          socket.join(`organization:${organizationId}`)
          console.log(`User ${user.id} joined organization ${organizationId}`)
        }
      })

      socket.on('disconnect', () => {
        console.log(`User ${user.id} disconnected`)
      })
    })
  }

  // Broadcast methods
  broadcastTaskUpdate(task: Task, projectId: string) {
    this.io.to(`project:${projectId}`).emit('task-updated', task)
  }

  broadcastTaskCreated(task: Task, projectId: string) {
    this.io.to(`project:${projectId}`).emit('task-created', task)
  }

  broadcastProjectUpdate(project: Project, organizationId: string) {
    this.io.to(`organization:${organizationId}`).emit('project-updated', project)
  }

  sendUserNotification(userId: string, notification: Notification) {
    this.io.to(`user:${userId}`).emit('notification', notification)
  }

  broadcastUserActivity(activity: UserActivity, organizationId: string) {
    this.io.to(`organization:${organizationId}`).emit('user-activity', activity)
  }

  private async verifyProjectAccess(userId: string, projectId: string): Promise<boolean> {
    // Implementation to verify user has access to project
    return true // placeholder
  }

  private async verifyOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
    // Implementation to verify user belongs to organization
    return true // placeholder
  }
}
```

## Caching Strategy with Redis

### Cache Service
```typescript
// services/cache-service.ts
import Redis from 'ioredis'
import { promisify } from 'util'

export class CacheService {
  private redis: Redis
  
  // Cache TTL constants (in seconds)
  private readonly TTL = {
    USER_SESSION: 24 * 60 * 60,      // 24 hours
    USER_PERMISSIONS: 30 * 60,        // 30 minutes
    API_RESPONSE: 5 * 60,             // 5 minutes
    PROJECT_STATS: 10 * 60,           // 10 minutes
    TASK_COUNTS: 5 * 60,              // 5 minutes
    ORGANIZATION_DATA: 15 * 60,       // 15 minutes
    RATE_LIMIT: 60,                   // 1 minute
  }

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    this.redis.on('connect', () => {
      console.log('Redis connected')
    })
  }

  // Generic cache methods
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key)
      return result ? JSON.parse(result) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await this.redis.setex(key, ttl, serialized)
      } else {
        await this.redis.set(key, serialized)
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  // Pattern-based operations
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
    }
  }

  // User session cache
  async setUserSession(userId: string, sessionData: any): Promise<void> {
    const key = `session:user:${userId}`
    await this.set(key, sessionData, this.TTL.USER_SESSION)
  }

  async getUserSession(userId: string): Promise<any> {
    const key = `session:user:${userId}`
    return this.get(key)
  }

  async deleteUserSession(userId: string): Promise<void> {
    const key = `session:user:${userId}`
    await this.del(key)
  }

  // User permissions cache
  async setUserPermissions(userId: string, organizationId: string, permissions: string[]): Promise<void> {
    const key = `permissions:user:${userId}:org:${organizationId}`
    await this.set(key, permissions, this.TTL.USER_PERMISSIONS)
  }

  async getUserPermissions(userId: string, organizationId: string): Promise<string[] | null> {
    const key = `permissions:user:${userId}:org:${organizationId}`
    return this.get(key)
  }

  // API response cache
  async cacheApiResponse(endpoint: string, params: Record<string, any>, response: any): Promise<void> {
    const paramsHash = this.hashParams(params)
    const key = `api_cache:${endpoint}:${paramsHash}`
    await this.set(key, response, this.TTL.API_RESPONSE)
  }

  async getCachedApiResponse(endpoint: string, params: Record<string, any>): Promise<any> {
    const paramsHash = this.hashParams(params)
    const key = `api_cache:${endpoint}:${paramsHash}`
    return this.get(key)
  }

  // Project statistics cache
  async setProjectStats(projectId: string, stats: any): Promise<void> {
    const key = `stats:project:${projectId}`
    await this.set(key, stats, this.TTL.PROJECT_STATS)
  }

  async getProjectStats(projectId: string): Promise<any> {
    const key = `stats:project:${projectId}`
    return this.get(key)
  }

  async invalidateProjectStats(projectId: string): Promise<void> {
    const key = `stats:project:${projectId}`
    await this.del(key)
  }

  // Task counts cache
  async setTaskCounts(projectId: string, counts: any): Promise<void> {
    const key = `counts:project:${projectId}:tasks`
    await this.set(key, counts, this.TTL.TASK_COUNTS)
  }

  async getTaskCounts(projectId: string): Promise<any> {
    const key = `counts:project:${projectId}:tasks`
    return this.get(key)
  }

  // Organization member count
  async setOrgMemberCount(organizationId: string, count: number): Promise<void> {
    const key = `count:org:${organizationId}:members`
    await this.set(key, count, this.TTL.ORGANIZATION_DATA)
  }

  async getOrgMemberCount(organizationId: string): Promise<number | null> {
    const key = `count:org:${organizationId}:members`
    return this.get(key)
  }

  // Rate limiting
  async incrementRateLimit(identifier: string, windowMs: number = 60000): Promise<number> {
    const key = `rate_limit:${identifier}`
    const current = await this.redis.incr(key)
    
    if (current === 1) {
      await this.redis.pexpire(key, windowMs)
    }
    
    return current
  }

  async getRateLimit(identifier: string): Promise<number> {
    const key = `rate_limit:${identifier}`
    const count = await this.redis.get(key)
    return count ? parseInt(count, 10) : 0
  }

  // Cache invalidation patterns
  async invalidateUserCache(userId: string): Promise<void> {
    await this.deletePattern(`*user:${userId}*`)
  }

  async invalidateProjectCache(projectId: string): Promise<void> {
    await this.deletePattern(`*project:${projectId}*`)
  }

  async invalidateOrganizationCache(organizationId: string): Promise<void> {
    await this.deletePattern(`*org:${organizationId}*`)
  }

  // Helper methods
  private hashParams(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, any>)
    
    return Buffer.from(JSON.stringify(sorted)).toString('base64')
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  }

  // Cleanup expired keys (optional manual cleanup)
  async cleanup(): Promise<void> {
    try {
      // Redis automatically handles TTL, but we can do manual cleanup if needed
      const expiredKeys = await this.redis.keys('*:expired:*')
      if (expiredKeys.length > 0) {
        await this.redis.del(...expiredKeys)
      }
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }
}

export const cacheService = new CacheService()
```

### Cache Middleware
```typescript
// middleware/cache-middleware.ts
import { Request, Response, NextFunction } from 'express'
import { cacheService } from '@/services/cache-service'

interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: Request) => string
  condition?: (req: Request) => boolean
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Check condition if provided
    if (options.condition && !options.condition(req)) {
      return next()
    }

    // Generate cache key
    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(req)
      : `api_cache:${req.originalUrl}:${JSON.stringify(req.query)}`

    try {
      // Try to get cached response
      const cachedResponse = await cacheService.get(cacheKey)
      
      if (cachedResponse) {
        console.log(`Cache hit: ${cacheKey}`)
        return res.json(cachedResponse)
      }

      // Cache miss - intercept response
      const originalSend = res.json
      res.json = function(body) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, options.ttl)
            .catch(error => console.error('Cache set error:', error))
        }
        
        return originalSend.call(this, body)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

// Usage examples
export const projectsCacheMiddleware = cacheMiddleware({
  ttl: 5 * 60, // 5 minutes
  keyGenerator: (req) => `projects:user:${(req as any).user.id}:${JSON.stringify(req.query)}`,
  condition: (req) => !req.query.real_time, // Skip cache for real-time requests
})

export const dashboardCacheMiddleware = cacheMiddleware({
  ttl: 2 * 60, // 2 minutes
  keyGenerator: (req) => `dashboard:user:${(req as any).user.id}`,
})
```

## Database Connection Management

### Database Service
```typescript
// services/database-service.ts
import { PrismaClient } from '@prisma/client'

class DatabaseService {
  private static instance: DatabaseService
  private prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })

    // Connection event handlers
    this.prisma.$on('query', (e) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Query: ' + e.query)
        console.log('Duration: ' + e.duration + 'ms')
      }
    })

    // Handle graceful shutdown
    process.on('SIGINT', this.disconnect.bind(this))
    process.on('SIGTERM', this.disconnect.bind(this))
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  getClient(): PrismaClient {
    return this.prisma
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      console.log('Database connected successfully')
    } catch (error) {
      console.error('Database connection failed:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      console.log('Database disconnected')
    } catch (error) {
      console.error('Database disconnection error:', error)
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  // Transaction helper
  async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn)
  }
}

export const databaseService = DatabaseService.getInstance()
export const prisma = databaseService.getClient()
```

## Message Queue Integration

### Queue Service (using Bull)
```typescript
// services/queue-service.ts
import Bull, { Queue, Job } from 'bull'
import Redis from 'ioredis'

interface EmailJob {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

interface NotificationJob {
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
}

export class QueueService {
  private emailQueue: Queue<EmailJob>
  private notificationQueue: Queue<NotificationJob>
  private redis: Redis

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)

    // Initialize queues
    this.emailQueue = new Bull<EmailJob>('email processing', {
      redis: { port: 6379, host: process.env.REDIS_HOST },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    })

    this.notificationQueue = new Bull<NotificationJob>('notification processing', {
      redis: { port: 6379, host: process.env.REDIS_HOST },
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    })

    this.setupProcessors()
    this.setupEventHandlers()
  }

  private setupProcessors() {
    // Email processing
    this.emailQueue.process('send-email', 5, async (job: Job<EmailJob>) => {
      const { to, subject, template, data } = job.data
      
      console.log(`Processing email job: ${job.id}`)
      
      try {
        // Email sending logic here (SendGrid, SES, etc.)
        await this.sendEmail(to, subject, template, data)
        console.log(`Email sent successfully to ${to}`)
      } catch (error) {
        console.error(`Email sending failed: ${error}`)
        throw error
      }
    })

    // Notification processing
    this.notificationQueue.process('send-notification', 10, async (job: Job<NotificationJob>) => {
      const { userId, type, title, message, data } = job.data
      
      console.log(`Processing notification job: ${job.id}`)
      
      try {
        // Notification sending logic here
        await this.sendNotification(userId, type, title, message, data)
        console.log(`Notification sent to user ${userId}`)
      } catch (error) {
        console.error(`Notification sending failed: ${error}`)
        throw error
      }
    })
  }

  private setupEventHandlers() {
    // Email queue events
    this.emailQueue.on('completed', (job) => {
      console.log(`Email job ${job.id} completed`)
    })

    this.emailQueue.on('failed', (job, err) => {
      console.error(`Email job ${job.id} failed:`, err)
    })

    // Notification queue events
    this.notificationQueue.on('completed', (job) => {
      console.log(`Notification job ${job.id} completed`)
    })

    this.notificationQueue.on('failed', (job, err) => {
      console.error(`Notification job ${job.id} failed:`, err)
    })
  }

  // Email methods
  async queueEmail(emailData: EmailJob, options?: Bull.JobOptions): Promise<Job<EmailJob>> {
    return this.emailQueue.add('send-email', emailData, options)
  }

  async queueWelcomeEmail(userEmail: string, userName: string): Promise<Job<EmailJob>> {
    return this.queueEmail({
      to: userEmail,
      subject: 'Welcome to Business App',
      template: 'welcome',
      data: { name: userName },
    })
  }

  async queuePasswordResetEmail(userEmail: string, resetToken: string): Promise<Job<EmailJob>> {
    return this.queueEmail({
      to: userEmail,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: { resetToken },
    }, { delay: 1000 }) // 1 second delay
  }

  // Notification methods
  async queueNotification(notificationData: NotificationJob, options?: Bull.JobOptions): Promise<Job<NotificationJob>> {
    return this.notificationQueue.add('send-notification', notificationData, options)
  }

  async queueTaskAssignedNotification(userId: string, taskTitle: string, projectName: string): Promise<Job<NotificationJob>> {
    return this.queueNotification({
      userId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to "${taskTitle}" in ${projectName}`,
      data: { taskTitle, projectName },
    })
  }

  // Queue management
  async getQueueStats() {
    const [emailStats, notificationStats] = await Promise.all([
      {
        waiting: await this.emailQueue.getWaiting(),
        active: await this.emailQueue.getActive(),
        completed: await this.emailQueue.getCompleted(),
        failed: await this.emailQueue.getFailed(),
      },
      {
        waiting: await this.notificationQueue.getWaiting(),
        active: await this.notificationQueue.getActive(),
        completed: await this.notificationQueue.getCompleted(),
        failed: await this.notificationQueue.getFailed(),
      },
    ])

    return {
      email: {
        waiting: emailStats.waiting.length,
        active: emailStats.active.length,
        completed: emailStats.completed.length,
        failed: emailStats.failed.length,
      },
      notification: {
        waiting: notificationStats.waiting.length,
        active: notificationStats.active.length,
        completed: notificationStats.completed.length,
        failed: notificationStats.failed.length,
      },
    }
  }

  async pauseQueues(): Promise<void> {
    await Promise.all([
      this.emailQueue.pause(),
      this.notificationQueue.pause(),
    ])
  }

  async resumeQueues(): Promise<void> {
    await Promise.all([
      this.emailQueue.resume(),
      this.notificationQueue.resume(),
    ])
  }

  async closeQueues(): Promise<void> {
    await Promise.all([
      this.emailQueue.close(),
      this.notificationQueue.close(),
    ])
  }

  // Private helper methods
  private async sendEmail(to: string, subject: string, template: string, data: Record<string, any>): Promise<void> {
    // Implementation for actual email sending
    // This would integrate with SendGrid, SES, or other email service
    console.log(`Sending email to ${to}: ${subject}`)
  }

  private async sendNotification(userId: string, type: string, title: string, message: string, data?: Record<string, any>): Promise<void> {
    // Implementation for actual notification sending
    // This would integrate with push notification service, WebSocket, etc.
    console.log(`Sending notification to user ${userId}: ${title}`)
  }
}

export const queueService = new QueueService()
```

## Health Check System

```typescript
// services/health-service.ts
import { databaseService } from './database-service'
import { cacheService } from './cache-service'
import { queueService } from './queue-service'

interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy'
  responseTime: number
  details?: any
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: HealthCheck[]
  uptime: number
}

export class HealthService {
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks: HealthCheck[] = []

    // Database health check
    const dbStart = Date.now()
    const dbHealthy = await databaseService.healthCheck()
    checks.push({
      service: 'database',
      status: dbHealthy ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - dbStart,
      details: dbHealthy ? null : 'Database connection failed',
    })

    // Cache health check
    const cacheStart = Date.now()
    const cacheHealthy = await cacheService.healthCheck()
    checks.push({
      service: 'cache',
      status: cacheHealthy ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - cacheStart,
      details: cacheHealthy ? null : 'Redis connection failed',
    })

    // Queue health check
    const queueStart = Date.now()
    try {
      const queueStats = await queueService.getQueueStats()
      checks.push({
        service: 'queues',
        status: 'healthy',
        responseTime: Date.now() - queueStart,
        details: queueStats,
      })
    } catch (error) {
      checks.push({
        service: 'queues',
        status: 'unhealthy',
        responseTime: Date.now() - queueStart,
        details: 'Queue system unreachable',
      })
    }

    // Determine overall system status
    const unhealthyServices = checks.filter(check => check.status === 'unhealthy')
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'

    if (unhealthyServices.length === 0) {
      overallStatus = 'healthy'
    } else if (unhealthyServices.length === checks.length) {
      overallStatus = 'unhealthy'
    } else {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      uptime: Date.now() - this.startTime,
    }
  }

  async getDetailedMetrics() {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    }
  }
}

export const healthService = new HealthService()
```

This system integration architecture provides a robust foundation for component communication, real-time updates, caching, queue processing, and health monitoring.