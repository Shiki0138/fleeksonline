# Fleeks Platform - データベースセットアップガイド

## 概要
このドキュメントでは、Fleeks Platformのデータベースをセットアップする手順を説明します。

## 前提条件
- Supabaseプロジェクトが作成済み
- Supabase SQLエディターへのアクセス権限

## セットアップ手順

### 1. データベーススキーマの修正
Supabase SQLエディターで以下のSQLを実行してください：

```sql
-- scripts/fix-database-schema.sql の内容を実行
```

このスクリプトは以下を行います：
- `profiles`テーブルに`role`カラムを追加
- `videos`テーブルに`published_at`カラムを追加
- 管理者ユーザーの設定
- 必要なインデックスの作成
- RLSポリシーの設定

### 2. ブログ機能のテーブル作成
次に、ブログ機能用のテーブルを作成します：

```sql
-- scripts/create-blog-tables.sql の内容を実行
```

### 3. 初期データの投入
動画データを投入します：

```sql
-- scripts/insert-videos-simple.sql の内容を実行
```

### 4. 管理者アカウントの作成

1. Supabase Authenticationで新規ユーザーを作成：
   - Email: greenroom51@gmail.com
   - Password: Fkyosai51

2. 作成後、以下のSQLを実行して管理者権限を付与：

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'greenroom51@gmail.com'
);
```

## 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を追加してください：

```
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=あなたのSupabase Service Role Key
OPENAI_API_KEY=あなたのOpenAI APIキー
CRON_SECRET=ランダムな文字列（Cronジョブの認証用）
```

## トラブルシューティング

### エラー: "column 'role' does not exist"
`fix-database-schema.sql`を実行してください。

### エラー: "column 'published_at' does not exist"
`fix-database-schema.sql`を実行してください。

### エラー: "relation 'blog_posts' does not exist"
`create-blog-tables.sql`を実行してください。

## 確認方法

1. 管理者でログイン後、ダッシュボードで：
   - 動画タブに動画が表示される
   - 管理者メニューが表示される
   - 動画の追加・編集ボタンが表示される

2. 一般ユーザーでログイン後：
   - 無料会員は動画を5分まで視聴可能
   - プレミアム会員は全編視聴可能

## メンテナンス

### 動画の追加
管理者としてログインし、ダッシュボードの「動画を追加」ボタンから追加できます。

### ブログの自動生成
毎週月曜日の10:00（JST）に自動的にブログが生成されます。

### 手動でブログを生成
```bash
curl -X GET https://app.fleeks.jp/api/blog/generate \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```