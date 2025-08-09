# データベースマイグレーション実行ガイド

## 実行が必要なマイグレーション

### 1. Supabaseダッシュボードで実行

1. https://supabase.com/dashboard にログイン
2. プロジェクトを選択
3. 左メニューの「SQL Editor」をクリック
4. 以下のSQLを実行

```sql
-- 既存のblog_postsテーブルに有料コンテンツ管理用のカラムを追加
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preview_content TEXT,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 記事カテゴリの追加
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- カテゴリのチェック制約（既に存在する場合はスキップ）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'blog_posts_category_check'
    ) THEN
        ALTER TABLE blog_posts 
        ADD CONSTRAINT blog_posts_category_check 
        CHECK (category IN ('beginner', 'management', 'dx', 'general'));
    END IF;
END $$;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_premium ON blog_posts(is_premium);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- 確認クエリ
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'blog_posts'
ORDER BY ordinal_position;
```

### 2. 実行後の確認

成功したら以下のカラムが表示されます：
- `is_premium` (boolean)
- `preview_content` (text)
- `reading_time` (integer)
- `view_count` (integer)
- `category` (varchar)

### 3. その他のテーブル作成（オプション）

読書進捗とプッシュ通知のテーブルも作成する場合：

```sql
-- UUIDエクステンションを有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 閲覧履歴テーブルの作成
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);

-- プッシュ通知設定テーブル
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, endpoint)
);

-- 通知履歴テーブル
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

-- RLSポリシーの設定
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
```

## PWAアイコンの確認

PWAアイコンも保存されたとのことなので、以下を確認：

1. `/public/` フォルダに以下のPNGファイルが存在することを確認：
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

2. manifest.jsonの更新が必要な場合：
   ```bash
   # .svgを.pngに変更
   sed -i '' 's/\.svg/\.png/g' public/manifest.json
   sed -i '' 's/image\/svg+xml/image\/png/g' public/manifest.json
   ```

## マイグレーション完了後

1. PM2でスケジューラーを再起動：
   ```bash
   pm2 restart content-scheduler
   ```

2. ログを確認：
   ```bash
   pm2 logs content-scheduler
   ```

3. 手動でテスト投稿：
   ```bash
   pm2 stop content-scheduler
   node scripts/content-scheduler.js post
   pm2 start content-scheduler
   ```