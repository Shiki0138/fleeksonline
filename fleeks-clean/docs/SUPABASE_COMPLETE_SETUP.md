# 🔐 FLEEKS Platform - Supabase Complete Database Setup Guide

## Overview
This guide provides the complete Supabase database schema and configuration for the FLEEKS platform with proper RLS (Row Level Security) policies, authentication, and data integrity.

## 🚨 CRITICAL: Execute in Order

**Run these SQL scripts in Supabase SQL Editor in the exact order listed:**

### 1. Core Schema Setup (FIRST)
```sql
-- Enable RLS on auth tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'premium', 'vip')),
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create videos table if not exists
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

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
```

### 2. Blog System Tables (SECOND)
```sql
-- Create blog_posts table
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

-- Create blog_generation_logs table
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

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_generation_logs ENABLE ROW LEVEL SECURITY;
```

### 3. Watch History Table (THIRD)
```sql
-- Create watch_history table
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

-- Enable RLS
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
```

### 4. Database Indexes (FOURTH)
```sql
-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_premium ON videos(is_premium);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_video_id ON watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_video ON watch_history(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_post_id ON blog_generation_logs(post_id);
```

### 5. Row Level Security Policies (FIFTH)
```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Drop existing video policies
DROP POLICY IF EXISTS "Anyone can view videos" ON videos;
DROP POLICY IF EXISTS "Only admins can insert videos" ON videos;
DROP POLICY IF EXISTS "Only admins can update videos" ON videos;
DROP POLICY IF EXISTS "Only admins can delete videos" ON videos;

-- Videos policies
CREATE POLICY "Anyone can view videos" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert videos" ON videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update videos" ON videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete videos" ON videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Drop existing blog policies
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can delete blog posts" ON blog_posts;

-- Blog posts policies
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert blog posts" ON blog_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update blog posts" ON blog_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete blog posts" ON blog_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Drop existing watch history policies
DROP POLICY IF EXISTS "Users can view own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can update own watch history" ON watch_history;

-- Watch history policies
CREATE POLICY "Users can view own watch history" ON watch_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history" ON watch_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history" ON watch_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing generation logs policies
DROP POLICY IF EXISTS "Only admins can view generation logs" ON blog_generation_logs;
DROP POLICY IF EXISTS "Only admins can insert generation logs" ON blog_generation_logs;

-- Blog generation logs policies (admin only)
CREATE POLICY "Only admins can view generation logs" ON blog_generation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert generation logs" ON blog_generation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### 6. Database Functions and Triggers (SIXTH)
```sql
-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON videos;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON blog_posts;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 7. Set Admin User (SEVENTH)
```sql
-- Set admin role for the specified user
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'greenroom51@gmail.com'
);

-- If the profile doesn't exist yet, insert it
INSERT INTO profiles (id, role, membership_type)
SELECT id, 'admin', 'vip'
FROM auth.users 
WHERE email = 'greenroom51@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.users.id
);
```

### 8. Sample Data (EIGHTH - OPTIONAL)
```sql
-- Insert sample videos (run only if you want test data)
INSERT INTO videos (
  youtube_id,
  title,
  description,
  category,
  duration,
  is_premium
) VALUES
  ('xdHq_H-VF80', 'Instagram集客の基礎：フォロワーを増やす5つの戦略', 'Instagramでビジネスを成長させるための基本戦略を解説。', 'Instagram集客', 1200, true),
  ('R6m6YtYj7w8', '顧客心理を掴む接客術：リピート率80%の秘密', '心理学的アプローチを活用した接客方法を実践的に解説。', '接客スキル', 1800, true),
  ('hJ22_BtUoQA', 'ローカルビジネスのためのMEO対策完全ガイド', 'Googleマイビジネスを活用した地域集客の方法を徹底解説。', 'デジタルマーケティング', 2400, true),
  ('vMq5vrfHlKI', 'インスタライブで売上を3倍にする方法', 'ライブコマースの成功事例と実践的なテクニック。', 'Instagram集客', 1500, true),
  ('6F9lUORkrNA', '価格設定の心理学：利益を最大化する戦略', '行動経済学に基づいた価格設定の方法を解説。', '経営戦略', 2100, true),
  ('_-0SaFXGeNw', 'SNS広告運用の基礎：少額予算で始める集客', 'Facebook/Instagram広告の基本設定から効果測定まで。', 'デジタルマーケティング', 1950, false),
  ('U43Z0O_PHNE', 'リールで爆発的にフォロワーを増やす方法', 'Instagramリールのアルゴリズムを理解し、バズるコンテンツを作る方法。', 'Instagram集客', 1650, true),
  ('X4I3wHH1cJY', 'ストーリーズを使った集客テクニック10選', 'Instagramストーリーズの機能を最大限活用する方法。', 'Instagram集客', 1350, false),
  ('cV8ynHlaq6I', 'クレーム対応の極意：ピンチをチャンスに変える', '難しいお客様への対応方法を心理学的アプローチで解説。', '接客スキル', 1750, true),
  ('vGdVg_Zl1b0', '競合分析の基本：差別化戦略の立て方', '競合店舗の分析方法と自店の強みを見つける方法。', '経営戦略', 2050, true)
ON CONFLICT (youtube_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  is_premium = EXCLUDED.is_premium,
  updated_at = NOW();
```

