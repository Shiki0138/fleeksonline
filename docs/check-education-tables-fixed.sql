-- 教育コンテンツ関連テーブルの構造確認SQL（修正版）

-- 1. education_chapters テーブルの構造確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'education_chapters'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 2. education_contents テーブルの構造確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'education_contents'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 3. 外部キー制約の確認
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('education_chapters', 'education_contents');

-- 4. インデックスの確認
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename IN ('education_chapters', 'education_contents')
    AND schemaname = 'public';

-- 5. RLSポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    tablename IN ('education_chapters', 'education_contents')
    AND schemaname = 'public';

-- 6. サンプルデータの確認（education_chapters）- カラムを動的に取得
SELECT * 
FROM education_chapters
ORDER BY id
LIMIT 5;

-- 7. サンプルデータの確認（education_contents）- カラムを動的に取得
SELECT * 
FROM education_contents
ORDER BY article_number
LIMIT 5;

-- 8. リレーション確認（結合テスト）- カラムを動的に取得
SELECT 
    ec.*,
    ech.*
FROM 
    education_contents ec
    LEFT JOIN education_chapters ech ON ec.education_chapter_id = ech.id
ORDER BY 
    ec.article_number
LIMIT 10;