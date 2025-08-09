# 一括ユーザー登録ガイド

## 概要

このガイドでは、FLEEKSプラットフォームに有料会員を一括登録する方法を説明します。

## 事前準備

### 1. 環境変数の設定

`.env.local` ファイルに以下の環境変数が設定されていることを確認してください：

```bash
# 既存の設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 一括登録に必要な追加設定
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Service Role Keyの取得方法

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. 左メニューの「Settings」→「API」へ移動
4. 「Service role key」をコピー（⚠️ このキーは機密情報です）
   - **注意**: 「anon public」キーではなく「service role」キーを使用してください
   - Service role keyは`eyJ...`で始まり、JWTペイロードに`"role":"service_role"`が含まれています

### 3. キーの確認

設定後、以下のコマンドで接続テストを実行できます：

```bash
npx tsx scripts/test-supabase-connection.ts
```

正しく設定されていれば「✅ Connection successful!」と表示されます。

## 一括登録の実行

### 実行コマンド

```bash
npm run bulk-register
```

### 処理内容

1. **ユーザー作成**
   - メールアドレスをパスワードとして初期設定
   - メールアドレスは自動確認済みに設定
   - 初回ログインフラグを設定

2. **プロファイル作成**
   - membership_type: 'premium'（有料会員）
   - 有効期限: 1年後
   - メールアドレスのローカル部を初期名として設定

3. **初回ログイン時の処理**
   - パスワード変更画面が自動表示
   - セキュアなパスワードへの変更を促す

## 実行結果

スクリプト実行後、以下の情報が出力されます：

- 成功した登録数
- 既存ユーザー数
- 失敗した登録（エラー詳細付き）

結果は `bulk-registration-results-YYYY-MM-DD.json` として保存されます。

## セキュリティ注意事項

1. **Service Role Key**
   - 絶対にGitにコミットしないでください
   - 本番環境では環境変数として安全に管理してください

2. **初期パスワード**
   - メールアドレスと同じ初期パスワードは一時的なものです
   - ユーザーは初回ログイン時に必ず変更する必要があります

3. **パスワード要件**
   - 8文字以上
   - 大文字・小文字・数字を含む

## トラブルシューティング

### よくあるエラー

1. **"Missing required environment variables"**
   - `.env.local`に必要な環境変数が設定されているか確認

2. **"User already exists"**
   - 既にそのメールアドレスで登録されています

3. **"Profile creation failed"**
   - fleeks_profilesテーブルの構造を確認
   - Service Role Keyの権限を確認

## 登録後の確認

1. Supabase Dashboardで確認
   - Authentication → Users でユーザー一覧を確認
   - Table Editor → fleeks_profiles でプロファイルを確認

2. アプリケーションで確認
   - 登録したメールアドレスでログイン
   - パスワード変更画面が表示されることを確認
   - 有料会員として全動画が視聴可能か確認