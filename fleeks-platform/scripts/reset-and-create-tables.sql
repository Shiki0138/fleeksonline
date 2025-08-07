-- FLEEKSプラットフォーム データベースリセット＆作成
-- 既存のテーブルを削除してから新規作成します

-- ========================================
-- 既存のテーブルとトリガーを削除（順序重要）
-- ========================================

-- トリガーの削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;

-- 関数の削除
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- テーブルの削除（依存関係の順序で削除）
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS watch_history CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================
-- テーブルの新規作成
-- ========================================

-- 1. ユーザープロファイルテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'premium')),
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 動画情報テーブル
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 視聴履歴テーブル
CREATE TABLE watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- 4. お気に入りテーブル
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- ========================================
-- インデックスの作成
-- ========================================
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_watch_history_user_video ON watch_history(user_id, video_id);
CREATE INDEX idx_favorites_user_video ON favorites(user_id, video_id);

-- ========================================
-- Row Level Security (RLS) の有効化
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLSポリシーの作成
-- ========================================

-- プロファイル
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 動画
CREATE POLICY "Videos are viewable by everyone" ON videos
  FOR SELECT USING (true);

-- 視聴履歴
CREATE POLICY "Users can view own watch history" ON watch_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history" ON watch_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history" ON watch_history
  FOR UPDATE USING (auth.uid() = user_id);

-- お気に入り
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 関数とトリガーの作成
-- ========================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ユーザー作成時の自動プロファイル作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- サンプルデータ（オプション）
-- ========================================
INSERT INTO videos (youtube_id, title, description, duration, thumbnail_url, is_premium, category, tags)
VALUES 
  ('abc123', 'ヘアカット基礎講座 Vol.1', '美容師必見！基本的なヘアカット技術を学びます', 360, 'https://img.youtube.com/vi/abc123/maxresdefault.jpg', false, 'ヘアカット', ARRAY['基礎', 'ヘアカット', '初心者']),
  ('def456', 'カラーリング応用テクニック', 'プロのカラーリング技術を詳しく解説', 480, 'https://img.youtube.com/vi/def456/maxresdefault.jpg', true, 'カラーリング', ARRAY['カラー', '応用', 'プロ向け']),
  ('ghi789', 'パーマ技術マスター講座', '最新のパーマ技術を完全マスター', 600, 'https://img.youtube.com/vi/ghi789/maxresdefault.jpg', true, 'パーマ', ARRAY['パーマ', 'マスター', '最新技術'])
ON CONFLICT (youtube_id) DO NOTHING;

-- ========================================
-- 完了確認
-- ========================================
SELECT 
  'テーブル作成完了' as status,
  COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'videos', 'watch_history', 'favorites');