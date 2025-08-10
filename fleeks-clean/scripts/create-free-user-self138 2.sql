-- =====================================================
-- self.138@gmail.com 無料会員登録手順
-- =====================================================

-- 方法1: Supabase Dashboardから作成（推奨）
-- 1. Supabase Dashboard > Authentication > Users
-- 2. 「Add user」ボタンをクリック
-- 3. 以下を入力:
--    Email: self.138@gmail.com
--    Password: 任意のパスワード（例: TestUser123!）
--    Auto Confirm User: ✅ チェック（重要！）
-- 4. 「Create new user」をクリック

-- その後、以下のSQLを実行：

-- STEP 1: auth.usersテーブルでユーザーIDを確認
SELECT id, email FROM auth.users WHERE email = 'self.138@gmail.com';

-- STEP 2: 上記で取得したIDを使用してbeauty_usersに追加
INSERT INTO beauty_users (id, email, created_at, updated_at)
SELECT id, email, NOW(), NOW()
FROM auth.users
WHERE email = 'self.138@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- STEP 3: fleeks_profilesに無料会員プロファイルを作成
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
    'self138',
    '無料会員ユーザー',
    'free',  -- 無料会員として設定
    'user',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'self.138@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    membership_type = 'free',
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
WHERE au.email = 'self.138@gmail.com';

-- STEP 5: 無料会員の制限確認（5分制限が適用されることを確認）
SELECT 
    email,
    membership_type,
    CASE 
        WHEN membership_type = 'free' THEN '動画は5分まで視聴可能'
        WHEN membership_type = 'premium' THEN '動画を無制限に視聴可能'
        ELSE '不明'
    END as 視聴制限
FROM auth.users au
JOIN fleeks_profiles fp ON au.id = fp.id
WHERE au.email = 'self.138@gmail.com';