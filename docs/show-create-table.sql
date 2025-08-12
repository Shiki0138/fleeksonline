-- テーブル定義の確認

-- 1. education_chaptersテーブルの定義を表示
SELECT 
    'CREATE TABLE education_chapters (' || string_agg(
        column_name || ' ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' 
        END ||
        CASE 
            WHEN is_nullable = 'NO' 
            THEN ' NOT NULL' 
            ELSE '' 
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END, 
        ', '
    ) || ');' AS create_statement
FROM information_schema.columns
WHERE table_name = 'education_chapters'
GROUP BY table_name;

-- 2. education_contentsテーブルの定義を表示
SELECT 
    'CREATE TABLE education_contents (' || string_agg(
        column_name || ' ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' 
        END ||
        CASE 
            WHEN is_nullable = 'NO' 
            THEN ' NOT NULL' 
            ELSE '' 
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END, 
        ', '
    ) || ');' AS create_statement
FROM information_schema.columns
WHERE table_name = 'education_contents'
GROUP BY table_name;