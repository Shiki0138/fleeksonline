-- FLEEKS Profile 同期スクリプト
-- beauty_usersに新規ユーザーが追加された時にfleeks_profilesを作成
-- 既存のbeauty_usersテーブルには触れず、イベントに反応するのみ

-- ===================================
-- 方法1: 手動同期（推奨）
-- 定期的に実行してbeauty_usersとfleeks_profilesを同期
-- ===================================

-- 既存のbeauty_usersユーザーでfleeks_profilesがないものを作成
INSERT INTO fleeks_profiles (id, full_name, role)
SELECT 
  bu.id,
  split_part(bu.email, '@', 1), -- メールアドレスのユーザー名部分を使用
  CASE 
    WHEN bu.email = 'greenroom51@gmail.com' THEN 'admin'
    ELSE 'user'
  END
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE fp.id IS NULL;

-- ===================================
-- 方法2: ビューを使用（代替案）
-- fleeks_profilesの代わりにビューを作成
-- ===================================

-- CREATE OR REPLACE VIEW fleeks_user_profiles AS
-- SELECT 
--   bu.id,
--   bu.email,
--   COALESCE(fp.username, split_part(bu.email, '@', 1)) as username,
--   COALESCE(fp.full_name, split_part(bu.email, '@', 1)) as full_name,
--   COALESCE(fp.membership_type, 'free') as membership_type,
--   fp.membership_expires_at,
--   COALESCE(fp.role, CASE WHEN bu.email = 'greenroom51@gmail.com' THEN 'admin' ELSE 'user' END) as role,
--   COALESCE(fp.created_at, bu.created_at) as created_at,
--   COALESCE(fp.updated_at, bu.updated_at) as updated_at
-- FROM beauty_users bu
-- LEFT JOIN fleeks_profiles fp ON bu.id = fp.id;

-- ===================================
-- 管理者ユーザーの設定
-- ===================================

-- 管理者ユーザーのプロファイルを作成/更新
INSERT INTO fleeks_profiles (id, full_name, role, membership_type)
SELECT 
  id,
  'Administrator',
  'admin',
  'vip'
FROM beauty_users
WHERE email = 'greenroom51@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  membership_type = 'vip';

-- ===================================
-- 検証クエリ
-- ===================================

-- 管理者ユーザーの確認
SELECT 
  bu.id,
  bu.email,
  fp.role,
  fp.membership_type,
  fp.full_name
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- 同期状況の確認
SELECT 
  COUNT(bu.id) as beauty_users_count,
  COUNT(fp.id) as fleeks_profiles_count,
  COUNT(bu.id) - COUNT(fp.id) as unsynced_users
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id;