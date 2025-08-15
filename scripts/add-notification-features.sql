-- 管理者通知機能のデータベース拡張

-- 1. ユーザープロフィールにプッシュ通知関連フィールドを追加
ALTER TABLE fleeks_profiles 
  ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE fleeks_profiles 
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"forum_notifications": true, "answer_notifications": true, "system_notifications": true}';

-- 2. 通知テーブルにメタデータフィールドを追加
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- 3. 管理者への新規質問通知トリガー関数
CREATE OR REPLACE FUNCTION notify_admins_new_question()
RETURNS TRIGGER AS $$
BEGIN
  -- 管理者に通知を作成
  INSERT INTO notifications (user_id, type, title, message, link, priority, metadata)
  SELECT 
    p.id,
    'new_question',
    '新しい質問が投稿されました',
    CASE 
      WHEN NEW.is_anonymous THEN '匿名ユーザーから: ' || substring(NEW.title, 1, 50) || '...'
      ELSE u.nickname || 'から: ' || substring(NEW.title, 1, 50) || '...'
    END,
    '/admin/forum?question=' || NEW.id,
    2, -- 高優先度
    json_build_object(
      'questionId', NEW.id,
      'questionTitle', NEW.title,
      'isAnonymous', NEW.is_anonymous,
      'categoryId', NEW.category_id,
      'timestamp', NOW()
    )
  FROM fleeks_profiles p
  LEFT JOIN fleeks_profiles u ON u.id = NEW.user_id
  WHERE p.role = 'admin'
    AND (p.notification_preferences->>'forum_notifications')::boolean = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 新規質問通知トリガーの作成
DROP TRIGGER IF EXISTS on_new_question_notify_admins ON forum_questions;
CREATE TRIGGER on_new_question_notify_admins
  AFTER INSERT ON forum_questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_question();

-- 5. 未読通知数を取得するビュー
CREATE OR REPLACE VIEW admin_notification_summary AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE is_read = false AND type = 'new_question') as unread_questions,
  COUNT(*) FILTER (WHERE is_read = false AND priority >= 2) as high_priority_count,
  MAX(created_at) as latest_notification
FROM notifications
WHERE user_id IN (
  SELECT id FROM fleeks_profiles WHERE role = 'admin'
)
GROUP BY user_id;

-- 6. リアルタイム通知用の関数
CREATE OR REPLACE FUNCTION get_admin_notifications(admin_id UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  title VARCHAR,
  message TEXT,
  link TEXT,
  is_read BOOLEAN,
  priority INTEGER,
  metadata JSONB,
  created_at TIMESTAMP,
  time_ago TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.link,
    n.is_read,
    n.priority,
    n.metadata,
    n.created_at,
    CASE
      WHEN n.created_at > NOW() - INTERVAL '1 minute' THEN 'たった今'
      WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(minutes FROM NOW() - n.created_at)::text || '分前'
      WHEN n.created_at > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(hours FROM NOW() - n.created_at)::text || '時間前'
      WHEN n.created_at > NOW() - INTERVAL '1 week' THEN 
        EXTRACT(days FROM NOW() - n.created_at)::text || '日前'
      ELSE '1週間以上前'
    END as time_ago
  FROM notifications n
  WHERE n.user_id = admin_id
  ORDER BY n.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 7. 通知を既読にする関数
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true 
  WHERE id = notification_id AND user_id = admin_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 8. 全通知を既読にする関数
CREATE OR REPLACE FUNCTION mark_all_notifications_read(admin_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = true 
  WHERE user_id = admin_id AND is_read = false;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- 9. 古い通知の自動削除（30日以上経過）
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority);
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON fleeks_profiles(push_token) WHERE push_token IS NOT NULL;