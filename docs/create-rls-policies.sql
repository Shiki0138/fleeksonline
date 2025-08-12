-- RLSポリシー作成SQL

-- 1. RLSを有効化
ALTER TABLE education_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_contents ENABLE ROW LEVEL SECURITY;

-- 2. education_chapters テーブルのポリシー
-- 全員が読み取り可能
CREATE POLICY "Allow public read access on education_chapters" ON education_chapters
    FOR SELECT
    USING (true);

-- 管理者のみ作成・更新・削除可能
CREATE POLICY "Allow admin full access on education_chapters" ON education_chapters
    FOR ALL
    USING (auth.jwt() ->> 'email' = 'greenroom51@gmail.com');

-- 3. education_contents テーブルのポリシー
-- 全員が公開済みコンテンツを読み取り可能
CREATE POLICY "Allow public read published education_contents" ON education_contents
    FOR SELECT
    USING (status = 'published');

-- 管理者は全てのコンテンツを読み取り可能
CREATE POLICY "Allow admin read all education_contents" ON education_contents
    FOR SELECT
    USING (auth.jwt() ->> 'email' = 'greenroom51@gmail.com');

-- 管理者のみ作成・更新・削除可能
CREATE POLICY "Allow admin write education_contents" ON education_contents
    FOR INSERT
    USING (auth.jwt() ->> 'email' = 'greenroom51@gmail.com');

CREATE POLICY "Allow admin update education_contents" ON education_contents
    FOR UPDATE
    USING (auth.jwt() ->> 'email' = 'greenroom51@gmail.com');

CREATE POLICY "Allow admin delete education_contents" ON education_contents
    FOR DELETE
    USING (auth.jwt() ->> 'email' = 'greenroom51@gmail.com');

-- 4. ポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies
WHERE 
    tablename IN ('education_chapters', 'education_contents')
ORDER BY 
    tablename, policyname;