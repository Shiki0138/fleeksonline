import { z } from 'zod';
import { TaskStatus, TaskPriority, Role } from '@prisma/client';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must not exceed 30 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must not exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must not exceed 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must not exceed 100 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

// Project validation schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must not exceed 100 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  isArchived: z.boolean().optional(),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  role: z.nativeEnum(Role).optional(),
});

export const updateProjectMemberSchema = z.object({
  role: z.nativeEnum(Role),
});

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must not exceed 200 characters'),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().cuid().optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const taskFilterSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  labelIds: z.union([
    z.string().cuid(),
    z.array(z.string().cuid()),
  ]).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment must not exceed 1000 characters'),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment must not exceed 1000 characters'),
});

// Label validation schemas
export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50, 'Label name must not exceed 50 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// Common validation schemas
export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

export const paginationSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
});

// Utility function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
    }
    throw error;
  }
}

// Helper function to create validation middleware
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return validateData(schema, data);
  };
}