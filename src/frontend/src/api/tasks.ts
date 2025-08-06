import { apiClient } from './client';
import { Task, TaskFilters, Comment, ApiResponse, PaginatedResponse } from '@/types';

export const tasksApi = {
  getTasks: async (filters?: TaskFilters & { page?: number; pageSize?: number }): Promise<ApiResponse<PaginatedResponse<Task>>> => {
    const params = new URLSearchParams();
    
    if (filters?.status?.length) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters?.priority?.length) {
      filters.priority.forEach(priority => params.append('priority', priority));
    }
    if (filters?.assigneeId) {
      params.append('assigneeId', filters.assigneeId);
    }
    if (filters?.projectId) {
      params.append('projectId', filters.projectId);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    return apiClient.get(`/tasks${queryString ? `?${queryString}` : ''}`);
  },

  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    return apiClient.get(`/tasks/${id}`);
  },

  createTask: async (data: Omit<Task, 'id' | 'creatorId' | 'creator' | 'project' | 'assignee' | 'comments' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> => {
    return apiClient.post('/tasks', data);
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<ApiResponse<Task>> => {
    return apiClient.patch(`/tasks/${id}`, data);
  },

  deleteTask: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/tasks/${id}`);
  },

  addComment: async (taskId: string, content: string): Promise<ApiResponse<Comment>> => {
    return apiClient.post(`/tasks/${taskId}/comments`, { content });
  },

  updateComment: async (taskId: string, commentId: string, content: string): Promise<ApiResponse<Comment>> => {
    return apiClient.patch(`/tasks/${taskId}/comments/${commentId}`, { content });
  },

  deleteComment: async (taskId: string, commentId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};