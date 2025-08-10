-- FLEEKSプロジェクトのアカウント分離を強化するSQL

-- ===========================
-- 1. RLS（Row Level Security）の設定
-- ===========================

-- fleeks_profilesテーブルのRLS有効化
ALTER TABLE fleeks_profiles ENABLE ROW LEVEL SECURITY;

-- FLEEKSユーザーのみアクセス可能にするポリシー
CREATE POLICY "fleeks_users_only" ON fleeks_profiles
  FOR ALL 
  TO authenticated
  USING (auth.uid() = id);

-- ===========================
-- 2. 動画テーブルの保護
-- ===========================

-- fleeks_videosテーブルのRLS有効化
ALTER TABLE fleeks_videos ENABLE ROW LEVEL SECURITY;

-- FLEEKSメンバーのみ動画を閲覧可能
CREATE POLICY "fleeks_members_can_view" ON fleeks_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles 
      WHERE fleeks_profiles.id = auth.uid()
    )
  );

-- 管理者のみ動画を追加・編集・削除可能
CREATE POLICY "fleeks_admin_manage_videos" ON fleeks_videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles 
      WHERE fleeks_profiles.id = auth.uid()
      AND fleeks_profiles.role = 'admin'
    )
  );

-- ===========================
-- 3. ブログテーブルの保護
-- ===========================

ALTER TABLE fleeks_blog_posts ENABLE ROW LEVEL SECURITY;

-- 全員がブログを読める
CREATE POLICY "public_can_read_blogs" ON fleeks_blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- 管理者のみブログを管理
CREATE POLICY "fleeks_admin_manage_blogs" ON fleeks_blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles 
      WHERE fleeks_profiles.id = auth.uid()
      AND fleeks_profiles.role = 'admin'
    )
  );

-- ===========================
-- 4. 視聴履歴テーブルの保護
-- ===========================

ALTER TABLE fleeks_watch_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の視聴履歴のみアクセス可能
CREATE POLICY "users_own_watch_history" ON fleeks_watch_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ===========================
-- 5. プロジェクト識別用の関数
-- ===========================

-- FLEEKSユーザーかどうかを判定する関数
CREATE OR REPLACE FUNCTION is_fleeks_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fleeks_profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 6. 確認用クエリ
-- ===========================

-- RLSが有効になっているテーブルを確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename LIKE 'fleeks_%'
ORDER BY tablename;

-- 作成されたポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename LIKE 'fleeks_%'
ORDER BY tablename, policyname;