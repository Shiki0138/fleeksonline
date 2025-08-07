-- FLEEKS Platform - 完全分離型データベースマイグレーション
-- 既存のテーブルには一切触れず、FLEEKS専用テーブルのみを作成
-- Execute this in Supabase SQL Editor

BEGIN;

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================
-- FLEEKS専用テーブルの作成
-- Prefix: fleeks_ を使用して名前空間を分離
-- ===================================

-- 1. FLEEKSプロファイルテーブル（既存のbeauty_usersを参照）
CREATE TABLE IF NOT EXISTS fleeks_profiles (
  id UUID REFERENCES beauty_users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'premium', 'vip')),
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FLEEKS動画テーブル
CREATE TABLE IF NOT EXISTS fleeks_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. FLEEKSブログ投稿テーブル
CREATE TABLE IF NOT EXISTS fleeks_blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_type TEXT,
  source_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  author_id TEXT DEFAULT 'system',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- 4. FLEEKSブログ生成ログテーブル
CREATE TABLE IF NOT EXISTS fleeks_blog_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES fleeks_blog_posts(id) ON DELETE CASCADE,
  source_content TEXT,
  prompt TEXT,
  ai_model TEXT,
  generation_params JSONB,
  generated_content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. FLEEKS視聴履歴テーブル
CREATE TABLE IF NOT EXISTS fleeks_watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES fleeks_profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES fleeks_videos(id) ON DELETE CASCADE NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- FLEEKS専用テーブルのRLS有効化
-- ===================================

ALTER TABLE fleeks_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleeks_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleeks_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleeks_blog_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleeks_watch_history ENABLE ROW LEVEL SECURITY;

-- ===================================
-- パフォーマンス用インデックス
-- ===================================

