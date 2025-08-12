import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { MembershipType } from '@prisma/client';

// 管理者チェックミドルウェア
export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  if (!user || user.email !== 'greenroom51@gmail.com') {
    return reply.code(403).send({ error: '管理者権限が必要です' });
  }
};

// 動画追加（YouTube URLから自動取得）
export const addVideoFromUrl = async (
  request: FastifyRequest<{
    Body: {
      youtubeUrl: string;
      categoryId: string;
      customTitle?: string;
      customDescription?: string;
      tags?: string[];
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { youtubeUrl, categoryId, customTitle, customDescription, tags } = request.body;
    const { extractVideoId, getVideoInfo } = await import('../utils/youtubeApi');

    // YouTube URLから動画IDを抽出
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return reply.code(400).send({ error: '有効なYouTube URLではありません' });
    }

    // 既存の動画チェック
    const existingVideo = await prisma.video.findUnique({
      where: { youtubeVideoId: videoId },
    });

    if (existingVideo) {
      return reply.code(400).send({ error: 'この動画は既に登録されています' });
    }

    // YouTube APIから動画情報を取得
    const videoInfo = await getVideoInfo(videoId);

    const video = await prisma.video.create({
      data: {
        youtubeVideoId: videoId,
        title: customTitle || videoInfo.title,
        description: customDescription || videoInfo.description,
        thumbnailUrl: videoInfo.thumbnailUrl,
        duration: videoInfo.duration,
        categoryId,
        tags: tags || videoInfo.tags.slice(0, 10), // 最大10個のタグ
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    return reply.send(video);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: '動画の追加に失敗しました' });
  }
};

// 手動動画追加（従来の方法）
export const addVideo = async (
  request: FastifyRequest<{
    Body: {
      youtubeVideoId: string;
      title: string;
      description?: string;
      thumbnailUrl: string;
      duration: number;
      categoryId: string;
      tags?: string[];
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { youtubeVideoId, title, description, thumbnailUrl, duration, categoryId, tags } = request.body;

    // 既存の動画チェック
    const existingVideo = await prisma.video.findUnique({
      where: { youtubeVideoId },
    });

    if (existingVideo) {
      return reply.code(400).send({ error: 'この動画は既に登録されています' });
    }

    const video = await prisma.video.create({
      data: {
        youtubeVideoId,
        title,
        description,
        thumbnailUrl,
        duration,
        categoryId,
        tags: tags || [],
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    return reply.send(video);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: '動画の追加に失敗しました' });
  }
};

// 動画更新
export const updateVideo = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
      duration?: number;
      categoryId?: string;
      tags?: string[];
      isPublished?: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return reply.send(video);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: '動画の更新に失敗しました' });
  }
};

// 動画削除
export const deleteVideo = async (
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    await prisma.video.delete({
      where: { id },
    });

    return reply.send({ message: '動画を削除しました' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: '動画の削除に失敗しました' });
  }
};

// カテゴリー追加
export const addCategory = async (
  request: FastifyRequest<{
    Body: {
      name: string;
      slug: string;
      description?: string;
      displayOrder?: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { name, slug, description, displayOrder } = request.body;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        displayOrder: displayOrder || 999,
      },
    });

    return reply.send(category);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'カテゴリーの追加に失敗しました' });
  }
};

// ユーザー一覧取得
export const getUsers = async (
  request: FastifyRequest<{
    Querystring: {
      membershipType?: MembershipType;
      page?: number;
      limit?: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { membershipType, page = 1, limit = 20 } = request.query;
    const skip = (page - 1) * limit;

    const where = membershipType ? { membershipType } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          membershipType: true,
          membershipExpiry: true,
          createdAt: true,
          _count: {
            select: {
              viewingHistory: true,
              favorites: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ユーザー一覧の取得に失敗しました' });
  }
};

// ユーザーの会員タイプ更新
export const updateUserMembership = async (
  request: FastifyRequest<{
    Params: { userId: string };
    Body: {
      membershipType: MembershipType;
      membershipExpiry?: Date;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { userId } = request.params;
    const { membershipType, membershipExpiry } = request.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        membershipType,
        membershipExpiry,
      },
    });

    return reply.send(user);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ユーザー情報の更新に失敗しました' });
  }
};

// 統計情報取得
export const getStats = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const [
      totalUsers,
      premiumUsers,
      totalVideos,
      totalViews,
      totalCategories,
      recentUsers,
      popularVideos,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { membershipType: 'PREMIUM' } }),
      prisma.video.count({ where: { isPublished: true } }),
      prisma.viewingHistory.count(),
      prisma.category.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          membershipType: true,
          createdAt: true,
        },
      }),
      prisma.video.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          viewCount: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    return reply.send({
      overview: {
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        totalVideos,
        totalViews,
        totalCategories,
      },
      recentUsers,
      popularVideos,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: '統計情報の取得に失敗しました' });
  }
};