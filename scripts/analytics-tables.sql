-- アナリティクス用のテーブルとトリガーを作成
-- 実行日: 2025-08-08

-- 1. 日次ユーザー統計テーブル
CREATE TABLE IF NOT EXISTS fleeks_daily_user_stats (
  date DATE PRIMARY KEY,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 視聴履歴の詳細追跡（既存のfleeks_watch_historyを拡張）
-- watched_secondsフィールドで実際の視聴時間を記録

-- 3. 動画視聴数を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_video_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 新しい視聴履歴が作成されたら、動画のview_countを増やす
  UPDATE fleeks_videos
  SET view_count = view_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.video_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成（まだ存在しない場合）
DROP TRIGGER IF EXISTS update_video_views_trigger ON fleeks_watch_history;
CREATE TRIGGER update_video_views_trigger
AFTER INSERT ON fleeks_watch_history
FOR EACH ROW
EXECUTE FUNCTION update_video_view_count();

-- 4. 日次統計を更新する関数
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  new_user_count INTEGER;
  active_user_count INTEGER;
  total_user_count INTEGER;
BEGIN
  -- 今日の新規ユーザー数
  SELECT COUNT(*) INTO new_user_count
  FROM fleeks_profiles
  WHERE DATE(created_at) = today;
  
  -- 今日のアクティブユーザー数（視聴履歴がある）
  SELECT COUNT(DISTINCT user_id) INTO active_user_count
  FROM fleeks_watch_history
  WHERE DATE(last_watched_at) = today;
  
  -- 総ユーザー数
  SELECT COUNT(*) INTO total_user_count
  FROM fleeks_profiles;
  
  -- 統計を更新または挿入
  INSERT INTO fleeks_daily_user_stats (date, new_users, active_users, total_users)
  VALUES (today, new_user_count, active_user_count, total_user_count)
  ON CONFLICT (date) DO UPDATE
  SET new_users = EXCLUDED.new_users,
      active_users = EXCLUDED.active_users,
      total_users = EXCLUDED.total_users;
END;
$$ LANGUAGE plpgsql;

-- 5. 平均視聴時間を計算する関数
CREATE OR REPLACE FUNCTION get_average_watch_time(days INTEGER DEFAULT 30)
RETURNS NUMERIC AS $$
DECLARE
  avg_time NUMERIC;
BEGIN
  SELECT AVG(watched_seconds) INTO avg_time
  FROM fleeks_watch_history
  WHERE last_watched_at >= CURRENT_DATE - INTERVAL '1 day' * days;
  
  RETURN COALESCE(avg_time, 0);
END;
$$ LANGUAGE plpgsql;

-- 6. ユーザー成長データを取得する関数
CREATE OR REPLACE FUNCTION get_user_growth(days INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.date,
    COALESCE(d.total_users, 0) as count
  FROM generate_series(
    CURRENT_DATE - INTERVAL '1 day' * (days - 1),
    CURRENT_DATE,
    INTERVAL '1 day'
  ) s(date)
  LEFT JOIN fleeks_daily_user_stats d ON s.date = d.date
  ORDER BY s.date;
END;
$$ LANGUAGE plpgsql;

-- 7. 初期データを生成（過去30日分）
DO $$
DECLARE
  i INTEGER;
  current_total INTEGER := 0;
BEGIN
  -- 現在の総ユーザー数を取得
  SELECT COUNT(*) INTO current_total FROM fleeks_profiles;
  
  -- 過去30日分のダミーデータを生成
  FOR i IN REVERSE 29..0 LOOP
    INSERT INTO fleeks_daily_user_stats (date, new_users, active_users, total_users)
    VALUES (
      CURRENT_DATE - INTERVAL '1 day' * i,
      FLOOR(RANDOM() * 5 + 1)::INTEGER, -- 1-5人の新規ユーザー
      FLOOR(RANDOM() * 10 + 5)::INTEGER, -- 5-15人のアクティブユーザー
      GREATEST(current_total - (i * 2), 0) -- 徐々に増加
    )
    ON CONFLICT (date) DO NOTHING;
  END LOOP;
END $$;

-- 8. Supabase RPCとして関数を公開
-- アプリケーションから以下のように呼び出せます：
-- const { data } = await supabase.rpc('get_average_watch_time', { days: 30 })
-- const { data } = await supabase.rpc('get_user_growth', { days: 30 })