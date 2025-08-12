import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import slugify from 'slugify';

// ブログ記事一覧取得
export const getBlogPosts = async (
  request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      categoryId?: string;
      tag?: string;
      search?: string;
      published?: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { page = 1, limit = 12, categoryId, tag, search, published = true } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: published };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
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
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: published ? { publishedAt: 'desc' } : { createdAt: 'desc' },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return reply.send({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ブログ記事の取得に失敗しました' });
  }
};

// ブログ記事詳細取得
export const getBlogPost = async (
  request: FastifyRequest<{
    Params: { slug: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { slug } = request.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
        category: true,
        comments: {
          where: { isApproved: true, parentId: null },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                profileImage: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profileImage: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return reply.code(404).send({ error: 'ブログ記事が見つかりません' });
    }

    if (!post.isPublished && request.user?.id !== post.authorId) {
      return reply.code(403).send({ error: 'このブログ記事にはアクセスできません' });
    }

    // 閲覧数更新
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return reply.send(post);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ブログ記事の取得に失敗しました' });
  }
};

// ブログ記事作成
export const createBlogPost = async (
  request: FastifyRequest<{
    Body: {
      title: string;
      content: string;
      excerpt?: string;
      coverImage?: string;
      categoryId?: string;
      tags?: string[];
      isPublished?: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { title, content, excerpt, coverImage, categoryId, tags, isPublished } = request.body;
    const authorId = request.user!.id;

    // スラッグ生成
    let slug = slugify(title, { lower: true, strict: true });
    
    // スラッグの重複チェック
    let counter = 1;
    let uniqueSlug = slug;
    while (await prisma.blogPost.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        excerpt,
        coverImage,
        authorId,
        categoryId,
        tags: tags || [],
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
        category: true,
      },
    });

    return reply.send(post);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ブログ記事の作成に失敗しました' });
  }
};

// ブログ記事更新
export const updateBlogPost = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      title?: string;
      content?: string;
      excerpt?: string;
      coverImage?: string;
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
    const userId = request.user!.id;

    // 記事の存在確認と権限チェック
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return reply.code(404).send({ error: 'ブログ記事が見つかりません' });
    }

    if (existingPost.authorId !== userId && request.user?.email !== 'greenroom51@gmail.com') {
      return reply.code(403).send({ error: '編集権限がありません' });
    }

    // タイトルが変更された場合はスラッグも更新
    if (updateData.title && updateData.title !== existingPost.title) {
      let newSlug = slugify(updateData.title, { lower: true, strict: true });
      
      // 新しいスラッグの重複チェック（現在の記事以外で）
      let counter = 1;
      let uniqueSlug = newSlug;
      while (await prisma.blogPost.findFirst({ 
        where: { slug: uniqueSlug, id: { not: id } } 
      })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      
      (updateData as any).slug = uniqueSlug;
    }

    // 公開状態が変更された場合
    if (updateData.isPublished && !existingPost.isPublished) {
      (updateData as any).publishedAt = new Date();
    } else if (updateData.isPublished === false && existingPost.isPublished) {
      (updateData as any).publishedAt = null;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
        category: true,
      },
    });

    return reply.send(post);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ブログ記事の更新に失敗しました' });
  }
};

// ブログ記事削除
export const deleteBlogPost = async (
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const userId = request.user!.id;

    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return reply.code(404).send({ error: 'ブログ記事が見つかりません' });
    }

    if (post.authorId !== userId && request.user?.email !== 'greenroom51@gmail.com') {
      return reply.code(403).send({ error: '削除権限がありません' });
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    return reply.send({ message: 'ブログ記事を削除しました' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ブログ記事の削除に失敗しました' });
  }
};

// ブログカテゴリー一覧取得
export const getBlogCategories = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            posts: { where: { isPublished: true } },
          },
        },
      },
    });

    return reply.send(categories);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'ブログカテゴリーの取得に失敗しました' });
  }
};

// ブログ記事にいいね
export const toggleBlogLike = async (
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const userId = request.user!.id;

    const existingLike = await prisma.blogLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    });

    if (existingLike) {
      // いいねを削除
      await prisma.blogLike.delete({
        where: { id: existingLike.id },
      });
      return reply.send({ liked: false, message: 'いいねを取り消しました' });
    } else {
      // いいねを追加
      await prisma.blogLike.create({
        data: {
          userId,
          postId: id,
        },
      });
      return reply.send({ liked: true, message: 'いいねしました' });
    }
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'いいねの処理に失敗しました' });
  }
};

// コメント投稿
export const createBlogComment = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      content: string;
      parentId?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id: postId } = request.params;
    const { content, parentId } = request.body;
    const authorId = request.user!.id;

    const comment = await prisma.blogComment.create({
      data: {
        content,
        authorId,
        postId,
        parentId,
        isApproved: true, // 自動承認（必要に応じて変更）
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    return reply.send(comment);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'コメントの投稿に失敗しました' });
  }
};