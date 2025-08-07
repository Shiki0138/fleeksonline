-- 管理者設定の検証

-- 1. beauty_usersとfleeks_profilesの関連を確認
SELECT 
  bu.id,
  bu.email,
  fp.id as profile_id,
  fp.role,
  fp.membership_type,
  fp.full_name,
  fp.created_at,
  fp.updated_at
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- 2. fleeks_profilesテーブルに管理者がいるか確認
SELECT COUNT(*) as admin_count 
FROM fleeks_profiles 
WHERE role = 'admin';

-- 3. ログイン時に使用されるユーザーIDの形式を確認
-- Supabaseの auth.users と beauty_users のIDが一致しているか確認が必要
SELECT 
  'beauty_users' as table_name,
  id,
  email
FROM beauty_users
WHERE email = 'greenroom51@gmail.com'
UNION ALL
SELECT 
  'auth.users' as table_name,
  id,
  email
FROM auth.users
WHERE email = 'greenroom51@gmail.com';