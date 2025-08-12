import { User, Project, Task, Comment, Label, Attachment, ActivityLog, ProjectMember } from '@prisma/client';

// Base types from Prisma
export type {
  User,
  Project,
  Task,
  Comment,
  Label,
  Attachment,
  ActivityLog,
  ProjectMember,
  Role,
  TaskStatus,
  TaskPriority,
  ActivityType
} from '@prisma/client';

// Extended types with relations
export interface UserWithProjects extends User {
  projectMemberships: (ProjectMember & {
    project: Project;
  })[];
}

export interface ProjectWithMembers extends Project {
  members: (ProjectMember & {
    user: User;
  })[];
  createdBy: User;
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface TaskWithDetails extends Task {
  project: Project;
  createdBy: User;
  assignee?: User | null;
  comments: (Comment & {
    author: User;
  })[];
  attachments: Attachment[];
  labels: (Label & {
    label: Label;
  })[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface CommentWithAuthor extends Comment {
  author: User;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  labelIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  position?: number;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CreateLabelRequest {
  name: string;
  color?: string;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
}

// Socket.io event types
export interface SocketEvents {
  // Task events
  'task:created': TaskWithDetails;
  'task:updated': TaskWithDetails;
  'task:deleted': { taskId: string; projectId: string };
  'task:assigned': { taskId: string; assigneeId: string; assignedBy: string };
  
  // Comment events
  'comment:created': CommentWithAuthor;
  'comment:updated': CommentWithAuthor;
  'comment:deleted': { commentId: string; taskId: string };
  
  // Project events
  'project:updated': ProjectWithMembers;
  'project:member_added': { projectId: string; member: ProjectMember & { user: User } };
  'project:member_removed': { projectId: string; userId: string };
  
  // Activity events
  'activity:new': ActivityLog & { user: User };
  
  // Notification events
  'notification:new': {
    id: string;
    type: string;
    title: string;
    message: string;
    userId: string;
    data?: Record<string, any>;
  };
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

// Error types
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, any>;
}

// Query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface TaskFilterQuery extends PaginationQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  labelIds?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectFilterQuery extends PaginationQuery {
  search?: string;
  isArchived?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// FastifyRequest extensions
declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

// Environment variables
export interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Role = 'ADMIN' | 'MEMBER' | 'VIEWER';