-- Convert Free Users to Premium Users
-- This script changes the 182 free users to premium users so they can access premium content

-- Step 1: Check current status before conversion
SELECT 'BEFORE CONVERSION - Role Distribution' as status,
  r.display_name as role,
  COUNT(DISTINCT ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.display_name
ORDER BY r.priority DESC;

-- Step 2: Get role IDs
DO $$
DECLARE
  free_user_role_id UUID;
  premium_user_role_id UUID;
  converted_count INTEGER;
BEGIN
  -- Get role IDs
  SELECT id INTO free_user_role_id FROM roles WHERE name = 'free_user';
  SELECT id INTO premium_user_role_id FROM roles WHERE name = 'premium_user';
  
  -- Count users to be converted
  SELECT COUNT(*) INTO converted_count 
  FROM user_roles 
  WHERE role_id = free_user_role_id;
  
  RAISE NOTICE 'Converting % users from free_user to premium_user', converted_count;
  
  -- Convert all free_user roles to premium_user roles
  UPDATE user_roles 
  SET role_id = premium_user_role_id,
      granted_at = NOW()
  WHERE role_id = free_user_role_id;
  
  RAISE NOTICE 'Conversion completed: % users converted to premium', converted_count;
END $$;

-- Step 3: Check status after conversion
SELECT 'AFTER CONVERSION - Role Distribution' as status,
  r.display_name as role,
  COUNT(DISTINCT ur.user_id) as user_count,
  CASE 
    WHEN r.name IN ('premium_user', 'admin', 'super_admin') THEN 'HAS PREMIUM ACCESS'
    ELSE 'FREE ONLY'
  END as content_access
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.display_name, r.name
ORDER BY r.priority DESC;

-- Step 4: Summary of premium content access
SELECT 
  'PREMIUM ACCESS SUMMARY' as summary,
  COUNT(DISTINCT ur.user_id) as total_users_with_premium_access
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name IN ('premium_user', 'admin', 'super_admin');

-- Step 5: Update fleeks_profiles to match (optional - for consistency)
UPDATE fleeks_profiles 
SET role = 'paid',
    membership_type = 'premium',
    updated_at = NOW()
WHERE id IN (
  SELECT ur.user_id 
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'premium_user'
);

-- Step 6: Verify admin user is still admin
SELECT 
  'Admin verification' as check_type,
  bu.email,
  array_agg(r.name ORDER BY r.priority DESC) as roles,
  CASE 
    WHEN 'admin' = ANY(array_agg(r.name)) OR 'super_admin' = ANY(array_agg(r.name)) 
    THEN 'ADMIN ACCESS CONFIRMED' 
    ELSE 'ERROR: NO ADMIN ACCESS' 
  END as admin_status
FROM beauty_users bu
JOIN user_roles ur ON bu.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE bu.email = 'greenroom51@gmail.com'
GROUP BY bu.id, bu.email;

-- Step 7: Final verification
SELECT 'FINAL STATUS' as status,
  'Admin users: ' || 
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('admin', 'super_admin')) ||
  ', Premium users: ' ||
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'premium_user') ||
  ', Free users: ' ||
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'free_user') ||
  ', Guest users: ' ||
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'guest') as distribution;