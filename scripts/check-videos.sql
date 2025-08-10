-- 動画データの確認
SELECT 
  id,
  title,
  youtube_id,
  duration,
  is_premium,
  category,
  published_at
FROM fleeks_videos
ORDER BY published_at DESC
LIMIT 10;

-- YouTube IDが設定されていない動画を確認
SELECT COUNT(*) as no_youtube_id_count
FROM fleeks_videos
WHERE youtube_id IS NULL OR youtube_id = '';

-- サンプル動画データの挿入（必要に応じて）
-- INSERT INTO fleeks_videos (
--   title,
--   youtube_id,
--   description,
--   duration,
--   is_premium,
--   category,
--   published_at
-- ) VALUES 
-- (
--   'Instagram集客の基本戦略',
--   'dQw4w9WgXcQ', -- サンプルYouTube ID（実際のIDに変更してください）
--   'Instagramを使った効果的な集客方法について解説します。',
--   600, -- 10分
--   false,
--   'Instagram集客',
--   NOW()
-- ),
-- (
--   '顧客心理を理解する接客術',
--   'jNQXAC9IVRw', -- サンプルYouTube ID（実際のIDに変更してください）
--   '顧客の心理を理解し、リピート率を上げる接客方法を学びます。',
--   900, -- 15分
--   true,
--   '接客スキル',
--   NOW()
-- );