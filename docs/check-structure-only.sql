-- テーブル構造のみを確認する最小限のSQL

-- 1. education_chaptersテーブルのカラム一覧
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'education_chapters'
ORDER BY ordinal_position;

-- 2. education_contentsテーブルのカラム一覧
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'education_contents'
ORDER BY ordinal_position;

-- 3. 外部キー制約の確認（どのカラムで関連付けられているか）
SELECT
    tc.table_name, 
    kcu.column_name as local_column, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'education_contents' OR tc.table_name = 'education_chapters');