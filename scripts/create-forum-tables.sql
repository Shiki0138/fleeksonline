-- フォーラム機能の初期化スクリプト
-- 既存のテーブルがない場合は、まずこのスクリプトを実行してください

-- ユーザープロフィール拡張
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  nickname VARCHAR(50) UNIQUE;
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  bio TEXT;
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  avatar_url TEXT;
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  experience_years INTEGER;
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  prefecture VARCHAR(20);
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  specialty_tags TEXT[];
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  forum_points INTEGER DEFAULT 0;
ALTER TABLE fleeks_profiles ADD COLUMN IF NOT EXISTS
  forum_rank VARCHAR(20) DEFAULT 'beginner';

-- ニックネームのデフォルト値を設定（既存ユーザー用）
UPDATE fleeks_profiles 
SET nickname = CONCAT('美容師#', RIGHT(id::text, 4))
WHERE nickname IS NULL;

-- フォーラムカテゴリー
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 初期カテゴリーの挿入（既存データがない場合のみ）
INSERT INTO forum_categories (name, slug, description, icon, display_order) 
SELECT * FROM (VALUES
  ('接客・サービス', 'customer-service', 'お客様対応、接客マナー、コミュニケーションについて', 'smile', 1),
  ('経営・マーケティング', 'business-marketing', '美容室経営、集客、マーケティング戦略について', 'trending-up', 2),
  ('技術相談', 'technical-advice', 'カット、カラー、パーマなどの技術的な相談', 'scissors', 3),
  ('商品・薬剤', 'products-chemicals', 'シャンプー、トリートメント、薬剤についての情報交換', 'beaker', 4),
  ('キャリア・転職', 'career-job', 'キャリアアップ、転職、独立についての相談', 'briefcase', 5),
  ('その他・雑談', 'others-chat', 'その他の話題や雑談', 'message-circle', 6)
) AS v(name, slug, description, icon, display_order)
WHERE NOT EXISTS (SELECT 1 FROM forum_categories);

-- 質問テーブル
CREATE TABLE IF NOT EXISTS forum_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES forum_categories(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 回答テーブル
CREATE TABLE IF NOT EXISTS forum_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES forum_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_best_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- コメントテーブル
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id UUID REFERENCES forum_answers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- いいねテーブル
CREATE TABLE IF NOT EXISTS forum_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES forum_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES forum_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_like UNIQUE(user_id, question_id, answer_id),
  CONSTRAINT like_target CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 通報テーブル
CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES forum_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES forum_answers(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT report_target CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- フォローテーブル（質問のフォロー）
CREATE TABLE IF NOT EXISTS forum_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES forum_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE(user_id, question_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_questions_category ON forum_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_user ON forum_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_created ON forum_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question ON forum_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user ON forum_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_likes_user ON forum_likes(user_id);

-- RLS（Row Level Security）ポリシー
ALTER TABLE forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_follows ENABLE ROW LEVEL SECURITY;

-- 質問のRLSポリシー
DROP POLICY IF EXISTS "Anyone can view questions" ON forum_questions;
CREATE POLICY "Anyone can view questions" ON forum_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create questions" ON forum_questions;
CREATE POLICY "Authenticated users can create questions" ON forum_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own questions" ON forum_questions;
CREATE POLICY "Users can update their own questions" ON forum_questions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own questions" ON forum_questions;
CREATE POLICY "Users can delete their own questions" ON forum_questions
  FOR DELETE USING (auth.uid() = user_id);

-- 回答のRLSポリシー
DROP POLICY IF EXISTS "Anyone can view answers" ON forum_answers;
CREATE POLICY "Anyone can view answers" ON forum_answers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create answers" ON forum_answers;
CREATE POLICY "Authenticated users can create answers" ON forum_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own answers" ON forum_answers;
CREATE POLICY "Users can update their own answers" ON forum_answers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own answers" ON forum_answers;
CREATE POLICY "Users can delete their own answers" ON forum_answers
  FOR DELETE USING (auth.uid() = user_id);

-- 通知のRLSポリシー
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- トリガー関数：回答が投稿されたときに質問者に通知
CREATE OR REPLACE FUNCTION notify_question_author()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT 
    q.user_id,
    'new_answer',
    'あなたの質問に回答がありました',
    substring(NEW.content, 1, 100) || '...',
    '/forum/questions/' || q.id
  FROM forum_questions q
  WHERE q.id = NEW.question_id
    AND q.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS on_new_answer ON forum_answers;
CREATE TRIGGER on_new_answer
  AFTER INSERT ON forum_answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_question_author();

-- ベストアンサー選択時の通知
CREATE OR REPLACE FUNCTION notify_best_answer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_best_answer = true AND OLD.is_best_answer = false THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'best_answer',
      'あなたの回答がベストアンサーに選ばれました！',
      'おめでとうございます！50ポイントを獲得しました。',
      '/forum/questions/' || NEW.question_id
    );
    
    -- ポイントを加算
    UPDATE fleeks_profiles
    SET forum_points = forum_points + 50
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_best_answer_selected ON forum_answers;
CREATE TRIGGER on_best_answer_selected
  AFTER UPDATE ON forum_answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_best_answer();