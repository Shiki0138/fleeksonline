# Vercel 自動デプロイ設定ガイド

## 問題
GitHubにプッシュしても自動デプロイされない

## 解決方法

### 1. Vercelダッシュボードでの設定

1. https://vercel.com/dashboard にログイン
2. プロジェクト「fleeksonline」または「fleeks-clean」を選択
3. 「Settings」タブに移動
4. 「Git」セクションを探す

### 2. GitHub連携の確認

#### A. 既に連携されている場合
1. 「Connected Git Repository」に`Shiki0138/fleeksonline`が表示されているか確認
2. ブランチが`main`に設定されているか確認
3. 「Auto Deploy」がONになっているか確認

#### B. 連携されていない場合
1. 「Connect Git Repository」をクリック
2. GitHubを選択
3. リポジトリ`Shiki0138/fleeksonline`を選択
4. ブランチを`main`に設定
5. 「Import」をクリック

### 3. Webhook設定の確認

GitHubリポジトリで確認：
1. https://github.com/Shiki0138/fleeksonline/settings/hooks
2. Vercelのwebhookが存在するか確認
3. 存在しない場合は、Vercel側で再連携

### 4. 環境変数の同期

Vercelダッシュボードで：
1. Settings → Environment Variables
2. 以下の変数が設定されているか確認：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 5. ビルド設定の確認

1. Settings → Build & Output Settings
2. 以下の設定を確認：
   ```
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Root Directory: fleeks-clean
   ```

## 記事投稿後の自動デプロイ

記事が自動投稿された後にデプロイをトリガーする方法：

### 方法1: Vercel Deploy Hook（推奨）

1. Vercelダッシュボードで：
   - Settings → Git → Deploy Hooks
   - 「Create Hook」をクリック
   - 名前：`content-update`
   - ブランチ：`main`
   - URLをコピー

2. content-scheduler.jsに追加：

```javascript
// 記事投稿後にデプロイをトリガー
async function triggerDeploy() {
  try {
    const deployHook = process.env.VERCEL_DEPLOY_HOOK
    if (deployHook) {
      await fetch(deployHook, { method: 'POST' })
      console.log('📦 デプロイをトリガーしました')
    }
  } catch (error) {
    console.error('デプロイトリガーエラー:', error)
  }
}

// dailyPost関数の最後に追加
async function dailyPost() {
  // ... 既存のコード ...
  
  // デプロイをトリガー
  await triggerDeploy()
}
```

3. .env.localに追加：
```
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
```

### 方法2: GitHub Actions経由

```yaml
name: Trigger Vercel Deploy
on:
  schedule:
    - cron: '0 11 * * *' # 毎日午前11時（記事投稿の1時間後）
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Deploy
        run: |
          curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

## トラブルシューティング

### デプロイが失敗する場合
1. ビルドログを確認
2. 環境変数が正しく設定されているか確認
3. `vercel.json`の設定を確認

### webhookが動作しない場合
1. GitHubのwebhook配信履歴を確認
2. Vercelのアクティビティログを確認
3. 必要に応じて再連携

## CLIでの手動デプロイ

スクリプトで自動化する場合：

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Vercelにデプロイ中..."
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean
vercel --prod --yes
echo "✅ デプロイ完了"
```

PM2タスクに追加：
```javascript
// 毎日午前11時にデプロイ
cron.schedule('0 11 * * *', async () => {
  exec('bash deploy.sh', (error, stdout, stderr) => {
    if (error) {
      console.error('デプロイエラー:', error)
    } else {
      console.log('デプロイ成功:', stdout)
    }
  })
})
```