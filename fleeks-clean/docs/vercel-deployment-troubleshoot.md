# Vercel 自動デプロイ トラブルシューティング

## 現在の状況
- GitHubへのプッシュ: ✅ 成功
- Vercel自動デプロイ: ❌ 動作していない

## 確認項目

### 1. Vercelダッシュボードで確認

1. https://vercel.com/dashboard にログイン
2. プロジェクトを選択
3. 「Settings」→「Git」を確認

### 2. GitHub連携の確認ポイント

#### A. Connected Git Repository
- リポジトリ: `Shiki0138/fleeksonline`が選択されているか？
- ブランチ: `main`が選択されているか？
- Root Directory: `fleeks-clean`が設定されているか？

#### B. Deploy Hooks
- Auto-deploy on push: ONになっているか？
- Production Branch: `main`になっているか？

### 3. GitHub Webhookの確認

1. https://github.com/Shiki0138/fleeksonline/settings/hooks
2. Vercelのwebhookが存在するか確認
3. 最近の配信履歴を確認
   - Status: ✅ or ❌
   - Response code: 200 or エラー

### 4. 考えられる原因

#### 原因1: GitHub連携が切れている
**解決方法:**
1. Vercel Settings → Git → Disconnect
2. 再度「Connect Git Repository」
3. GitHubアカウントを再認証
4. リポジトリを選択

#### 原因2: Root Directoryの設定ミス
**解決方法:**
1. Settings → General → Root Directory
2. `fleeks-clean`を設定
3. Save

#### 原因3: Build設定の問題
**解決方法:**
1. Settings → Build & Output Settings
2. 以下を確認:
   ```
   Framework Preset: Next.js
   Build Command: cd fleeks-clean && npm install && npm run build
   Output Directory: fleeks-clean/.next
   Install Command: npm install
   ```

#### 原因4: 環境変数の不足
**解決方法:**
1. Settings → Environment Variables
2. 必要な変数を確認:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - その他の必要な変数

### 5. 手動デプロイのテスト

```bash
# Vercel CLIで手動デプロイ
cd fleeks-clean
vercel --prod

# または
vercel deploy --prod
```

### 6. ログの確認

Vercelダッシュボード → Functions → Logs で以下を確認:
- ビルドエラー
- デプロイメントエラー
- 環境変数エラー

### 7. Vercel CLIでプロジェクトをリンク

```bash
cd fleeks-clean
vercel link

# プロンプトに従って:
# 1. プロジェクトを選択
# 2. 既存のプロジェクトとリンク
```

### 8. GitHub Actionsの代替案

もしVercelの自動デプロイが動作しない場合、GitHub Actionsを使用:

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Vercel
        run: |
          cd fleeks-clean
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 9. Vercel Deploy Hookの手動トリガー

現在設定されているDeploy Hook:
```
https://api.vercel.com/v1/integrations/deploy/prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3/amcwVjy8uE
```

手動でトリガー:
```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3/amcwVjy8uE
```

## 推奨アクション

1. **まずVercelダッシュボードでGit連携を確認**
2. **Webhookの配信履歴を確認**
3. **必要に応じて再連携**
4. **手動デプロイでテスト**