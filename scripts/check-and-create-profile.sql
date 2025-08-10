-- 1. まず、mail@invest-master.netのユーザーIDを確認
SELECT id, email, role FROM beauty_users WHERE email = 'mail@invest-master.net';

-- 2. 上記で取得したIDを使用してプロファイルを作成
-- 注意: 以下のINSERT文は、上記のSELECTで取得したIDに置き換えて実行してください
/*
INSERT INTO fleeks_profiles (
  id,
  username,
  full_name,
  membership_type,
  role,
  created_at,
  updated_at
) VALUES (
  '実際のユーザーID', -- ここを上記のSELECTで取得したIDに置き換える
  'test_user',
  'テストユーザー',
  'premium',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  membership_type = 'premium',
  updated_at = NOW();
*/

-- 3. すでにプロファイルが存在するかチェック
SELECT * FROM fleeks_profiles WHERE id IN (
  SELECT id FROM beauty_users WHERE email = 'mail@invest-master.net'
);