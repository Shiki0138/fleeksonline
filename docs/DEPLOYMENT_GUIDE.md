# FLEEKS Platform デプロイメントガイド

## 🚀 クイックデプロイ（Vercel）

### 1. 前提条件
- Vercelアカウント
- Supabaseプロジェクト
- GitHub/GitLab/Bitbucketアカウント

### 2. Supabaseセットアップ

1. [Supabase](https://app.supabase.com)で新規プロジェクト作成
2. SQLエディタで以下を実行：

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  membership_type TEXT DEFAULT 'FREE',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 動画テーブル
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  category_id TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 視聴履歴
CREATE TABLE viewing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  video_id UUID REFERENCES videos(id),
  watched_duration INTEGER,
  total_watch_time INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- お気に入り
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  video_id UUID REFERENCES videos(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- ブログ
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  tags TEXT[],
  author_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ライブストリーム
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  streamer_id UUID REFERENCES users(id),
  stream_key TEXT UNIQUE,
  rtmp_url TEXT,
  status TEXT DEFAULT 'scheduled',
  requires_premium BOOLEAN DEFAULT false,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. 環境変数をメモ：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### 3. Vercelデプロイ

#### オプション1: Vercel UIを使用

1. [Vercel](https://vercel.com)にログイン
2. "New Project"をクリック
3. GitHubリポジトリを接続
4. 環境変数を設定：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_APP_NAME=FLEEKS Platform
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
5. "Deploy"をクリック

#### オプション2: Vercel CLIを使用

```bash
# Vercel CLIインストール
npm i -g vercel

# プロジェクトディレクトリで実行
cd fleeks-ai-platform
vercel

# 環境変数を設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_APP_NAME
vercel env add NEXT_PUBLIC_APP_URL

# 本番環境にデプロイ
vercel --prod
```

### 4. カスタムドメイン設定（オプション）

1. Vercelダッシュボードで"Settings" → "Domains"
2. カスタムドメインを追加
3. DNSレコードを設定

### 5. 本番環境チェックリスト

- [ ] 環境変数が正しく設定されている
- [ ] Supabaseの認証設定が完了
- [ ] リダイレクトURLが設定されている
- [ ] CORS設定が適切
- [ ] SSL証明書が有効

## 🔧 トラブルシューティング

### ビルドエラー
```bash
# 依存関係をクリーンインストール
rm -rf node_modules package-lock.json
npm install
```

### 環境変数が読み込まれない
- Vercelダッシュボードで再度確認
- 変数名のプレフィックス`NEXT_PUBLIC_`を確認

### Supabase接続エラー
- URLとAPIキーを再確認
- Supabaseダッシュボードでプロジェクトステータス確認

## 📞 サポート

問題が解決しない場合は、以下をご確認ください：
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)