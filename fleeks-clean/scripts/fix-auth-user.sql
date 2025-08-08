-- 認証問題を解決するSQL

-- ===========================
-- 方法1: Supabase標準のauth.usersテーブルを使用する場合
-- ===========================
-- Supabase Dashboardで確認：
-- 1. SQL Editor に移動
-- 2. 以下のクエリでauth.usersテーブルの存在を確認

-- auth.usersテーブルが存在するか確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_exists;

-- auth.usersにユーザーが存在するか確認
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'mail@invest-master.net';

-- ===========================
-- 方法2: beauty_usersテーブルの状態確認
-- ===========================

-- beauty_usersテーブルのユーザー確認
SELECT id, email, created_at 
FROM beauty_users 
WHERE email = 'mail@invest-master.net';

-- fleeks_profilesの確認
SELECT * FROM fleeks_profiles 
WHERE full_name LIKE '%投資%' 
OR username = 'invest-master';

-- ===========================
-- 方法3: 認証設定の確認
-- ===========================

-- Supabase Dashboard > Authentication > Providers で確認：
-- 1. Email Provider が有効になっているか
-- 2. Confirm email が無効になっているか（開発環境）
-- 3. Passwordの最小文字数設定

-- ===========================
-- 方法4: 最も確実な解決方法
-- ===========================

-- 1. Supabase Dashboard > Authentication > Users
-- 2. 既存のmail@invest-master.netを削除（存在する場合）
-- 3. 新規作成：
--    - Email: mail@invest-master.net
--    - Password: Skyosai51
--    - Auto Confirm User: ✅
-- 4. 作成後、以下のSQLを実行：

-- 新しく作成されたユーザーIDでプロファイル作成
INSERT INTO fleeks_profiles (
    id,
    username,
    full_name,
    membership_type,
    role,
    created_at,
    updated_at
)
SELECT 
    id,
    'invest-master',
    '投資マスター',
    'free',
    'user',
    NOW(),
    NOW()
FROM auth.users -- またはbeauty_users
WHERE email = 'mail@invest-master.net'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();