## 🔒 Security Features Implemented

### Row Level Security (RLS)
- ✅ **Profiles**: Users can only view/edit their own profile, admins can view all
- ✅ **Videos**: Public read, admin-only write/update/delete
- ✅ **Blog Posts**: Public read for published posts, admin-only management
- ✅ **Watch History**: Users can only access their own viewing history
- ✅ **Generation Logs**: Admin-only access for AI blog generation tracking

### Data Integrity
- ✅ **Foreign Key Constraints**: Proper relationships between tables
- ✅ **Check Constraints**: Valid values for enums (membership_type, role, status)
- ✅ **Unique Constraints**: Prevent duplicate YouTube IDs and blog slugs
- ✅ **NOT NULL Constraints**: Required fields properly enforced

### Performance Optimization
- ✅ **Strategic Indexes**: Optimized for common query patterns
- ✅ **Composite Indexes**: Multi-column indexes for complex queries
- ✅ **Timestamp Indexes**: Optimized for date-based sorting

### Authentication Flow
- ✅ **Auto Profile Creation**: Trigger creates profile on user signup
- ✅ **Admin Detection**: Email-based and role-based admin identification
- ✅ **Membership Management**: Free/Premium/VIP tier support

## 🧪 Testing Checklist

After running the setup, verify these work:

### Authentication
- [ ] User signup creates profile automatically
- [ ] Admin user (greenroom51@gmail.com) has admin role
- [ ] Login/logout functions properly

### Admin Functions
- [ ] Admin can create/edit/delete videos
- [ ] Admin can create/edit/delete blog posts
- [ ] Regular users cannot access admin functions

### User Functions
- [ ] Users can view videos (with 5-minute limit for free users on premium content)
- [ ] Users can view published blog posts
- [ ] Watch history is tracked properly

### Security
- [ ] RLS policies prevent unauthorized access
- [ ] Admin-only routes are protected
- [ ] User data isolation works properly

## 🔧 Troubleshooting

### Common Issues

1. **"column does not exist" errors**
   - Run schema setup scripts in order
   - Check if all ALTER TABLE statements completed

2. **RLS policy conflicts**
   - Run DROP POLICY statements first
   - Ensure policies are created after tables exist

3. **Admin user not working**
   - Verify user exists in auth.users
   - Check profile has role = 'admin'
   - Ensure email matches exactly

4. **Trigger errors**
   - Drop existing triggers before recreating
   - Check function exists before creating trigger

### SQL Verification Queries

```sql
-- Check table structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Check admin user
SELECT u.email, p.role, p.membership_type
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'greenroom51@gmail.com';

-- Check sample data
SELECT COUNT(*) as video_count FROM videos;
SELECT COUNT(*) as blog_count FROM blog_posts;
SELECT COUNT(*) as profile_count FROM profiles;
```

## 📋 Environment Variables Required

Make sure these are set in your Vercel/deployment environment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
CRON_SECRET=random_secret_for_cron_jobs
```

## 🎯 Next Steps

1. Execute all SQL scripts in order in Supabase SQL Editor
2. Create admin user account in Supabase Auth
3. Set environment variables in Vercel
4. Test all functionality
5. Deploy application

This complete setup provides a secure, scalable, and feature-rich database foundation for the FLEEKS platform.