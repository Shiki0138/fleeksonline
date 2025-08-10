-- IMMEDIATE FIX FOR ALL ISSUES
-- Run this entire script in Supabase SQL Editor

BEGIN;

-- ===================================
-- PART 1: FIX ADMIN ACCESS
-- ===================================

-- Find and fix admin user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get user ID for greenroom51@gmail.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'greenroom51@gmail.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure admin profile exists with correct role
        INSERT INTO fleeks_profiles (
            id, 
            username, 
            full_name, 
            role, 
            membership_type,
            created_at,
            updated_at
        )
        VALUES (
            admin_user_id,
            'admin',
            'Administrator',
            'admin',  -- CRITICAL: Set role to admin
            'vip',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'admin',  -- Force update to admin
            membership_type = 'vip',
            updated_at = CURRENT_TIMESTAMP;
            
        RAISE NOTICE 'Admin profile fixed for user ID: %', admin_user_id;
    ELSE
        RAISE WARNING 'User greenroom51@gmail.com not found!';
    END IF;
END $$;

-- ===================================
-- PART 2: FIX VIDEO VISIBILITY
-- ===================================

-- Check if videos exist
SELECT 'Video count before fix:' as info, COUNT(*) as count FROM fleeks_videos;

-- Fix video viewing RLS policy
DROP POLICY IF EXISTS "Anyone can view videos" ON fleeks_videos;

-- Create a completely open SELECT policy
CREATE POLICY "Anyone can view videos" ON fleeks_videos
    FOR SELECT 
    USING (true);  -- Allow ALL users to view videos

-- Add missing columns if they don't exist
ALTER TABLE fleeks_videos 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- ===================================
-- PART 3: TEMPORARY RLS DISABLE (if needed)
-- ===================================

-- Check current RLS status
SELECT 
    'Table' as info,
    tablename,
    'RLS Enabled' as status,
    (SELECT relrowsecurity FROM pg_class WHERE relname = tablename) as enabled
FROM pg_tables 
WHERE tablename LIKE 'fleeks_%' AND schemaname = 'public';

-- If videos still don't show, uncomment these lines:
-- ALTER TABLE fleeks_videos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_profiles DISABLE ROW LEVEL SECURITY;

-- ===================================
-- PART 4: VERIFY FIXES
-- ===================================

-- Check admin user
SELECT 
    'Admin Check' as check_type,
    u.id,
    u.email,
    p.role,
    p.membership_type,
    CASE 
        WHEN p.role = 'admin' THEN '✅ ADMIN ACCESS OK'
        ELSE '❌ NOT ADMIN - PROBLEM!'
    END as status
FROM auth.users u
LEFT JOIN fleeks_profiles p ON u.id = p.id
WHERE u.email = 'greenroom51@gmail.com';

-- Check videos
SELECT 
    'Video Check' as check_type,
    COUNT(*) as total_videos,
    COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published_videos
FROM fleeks_videos;

-- Show sample videos
SELECT 
    'Sample Videos' as info,
    id,
    title,
    is_premium,
    published_at
FROM fleeks_videos
ORDER BY created_at DESC
LIMIT 5;

COMMIT;

-- ===================================
-- EMERGENCY COMMANDS (use if still broken)
-- ===================================

-- 1. To completely disable RLS (temporary fix):
-- ALTER TABLE fleeks_videos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_watch_history DISABLE ROW LEVEL SECURITY;

-- 2. To check if fleeks_is_admin() function works:
-- SELECT fleeks_is_admin();

-- 3. To manually check video access:
-- SELECT COUNT(*) FROM fleeks_videos;

-- 4. To see all RLS policies:
-- SELECT tablename, policyname, permissive, cmd, qual::text 
-- FROM pg_policies 
-- WHERE tablename LIKE 'fleeks_%';