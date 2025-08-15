-- Check Supabase Auth configuration
-- Run this in Supabase SQL Editor

-- 1. Check if email confirmation is required
SELECT 
    auth.config.name,
    auth.config.value
FROM auth.config
WHERE name IN ('email_confirm', 'disable_signup', 'external_email_enabled');

-- 2. Check users with unconfirmed emails
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check if profiles exist for unconfirmed users
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.display_name,
    p.membership_type
FROM auth.users u
LEFT JOIN public.fleeks_profiles p ON u.id = p.id
WHERE u.email_confirmed_at IS NULL
ORDER BY u.created_at DESC
LIMIT 20;

-- 4. To disable email confirmation requirement (if needed)
-- WARNING: Only do this if you want to allow unconfirmed users to login
-- UPDATE auth.config SET value = 'false' WHERE name = 'email_confirm';

-- 5. To manually confirm a user's email (replace USER_ID with actual ID)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW(), 
--     confirmed_at = NOW()
-- WHERE id = 'USER_ID';

-- 6. To check auth.identities table for issues
SELECT 
    u.id,
    u.email,
    i.provider,
    i.created_at,
    i.updated_at
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email_confirmed_at IS NULL
ORDER BY u.created_at DESC
LIMIT 10;