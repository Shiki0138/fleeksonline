-- Add status column to fleeks_profiles table
ALTER TABLE fleeks_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- Update existing profiles to have 'active' status
UPDATE fleeks_profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_fleeks_profiles_status ON fleeks_profiles(status);

-- Update RLS policies to consider status
-- Drop existing policies if needed
DROP POLICY IF EXISTS "fleeks_profiles_select_policy" ON fleeks_profiles;
DROP POLICY IF EXISTS "fleeks_profiles_insert_policy" ON fleeks_profiles;
DROP POLICY IF EXISTS "fleeks_profiles_update_policy" ON fleeks_profiles;

-- Create new policies that consider status
CREATE POLICY "fleeks_profiles_select_policy" ON fleeks_profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM fleeks_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "fleeks_profiles_insert_policy" ON fleeks_profiles
FOR INSERT WITH CHECK (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM fleeks_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "fleeks_profiles_update_policy" ON fleeks_profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM fleeks_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
) WITH CHECK (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM fleeks_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);