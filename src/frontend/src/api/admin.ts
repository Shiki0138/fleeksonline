import { api } from '@/lib/api';

export const adminApi = {
  // 統計情報取得
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // 動画管理
  addVideoFromUrl: async (data: {
    youtubeUrl: string;
    categoryId: string;
    customTitle?: string;
    customDescription?: string;
    tags?: string[];
  }) => {
    const response = await api.post('/admin/videos/from-url', data);
    return response.data;
  },

  addVideo: async (data: {
    youtubeVideoId: string;
    title: string;
    description?: string;
    thumbnailUrl: string;
    duration: number;
    categoryId: string;
    tags?: string[];
  }) => {
    const response = await api.post('/admin/videos', data);
    return response.data;
  },

  updateVideo: async (id: string, data: any) => {
    const response = await api.put(`/admin/videos/${id}`, data);
    return response.data;
  },

  deleteVideo: async (id: string) => {
    const response = await api.delete(`/admin/videos/${id}`);
    return response.data;
  },

  // カテゴリー管理
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  addCategory: async (data: {
    name: string;
    slug: string;
    description?: string;
    displayOrder?: number;
  }) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },

  // ブログ管理
  createBlogPost: async (data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    categoryId?: string;
    tags?: string[];
    isPublished?: boolean;
  }) => {
    const response = await api.post('/blog/posts', data);
    return response.data;
  },

  getBlogPosts: async (params?: {
    page?: number;
    limit?: number;
    published?: boolean;
  }) => {
    const response = await api.get('/blog/posts', { params });
    return response.data;
  },

  updateBlogPost: async (id: string, data: any) => {
    const response = await api.put(`/blog/posts/${id}`, data);
    return response.data;
  },

  deleteBlogPost: async (id: string) => {
    const response = await api.delete(`/blog/posts/${id}`);
    return response.data;
  },

  // ライブ配信管理
  createLiveStream: async (data: {
    title: string;
    description?: string;
    categoryId?: string;
    scheduledAt?: string;
    tags?: string[];
    isPrivate?: boolean;
    chatEnabled?: boolean;
  }) => {
    const response = await api.post('/live/streams', data);
    return response.data;
  },

  getLiveStreams: async (params?: {
    status?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/live/streams', { params });
    return response.data;
  },

  updateLiveStream: async (id: string, data: any) => {
    const response = await api.put(`/live/streams/${id}`, data);
    return response.data;
  },

  deleteLiveStream: async (id: string) => {
    const response = await api.delete(`/live/streams/${id}`);
    return response.data;
  },

  // ユーザー管理
  getUsers: async (params?: {
    membershipType?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserMembership: async (userId: string, data: {
    membershipType: 'FREE' | 'PREMIUM';
    membershipExpiry?: Date;
  }) => {
    const response = await api.put(`/admin/users/${userId}/membership`, data);
    return response.data;
  },

  // スケジュール管理
  createScheduledPost: async (data: {
    title: string;
    type: 'VIDEO' | 'BLOG' | 'LIVE_STREAM';
    scheduledAt: string;
    content: any;
  }) => {
    const response = await api.post('/admin/scheduled-posts', data);
    return response.data;
  },

  getScheduledPosts: async () => {
    const response = await api.get('/admin/scheduled-posts');
    return response.data;
  },

  updateScheduledPost: async (id: string, data: any) => {
    const response = await api.put(`/admin/scheduled-posts/${id}`, data);
    return response.data;
  },

  deleteScheduledPost: async (id: string) => {
    const response = await api.delete(`/admin/scheduled-posts/${id}`);
    return response.data;
  },
};