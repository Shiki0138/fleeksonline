-- mail@invest-master.net用のプロファイルを作成
INSERT INTO fleeks_profiles (
  id,
  username,
  full_name,
  membership_type,
  role,
  created_at,
  updated_at
) VALUES (
  'ed770422-4b1d-4f79-832a-4c5a65725e05', -- デバッグページで確認したユーザーID
  'test_user',
  'テストユーザー',
  'premium', -- 有料会員として設定
  'user',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  membership_type = 'premium',
  updated_at = NOW();

-- 確認
SELECT * FROM fleeks_profiles WHERE id = 'ed770422-4b1d-4f79-832a-4c5a65725e05';