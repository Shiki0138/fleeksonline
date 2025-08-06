import { api } from '@/lib/api';

export const videoApi = {
  // 動画一覧取得
  getVideos: async (params?: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/videos', { params });
    return response.data;
  },

  // 動画詳細取得
  getVideoDetail: async (id: string) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  // カテゴリー一覧取得
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // お気に入り状態確認
  checkFavorite: async (videoId: string) => {
    const response = await api.get(`/videos/${videoId}/favorite`);
    return response.data.isFavorite;
  },

  // お気に入り切り替え
  toggleFavorite: async (videoId: string) => {
    const response = await api.post(`/videos/${videoId}/favorite/toggle`);
    return response.data;
  },

  // 視聴履歴更新
  updateViewingHistory: async (videoId: string, watchedDuration: number) => {
    const response = await api.post(`/videos/${videoId}/history`, {
      watchedDuration,
    });
    return response.data;
  },

  // お気に入り動画一覧
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  // 視聴履歴取得
  getViewingHistory: async () => {
    const response = await api.get('/history');
    return response.data;
  },
};