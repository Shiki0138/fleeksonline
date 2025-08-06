import { apiClient } from './client';
import { LoginCredentials, RegisterData, User, AuthTokens, ApiResponse } from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    return apiClient.post('/auth/login', credentials);
  },

  register: async (data: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    return apiClient.post('/auth/register', data);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiClient.get('/auth/profile');
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.patch('/auth/profile', data);
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/change-password', data);
  },
};