-- Cleanup Orphaned Profiles Script
-- This script safely removes orphaned profiles and prepares for RBAC migration

-- Step 1: Create backup of orphaned profiles before deletion
CREATE TABLE IF NOT EXISTS orphaned_profiles_backup AS
SELECT fp.*, NOW() as backed_up_at
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL;

-- Show what will be deleted
SELECT 'Orphaned profiles to be deleted:' as action, COUNT(*) as count
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL;

-- Show details of orphaned profiles (first 20)
SELECT 
  fp.id,
  fp.username,
  fp.full_name,
  fp.role,
  fp.membership_type,
  fp.created_at
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL
ORDER BY fp.created_at DESC
LIMIT 20;

-- Step 2: Delete orphaned profiles
DELETE FROM fleeks_profiles
WHERE id NOT IN (SELECT id FROM beauty_users);

-- Step 3: Verify deletion
SELECT 'Orphaned profiles after cleanup:' as status, COUNT(*) as count
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL;

-- Step 4: Create profiles for users without them
INSERT INTO fleeks_profiles (
  id,
  username,
  full_name,
  membership_type,
  membership_expires_at,
  role,
  created_at,
  updated_at
)
SELECT 
  bu.id,
  COALESCE(bu.email, 'user_' || LEFT(bu.id::text, 8)) as username,
  NULL as full_name,
  'free' as membership_type,
  NULL as membership_expires_at,
  'user' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 5: Final verification
SELECT 'Data consistency check:' as check_type, 
  'beauty_users count' as metric,
  COUNT(*) as value
FROM beauty_users
UNION ALL
SELECT 'Data consistency check' as check_type,
  'fleeks_profiles count' as metric,
  COUNT(*) as value
FROM fleeks_profiles
UNION ALL
SELECT 'Data consistency check' as check_type,
  'Matching records' as metric,
  COUNT(*) as value
FROM beauty_users bu
INNER JOIN fleeks_profiles fp ON bu.id = fp.id
UNION ALL
SELECT 'Data consistency check' as check_type,
  'Users without profiles' as metric,
  COUNT(*) as value
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL
UNION ALL
SELECT 'Data consistency check' as check_type,
  'Profiles without users' as metric,
  COUNT(*) as value
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL;

-- Step 6: Show admin user status
SELECT 'Admin user check:' as check_type,
  bu.id,
  bu.email,
  fp.role,
  fp.membership_type,
  CASE WHEN fp.id IS NULL THEN 'Profile missing' ELSE 'Profile exists' END as profile_status
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- Step 7: Final migration readiness check
SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM fleeks_profiles fp
      LEFT JOIN beauty_users bu ON fp.id = bu.id
      WHERE bu.id IS NULL
    ) = 0 
    AND (
      SELECT COUNT(*)
      FROM beauty_users bu
      LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
      WHERE fp.id IS NULL
    ) = 0
    THEN 'YES - Ready for RBAC migration'
    ELSE 'NO - Data inconsistencies remain'
  END as migration_readiness;