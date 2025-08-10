-- mail@invest-master.net ユーザーを確実に作成するSQL

-- ===========================
-- 方法1: 最も簡単な方法（推奨）
-- ===========================
-- 1. Supabase Dashboard > Authentication > Users
-- 2. 「Add user」ボタンをクリック
-- 3. 以下を入力:
--    Email: mail@invest-master.net
--    Password: Skyosai51
--    Auto Confirm User: ✅ チェック（重要！）
-- 4. 「Create new user」をクリック

-- その後、以下のSQLを実行してプロファイルを作成：

-- ===========================
-- STEP 1: ユーザーの存在確認
-- ===========================
-- auth.usersテーブルで確認
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'mail@invest-master.net';

-- beauty_usersテーブルで確認（存在する場合）
SELECT id, email, created_at 
FROM beauty_users 
WHERE email = 'mail@invest-master.net';

-- ===========================
-- STEP 2: FLEEKSプロファイル作成
-- ===========================
-- auth.usersにユーザーが存在する場合
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
FROM auth.users
WHERE email = 'mail@invest-master.net'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    membership_type = EXCLUDED.membership_type,
    role = EXCLUDED.role,
    updated_at = NOW();

-- beauty_usersテーブルを使用する場合
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
FROM beauty_users
WHERE email = 'mail@invest-master.net'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    membership_type = EXCLUDED.membership_type,
    role = EXCLUDED.role,
    updated_at = NOW();

-- ===========================
-- STEP 3: 作成確認
-- ===========================
-- ユーザーとプロファイルの確認
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    fp.username,
    fp.full_name,
    fp.membership_type,
    fp.role
FROM auth.users u
LEFT JOIN fleeks_profiles fp ON u.id = fp.id
WHERE u.email = 'mail@invest-master.net';

-- beauty_usersを使用している場合
SELECT 
    bu.id,
    bu.email,
    bu.created_at,
    fp.username,
    fp.full_name,
    fp.membership_type,
    fp.role
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'mail@invest-master.net';

-- ===========================
-- トラブルシューティング
-- ===========================

-- 1. パスワードリセットが必要な場合
-- Supabase Dashboard > Authentication > Users
-- mail@invest-master.net の行の「...」メニュー > "Send password recovery"

-- 2. メール確認が必要な場合
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'mail@invest-master.net' 
AND email_confirmed_at IS NULL;

-- 3. ユーザーが無効化されている場合
UPDATE auth.users 
SET banned_until = NULL
WHERE email = 'mail@invest-master.net';

-- 4. FLEEKSプロファイルがない場合のみ作成
INSERT INTO fleeks_profiles (
    id, username, full_name, membership_type, role, created_at, updated_at
)
SELECT 
    id, 'invest-master', '投資マスター', 'free', 'user', NOW(), NOW()
FROM (
    SELECT id FROM auth.users WHERE email = 'mail@invest-master.net'
    UNION ALL
    SELECT id FROM beauty_users WHERE email = 'mail@invest-master.net'
) AS users
WHERE NOT EXISTS (
    SELECT 1 FROM fleeks_profiles WHERE id = users.id
)
LIMIT 1;