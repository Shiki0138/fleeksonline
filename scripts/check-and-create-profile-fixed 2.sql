-- 1. beauty_usersテーブルの構造を確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'beauty_users' 
ORDER BY ordinal_position;

-- 2. mail@invest-master.netのユーザー情報を確認（roleカラムなし）
SELECT id, email FROM beauty_users WHERE email = 'mail@invest-master.net';

-- 3. 上記で取得したIDを使用してプロファイルを作成
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
  '実際のユーザーID', -- ここを手順2で取得したIDに置き換える
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

-- 4. すでにプロファイルが存在するかチェック
SELECT * FROM fleeks_profiles WHERE id IN (
  SELECT id FROM beauty_users WHERE email = 'mail@invest-master.net'
);

-- 5. 全てのプロファイルを確認（デバッグ用）
SELECT fp.*, bu.email 
FROM fleeks_profiles fp
LEFT JOIN beauty_users bu ON fp.id = bu.id;