-- Comprehensive fix for authentication system
-- This migration consolidates auth to use only auth.users and removes beauty_users dependencies

BEGIN;

-- ===================================
-- Step 1: Fix fleeks_profiles foreign key
-- ===================================

-- Drop the existing foreign key constraint if it references beauty_users
ALTER TABLE fleeks_profiles 
DROP CONSTRAINT IF EXISTS fleeks_profiles_id_fkey;

-- Add new foreign key constraint to auth.users
ALTER TABLE fleeks_profiles 
ADD CONSTRAINT fleeks_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fleeks_profiles_auth_user_id ON fleeks_profiles(id);

-- ===================================
-- Step 2: Update RLS policies to use auth.uid()
-- ===================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON fleeks_profiles;

-- Create new policies using auth.uid()
CREATE POLICY "Users can view own profile" ON fleeks_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON fleeks_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON fleeks_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON fleeks_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ===================================
-- Step 3: Create trigger to auto-create fleeks_profiles on user signup
-- ===================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into fleeks_profiles
  INSERT INTO public.fleeks_profiles (id, username, full_name, role, membership_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    CASE 
      WHEN NEW.email = 'greenroom51@gmail.com' THEN 'admin'
      ELSE 'user'
    END,
    'free'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    updated_at = CURRENT_TIMESTAMP,
    username = COALESCE(EXCLUDED.username, fleeks_profiles.username),
    full_name = COALESCE(EXCLUDED.full_name, fleeks_profiles.full_name);
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================
-- Step 4: Update existing functions to use auth.uid()
-- ===================================

-- Update the fleeks_get_current_user_id function
CREATE OR REPLACE FUNCTION fleeks_get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- Update the fleeks_is_admin function
CREATE OR REPLACE FUNCTION fleeks_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role 
  FROM fleeks_profiles 
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$;

-- ===================================
-- Step 5: Update other tables' RLS policies
-- ===================================

-- fleeks_videos policies
DROP POLICY IF EXISTS "Anyone can view videos" ON fleeks_videos;
DROP POLICY IF EXISTS "Only admins can insert videos" ON fleeks_videos;
DROP POLICY IF EXISTS "Only admins can update videos" ON fleeks_videos;
DROP POLICY IF EXISTS "Only admins can delete videos" ON fleeks_videos;

CREATE POLICY "Anyone can view videos" ON fleeks_videos
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert videos" ON fleeks_videos
  FOR INSERT WITH CHECK (fleeks_is_admin());

CREATE POLICY "Only admins can update videos" ON fleeks_videos
  FOR UPDATE USING (fleeks_is_admin());

CREATE POLICY "Only admins can delete videos" ON fleeks_videos
  FOR DELETE USING (fleeks_is_admin());

-- fleeks_blog_posts policies
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON fleeks_blog_posts;
DROP POLICY IF EXISTS "Only admins can insert blog posts" ON fleeks_blog_posts;
DROP POLICY IF EXISTS "Only admins can update blog posts" ON fleeks_blog_posts;
DROP POLICY IF EXISTS "Only admins can delete blog posts" ON fleeks_blog_posts;

CREATE POLICY "Anyone can view published blog posts" ON fleeks_blog_posts
  FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert blog posts" ON fleeks_blog_posts
  FOR INSERT WITH CHECK (fleeks_is_admin());

CREATE POLICY "Only admins can update blog posts" ON fleeks_blog_posts
  FOR UPDATE USING (fleeks_is_admin());

CREATE POLICY "Only admins can delete blog posts" ON fleeks_blog_posts
  FOR DELETE USING (fleeks_is_admin());

-- fleeks_watch_history policies
DROP POLICY IF EXISTS "Users can view own watch history" ON fleeks_watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON fleeks_watch_history;
DROP POLICY IF EXISTS "Users can update own watch history" ON fleeks_watch_history;

CREATE POLICY "Users can view own watch history" ON fleeks_watch_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own watch history" ON fleeks_watch_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own watch history" ON fleeks_watch_history
  FOR UPDATE USING (user_id = auth.uid());

-- fleeks_blog_generation_logs policies
DROP POLICY IF EXISTS "Only admins can view generation logs" ON fleeks_blog_generation_logs;
DROP POLICY IF EXISTS "Only admins can insert generation logs" ON fleeks_blog_generation_logs;

CREATE POLICY "Only admins can view generation logs" ON fleeks_blog_generation_logs
  FOR SELECT USING (fleeks_is_admin());

CREATE POLICY "Only admins can insert generation logs" ON fleeks_blog_generation_logs
  FOR INSERT WITH CHECK (fleeks_is_admin());

-- ===================================
-- Step 6: Ensure admin user has proper profile
-- ===================================

-- Create fleeks_profile for admin if it doesn't exist
INSERT INTO fleeks_profiles (id, username, full_name, role, membership_type)
SELECT 
  id,
  'admin',
  'Administrator',
  'admin',
  'vip'
FROM auth.users
WHERE email = 'greenroom51@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  membership_type = 'vip',
  updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- Verify the changes
SELECT 
    'Foreign Key Check' as check_type,
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'fleeks_profiles' 
    AND tc.constraint_type = 'FOREIGN KEY';