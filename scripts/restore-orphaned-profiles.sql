-- Restore Orphaned Profiles Script
-- Use this script only if you need to restore deleted profiles

-- Check backup table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orphaned_profiles_backup'
ORDER BY ordinal_position;

-- Check what's in the backup
SELECT COUNT(*) as total_backed_up_profiles
FROM orphaned_profiles_backup;

-- Show sample of backed up data
SELECT id, username, role, membership_type, backed_up_at
FROM orphaned_profiles_backup
LIMIT 10;

-- Restore profiles (only for users that now exist in beauty_users)
INSERT INTO fleeks_profiles (
  id,
  username,
  full_name,
  membership_type,
  membership_expires_at,
  role,
  created_at,
  updated_at,
  avatar_url,
  bio,
  website,
  location,
  social_links,
  preferences,
  last_active_at,
  email_notifications,
  is_verified,
  verification_token,
  points,
  badges,
  achievements
)
SELECT 
  opb.id,
  opb.username,
  opb.full_name,
  opb.membership_type,
  opb.membership_expires_at,
  opb.role,
  opb.created_at,
  opb.updated_at,
  opb.avatar_url,
  opb.bio,
  opb.website,
  opb.location,
  opb.social_links,
  opb.preferences,
  opb.last_active_at,
  opb.email_notifications,
  opb.is_verified,
  opb.verification_token,
  opb.points,
  opb.badges,
  opb.achievements
FROM orphaned_profiles_backup opb
INNER JOIN beauty_users bu ON opb.id = bu.id
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  membership_type = EXCLUDED.membership_type,
  updated_at = NOW();

-- Check restoration results
SELECT 
  'Profiles restored' as action,
  COUNT(*) as count
FROM orphaned_profiles_backup opb
INNER JOIN beauty_users bu ON opb.id = bu.id
INNER JOIN fleeks_profiles fp ON bu.id = fp.id;

-- Alternative: If you need to check specific columns in fleeks_profiles
-- First, check the actual structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'fleeks_profiles'
ORDER BY ordinal_position;

-- If the table has different columns, create a more targeted restore
-- This is a safer approach that only restores essential columns
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
  opb.id,
  COALESCE(opb.username, 'user_' || LEFT(opb.id::text, 8)),
  opb.full_name,
  COALESCE(opb.membership_type, 'free'),
  opb.membership_expires_at,
  COALESCE(opb.role, 'user'),
  COALESCE(opb.created_at, NOW()),
  NOW()
FROM orphaned_profiles_backup opb
INNER JOIN beauty_users bu ON opb.id = bu.id
WHERE NOT EXISTS (
  SELECT 1 FROM fleeks_profiles fp WHERE fp.id = opb.id
)
ON CONFLICT (id) DO NOTHING;