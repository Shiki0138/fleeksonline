-- 教育コンテンツ用の修正版SQL

-- UUIDエクステンションを有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 章（チャプター）テーブル
CREATE TABLE IF NOT EXISTS education_chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 教育コンテンツテーブル
CREATE TABLE IF NOT EXISTS education_contents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_id UUID REFERENCES education_chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  preview_content TEXT,
  excerpt TEXT,
  featured_image VARCHAR(500),
  is_premium BOOLEAN DEFAULT false,
  category VARCHAR(50) CHECK (category IN ('beginner', 'management', 'dx', 'general')),
  reading_time INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_education_contents_chapter_id ON education_contents(chapter_id);
CREATE INDEX IF NOT EXISTS idx_education_contents_is_premium ON education_contents(is_premium);
CREATE INDEX IF NOT EXISTS idx_education_contents_status ON education_contents(status);
CREATE INDEX IF NOT EXISTS idx_education_contents_slug ON education_contents(slug);

-- 更新トリガー
CREATE OR REPLACE FUNCTION update_education_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER education_chapters_updated_at
  BEFORE UPDATE ON education_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER education_contents_updated_at
  BEFORE UPDATE ON education_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

-- RLSポリシー
ALTER TABLE education_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_contents ENABLE ROW LEVEL SECURITY;

-- 誰でも公開されているコンテンツを閲覧可能
CREATE POLICY "Public chapters are viewable by everyone" ON education_chapters
  FOR SELECT USING (is_published = true);

CREATE POLICY "Published education contents are viewable by everyone" ON education_contents
  FOR SELECT USING (status = 'published');

-- fleeks_profilesテーブルを使用した管理者ポリシー
CREATE POLICY "Admins can manage education chapters" ON education_chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles
      WHERE fleeks_profiles.id = auth.uid()
      AND fleeks_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage education contents" ON education_contents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles
      WHERE fleeks_profiles.id = auth.uid()
      AND fleeks_profiles.role = 'admin'
    )
  );

-- 章データの挿入
INSERT INTO education_chapters (chapter_number, title, slug, description, sort_order) VALUES
  (1, '第1部：新人美容師の基礎教養', 'chapter-1-beginner-basics', '美容師としての基本的な心構えとマナーを学びます', 1),
  (2, '第2部：美容室経営の実践知識', 'chapter-2-salon-management', '独立開業から経営管理まで実践的な知識を身につけます', 2),
  (3, '第3部：AI時代の美容室DX', 'chapter-3-digital-transformation', '最新技術を活用した美容室運営を学びます', 3),
  (4, '第4部：一人前の美容師への道', 'chapter-4-professional-growth', 'プロフェッショナルとしての成長戦略を構築します', 4)
ON CONFLICT (slug) DO NOTHING;

-- 画像候補のテーブル
CREATE TABLE IF NOT EXISTS content_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- デフォルト画像を挿入（既存の場合はスキップ）
INSERT INTO content_images (category, image_url, description) VALUES
  ('beginner', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', '美容師の基礎'),
  ('beginner', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800', 'カット練習'),
  ('beginner', 'https://images.unsplash.com/photo-1559599101-f09722b4d4e8?w=800', 'ヘアスタイリング'),
  ('management', 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800', '経営戦略'),
  ('management', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', 'ビジネス分析'),
  ('management', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'チーム管理'),
  ('dx', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', 'デジタル技術'),
  ('dx', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', 'データ分析'),
  ('dx', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 'ビジネスインテリジェンス'),
  ('general', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', '美容室風景'),
  ('general', 'https://images.unsplash.com/photo-1633681926022-84c23e6b2edd?w=800', 'スタイリング'),
  ('general', 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800', 'ヘアケア')
ON CONFLICT DO NOTHING;