import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { StreamStatus } from '@prisma/client';
import crypto from 'crypto';

// ライブ配信一覧取得
export const getLiveStreams = async (
  request: FastifyRequest<{
    Querystring: {
      status?: StreamStatus;
      categoryId?: string;
      page?: number;
      limit?: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { status, categoryId, page = 1, limit = 12 } = request.query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    // プライベート配信は除外（ホスト以外）
    where.OR = [
      { isPrivate: false },
      { hostId: request.user?.id || '' },
    ];

    const [streams, total] = await Promise.all([
      prisma.liveStream.findMany({
        where,
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              profileImage: true,
            },
          },
          category: true,
          _count: {
            select: {
              viewers: true,
            },
          },
        },
        orderBy: [\n          { status: 'asc' }, // LIVE -> SCHEDULED -> ENDED\n          { scheduledAt: 'asc' },\n          { createdAt: 'desc' },\n        ],
      }),
      prisma.liveStream.count({ where }),
    ]);

    return reply.send({
      data: streams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ライブ配信一覧の取得に失敗しました' });
  }
};

// ライブ配信詳細取得
export const getLiveStream = async (
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
        category: true,
        viewers: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!stream) {
      return reply.code(404).send({ error: 'ライブ配信が見つかりません' });
    }

    // プライベート配信のアクセス制御
    if (stream.isPrivate && request.user?.id !== stream.hostId) {
      return reply.code(403).send({ error: 'プライベート配信にはアクセスできません' });
    }

    return reply.send(stream);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ライブ配信の取得に失敗しました' });
  }
};