CREATE INDEX IF NOT EXISTS idx_fleeks_profiles_role ON fleeks_profiles(role);
CREATE INDEX IF NOT EXISTS idx_fleeks_profiles_membership ON fleeks_profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_fleeks_videos_published_at ON fleeks_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleeks_videos_category ON fleeks_videos(category);
CREATE INDEX IF NOT EXISTS idx_fleeks_videos_premium ON fleeks_videos(is_premium);
CREATE INDEX IF NOT EXISTS idx_fleeks_videos_youtube_id ON fleeks_videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_fleeks_blog_posts_slug ON fleeks_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_fleeks_blog_posts_status ON fleeks_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_fleeks_blog_posts_published_at ON fleeks_blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleeks_blog_posts_category ON fleeks_blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_fleeks_watch_history_user_id ON fleeks_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fleeks_watch_history_video_id ON fleeks_watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_fleeks_watch_history_user_video ON fleeks_watch_history(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_fleeks_blog_generation_logs_post_id ON fleeks_blog_generation_logs(post_id);

-- ===================================
-- FLEEKS専用関数
-- ===================================

-- 現在のユーザーIDを取得する関数（beauty_usersを参照）
CREATE OR REPLACE FUNCTION fleeks_get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
  user_id UUID;
BEGIN
  -- Get email from JWT token or session
  current_user_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  IF current_user_email IS NULL THEN
    current_user_email := current_setting('request.session.email', true);
  END IF;
  
  -- auth.uid()が使える場合は優先
  BEGIN
    user_id := auth.uid();
    IF user_id IS NOT NULL THEN
      RETURN user_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- auth.uid()が使えない場合は続行
  END;
  
  -- beauty_usersからユーザーIDを取得（読み取りのみ）
  IF current_user_email IS NOT NULL THEN
    SELECT id INTO user_id FROM beauty_users WHERE email = current_user_email;
    RETURN user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 管理者チェック関数
CREATE OR REPLACE FUNCTION fleeks_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_role TEXT;
  user_email TEXT;
BEGIN
  user_id := fleeks_get_current_user_id();
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- fleeks_profilesでロールをチェック
  SELECT role INTO user_role FROM fleeks_profiles WHERE id = user_id;
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- beauty_usersからメールアドレスを取得（読み取りのみ）
  SELECT email INTO user_email FROM beauty_users WHERE id = user_id;
  IF user_email = 'greenroom51@gmail.com' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION fleeks_handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- ===================================
-- RLSポリシー（既存ポリシーの削除）
-- ===================================

-- fleeks_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON fleeks_profiles;

-- fleeks_videos policies
DROP POLICY IF EXISTS "Anyone can view videos" ON fleeks_videos;
DROP POLICY IF EXISTS "Only admins can insert videos" ON fleeks_videos;
DROP POLICY IF EXISTS "Only admins can update videos" ON fleeks_videos;
DROP POLICY IF EXISTS "Only admins can delete videos" ON fleeks_videos;

-- fleeks_blog_posts policies
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON fleeks_blog_posts;
DROP POLICY IF EXISTS "Only admins can insert blog posts" ON fleeks_blog_posts;
DROP POLICY IF EXISTS "Only admins can update blog posts" ON fleeks_blog_posts;
DROP POLICY IF EXISTS "Only admins can delete blog posts" ON fleeks_blog_posts;

-- fleeks_watch_history policies
DROP POLICY IF EXISTS "Users can view own watch history" ON fleeks_watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON fleeks_watch_history;
DROP POLICY IF EXISTS "Users can update own watch history" ON fleeks_watch_history;

-- fleeks_blog_generation_logs policies
DROP POLICY IF EXISTS "Only admins can view generation logs" ON fleeks_blog_generation_logs;
DROP POLICY IF EXISTS "Only admins can insert generation logs" ON fleeks_blog_generation_logs;

-- ===================================
-- RLSポリシー（新規作成）
-- ===================================

-- fleeks_profiles のRLSポリシー
CREATE POLICY "Users can view own profile" ON fleeks_profiles
  FOR SELECT USING (id = fleeks_get_current_user_id());

CREATE POLICY "Users can insert own profile" ON fleeks_profiles
  FOR INSERT WITH CHECK (id = fleeks_get_current_user_id());

CREATE POLICY "Users can update own profile" ON fleeks_profiles
  FOR UPDATE USING (id = fleeks_get_current_user_id());

CREATE POLICY "Admins can view all profiles" ON fleeks_profiles
  FOR SELECT USING (fleeks_is_admin());

-- fleeks_videos のRLSポリシー
CREATE POLICY "Anyone can view videos" ON fleeks_videos
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert videos" ON fleeks_videos
  FOR INSERT WITH CHECK (fleeks_is_admin());

CREATE POLICY "Only admins can update videos" ON fleeks_videos
  FOR UPDATE USING (fleeks_is_admin());

CREATE POLICY "Only admins can delete videos" ON fleeks_videos
  FOR DELETE USING (fleeks_is_admin());

-- fleeks_blog_posts のRLSポリシー
CREATE POLICY "Anyone can view published blog posts" ON fleeks_blog_posts
  FOR SELECT USING (status = 'published' OR fleeks_get_current_user_id() IS NOT NULL);

CREATE POLICY "Only admins can insert blog posts" ON fleeks_blog_posts
  FOR INSERT WITH CHECK (fleeks_is_admin());

CREATE POLICY "Only admins can update blog posts" ON fleeks_blog_posts
  FOR UPDATE USING (fleeks_is_admin());

CREATE POLICY "Only admins can delete blog posts" ON fleeks_blog_posts
  FOR DELETE USING (fleeks_is_admin());

-- fleeks_watch_history のRLSポリシー
CREATE POLICY "Users can view own watch history" ON fleeks_watch_history
  FOR SELECT USING (user_id = fleeks_get_current_user_id());

CREATE POLICY "Users can insert own watch history" ON fleeks_watch_history
  FOR INSERT WITH CHECK (user_id = fleeks_get_current_user_id());

CREATE POLICY "Users can update own watch history" ON fleeks_watch_history
  FOR UPDATE USING (user_id = fleeks_get_current_user_id());

-- fleeks_blog_generation_logs のRLSポリシー
CREATE POLICY "Only admins can view generation logs" ON fleeks_blog_generation_logs
  FOR SELECT USING (fleeks_is_admin());

CREATE POLICY "Only admins can insert generation logs" ON fleeks_blog_generation_logs
  FOR INSERT WITH CHECK (fleeks_is_admin());

-- ===================================
-- トリガー（FLEEKSテーブルのみ）
-- ===================================

-- updated_at トリガー
DROP TRIGGER IF EXISTS handle_fleeks_profiles_updated_at ON fleeks_profiles;
CREATE TRIGGER handle_fleeks_profiles_updated_at
  BEFORE UPDATE ON fleeks_profiles
  FOR EACH ROW EXECUTE FUNCTION fleeks_handle_updated_at();

DROP TRIGGER IF EXISTS handle_fleeks_videos_updated_at ON fleeks_videos;
CREATE TRIGGER handle_fleeks_videos_updated_at
  BEFORE UPDATE ON fleeks_videos
  FOR EACH ROW EXECUTE FUNCTION fleeks_handle_updated_at();

DROP TRIGGER IF EXISTS handle_fleeks_blog_posts_updated_at ON fleeks_blog_posts;
CREATE TRIGGER handle_fleeks_blog_posts_updated_at
  BEFORE UPDATE ON fleeks_blog_posts
  FOR EACH ROW EXECUTE FUNCTION fleeks_handle_updated_at();

COMMIT;

-- ===================================
-- 使用方法の説明
-- ===================================
-- 1. このスクリプトは既存のテーブルには一切触れません
-- 2. すべてのFLEEKS専用テーブルには fleeks_ プレフィックスがついています
-- 3. beauty_usersテーブルは参照のみ（読み取り専用）で使用します
-- 4. 新規ユーザー作成時のプロファイル作成は別途設定が必要です