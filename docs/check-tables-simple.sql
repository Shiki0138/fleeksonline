-- 教育コンテンツ関連テーブルの構造確認SQL（シンプル版）

-- 1. education_chapters テーブルの全カラムを確認
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'education_chapters'
ORDER BY ordinal_position;

-- 2. education_contents テーブルの全カラムを確認
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'education_contents'
ORDER BY ordinal_position;

-- 3. 各テーブルのサンプルデータ（1行のみ）
SELECT * FROM education_chapters LIMIT 1;
SELECT * FROM education_contents LIMIT 1;