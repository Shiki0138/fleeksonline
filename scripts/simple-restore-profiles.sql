-- Simple Profile Restoration Script
-- This script safely restores only essential profile data

-- Check what we have in backup
SELECT 'Backup table contents:' as info, COUNT(*) as count FROM orphaned_profiles_backup;

-- Restore profiles with only essential columns
-- This avoids column mismatch errors
INSERT INTO fleeks_profiles (
  id,
  username,
  full_name,
  role,
  membership_type,
  created_at,
  updated_at
)
SELECT 
  opb.id,
  COALESCE(opb.username, bu.email, 'user_' || LEFT(opb.id::text, 8)) as username,
  opb.full_name,
  COALESCE(opb.role, 'user') as role,
  COALESCE(opb.membership_type, 'free') as membership_type,
  COALESCE(opb.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM orphaned_profiles_backup opb
INNER JOIN beauty_users bu ON opb.id = bu.id
WHERE NOT EXISTS (
  SELECT 1 FROM fleeks_profiles fp WHERE fp.id = opb.id
)
ON CONFLICT (id) DO NOTHING;

-- Verify restoration
SELECT 'Restoration check:' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM orphaned_profiles_backup) 
    THEN CONCAT(
      'Restored profiles for ',
      (SELECT COUNT(*) FROM orphaned_profiles_backup opb 
       INNER JOIN beauty_users bu ON opb.id = bu.id
       INNER JOIN fleeks_profiles fp ON bu.id = fp.id),
      ' users'
    )
    ELSE 'No backup data found'
  END as result;