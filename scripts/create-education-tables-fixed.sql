-- 既存のテーブルを削除（データがある場合は注意）
DROP TABLE IF EXISTS education_contents CASCADE;
DROP TABLE IF EXISTS education_chapters CASCADE;

-- 教育チャプターテーブル
CREATE TABLE education_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_number INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 教育コンテンツテーブル
CREATE TABLE education_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES education_chapters(id) ON DELETE CASCADE,
  article_number INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  preview_content TEXT,
  excerpt TEXT,
  is_premium BOOLEAN DEFAULT false,
  access_level VARCHAR(20) NOT NULL,
  reading_time INT DEFAULT 7,
  featured_image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft',
  publish_date TIMESTAMP WITH TIME ZONE,
  seo_title VARCHAR(255),
  seo_description TEXT,
  internal_links JSONB DEFAULT '[]'::jsonb,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- チャプターデータを挿入
INSERT INTO education_chapters (chapter_number, title, category, icon, description) VALUES
(1, '初心者編', 'beginner', '🌱', '美容師としての基本的なスキルと心構えを学びます'),
(2, '経営編', 'management', '💼', '美容室経営に必要な知識とノウハウを習得します'),
(3, 'DX・テクノロジー編', 'dx', '🚀', '最新技術を活用した美容室運営を学びます'),
(4, '総合スキルアップ編', 'general', '🎯', '美容師としての総合的なスキル向上を目指します');

-- RLSを有効化
ALTER TABLE education_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_contents ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成
CREATE POLICY "Everyone can view chapters" ON education_chapters
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view contents" ON education_contents
  FOR SELECT USING (true);