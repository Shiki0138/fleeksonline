-- ブログ記事テーブル
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug TEXT UNIQUE NOT NULL,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_type TEXT CHECK (source_type IN ('wordpress', 'sheets', 'notebooklm', 'manual', 'ai_generated')),
  source_url TEXT,
  original_id TEXT,
  seo_title TEXT,
  seo_description TEXT,
  featured_image TEXT,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログカテゴリテーブル
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES blog_categories(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI生成ログテーブル
CREATE TABLE IF NOT EXISTS blog_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  source_content TEXT,
  prompt TEXT,
  ai_model TEXT,
  generation_params JSONB,
  generated_content TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログコメントテーブル
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES blog_comments(id),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);

-- 更新時刻の自動更新トリガー
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

-- Row Level Security (RLS) ポリシー
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_generation_logs ENABLE ROW LEVEL SECURITY;

-- 公開記事は誰でも閲覧可能
CREATE POLICY "Public blog posts are viewable by everyone"
ON blog_posts FOR SELECT
USING (status = 'published');

-- 下書きは作成者と管理者のみ閲覧可能
CREATE POLICY "Draft posts are viewable by author and admin"
ON blog_posts FOR SELECT
USING (
  status = 'draft' AND (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- 管理者は全ての記事を作成・更新・削除可能
CREATE POLICY "Admins can manage all blog posts"
ON blog_posts FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- カテゴリは誰でも閲覧可能
CREATE POLICY "Categories are viewable by everyone"
ON blog_categories FOR SELECT
USING (true);

-- カテゴリの管理は管理者のみ
CREATE POLICY "Only admins can manage categories"
ON blog_categories FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 承認されたコメントは誰でも閲覧可能
CREATE POLICY "Approved comments are viewable by everyone"
ON blog_comments FOR SELECT
USING (is_approved = true);

-- ユーザーは自分のコメントを作成・編集可能
CREATE POLICY "Users can create and edit own comments"
ON blog_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON blog_comments FOR UPDATE
USING (auth.uid() = user_id);

-- 管理者はコメントを管理可能
CREATE POLICY "Admins can manage all comments"
ON blog_comments FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- AI生成ログは管理者のみアクセス可能
CREATE POLICY "Only admins can access generation logs"
ON blog_generation_logs FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- サンプルカテゴリの挿入
INSERT INTO blog_categories (name, slug, description, display_order) VALUES
  ('Instagram集客', 'instagram-marketing', 'Instagramを活用した効果的な集客方法', 1),
  ('経営戦略', 'business-strategy', 'ローカルビジネスの経営戦略とマーケティング', 2),
  ('接客心理学', 'customer-psychology', '顧客心理を理解した接客スキル向上', 3),
  ('デジタルマーケティング', 'digital-marketing', 'オンラインでのビジネス成長戦略', 4),
  ('事例研究', 'case-studies', '成功事例から学ぶ実践的アプローチ', 5)
ON CONFLICT (slug) DO NOTHING;