// ライブ配信作成
export const createLiveStream = async (
  request: FastifyRequest<{
    Body: {
      title: string;
      description?: string;
      categoryId?: string;
      scheduledAt?: string;
      tags?: string[];
      isPrivate?: boolean;
      chatEnabled?: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {\n      title,\n      description,\n      categoryId,\n      scheduledAt,\n      tags,\n      isPrivate,\n      chatEnabled,\n    } = request.body;\n    const hostId = request.user!.id;\n\n    // ストリームキー生成\n    const streamKey = crypto.randomUUID();\n\n    const stream = await prisma.liveStream.create({\n      data: {\n        title,\n        description,\n        streamKey,\n        hostId,\n        categoryId,\n        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,\n        tags: tags || [],\n        isPrivate: isPrivate || false,\n        chatEnabled: chatEnabled !== false,\n        status: scheduledAt ? 'SCHEDULED' : 'LIVE',\n      },\n      include: {\n        host: {\n          select: {\n            id: true,\n            firstName: true,\n            lastName: true,\n            username: true,\n            profileImage: true,\n          },\n        },\n        category: true,\n      },\n    });\n\n    return reply.send(stream);\n  } catch (error) {\n    request.log.error(error);\n    return reply.code(500).send({ error: 'ライブ配信の作成に失敗しました' });\n  }\n};\n\n// ライブ配信更新\nexport const updateLiveStream = async (\n  request: FastifyRequest<{\n    Params: { id: string };\n    Body: {\n      title?: string;\n      description?: string;\n      categoryId?: string;\n      scheduledAt?: string;\n      tags?: string[];\n      isPrivate?: boolean;\n      chatEnabled?: boolean;\n      status?: StreamStatus;\n    };\n  }>,\n  reply: FastifyReply\n) => {\n  try {\n    const { id } = request.params;\n    const updateData = request.body;\n    const userId = request.user!.id;\n\n    // 配信の存在確認と権限チェック\n    const existingStream = await prisma.liveStream.findUnique({\n      where: { id },\n    });\n\n    if (!existingStream) {\n      return reply.code(404).send({ error: 'ライブ配信が見つかりません' });\n    }\n\n    if (existingStream.hostId !== userId && request.user?.email !== 'greenroom51@gmail.com') {\n      return reply.code(403).send({ error: '編集権限がありません' });\n    }\n\n    // ステータス変更時の処理\n    if (updateData.status) {\n      if (updateData.status === 'LIVE' && existingStream.status !== 'LIVE') {\n        (updateData as any).startedAt = new Date();\n      } else if (updateData.status === 'ENDED' && existingStream.status === 'LIVE') {\n        (updateData as any).endedAt = new Date();\n      }\n    }\n\n    if (updateData.scheduledAt) {\n      (updateData as any).scheduledAt = new Date(updateData.scheduledAt);\n    }\n\n    const stream = await prisma.liveStream.update({\n      where: { id },\n      data: updateData,\n      include: {\n        host: {\n          select: {\n            id: true,\n            firstName: true,\n            lastName: true,\n            username: true,\n            profileImage: true,\n          },\n        },\n        category: true,\n      },\n    });\n\n    return reply.send(stream);\n  } catch (error) {\n    request.log.error(error);\n    return reply.code(500).send({ error: 'ライブ配信の更新に失敗しました' });\n  }\n};\n\n// ライブ配信削除\nexport const deleteLiveStream = async (\n  request: FastifyRequest<{\n    Params: { id: string };\n  }>,\n  reply: FastifyReply\n) => {\n  try {\n    const { id } = request.params;\n    const userId = request.user!.id;\n\n    const stream = await prisma.liveStream.findUnique({\n      where: { id },\n    });\n\n    if (!stream) {\n      return reply.code(404).send({ error: 'ライブ配信が見つかりません' });\n    }\n\n    if (stream.hostId !== userId && request.user?.email !== 'greenroom51@gmail.com') {\n      return reply.code(403).send({ error: '削除権限がありません' });\n    }\n\n    await prisma.liveStream.delete({\n      where: { id },\n    });\n\n    return reply.send({ message: 'ライブ配信を削除しました' });\n  } catch (error) {\n    request.log.error(error);\n    return reply.code(500).send({ error: 'ライブ配信の削除に失敗しました' });\n  }\n};\n\n// ライブ配信参加\nexport const joinLiveStream = async (\n  request: FastifyRequest<{\n    Params: { id: string };\n  }>,\n  reply: FastifyReply\n) => {\n  try {\n    const { id } = request.params;\n    const userId = request.user!.id;\n\n    // 配信の存在確認\n    const stream = await prisma.liveStream.findUnique({\n      where: { id },\n    });\n\n    if (!stream) {\n      return reply.code(404).send({ error: 'ライブ配信が見つかりません' });\n    }\n\n    if (stream.status !== 'LIVE') {\n      return reply.code(400).send({ error: 'この配信は現在ライブではありません' });\n    }\n\n    // 既に参加している場合は何もしない\n    const existingViewer = await prisma.streamViewer.findUnique({\n      where: {\n        userId_streamId: {\n          userId,\n          streamId: id,\n        },\n      },\n    });\n\n    if (!existingViewer || existingViewer.leftAt) {\n      // 新規参加または再参加\n      await prisma.streamViewer.upsert({\n        where: {\n          userId_streamId: {\n            userId,\n            streamId: id,\n          },\n        },\n        update: {\n          leftAt: null,\n          joinedAt: new Date(),\n        },\n        create: {\n          userId,\n          streamId: id,\n        },\n      });\n\n      // 現在の視聴者数更新\n      const currentViewers = await prisma.streamViewer.count({\n        where: {\n          streamId: id,\n          leftAt: null,\n        },\n      });\n\n      await prisma.liveStream.update({\n        where: { id },\n        data: {\n          currentViewers,\n          maxViewers: {\n            set: Math.max(stream.maxViewers, currentViewers),\n          },\n        },\n      });\n    }\n\n    return reply.send({ message: '配信に参加しました' });\n  } catch (error) {\n    request.log.error(error);\n    return reply.code(500).send({ error: '配信への参加に失敗しました' });\n  }\n};\n\n// ライブ配信退出\nexport const leaveLiveStream = async (\n  request: FastifyRequest<{\n    Params: { id: string };\n  }>,\n  reply: FastifyReply\n) => {\n  try {\n    const { id } = request.params;\n    const userId = request.user!.id;\n\n    // 視聴者レコード更新\n    await prisma.streamViewer.updateMany({\n      where: {\n        userId,\n        streamId: id,\n        leftAt: null,\n      },\n      data: {\n        leftAt: new Date(),\n      },\n    });\n\n    // 現在の視聴者数更新\n    const currentViewers = await prisma.streamViewer.count({\n      where: {\n        streamId: id,\n        leftAt: null,\n      },\n    });\n\n    await prisma.liveStream.update({\n      where: { id },\n      data: { currentViewers },\n    });\n\n    return reply.send({ message: '配信から退出しました' });\n  } catch (error) {\n    request.log.error(error);\n    return reply.code(500).send({ error: '配信からの退出に失敗しました' });\n  }\n};\n\n// チャットメッセージ送信\nexport const sendChatMessage = async (\n  request: FastifyRequest<{\n    Params: { id: string };\n    Body: {\n      content: string;\n    };\n  }>,\n  reply: FastifyReply\n) => {\n  try {\n    const { id } = request.params;\n    const { content } = request.body;\n    const userId = request.user!.id;\n\n    // 配信の存在確認とチャット有効化チェック\n    const stream = await prisma.liveStream.findUnique({\n      where: { id },\n    });\n\n    if (!stream) {\n      return reply.code(404).send({ error: 'ライブ配信が見つかりません' });\n    }\n\n    if (!stream.chatEnabled) {\n      return reply.code(403).send({ error: 'この配信ではチャットが無効になっています' });\n    }\n\n    if (stream.status !== 'LIVE') {\n      return reply.code(400).send({ error: 'ライブ配信中のみチャットできます' });\n    }\n\n    // チャットメッセージ作成\n    const message = await prisma.streamChatMessage.create({\n      data: {\n        content,\n        userId,\n        streamId: id,\n      },\n      include: {\n        user: {\n          select: {\n            id: true,\n            firstName: true,\n            lastName: true,\n            username: true,\n            profileImage: true,\n          },\n        },\n      },\n    });\n\n    return reply.send(message);\n  } catch (error) {\n    request.log.error(error);\n    return reply.code(500).send({ error: 'チャットメッセージの送信に失敗しました' });\n  }\n};\n\n// チャット履歴取得\nexport const getChatMessages = async (\n  request: FastifyRequest<{\n    Params: { id: string };\n    Querystring: {\n      limit?: number;\n      before?: string;\n    };\n  }>,\n  reply: FastifyReply\n) => {\n  try {\n    const { id } = request.params;\n    const { limit = 50, before } = request.query;\n\n    const where: any = { streamId: id };\n    if (before) {\n      where.createdAt = { lt: new Date(before) };\n    }\n\n    const messages = await prisma.streamChatMessage.findMany({\n      where,\n      take: limit,\n      orderBy: { createdAt: 'desc' },\n      include: {\n        user: {\n          select: {\n            id: true,\n            firstName: true,\n            lastName: true,\n            username: true,\n            profileImage: true,\n          },\n        },\n      },\n    });\n\n    return reply.send(messages.reverse());\n  } catch (error) {\n    request.log.error(error);\n    return reply.code(500).send({ error: 'チャット履歴の取得に失敗しました' });\n  }\n};"}