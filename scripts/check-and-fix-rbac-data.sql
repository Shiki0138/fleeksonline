-- RBAC Data Integrity Check and Fix Script
-- This script checks for data inconsistencies and fixes them before migration

-- Step 1: Check for orphaned profiles (profiles without corresponding beauty_users)
SELECT 'Orphaned profiles found:' as message, COUNT(*) as count
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL;

-- List orphaned profiles
SELECT fp.id, fp.username, fp.role, fp.membership_type
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id
WHERE bu.id IS NULL
LIMIT 10;

-- Step 2: Clean up orphaned profiles (optional - uncomment to execute)
-- DELETE FROM fleeks_profiles
-- WHERE id NOT IN (SELECT id FROM beauty_users);

-- Step 3: Check for users without profiles
SELECT 'Users without profiles:' as message, COUNT(*) as count
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL;

-- List users without profiles
SELECT bu.id, bu.email, bu.created_at
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL
LIMIT 10;

-- Step 4: Create missing profiles with default values
INSERT INTO fleeks_profiles (id, role, membership_type, created_at, updated_at)
SELECT 
  bu.id,
  'user' as role,
  'free' as membership_type,
  NOW() as created_at,
  NOW() as updated_at
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify data consistency after fixes
SELECT 'Total beauty_users:' as metric, COUNT(*) as count FROM beauty_users
UNION ALL
SELECT 'Total fleeks_profiles:' as metric, COUNT(*) as count FROM fleeks_profiles
UNION ALL
SELECT 'Profiles with role=user:' as metric, COUNT(*) as count FROM fleeks_profiles WHERE role = 'user'
UNION ALL
SELECT 'Profiles with role=paid:' as metric, COUNT(*) as count FROM fleeks_profiles WHERE role = 'paid'
UNION ALL
SELECT 'Profiles with role=admin:' as metric, COUNT(*) as count FROM fleeks_profiles WHERE role = 'admin'
UNION ALL
SELECT 'Profiles with NULL role:' as metric, COUNT(*) as count FROM fleeks_profiles WHERE role IS NULL;

-- Step 6: Check specific admin email
SELECT 'Admin email check:' as message, 
  bu.id, 
  bu.email, 
  fp.role,
  fp.membership_type
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- Step 7: Fix any NULL roles to default 'user'
UPDATE fleeks_profiles
SET role = 'user'
WHERE role IS NULL;

-- Step 8: Ensure role values are valid
UPDATE fleeks_profiles
SET role = 'user'
WHERE role NOT IN ('user', 'paid', 'admin', 'free');

-- Step 9: Final consistency check
SELECT 
  'Ready for migration' as status,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM fleeks_profiles fp
      LEFT JOIN beauty_users bu ON fp.id = bu.id
      WHERE bu.id IS NULL
    ) = 0 
    THEN 'YES - No orphaned profiles'
    ELSE 'NO - Orphaned profiles exist'
  END as check_result;