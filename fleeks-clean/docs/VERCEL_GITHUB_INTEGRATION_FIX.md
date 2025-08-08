# Vercel GitHub自動デプロイ設定修正手順

## 問題
GitHubへのプッシュ時にVercelの自動デプロイが動作していない

## 修正手順

### 1. Vercel Dashboard での確認

1. https://vercel.com にログイン
2. プロジェクト「fleeksonline」を選択
3. 「Settings」タブを開く
4. 「Git」セクションを確認

### 2. GitHub連携の再設定

#### オプション A: Vercel Dashboard から
1. Settings → Git → Connected Git Repository
2. 「Disconnect」をクリック（既に接続されている場合）
3. 「Connect Git Repository」をクリック
4. GitHub を選択
5. リポジトリ「Shiki0138/fleeksonline」を選択
6. Branch: `main` を指定

#### オプション B: GitHub から Webhook を確認
1. GitHub リポジトリ: https://github.com/Shiki0138/fleeksonline
2. Settings → Webhooks
3. Vercel webhook が存在するか確認
4. 存在しない場合は、Vercel Dashboard から再接続

### 3. 環境変数の確認

Vercel Dashboard → Settings → Environment Variables で以下が設定されていることを確認：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### 4. デプロイ設定の確認

Vercel Dashboard → Settings → General で以下を確認：

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 5. 自動デプロイのテスト

```bash
# 小さな変更を加える
echo "# Updated $(date)" >> README.md
git add README.md
git commit -m "test: Vercel auto-deployment"
git push origin main
```

その後、Vercel Dashboard → Deployments で新しいデプロイが開始されるか確認

## トラブルシューティング

### Webhook が動作しない場合
1. GitHub → Settings → Webhooks → Vercel webhook → Recent Deliveries を確認
2. エラーがある場合は、Redeliver をクリック

### 権限の問題
1. GitHub → Settings → Applications → Authorized OAuth Apps
2. Vercel が適切な権限を持っているか確認

## 現在のプロジェクト情報

- **Project ID**: prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3
- **Org ID**: team_CxYuNDI2LPUdzABJOsjF35QQ
- **Production Domain**: app.fleeks.jp
- **GitHub Repo**: Shiki0138/fleeksonline