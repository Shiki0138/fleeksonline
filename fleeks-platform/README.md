# 🌟 FLEEKS Platform

美容業界プロフェッショナル向けAI搭載学習プラットフォーム

## 🚀 プロジェクト概要

FLEEKSは、美容業界のプロフェッショナルを目指す方々に向けた、AI技術を活用した次世代学習プラットフォームです。個別最適化された学習体験を提供し、効率的なスキル習得をサポートします。

## 🛠 技術スタック

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase
- **Authentication**: NextAuth.js + Supabase Auth
- **Payment**: Square API
- **Deployment**: Vercel

## 📁 プロジェクト構造

```
fleeks-platform/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable components
│   ├── lib/          # Utility libraries
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Helper functions
│   └── types/        # TypeScript types
├── public/           # Static assets
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── tests/            # Test files
```

## 🔧 セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.local`ファイルを作成し、以下の環境変数を設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# その他
ENCRYPTION_KEY=your_encryption_key
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

## 🚀 デプロイ

### Vercelへのデプロイ
```bash
npx vercel --prod
```

### カスタムドメイン設定
1. Vercelダッシュボードでドメインを追加
2. DNSレコードを設定（CNAME: app → cname.vercel-dns.com）

## 📝 主な機能

- **AI学習アシスタント**: 個別最適化された学習プラン
- **動画学習**: プロの技術を動画で学習
- **進捗管理**: 学習進度をリアルタイムで分析
- **メンバーシップ**: 無料/有料プランの管理
- **決済機能**: Square APIによる安全な決済

## 🔐 セキュリティ

- 環境変数による機密情報の管理
- Supabase Row Level Securityによるデータ保護
- HTTPS強制とセキュアなセッション管理

## 📄 ライセンス

Proprietary - All rights reserved

## 🤝 貢献

現在、このプロジェクトは限定的な貢献者のみ受け付けています。

## 📞 お問い合わせ

質問や提案がある場合は、イシューを作成してください。