# Vercel自動デプロイセットアップガイド

## 現在の状況
- GitHub Actionsワークフローを無効化済み
- Vercel CLIでの手動デプロイは成功
- Vercelの自動デプロイが未設定

## 自動デプロイを有効にする手順

### 1. Vercelダッシュボードにアクセス
1. https://vercel.com/dashboard にアクセス
2. プロジェクト「fleeksonline」を選択

### 2. Git連携を設定
1. プロジェクトの「Settings」タブを開く
2. 左メニューから「Git」を選択
3. 「Connect Git Repository」をクリック
4. GitHubアカウントを選択
5. リポジトリ「Shiki0138/fleeksonline」を選択
6. 「Import」をクリック

### 3. ブランチ設定
1. Production Branch: `main`
2. Preview Branches: すべてのブランチ（オプション）

### 4. 環境変数の確認
以下の環境変数が設定されていることを確認：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. デプロイメント設定
1. Build Command: `npm run build`（デフォルト）
2. Output Directory: `.next`（デフォルト）
3. Install Command: `npm install`（デフォルト）

## トラブルシューティング

### 自動デプロイが動作しない場合
1. Git連携が正しく設定されているか確認
2. Webhookが有効になっているか確認（GitHubリポジトリの Settings > Webhooks）
3. Vercelのデプロイメントログを確認

### 手動でWebhookを再設定する場合
1. GitHubリポジトリの Settings > Webhooks
2. Vercel Webhookを削除
3. Vercelプロジェクトで Git連携を一度解除して再設定

## 確認方法
1. GitHubにコミットをプッシュ
2. Vercelダッシュボードで新しいデプロイメントが開始されることを確認
3. デプロイメントが成功することを確認

## 現在のプロジェクトURL
- 本番環境: https://app.fleeks.jp
- Vercel URL: https://fleeksonline-73hgpwb9y-shikis-projects-6e27447a.vercel.app