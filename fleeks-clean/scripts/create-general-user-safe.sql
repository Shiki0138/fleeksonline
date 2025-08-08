-- 🎯 最も安全な方法：Supabase Dashboard使用を推奨

-- ===========================
-- STEP 1: Supabase Dashboardでユーザー作成
-- ===========================
-- 1. Supabase Dashboard にログイン
-- 2. Authentication > Users に移動
-- 3. "Add user" ボタンクリック
-- 4. Email: mail@invest-master.net
-- 5. Password: Skyosai51
-- 6. "Confirm email" にチェック ✅
-- 7. "Create new user" ボタンクリック

-- ===========================
-- STEP 2: 以下のSQLでプロファイル作成
-- ===========================

-- まず作成されたユーザーIDを確認
SELECT id, email, created_at 
FROM beauty_users 
WHERE email = 'mail@invest-master.net';

-- fleeks_profilesにプロファイルを作成
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
    bu.id,
    'invest-master',
    '投資マスター',
    'free',
    'user',
    NOW(),
    NOW()
FROM beauty_users bu
WHERE bu.email = 'mail@invest-master.net'
AND NOT EXISTS (
    SELECT 1 FROM fleeks_profiles fp WHERE fp.id = bu.id
);

-- ===========================
-- STEP 3: 作成確認
-- ===========================
SELECT 
    bu.id,
    bu.email,
    bu.created_at as user_created,
    fp.username,
    fp.full_name,
    fp.membership_type,
    fp.role,
    fp.created_at as profile_created
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'mail@invest-master.net';

-- ===========================
-- 完了！
-- ===========================
-- これで一般ユーザーアカウント mail@invest-master.net が作成されます
-- パスワード: Skyosai51