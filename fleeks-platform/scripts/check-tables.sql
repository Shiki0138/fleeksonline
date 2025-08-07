-- テーブル構造の確認用SQL
-- 現在のテーブル構造を確認します

-- 1. 既存のテーブル一覧を確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. 各テーブルのカラム構造を確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'videos', 'watch_history', 'favorites')
ORDER BY table_name, ordinal_position;