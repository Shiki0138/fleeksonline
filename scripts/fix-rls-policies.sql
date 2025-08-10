-- RLSポリシーの修正と確認

-- 1. 現在のRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename LIKE 'fleeks_%'
ORDER BY tablename, policyname;

-- 2. fleeks_profilesのRLSを一時的に無効化（テスト用）
ALTER TABLE fleeks_profiles DISABLE ROW LEVEL SECURITY;

-- 3. 他のfleeks_テーブルのRLSも一時的に無効化
ALTER TABLE fleeks_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleeks_blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleeks_blog_generation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleeks_watch_history DISABLE ROW LEVEL SECURITY;

-- 4. 管理者ユーザーの存在を確認
SELECT 
  bu.id,
  bu.email,
  fp.role,
  fp.membership_type,
  fp.created_at,
  fp.updated_at
FROM beauty_users bu
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';

-- 5. RLSを再度有効化する場合は以下を実行
-- ALTER TABLE fleeks_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_videos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_blog_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_blog_generation_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleeks_watch_history ENABLE ROW LEVEL SECURITY;