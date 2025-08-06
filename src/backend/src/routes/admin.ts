import { FastifyPluginAsync } from 'fastify';
import {
  requireAdmin,
  addVideo,
  addVideoFromUrl,
  updateVideo,
  deleteVideo,
  addCategory,
  getUsers,
  updateUserMembership,
  getStats,
} from '../controllers/adminController';

const adminRoutes: FastifyPluginAsync = async function (fastify) {
  // 管理者認証の必要なルート
  fastify.addHook('preHandler', async (request, reply) => {
    // JWT認証チェック
    await request.jwtVerify();
    // 管理者権限チェック
    await requireAdmin(request, reply);
  });

  // 統計情報
  fastify.get('/stats', getStats);

  // 動画管理
  // YouTube URLから動画追加
  fastify.post('/videos/from-url', {
    schema: {
      body: {
        type: 'object',
        required: ['youtubeUrl', 'categoryId'],
        properties: {
          youtubeUrl: { type: 'string' },
          categoryId: { type: 'string' },
          customTitle: { type: 'string' },
          customDescription: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, addVideoFromUrl);

  // 手動で動画追加
  fastify.post('/videos', {
    schema: {
      body: {
        type: 'object',
        required: ['youtubeVideoId', 'title', 'thumbnailUrl', 'duration', 'categoryId'],
        properties: {
          youtubeVideoId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'number' },
          categoryId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, addVideo);

  fastify.put('/videos/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'number' },
          categoryId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          isPublished: { type: 'boolean' },
        },
      },
    },
  }, updateVideo);

  fastify.delete('/videos/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, deleteVideo);

  // カテゴリー管理
  fastify.post('/categories', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          displayOrder: { type: 'number' },
        },
      },
    },
  }, addCategory);

  // ユーザー管理
  fastify.get('/users', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          membershipType: { type: 'string', enum: ['FREE', 'PREMIUM'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 },
        },
      },
    },
  }, getUsers);

  fastify.put('/users/:userId/membership', {
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
        required: ['userId'],
      },
      body: {
        type: 'object',
        required: ['membershipType'],
        properties: {
          membershipType: { type: 'string', enum: ['FREE', 'PREMIUM'] },
          membershipExpiry: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, updateUserMembership);
};

export default adminRoutes;