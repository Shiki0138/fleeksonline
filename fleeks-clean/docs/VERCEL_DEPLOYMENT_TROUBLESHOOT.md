# Vercelデプロイメントトラブルシューティング

## 問題
GitHub Actionsは成功しているが、Vercelに変更が反映されない

## 確認事項

### 1. Vercelプロジェクト設定
- プロジェクトページ: https://vercel.com/dashboard
- プロジェクトID: `prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3`
- 組織ID: `team_CxYuNDI2LPUdzABJOsjF35QQ`

### 2. GitHub連携の確認
Vercelダッシュボードで以下を確認：
1. Settings → Git → Connected Git Repository
2. Production Branch が `main` に設定されているか
3. GitHub連携が有効になっているか

### 3. デプロイメント履歴の確認
1. Vercelダッシュボードでプロジェクトを開く
2. Deploymentsタブを確認
3. 最新のデプロイメントが表示されているか確認

### 4. 環境変数の確認
必要な環境変数がすべて設定されているか確認：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. 推奨される解決策

#### オプション1: Vercelの自動デプロイを使用
1. GitHub Actionsワークフローを無効化
2. Vercelの自動デプロイ機能を有効化

```bash
# GitHub Actionsを無効化
mv .github/workflows/vercel-deploy.yml .github/workflows/vercel-deploy.yml.bak
git add .github/workflows/
git commit -m "Disable GitHub Actions deployment to use Vercel auto-deploy"
git push origin main
```

#### オプション2: 手動でデプロイを強制
```bash
# Vercel CLIをインストール
npm i -g vercel@latest

# ログイン
vercel login

# 手動デプロイ
vercel --prod
```

#### オプション3: キャッシュをクリア
1. Vercelダッシュボードでプロジェクトを開く
2. Settings → Functions → Clear Cache
3. Redeploy ボタンをクリック

## 次のステップ
1. Vercelダッシュボードで最新のデプロイメント状態を確認
2. デプロイメントログでエラーがないか確認
3. 本番URLで変更が反映されているか確認: https://app.fleeks.jp