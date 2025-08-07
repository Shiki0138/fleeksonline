# 🤖 ブログ自動生成システム設計書

## 概要

FLEEKS プラットフォームのブログ自動生成システムは、以下のソースからコンテンツを取得し、AIを活用してリライト・生成します：

1. **WordPress ブログ** - 既存記事のリライト
2. **Google スプレッドシート** - アイデアや考えを記事化
3. **Google NotebookLM** - 学習内容を記事化

## システムアーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WordPress     │     │ Google Sheets   │     │  NotebookLM     │
│     API         │     │     API         │     │    Export       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Content Aggregator    │
                    │  (データ収集・整形)      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    AI Processor         │
                    │  (OpenAI/Claude API)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Content Optimizer     │
                    │  (SEO最適化・編集)      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Supabase DB       │
                    │   (blog_posts table)   │
                    └─────────────────────────┘
```

## 実装可能性と方法

### 1. WordPress ブログのリライト ✅ 実装可能

**方法1: WordPress REST API**
```javascript
// WordPress REST APIを使用
const wpApiUrl = 'https://your-wordpress.com/wp-json/wp/v2/posts';
const response = await fetch(wpApiUrl);
const posts = await response.json();
```

**方法2: WordPress Export XML**
- WordPress管理画面からXMLファイルをエクスポート
- XMLパーサーで記事データを抽出

### 2. Google スプレッドシートの活用 ✅ 実装可能

**Google Sheets API を使用**
```javascript
// Google Sheets API
const sheets = google.sheets({version: 'v4', auth});
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: 'SPREADSHEET_ID',
  range: 'Sheet1!A:Z',
});
```

必要な設定：
- Google Cloud Project の作成
- Sheets API の有効化
- サービスアカウントの作成

### 3. Google NotebookLM の統合 ⚠️ 制限あり

**現状の制限**：
- NotebookLM は公式APIを提供していない
- 手動エクスポートが必要

**回避策**：
1. NotebookLM から手動でエクスポート（テキスト形式）
2. エクスポートしたファイルをアップロード
3. テキスト解析してブログ記事化

## データベース設計

```sql
-- ブログ記事テーブル
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug TEXT UNIQUE NOT NULL,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft', -- draft, published, archived
  source_type TEXT, -- wordpress, sheets, notebooklm, manual
  source_url TEXT,
  original_id TEXT, -- 元記事のID
  seo_title TEXT,
  seo_description TEXT,
  featured_image TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログカテゴリテーブル
CREATE TABLE blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES blog_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI生成ログテーブル
CREATE TABLE blog_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id),
  source_content TEXT,
  prompt TEXT,
  ai_model TEXT,
  generation_params JSONB,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## AI リライト・生成プロンプト例

### WordPressリライト用
```
以下の記事を、ローカルビジネスオーナー向けに最適化してリライトしてください：

【元記事】
{original_content}

【要件】
- トーンは親しみやすく、実践的に
- 具体的な数値や事例を追加
- Instagram集客の観点を含める
- 心理学的アプローチを組み込む
- SEOを意識したキーワードを含める
```

### スプレッドシートからの記事生成
```
以下のアイデアメモから、実践的なブログ記事を作成してください：

【アイデア】
{spreadsheet_content}

【記事構成】
1. 導入（問題提起）
2. 理論的背景
3. 実践方法（ステップバイステップ）
4. 事例紹介
5. まとめとアクションプラン
```

## 実装ステップ

### フェーズ1: 基本機能（2週間）
1. Supabaseにブログテーブル作成
2. 管理画面の基本UI実装
3. 手動記事作成機能

### フェーズ2: WordPress連携（1週間）
1. WordPress API接続
2. 記事インポート機能
3. AIリライト機能

### フェーズ3: Google連携（2週間）
1. Google Sheets API設定
2. スプレッドシート読み込み
3. AI記事生成機能

### フェーズ4: 自動化（1週間）
1. 定期実行スケジューラー
2. 生成品質チェック
3. 公開ワークフロー

## セキュリティと注意点

1. **APIキーの管理**
   - 環境変数で管理
   - Vercelの環境変数に設定

2. **レート制限**
   - OpenAI API: 適切な遅延を設定
   - Google API: クォータ管理

3. **コンテンツの著作権**
   - リライト時も元記事の権利を尊重
   - 引用元を明記

4. **品質管理**
   - AI生成後の人間によるレビュー
   - 公開前の承認フロー

## 必要な環境変数

```env
# WordPress API
WORDPRESS_API_URL=https://your-site.com/wp-json/wp/v2
WORDPRESS_API_KEY=your_api_key

# Google APIs
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account"...}
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## まとめ

このシステムにより、以下が実現可能です：

✅ **WordPress記事の自動リライト**
✅ **Googleスプレッドシートからの記事生成**
✅ **SEO最適化された記事の自動作成**
✅ **管理者による編集・承認フロー**
⚠️ **NotebookLMは手動インポートが必要**

実装期間：約6週間（段階的リリース可能）