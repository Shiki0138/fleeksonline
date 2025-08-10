-- URGENT FIX: Restore admin access and video visibility
-- Run this in Supabase SQL Editor

BEGIN;

-- ===================================
-- Step 1: Fix admin user profile
-- ===================================

-- First, find the user ID for greenroom51@gmail.com
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'greenroom51@gmail.com'
    LIMIT 1;
    
    -- If user exists, ensure they have an admin profile
    IF admin_user_id IS NOT NULL THEN
        -- Update or insert the profile
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
            'admin',
            'vip',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'admin',
            membership_type = 'vip',
            updated_at = CURRENT_TIMESTAMP;
            
        RAISE NOTICE 'Admin profile updated for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'User greenroom51@gmail.com not found in auth.users';
    END IF;
END $$;

-- ===================================
-- Step 2: Check and fix video visibility
-- ===================================

-- Check if RLS is blocking video access
SELECT 
    'Videos Table Status' as info,
    COUNT(*) as total_videos,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'fleeks_videos') as rls_enabled
FROM fleeks_videos;

-- Check current RLS policies on fleeks_videos
SELECT 
    policyname,
    cmd,
    permissive,
    qual::text as policy_condition
FROM pg_policies 
WHERE tablename = 'fleeks_videos';

-- ===================================
-- Step 3: Temporarily disable RLS if needed
-- ===================================

-- If videos are not showing, temporarily disable RLS
-- IMPORTANT: Only do this if absolutely necessary
-- ALTER TABLE fleeks_videos DISABLE ROW LEVEL SECURITY;

-- ===================================
-- Step 4: Fix the video viewing policy
-- ===================================

-- Drop and recreate the video viewing policy to ensure it's permissive
DROP POLICY IF EXISTS "Anyone can view videos" ON fleeks_videos;

CREATE POLICY "Anyone can view videos" ON fleeks_videos
    FOR SELECT 
    USING (true);  -- This allows EVERYONE to view videos

-- ===================================
-- Step 5: Verify the fixes
-- ===================================

-- Check admin user and profile
SELECT 
    'Admin User Check' as check_type,
    u.id,
    u.email,
    u.created_at as user_created,
    p.role,
    p.membership_type,
    p.updated_at as profile_updated
FROM auth.users u
LEFT JOIN fleeks_profiles p ON u.id = p.id
WHERE u.email = 'greenroom51@gmail.com';

-- Check video count and sample
SELECT 
    'Video Check' as check_type,
    COUNT(*) as total_videos,
    COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published_videos,
    COUNT(CASE WHEN is_premium = true THEN 1 END) as premium_videos
FROM fleeks_videos;

-- Show first 5 videos
SELECT 
    id,
    title,
    is_premium,
    published_at,
    created_at
FROM fleeks_videos
ORDER BY published_at DESC NULLS LAST
LIMIT 5;

COMMIT;

-- ===================================
-- Additional Debug Commands (run separately if needed)
-- ===================================

-- If videos still don't show, check if the table exists and has data:
-- SELECT COUNT(*) FROM fleeks_videos;

-- If admin still can't access, check the fleeks_is_admin function:
-- SELECT fleeks_is_admin();

-- To completely disable RLS temporarily (emergency only):
-- ALTER TABLE fleeks_videos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_profiles DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS:
-- ALTER TABLE fleeks_videos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_profiles ENABLE ROW LEVEL SECURITY;