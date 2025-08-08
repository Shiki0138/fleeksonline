-- 一般ユーザーアカウントの作成
-- このSQLをSupabaseのSQLエディタで実行してください

-- 1. beauty_users テーブルに一般ユーザーを挿入
INSERT INTO beauty_users (email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, confirmation_token, email_confirm_token, recovery_token, aud, role, instance_id, confirmation_sent_at, recovery_sent_at, email_change_token_new, email_change_confirm_status, banned_until, deleted_at, is_sso_user)
VALUES (
    'mail@invest-master.net',
    crypt('Skyosai51', gen_salt('bf')), -- パスワードをハッシュ化
    NOW(),                              -- 即座に確認済みに
    NOW(),
    NOW(),
    '{"email": "mail@invest-master.net", "name": "投資マスター"}',
    '',
    '',
    '',
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000',
    NOW(),
    NULL,
    '',
    0,
    NULL,
    NULL,
    false
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