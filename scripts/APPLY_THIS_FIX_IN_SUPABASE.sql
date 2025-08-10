-- =====================================================
-- IMPORTANT: Run this script in Supabase SQL Editor
-- This fixes the authentication system to use auth.users
-- =====================================================

-- First, check current foreign key status
SELECT 
    'Current foreign key for fleeks_profiles:' as info,
    tc.constraint_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'fleeks_profiles' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- Apply the fix
BEGIN;

-- Step 1: Fix foreign key constraint
ALTER TABLE fleeks_profiles 
DROP CONSTRAINT IF EXISTS fleeks_profiles_id_fkey;

ALTER TABLE fleeks_profiles 
ADD CONSTRAINT fleeks_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create profile for existing admin user
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

-- Step 3: Update RLS policies to use auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON fleeks_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON fleeks_profiles;

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

COMMIT;

-- Verify the fix
SELECT 
    'After fix - foreign key for fleeks_profiles:' as info,
    tc.constraint_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'fleeks_profiles' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- Check admin profile
SELECT 'Admin profile status:' as info, * 
FROM fleeks_profiles 
WHERE role = 'admin';