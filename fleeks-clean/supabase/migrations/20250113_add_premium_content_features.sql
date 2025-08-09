-- 既存のblog_postsテーブルに有料コンテンツ管理用のカラムを追加
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preview_content TEXT,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 記事カテゴリの追加
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- カテゴリのチェック制約
ALTER TABLE blog_posts 
ADD CONSTRAINT blog_posts_category_check 
CHECK (category IN ('beginner', 'management', 'dx', 'general'));

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_premium ON blog_posts(is_premium);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

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

-- 閲覧履歴の更新トリガー
CREATE OR REPLACE FUNCTION update_reading_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.last_read_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reading_progress_updated_at
  BEFORE UPDATE ON reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_progress_updated_at();

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

-- reading_progressのポリシー
CREATE POLICY "Users can view own reading progress" ON reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress" ON reading_progress
  FOR ALL USING (auth.uid() = user_id);

-- push_subscriptionsのポリシー
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- notification_historyのポリシー
CREATE POLICY "Users can view own notifications" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

-- サンプルデータの挿入（オプション）
COMMENT ON TABLE reading_progress IS '学習進捗管理テーブル';
COMMENT ON TABLE push_subscriptions IS 'プッシュ通知購読情報';
COMMENT ON TABLE notification_history IS '通知履歴';