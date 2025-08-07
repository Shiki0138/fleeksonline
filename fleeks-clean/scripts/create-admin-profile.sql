-- 管理者プロファイルを作成

-- 1. まずgreenroom51@gmail.comのIDを確認
SELECT id, email FROM beauty_users WHERE email = 'greenroom51@gmail.com';

-- 2. 上記で表示されたIDを使って、fleeks_profilesにデータを挿入
-- 注: 実際のIDに置き換えてから実行してください
INSERT INTO fleeks_profiles (id, full_name, username, role, membership_type, created_at, updated_at)
SELECT 
  id,
  'Administrator',
  'admin',
  'admin',
  'vip',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM beauty_users 
WHERE email = 'greenroom51@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  membership_type = 'vip',
  updated_at = CURRENT_TIMESTAMP;

-- 3. 作成結果を確認
SELECT 
  bu.id,
  bu.email,
  fp.role,
  fp.membership_type,
  fp.full_name
FROM beauty_users bu
JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';