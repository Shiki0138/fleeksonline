# 教育コンテンツシステムのセットアップ

## 1. Supabaseでテーブル作成

Supabaseダッシュボードで以下のSQLを実行：

```sql
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
CREATE INDEX idx_education_contents_chapter_id ON education_contents(chapter_id);
CREATE INDEX idx_education_contents_is_premium ON education_contents(is_premium);
CREATE INDEX idx_education_contents_status ON education_contents(status);
CREATE INDEX idx_education_contents_slug ON education_contents(slug);

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

-- 管理者のみ編集可能
CREATE POLICY "Admins can manage education chapters" ON education_chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage education contents" ON education_contents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 章データの挿入
INSERT INTO education_chapters (chapter_number, title, slug, description, sort_order) VALUES
  (1, '第1部：新人美容師の基礎教養', 'chapter-1-beginner-basics', '美容師としての基本的な心構えとマナーを学びます', 1),
  (2, '第2部：美容室経営の実践知識', 'chapter-2-salon-management', '独立開業から経営管理まで実践的な知識を身につけます', 2),
  (3, '第3部：AI時代の美容室DX', 'chapter-3-digital-transformation', '最新技術を活用した美容室運営を学びます', 3),
  (4, '第4部：一人前の美容師への道', 'chapter-4-professional-growth', 'プロフェッショナルとしての成長戦略を構築します', 4);

-- 画像候補のテーブル
CREATE TABLE IF NOT EXISTS content_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- デフォルト画像を挿入
INSERT INTO content_images (category, image_url, description) VALUES
  ('beginner', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', '美容師の基礎'),
  ('beginner', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800', 'カット練習'),
  ('management', 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800', '経営戦略'),
  ('management', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', 'ビジネス分析'),
  ('dx', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', 'デジタル技術'),
  ('dx', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', 'データ分析'),
  ('general', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', '美容室風景'),
  ('general', 'https://images.unsplash.com/photo-1633681926022-84c23e6b2edd?w=800', 'スタイリング');
```

## 2. スケジューラーの切り替え

### 現在のスケジューラーを停止
```bash
pm2 stop content-scheduler
pm2 delete content-scheduler
```

### 新しい教育コンテンツスケジューラーを開始
```bash
# テスト投稿
node scripts/content-scheduler-education.js post

# PM2で永続化
pm2 start scripts/content-scheduler-education.js --name education-scheduler -- schedule
pm2 save
```

## 3. 管理画面の確認

1. `/admin/education` - 教育コンテンツ一覧
2. `/admin/education/new` - 新規作成
3. `/education` - ユーザー向け教育コンテンツページ

## 4. 画像の自動配置

教育コンテンツには以下の位置に画像が自動配置されます：

1. **タイトル直下**: メイン画像
2. **各h2見出しの直下**: セクション画像

例：
```html
<h1>記事タイトル</h1>
<img src="メイン画像" />

<p>導入文...</p>

<h2>セクション1</h2>
<img src="セクション画像1" />
<p>内容...</p>

<h2>セクション2</h2>
<img src="セクション画像2" />
<p>内容...</p>
```

## 5. ブログとの使い分け

- **教育コンテンツ** (`/education`)
  - 体系的な学習コンテンツ
  - 章立て構造
  - 有料/無料の明確な区分
  - 学習進捗管理

- **ブログ** (`/blog`)
  - ニュース、お知らせ
  - トレンド情報
  - イベントレポート
  - 時事的な内容

## 6. 既存のコンテンツ移行

既にblog_postsに投稿された教育系コンテンツを移行する場合：

```sql
-- 既存の教育系記事を確認
SELECT title, category, is_premium, created_at 
FROM blog_posts 
WHERE category IN ('beginner', 'management', 'dx', 'general')
ORDER BY created_at DESC;

-- 必要に応じて手動で移行またはスクリプトで一括移行
```