-- 管理者権限を確実に設定

-- 1. greenroom51@gmail.comのユーザーIDを取得して、roleをadminに更新
UPDATE fleeks_profiles
SET 
  role = 'admin',
  membership_type = 'vip',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id FROM beauty_users WHERE email = 'greenroom51@gmail.com'
);

-- 2. 更新結果を確認
SELECT 
  bu.id,
  bu.email,
  fp.role,
  fp.membership_type,
  fp.full_name,
  fp.updated_at
FROM beauty_users bu
JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- 3. 管理者権限の関数が正しく動作するか確認
-- （Supabaseにログインした状態で実行）
SELECT 
  fleeks_get_current_user_id() as current_user_id,
  fleeks_is_admin() as is_admin;