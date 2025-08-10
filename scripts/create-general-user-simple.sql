-- 簡単な方法：Supabase Authを使用してユーザーを作成
-- 1. Supabase Dashboard > Authentication > Users で手動作成
-- 2. Email: mail@invest-master.net
-- 3. Password: Skyosai51
-- 4. Email Confirmed: true にチェック

-- その後、以下のSQLでプロファイルを作成
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

-- まずbeauty_usersテーブルの構造を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'beauty_users' 
ORDER BY ordinal_position;

-- 確認用クエリ（実際のカラム名に合わせる）
SELECT 
    bu.id,
    bu.email,
    -- bu.email_confirmed_at,  -- このカラムが存在しない場合はコメントアウト
    bu.created_at,
    fp.username,
    fp.full_name,
    fp.membership_type,
    fp.role
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'mail@invest-master.net';