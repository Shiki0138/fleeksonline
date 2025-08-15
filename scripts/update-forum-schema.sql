-- フォーラム機能の更新スクリプト
-- 管理者が返信した質問のみ表示する機能と、管理者による質問編集機能を追加

-- 1. 質問テーブルに管理者返信フラグと関連フィールドを追加
ALTER TABLE forum_questions 
  ADD COLUMN IF NOT EXISTS has_admin_answer BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_questions 
  ADD COLUMN IF NOT EXISTS is_admin_question BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_questions 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE forum_questions 
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id);
ALTER TABLE forum_questions 
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

-- 2. 管理者が質問を編集できるようにRLSポリシーを更新
DROP POLICY IF EXISTS "Users can update their own questions" ON forum_questions;

CREATE POLICY "Users and admins can update questions" ON forum_questions
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM fleeks_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 3. 管理者が返信した時に質問のフラグを更新するトリガー関数
CREATE OR REPLACE FUNCTION update_admin_answer_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- 回答者が管理者かチェック
  IF EXISTS (
    SELECT 1 FROM fleeks_profiles 
    WHERE id = NEW.user_id 
    AND role = 'admin'
  ) THEN
    -- 質問に管理者返信フラグを立てる
    UPDATE forum_questions
    SET has_admin_answer = TRUE,
        updated_at = NOW()
    WHERE id = NEW.question_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガーの作成
DROP TRIGGER IF EXISTS on_admin_answer ON forum_answers;
CREATE TRIGGER on_admin_answer
  AFTER INSERT ON forum_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_answer_flag();

-- 5. 既存の質問で管理者の回答があるものにフラグを設定
UPDATE forum_questions q
SET has_admin_answer = TRUE
WHERE EXISTS (
  SELECT 1 
  FROM forum_answers a
  JOIN fleeks_profiles p ON a.user_id = p.id
  WHERE a.question_id = q.id
  AND p.role = 'admin'
);

-- 6. 管理者用のビューを作成（管理画面で全質問を見るため）
CREATE OR REPLACE VIEW forum_questions_admin_view AS
SELECT 
  q.*,
  p.nickname,
  p.avatar_url,
  p.membership_type,
  p.role,
  COUNT(DISTINCT a.id) as answer_count,
  COUNT(DISTINCT CASE WHEN ap.role = 'admin' THEN a.id END) as admin_answer_count
FROM forum_questions q
LEFT JOIN fleeks_profiles p ON q.user_id = p.id
LEFT JOIN forum_answers a ON q.id = a.question_id
LEFT JOIN fleeks_profiles ap ON a.user_id = ap.id
GROUP BY q.id, p.nickname, p.avatar_url, p.membership_type, p.role;

-- 7. インデックスの追加
CREATE INDEX IF NOT EXISTS idx_questions_admin_answer ON forum_questions(has_admin_answer);
CREATE INDEX IF NOT EXISTS idx_questions_admin_question ON forum_questions(is_admin_question);
CREATE INDEX IF NOT EXISTS idx_questions_priority ON forum_questions(priority);

-- 8. 管理者の質問編集履歴テーブル
CREATE TABLE IF NOT EXISTS forum_question_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES forum_questions(id) ON DELETE CASCADE,
  editor_id UUID REFERENCES auth.users(id),
  title_before TEXT,
  title_after TEXT,
  content_before TEXT,
  content_after TEXT,
  edit_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 編集履歴のRLSポリシー
ALTER TABLE forum_question_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view edit history" ON forum_question_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "System can create edit history" ON forum_question_edits
  FOR INSERT WITH CHECK (true);

-- 9. 質問編集時の履歴記録関数
CREATE OR REPLACE FUNCTION log_question_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- 管理者チェック
  IF EXISTS (
    SELECT 1 FROM fleeks_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    IF OLD.title != NEW.title OR OLD.content != NEW.content THEN
      INSERT INTO forum_question_edits (
        question_id,
        editor_id,
        title_before,
        title_after,
        content_before,
        content_after
      ) VALUES (
        NEW.id,
        auth.uid(),
        OLD.title,
        NEW.title,
        OLD.content,
        NEW.content
      );
      
      -- edited_by と edited_at を更新
      NEW.edited_by = auth.uid();
      NEW.edited_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 編集トリガーの作成
DROP TRIGGER IF EXISTS on_question_edit ON forum_questions;
CREATE TRIGGER on_question_edit
  BEFORE UPDATE ON forum_questions
  FOR EACH ROW
  EXECUTE FUNCTION log_question_edit();