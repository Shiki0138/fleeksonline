-- =====================================================
-- mail@invest-master.net ユーザー作成手順
-- =====================================================

-- 方法1: Supabase Dashboardから作成（推奨）
-- 1. Supabase Dashboard > Authentication > Users
-- 2. 「Add user」ボタンをクリック
-- 3. 以下を入力:
--    Email: mail@invest-master.net
--    Password: 任意のパスワード
--    Auto Confirm User: ✅ チェック（重要！）
-- 4. 「Create new user」をクリック

-- その後、以下のSQLを実行：

-- STEP 1: auth.usersテーブルでユーザーIDを確認
SELECT id, email FROM auth.users WHERE email = 'mail@invest-master.net';

-- STEP 2: 上記で取得したIDを使用してbeauty_usersに追加
-- 注意: 'YOUR-USER-ID-HERE'を実際のIDに置き換えてください
INSERT INTO beauty_users (id, email, created_at, updated_at)
SELECT id, email, NOW(), NOW()
FROM auth.users
WHERE email = 'mail@invest-master.net'
ON CONFLICT (id) DO NOTHING;

-- STEP 3: fleeks_profilesにプロファイルを作成
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
    'test_user',
    'テストユーザー',
    'premium',  -- premiumに設定して動画を全て視聴可能に
    'user',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'mail@invest-master.net'
ON CONFLICT (id) DO UPDATE SET
    membership_type = 'premium',
    updated_at = NOW();

-- STEP 4: 作成確認
SELECT 
    au.id,
    au.email,
    bu.id as beauty_user_id,
    fp.username,
    fp.full_name,
    fp.membership_type,
    fp.role
FROM auth.users au
LEFT JOIN beauty_users bu ON au.id = bu.id
LEFT JOIN fleeks_profiles fp ON au.id = fp.id
WHERE au.email = 'mail@invest-master.net';