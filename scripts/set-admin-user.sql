-- Set Admin User Role
-- Run this AFTER creating the admin user account in Supabase Auth

-- Method 1: Update existing profile
UPDATE profiles 
SET role = 'admin', 
    membership_type = 'vip'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'greenroom51@gmail.com'
);

-- Method 2: Insert admin profile if user exists but no profile
INSERT INTO profiles (id, role, membership_type, full_name)
SELECT id, 'admin', 'vip', 'Administrator'
FROM auth.users 
WHERE email = 'greenroom51@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.users.id
);

-- Verify admin user was set correctly
SELECT 
  u.email,
  u.created_at,
  p.role,
  p.membership_type,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'greenroom51@gmail.com';