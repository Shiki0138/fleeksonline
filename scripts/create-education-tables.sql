-- 教育コンテンツ用のテーブル作成スクリプト

-- UUID拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 教育チャプターテーブル
CREATE TABLE IF NOT EXISTS education_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_number INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('beginner', 'management', 'dx', 'general')),
  description TEXT,
  icon VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 教育コンテンツテーブル
CREATE TABLE IF NOT EXISTS education_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES education_chapters(id) ON DELETE CASCADE,
  article_number INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  preview_content TEXT,
  excerpt TEXT,
  is_premium BOOLEAN DEFAULT false,
  access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('free', 'partial', 'premium')),
  reading_time INT DEFAULT 7,
  featured_image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  publish_date TIMESTAMP WITH TIME ZONE,
  seo_title VARCHAR(255),
  seo_description TEXT,
  internal_links JSONB DEFAULT '[]'::jsonb,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_education_contents_slug ON education_contents(slug);
CREATE INDEX idx_education_contents_status ON education_contents(status);
CREATE INDEX idx_education_contents_publish_date ON education_contents(publish_date);
CREATE INDEX idx_education_contents_article_number ON education_contents(article_number);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- チャプターテーブルのトリガー
CREATE TRIGGER update_education_chapters_updated_at BEFORE UPDATE
  ON education_chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- コンテンツテーブルのトリガー
CREATE TRIGGER update_education_contents_updated_at BEFORE UPDATE
  ON education_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- チャプターの初期データを挿入
INSERT INTO education_chapters (chapter_number, title, category, icon, description) VALUES
(1, '初心者編', 'beginner', '🌱', '美容師としての基本的なスキルと心構えを学びます'),
(2, '経営編', 'management', '💼', '美容室経営に必要な知識とノウハウを習得します'),
(3, 'DX・テクノロジー編', 'dx', '🚀', '最新技術を活用した美容室運営を学びます'),
(4, '総合スキルアップ編', 'general', '🎯', '美容師としての総合的なスキル向上を目指します')
ON CONFLICT (chapter_number) DO NOTHING;

-- Row Level Security (RLS) を有効化
ALTER TABLE education_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_contents ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー（全員が読める）
CREATE POLICY "Education chapters are viewable by everyone" ON education_chapters
  FOR SELECT USING (true);

CREATE POLICY "Published education contents are viewable by everyone" ON education_contents
  FOR SELECT USING (status = 'published' AND publish_date <= CURRENT_TIMESTAMP);

-- 管理者用の書き込みポリシー
CREATE POLICY "Admin can manage education chapters" ON education_chapters
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admin can manage education contents" ON education_contents
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- コメント追加
COMMENT ON TABLE education_chapters IS '教育コンテンツのチャプター管理テーブル';
COMMENT ON TABLE education_contents IS '教育コンテンツの記事管理テーブル';
COMMENT ON COLUMN education_contents.access_level IS 'アクセスレベル: free=無料, partial=一部有料, premium=有料限定';
COMMENT ON COLUMN education_contents.status IS '記事のステータス: draft=下書き, published=公開, scheduled=予約投稿';