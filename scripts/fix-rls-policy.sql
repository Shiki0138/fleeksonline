-- RLSポリシーを更新して、誰でも公開記事を読めるようにする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Everyone can view contents" ON education_contents;
DROP POLICY IF EXISTS "Published education contents are viewable by everyone" ON education_contents;

-- 新しいポリシーを作成（より寛容な設定）
CREATE POLICY "Anyone can read education contents" 
ON education_contents 
FOR SELECT 
USING (true);

-- テスト用: 一時的にRLSを無効化することも可能
-- ALTER TABLE education_contents DISABLE ROW LEVEL SECURITY;

-- 現在のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'education_contents';