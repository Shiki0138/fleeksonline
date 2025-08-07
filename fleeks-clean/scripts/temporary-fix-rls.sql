-- 一時的なRLS無効化（テスト用）
-- 注意：これはテスト目的のみ。本番環境では必ずRLSを有効にしてください

-- fleeks_profilesのRLSを一時的に無効化
ALTER TABLE fleeks_profiles DISABLE ROW LEVEL SECURITY;

-- 確認：greenroom51@gmail.comのプロファイルが存在するか
SELECT 
  bu.id,
  bu.email,
  fp.id as profile_id,
  fp.role,
  fp.membership_type
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- もしプロファイルが存在しない場合は作成
INSERT INTO fleeks_profiles (id, full_name, username, role, membership_type)
SELECT 
  id,
  'Administrator',
  'admin',
  'admin',
  'vip'
FROM beauty_users 
WHERE email = 'greenroom51@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM fleeks_profiles WHERE id = beauty_users.id
);

-- 再度確認
SELECT * FROM fleeks_profiles WHERE role = 'admin';