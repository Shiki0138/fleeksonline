-- beauty_usersテーブルの構造を確認

-- テーブルのカラム一覧を表示
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'beauty_users'
ORDER BY ordinal_position;

-- サンプルデータを確認（最初の1行）
SELECT * FROM beauty_users LIMIT 1;