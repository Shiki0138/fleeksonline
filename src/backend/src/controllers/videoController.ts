import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/db';
import { z } from 'zod';

// スキーマ定義
const videoQuerySchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const videoCreateSchema = z.object({
  youtubeVideoId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url(),
  duration: z.number().int().positive(),
  categoryId: z.string(),
  tags: z.array(z.string()).default([]),
});

export class VideoController {
  constructor(private fastify: FastifyInstance) {}

  // 動画一覧取得
  async getVideos(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = videoQuerySchema.parse(request.query);
      const { categoryId, search, page, limit } = query;

      const where: any = {
        isPublished: true,
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          include: {
            category: true,
            _count: {
              select: {
                viewingHistory: true,
                favorites: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { publishedAt: 'desc' },
        }),
        prisma.video.count({ where }),
      ]);

      reply.send({
        success: true,
        data: videos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      request.log.error(error);
      reply.code(400).send({
        success: false,
        message: 'Failed to fetch videos',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 動画詳細取得
  async getVideo(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user?.userId;

      const video = await prisma.video.findUnique({
        where: { id },
        include: {
          category: true,
          _count: {
            select: {
              viewingHistory: true,
              favorites: true,
            },
          },
        },
      });

      if (!video) {
        return reply.code(404).send({
          success: false,
          message: 'Video not found',
        });
      }

      // 視聴履歴を取得（ログインユーザーの場合）
      let viewingHistory = null;
      let isFavorite = false;

      if (userId) {
        [viewingHistory, isFavorite] = await Promise.all([
          prisma.viewingHistory.findUnique({
            where: {
              userId_videoId: {
                userId,
                videoId: id,
              },
            },
          }),
          prisma.favorite.findUnique({
            where: {
              userId_videoId: {
                userId,
                videoId: id,
              },
            },
          }).then(fav => !!fav),
        ]);
      }

      // 視聴回数を増やす
      await prisma.video.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      reply.send({
        success: true,
        data: {
          ...video,
          viewingHistory,
          isFavorite,
        },
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch video',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 動画作成（管理者のみ）
  async createVideo(request: FastifyRequest<{ Body: z.infer<typeof videoCreateSchema> }>, reply: FastifyReply) {
    try {
      const data = videoCreateSchema.parse(request.body);

      const video = await prisma.video.create({
        data: {
          ...data,
          isPublished: true,
          publishedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      reply.code(201).send({
        success: true,
        message: 'Video created successfully',
        data: video,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(400).send({
        success: false,
        message: 'Failed to create video',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 視聴履歴の更新
  async updateViewingHistory(request: FastifyRequest<{ 
    Params: { id: string },
    Body: { watchedDuration: number }
  }>, reply: FastifyReply) {
    try {
      const { id: videoId } = request.params;
      const { watchedDuration } = request.body;
      const userId = request.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'User not found',
        });
      }

      // 無料会員の場合、5分（300秒）で制限
      const maxDuration = user.membershipType === 'FREE' ? 300 : watchedDuration;
      const effectiveDuration = Math.min(watchedDuration, maxDuration);

      const viewingHistory = await prisma.viewingHistory.upsert({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
        update: {
          watchedDuration: effectiveDuration,
          lastWatchedAt: new Date(),
          totalWatchTime: {
            increment: effectiveDuration,
          },
        },
        create: {
          userId,
          videoId,
          watchedDuration: effectiveDuration,
          totalWatchTime: effectiveDuration,
        },
      });

      reply.send({
        success: true,
        data: viewingHistory,
        isLimited: user.membershipType === 'FREE' && watchedDuration > 300,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        success: false,
        message: 'Failed to update viewing history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // お気に入り追加/削除
  async toggleFavorite(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id: videoId } = request.params;
      const userId = request.user!.userId;

      const existing = await prisma.favorite.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: {
            userId_videoId: {
              userId,
              videoId,
            },
          },
        });

        reply.send({
          success: true,
          message: 'Removed from favorites',
          data: { isFavorite: false },
        });
      } else {
        await prisma.favorite.create({
          data: {
            userId,
            videoId,
          },
        });

        reply.send({
          success: true,
          message: 'Added to favorites',
          data: { isFavorite: true },
        });
      }
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        success: false,
        message: 'Failed to toggle favorite',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}