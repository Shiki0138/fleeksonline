-- 一般ユーザーアカウントの作成
-- このSQLをSupabaseのSQLエディタで実行してください

-- まず beauty_users テーブルの構造を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'beauty_users' 
ORDER BY ordinal_position;

-- 1. beauty_users テーブルに一般ユーザーを挿入
-- ⚠️ 注意：テーブル構造確認後に実際のカラム名に変更してください
-- 以下は一般的なカラム名の例です

-- 方法1：基本的なカラムのみで作成
INSERT INTO beauty_users (
    email, 
    -- password または encrypted_password （実際のカラム名を確認）
    created_at, 
    updated_at
)
VALUES (
    'mail@invest-master.net',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 方法2：Supabaseの標準auth.usersテーブル形式（もしこの構造なら）
/*
INSERT INTO beauty_users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    aud,
    role
)
VALUES (
    'mail@invest-master.net',
    crypt('Skyosai51', gen_salt('bf')),
    NOW(),
    NOW(), 
    NOW(),
    '{"email": "mail@invest-master.net", "name": "投資マスター"}'::jsonb,
    'authenticated',
    'authenticated'
) ON CONFLICT (email) DO NOTHING;
*/

-- 2. 作成されたユーザーのIDを取得してfleeks_profilesに挿入
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
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 確認用クエリ（実際のカラム名に合わせる）
SELECT 
    bu.id,
    bu.email,
    -- bu.email_confirmed_at,  -- 存在しない場合はコメントアウト
    bu.created_at,
    fp.username,
    fp.full_name,
    fp.membership_type,
    fp.role
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'mail@invest-master.net';