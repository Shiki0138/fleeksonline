-- FLEEKS セットアップ状況の確認

-- 1. beauty_usersにgreenroom51@gmail.comが存在するか確認
SELECT id, email, created_at 
FROM beauty_users 
WHERE email = 'greenroom51@gmail.com';

-- 2. fleeks_profilesテーブルが存在するか確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'fleeks_profiles'
) as table_exists;

-- 3. fleeks_profilesにデータが入っているか確認
SELECT COUNT(*) as profile_count FROM fleeks_profiles;

-- 4. 関数が存在するか確認
SELECT proname 
FROM pg_proc 
WHERE proname IN ('fleeks_get_current_user_id', 'fleeks_is_admin');

-- 5. もしfleeks_profilesが空の場合、手動でデータを挿入
-- まずbeauty_usersからIDを確認
SELECT id, email FROM beauty_users WHERE email = 'greenroom51@gmail.com';

-- 上記で取得したIDを使って、fleeks_profilesにデータを挿入
-- INSERT INTO fleeks_profiles (id, full_name, role, membership_type)
-- VALUES (
--   'ここに上記で取得したIDを入れる',
--   'Administrator',
--   'admin',
--   'vip'
-- );