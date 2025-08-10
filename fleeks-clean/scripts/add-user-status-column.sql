-- Add status column to fleeks_profiles table
ALTER TABLE fleeks_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- Update existing profiles to have 'active' status
UPDATE fleeks_profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_fleeks_profiles_status ON fleeks_profiles(status);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'fleeks_profiles' 
AND column_name = 'status';