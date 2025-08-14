-- Current Database Status Check
-- This script checks the current state before proceeding with RBAC migration

-- 1. Check backup table
SELECT 'Backup table status:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orphaned_profiles_backup')
    THEN CONCAT('EXISTS - Contains ', (SELECT COUNT(*) FROM orphaned_profiles_backup), ' records')
    ELSE 'DOES NOT EXIST'
  END as status;

-- 2. Show backup table contents if it exists
SELECT 'Backup table sample:' as info, id, username, role, membership_type, backed_up_at
FROM orphaned_profiles_backup
LIMIT 5;

-- 3. Current data consistency check
SELECT 'Current consistency:' as check_type,
  'beauty_users count' as metric,
  COUNT(*) as value
FROM beauty_users
UNION ALL
SELECT 'Current consistency' as check_type,
  'fleeks_profiles count' as metric,
  COUNT(*) as value
FROM fleeks_profiles
UNION ALL
SELECT 'Current consistency' as check_type,
  'Users without profiles' as metric,
  COUNT(*) as value
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL
UNION ALL
SELECT 'Current consistency' as check_type,
  'Profiles without users' as metric,
  COUNT(*) as value
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL;

-- 4. Check specific admin user
SELECT 'Admin check:' as info,
  bu.id,
  bu.email,
  CASE WHEN fp.id IS NOT NULL THEN fp.role ELSE 'NO PROFILE' END as role,
  CASE WHEN fp.id IS NOT NULL THEN fp.membership_type ELSE 'NO PROFILE' END as membership_type
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- 5. Migration readiness final check
SELECT 
  'MIGRATION READINESS' as status,
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
    THEN 'READY - All users have profiles, no orphaned profiles'
    ELSE 'NOT READY - Data inconsistencies exist'
  END as readiness;

-- 6. Show any remaining issues
SELECT 'Issue type:' as issue, 'Users without profiles' as description, COUNT(*) as count
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL
HAVING COUNT(*) > 0
UNION ALL
SELECT 'Issue type:' as issue, 'Profiles without users' as description, COUNT(*) as count
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL
HAVING COUNT(*) > 0;

-- 7. Create any missing profiles for users
INSERT INTO fleeks_profiles (
  id,
  username,
  full_name,
  membership_type,
  role,
  created_at,
  updated_at
)
SELECT 
  bu.id,
  COALESCE(bu.email, 'user_' || LEFT(bu.id::text, 8)) as username,
  NULL as full_name,
  'free' as membership_type,
  'user' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 8. Final status after creating missing profiles
SELECT 'Final status:' as check_type,
  'Users without profiles' as metric,
  COUNT(*) as remaining_issues
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL;