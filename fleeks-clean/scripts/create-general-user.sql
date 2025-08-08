-- 一般ユーザーアカウントの作成
-- このSQLをSupabaseのSQLエディタで実行してください

-- まず beauty_users テーブルの構造を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'beauty_users' 
ORDER BY ordinal_position;

-- 1. beauty_users テーブルに一般ユーザーを挿入
-- 実際のカラム名に合わせて修正
INSERT INTO beauty_users (
    email, 
    password,  -- encrypted_password ではなく password の可能性
    email_confirmed_at, 
    created_at, 
    updated_at, 
    raw_user_meta_data
)
VALUES (
    'mail@invest-master.net',
    crypt('Skyosai51', gen_salt('bf')), -- パスワードをハッシュ化
    NOW(),                              -- 即座に確認済みに
    NOW(),
    NOW(),
    '{"email": "mail@invest-master.net", "name": "投資マスター"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

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

-- 確認用クエリ
SELECT 
    bu.id,
    bu.email,
    bu.email_confirmed_at,
    fp.username,
    fp.full_name,
    fp.membership_type,
    fp.role
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'mail@invest-master.net';