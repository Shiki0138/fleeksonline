-- 管理者アクセスのデバッグクエリ

-- 1. greenroom51@gmail.comユーザーの情報を確認
SELECT 
  bu.id as user_id,
  bu.email,
  fp.id as profile_id,
  fp.role,
  fp.membership_type,
  fp.full_name
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- 2. fleeks_profilesテーブルのroleがadminのユーザーを確認
SELECT * FROM fleeks_profiles WHERE role = 'admin';

-- 3. fleeks_profilesテーブルの全データを確認（最初の10件）
SELECT 
  fp.id,
  fp.role,
  fp.membership_type,
  bu.email
FROM fleeks_profiles fp
JOIN beauty_users bu ON fp.id = bu.id
LIMIT 10;

-- 4. 管理者権限の関数をテスト
SELECT fleeks_is_admin();

-- 5. 現在のユーザーIDを取得（ログイン状態で実行）
SELECT fleeks_get_current_user_id();