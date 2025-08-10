-- FLEEKS Platform - Custom Auth Table Migration
-- For Supabase with beauty_users table instead of auth.users
-- Execute this in Supabase SQL Editor

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. First, check if beauty_users table exists and has required columns
-- If not, create it
CREATE TABLE IF NOT EXISTS beauty_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  raw_user_meta_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create profiles table referencing beauty_users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES beauty_users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'premium', 'vip')),
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create videos table
CREATE TABLE IF NOT EXISTS videos (
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

-- 4. Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
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

-- 5. Create blog_generation_logs table
CREATE TABLE IF NOT EXISTS blog_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  source_content TEXT,
  prompt TEXT,
  ai_model TEXT,
  generation_params JSONB,
  generated_content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create watch_history table
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on tables
ALTER TABLE beauty_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_beauty_users_email ON beauty_users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_premium ON videos(is_premium);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_video_id ON watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_video ON watch_history(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_post_id ON blog_generation_logs(post_id);

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view videos" ON videos;
DROP POLICY IF EXISTS "Only admins can insert videos" ON videos;
DROP POLICY IF EXISTS "Only admins can update videos" ON videos;
DROP POLICY IF EXISTS "Only admins can delete videos" ON videos;
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can view own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can update own watch history" ON watch_history;
DROP POLICY IF EXISTS "Only admins can view generation logs" ON blog_generation_logs;
DROP POLICY IF EXISTS "Only admins can insert generation logs" ON blog_generation_logs;

-- Create function to get current user id (custom auth)
CREATE OR REPLACE FUNCTION get_current_user_id()
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
  
  IF current_user_email IS NOT NULL THEN
    SELECT id INTO user_id FROM beauty_users WHERE email = current_user_email;
    RETURN user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_role TEXT;
  user_email TEXT;
BEGIN
  user_id := get_current_user_id();
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check role in profiles
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check email directly
  SELECT email INTO user_email FROM beauty_users WHERE id = user_id;
  IF user_email = 'greenroom51@gmail.com' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = get_current_user_id());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = get_current_user_id());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Create RLS policies for videos
CREATE POLICY "Anyone can view videos" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert videos" ON videos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update videos" ON videos
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete videos" ON videos
  FOR DELETE USING (is_admin());

-- Create RLS policies for blog_posts
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published' OR get_current_user_id() IS NOT NULL);

CREATE POLICY "Only admins can insert blog posts" ON blog_posts
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update blog posts" ON blog_posts
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete blog posts" ON blog_posts
  FOR DELETE USING (is_admin());

-- Create RLS policies for watch_history
CREATE POLICY "Users can view own watch history" ON watch_history
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert own watch history" ON watch_history
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update own watch history" ON watch_history
  FOR UPDATE USING (user_id = get_current_user_id());

-- Create RLS policies for blog_generation_logs
CREATE POLICY "Only admins can view generation logs" ON blog_generation_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Only admins can insert generation logs" ON blog_generation_logs
  FOR INSERT WITH CHECK (is_admin());

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_beauty_users ON beauty_users;
CREATE TRIGGER handle_updated_at_beauty_users
  BEFORE UPDATE ON beauty_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_profiles ON profiles;
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_videos ON videos;
CREATE TRIGGER handle_updated_at_videos
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_blog_posts ON blog_posts;
CREATE TRIGGER handle_updated_at_blog_posts
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT;

-- Note: After running this script, you'll need to create the admin user manually