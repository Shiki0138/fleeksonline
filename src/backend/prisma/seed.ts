import { PrismaClient, MembershipType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 FLEEKS - データベースシード開始...');

  // カテゴリー作成
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'プログラミング',
        slug: 'programming',
        description: 'プログラミング・開発に関する動画',
        displayOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'デザイン',
        slug: 'design',
        description: 'UI/UX・グラフィックデザインに関する動画',
        displayOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'ビジネス',
        slug: 'business',
        description: 'ビジネス・起業に関する動画',
        displayOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'マーケティング',
        slug: 'marketing',
        description: 'マーケティング・SEOに関する動画',
        displayOrder: 4,
      },
    }),
  ]);

  console.log(`✅ ${categories.length}個のカテゴリーを作成しました`);

  // ユーザー作成
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'greenroom51@gmail.com',
        username: 'greenroom51',
        password: hashedPassword,
        firstName: '管理者',
        lastName: 'FLEEKS',
        membershipType: MembershipType.PREMIUM,
        membershipExpiry: new Date('2025-12-31'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'premium@fleeks.jp',
        username: 'premium_user',
        password: hashedPassword,
        firstName: '田中',
        lastName: '太郎',
        membershipType: MembershipType.PREMIUM,
        membershipExpiry: new Date('2025-06-30'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'free@fleeks.jp',
        username: 'free_user',
        password: hashedPassword,
        firstName: '鈴木',
        lastName: '花子',
        membershipType: MembershipType.FREE,
      },
    }),
  ]);

  console.log(`✅ ${users.length}人のユーザーを作成しました`);
  console.log('  - admin@fleeks.jp (有料会員)');
  console.log('  - premium@fleeks.jp (有料会員)');
  console.log('  - free@fleeks.jp (無料会員)');
  console.log('  パスワード: password123');

  // サンプル動画作成
  const videos = await Promise.all([
    // プログラミングカテゴリー
    prisma.video.create({
      data: {
        youtubeVideoId: 'dQw4w9WgXcQ',
        title: 'React 18の新機能完全ガイド',
        description: 'React 18で追加された新機能について、実例を交えながら詳しく解説します。Concurrent Features、Suspense、Server Componentsなど。',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: 1800, // 30分
        categoryId: categories[0].id,
        tags: ['React', 'JavaScript', 'フロントエンド'],
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
    }),
    prisma.video.create({
      data: {
        youtubeVideoId: 'abc123xyz',
        title: 'TypeScript入門 - 型安全なコーディング',
        description: 'TypeScriptの基本から応用まで、型システムを活用した安全なコーディング手法を学びます。',
        thumbnailUrl: 'https://img.youtube.com/vi/abc123xyz/maxresdefault.jpg',
        duration: 2400, // 40分
        categoryId: categories[0].id,
        tags: ['TypeScript', 'JavaScript', '型システム'],
        isPublished: true,
        publishedAt: new Date('2024-02-20'),
      },
    }),

    // デザインカテゴリー
    prisma.video.create({
      data: {
        youtubeVideoId: 'def456uvw',
        title: 'Figmaで作るモダンUIデザイン',
        description: 'Figmaを使って、モダンで美しいUIデザインを作成する方法を解説します。コンポーネント設計からプロトタイピングまで。',
        thumbnailUrl: 'https://img.youtube.com/vi/def456uvw/maxresdefault.jpg',
        duration: 1500, // 25分
        categoryId: categories[1].id,
        tags: ['Figma', 'UI/UX', 'デザイン'],
        isPublished: true,
        publishedAt: new Date('2024-03-10'),
      },
    }),

    // ビジネスカテゴリー
    prisma.video.create({
      data: {
        youtubeVideoId: 'ghi789rst',
        title: 'スタートアップの資金調達戦略',
        description: 'スタートアップが成功するための資金調達戦略について、実例を交えて解説します。',
        thumbnailUrl: 'https://img.youtube.com/vi/ghi789rst/maxresdefault.jpg',
        duration: 2100, // 35分
        categoryId: categories[2].id,
        tags: ['スタートアップ', '資金調達', 'ビジネス'],
        isPublished: true,
        publishedAt: new Date('2024-04-05'),
      },
    }),

    // マーケティングカテゴリー
    prisma.video.create({
      data: {
        youtubeVideoId: 'jkl012mno',
        title: 'SNSマーケティング最新トレンド2024',
        description: '2024年のSNSマーケティング最新トレンドと、効果的な戦略について解説します。',
        thumbnailUrl: 'https://img.youtube.com/vi/jkl012mno/maxresdefault.jpg',
        duration: 1200, // 20分
        categoryId: categories[3].id,
        tags: ['SNS', 'マーケティング', 'トレンド'],
        isPublished: true,
        publishedAt: new Date('2024-05-01'),
      },
    }),
  ]);

  console.log(`✅ ${videos.length}本の動画を作成しました`);

  // サブスクリプション作成（有料会員用）
  await prisma.subscription.create({
    data: {
      userId: users[1].id, // premium_user
      planType: 'MONTHLY',
      amount: 980,
      status: 'ACTIVE',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-06-30'),
    },
  });

  console.log('✅ サブスクリプションデータを作成しました');

  console.log('\n🎉 FLEEKS - データベースシード完了！');
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });