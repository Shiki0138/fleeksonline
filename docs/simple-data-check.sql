-- データ確認用の最小限クエリ

-- 1. education_chaptersの最初の1行を見る
SELECT * FROM education_chapters LIMIT 1;

-- 2. education_contentsの最初の1行を見る  
SELECT * FROM education_contents LIMIT 1;

-- 3. 両テーブルの行数を確認
SELECT 
    (SELECT COUNT(*) FROM education_chapters) as chapters_count,
    (SELECT COUNT(*) FROM education_contents) as contents_count;