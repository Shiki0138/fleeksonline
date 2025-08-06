import { apiClient } from './client';
import { Project, ProjectFilters, ApiResponse, PaginatedResponse } from '@/types';

export const projectsApi = {
  getProjects: async (filters?: ProjectFilters & { page?: number; pageSize?: number }): Promise<ApiResponse<PaginatedResponse<Project>>> => {
    const params = new URLSearchParams();
    
    if (filters?.status?.length) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters?.priority?.length) {
      filters.priority.forEach(priority => params.append('priority', priority));
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
    return apiClient.get(`/projects${queryString ? `?${queryString}` : ''}`);
  },

  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    return apiClient.get(`/projects/${id}`);
  },

  createProject: async (data: Omit<Project, 'id' | 'ownerId' | 'members' | 'tasksCount' | 'completedTasksCount' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Project>> => {
    return apiClient.post('/projects', data);
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<ApiResponse<Project>> => {
    return apiClient.patch(`/projects/${id}`, data);
  },

  deleteProject: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/projects/${id}`);
  },

  addMember: async (projectId: string, data: { userId: string; role: 'admin' | 'member' }): Promise<ApiResponse<Project>> => {
    return apiClient.post(`/projects/${projectId}/members`, data);
  },

  removeMember: async (projectId: string, userId: string): Promise<ApiResponse<Project>> => {
    return apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  updateMemberRole: async (projectId: string, userId: string, role: 'admin' | 'member'): Promise<ApiResponse<Project>> => {
    return apiClient.patch(`/projects/${projectId}/members/${userId}`, { role });
  },
};