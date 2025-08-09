-- Fix fleeks_profiles foreign key constraint issue
-- The table currently references beauty_users but auth.users IDs don't exist there

BEGIN;

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE fleeks_profiles 
DROP CONSTRAINT IF EXISTS fleeks_profiles_id_fkey;

-- Step 2: Add new foreign key constraint to auth.users
ALTER TABLE fleeks_profiles 
ADD CONSTRAINT fleeks_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fleeks_profiles_auth_user_id ON fleeks_profiles(id);

COMMIT;

-- Verify the change
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'fleeks_profiles' 
    AND tc.constraint_type = 'FOREIGN KEY';