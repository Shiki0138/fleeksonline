# Supabase教育コンテンツセットアップガイド

## 手動でテーブルを作成する手順

### 1. Supabaseダッシュボードにログイン
https://app.supabase.com/

### 2. SQL Editorを開く
左側メニューから「SQL Editor」を選択

### 3. 以下のSQLを実行

```sql
-- UUID拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 教育チャプターテーブル（既に存在する場合はスキップ）
CREATE TABLE IF NOT EXISTS education_chapters (
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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_education_contents_slug ON education_contents(slug);
CREATE INDEX IF NOT EXISTS idx_education_contents_status ON education_contents(status);
CREATE INDEX IF NOT EXISTS idx_education_contents_publish_date ON education_contents(publish_date);
CREATE INDEX IF NOT EXISTS idx_education_contents_article_number ON education_contents(article_number);
```

### 4. チャプターデータを挿入（既に存在する場合はスキップ）

```sql
INSERT INTO education_chapters (chapter_number, title, category, icon, description) VALUES
(1, '初心者編', 'beginner', '🌱', '美容師としての基本的なスキルと心構えを学びます'),
(2, '経営編', 'management', '💼', '美容室経営に必要な知識とノウハウを習得します'),
(3, 'DX・テクノロジー編', 'dx', '🚀', '最新技術を活用した美容室運営を学びます'),
(4, '総合スキルアップ編', 'general', '🎯', '美容師としての総合的なスキル向上を目指します')
ON CONFLICT (chapter_number) DO NOTHING;
```

### 5. RLSポリシーを設定

```sql
-- Row Level Security (RLS) を有効化
ALTER TABLE education_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_contents ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー（全員が読める）
CREATE POLICY "Education chapters are viewable by everyone" ON education_chapters
  FOR SELECT USING (true);

CREATE POLICY "Published education contents are viewable by everyone" ON education_contents
  FOR SELECT USING (true);

-- 管理者用の書き込みポリシー（必要に応じて）
CREATE POLICY "Service role can manage education" ON education_contents
  FOR ALL USING (auth.role() = 'service_role');
```

## 確認手順

### 1. テーブルが作成されたか確認
Table Editorで以下のテーブルが表示されることを確認：
- education_chapters（4件のデータ）
- education_contents（空）

### 2. テスト記事を挿入

```sql
-- テスト記事を1件挿入
INSERT INTO education_contents (
  chapter_id,
  article_number,
  title,
  slug,
  content,
  preview_content,
  excerpt,
  is_premium,
  access_level,
  reading_time,
  status,
  publish_date
) VALUES (
  (SELECT id FROM education_chapters WHERE chapter_number = 1),
  1,
  '美容師のための効果的な挨拶とその心理学的効果',
  '001',
  'ここに記事の本文が入ります...',
  'ここにプレビューが入ります...',
  '美容師にとって挨拶は最も重要なコミュニケーションツールの一つです。',
  false,
  'free',
  7,
  'published',
  CURRENT_TIMESTAMP
);
```

## トラブルシューティング

### エラー: "column does not exist"
→ テーブルが正しく作成されていない可能性があります。SQL Editorで上記のCREATE TABLE文を再実行してください。

### エラー: "permission denied"
→ RLSポリシーが正しく設定されていない可能性があります。上記のポリシー設定SQLを実行してください。

### エラー: "relation does not exist"
→ テーブルが存在しません。CREATE TABLE文から順番に実行してください。