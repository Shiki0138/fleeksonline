-- Create Admin User for Custom Auth Table (beauty_users)
-- Run this AFTER the main migration script

-- Step 1: Create admin user in beauty_users table
INSERT INTO beauty_users (email, email_confirmed_at, raw_user_meta_data)
VALUES (
  'greenroom51@gmail.com',
  NOW(),
  '{"full_name": "Administrator"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Step 2: Get the user ID and create profile
WITH user_data AS (
  SELECT id FROM beauty_users WHERE email = 'greenroom51@gmail.com'
)
INSERT INTO profiles (id, full_name, role, membership_type)
SELECT 
  id,
  'Administrator',
  'admin',
  'vip'
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  membership_type = 'vip';

-- Step 3: Verify admin user was created correctly
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.membership_type
FROM beauty_users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'greenroom51@gmail.com';

-- Note: Password setting depends on your authentication implementation
-- If using Supabase Auth with custom table, you may need to use Supabase Dashboard
-- or implement a custom password hashing function