# Vercel 自動デプロイ トラブルシューティング

## 現在の状況
- GitHubへのプッシュ: ✅ 成功
- Vercel自動デプロイ: ❌ 動作していない
- Deploy Hook（手動トリガー）: ✅ 動作確認済み（201 Created）
- ビルドエラー: ✅ 修正済み（react-quillインストール済み）

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

## 診断結果

### 確認済み事項
1. **Deploy Hook**: ✅ 正常動作（201レスポンス）
2. **ローカルビルド**: ✅ 成功
3. **GitHubプッシュ**: ✅ 成功
4. **自動デプロイトリガー**: ❌ 動作せず

### 問題の原因
GitHubからVercelへの自動デプロイが動作していません。これは以下の原因が考えられます：

1. **GitHub連携が切断されている**
2. **Vercelプロジェクトの設定が不適切**
3. **GitHubのwebhookが削除または無効化されている**

## 解決方法

### 方法1: Vercelダッシュボードで再連携（推奨）

1. https://vercel.com/dashboard にログイン
2. `fleeks-clean`プロジェクトを選択
3. **Settings** → **Git** タブへ移動
4. 現在の設定を確認：
   - Connected Git Repository: `Shiki0138/fleeksonline`
   - Production Branch: `main`
   - Root Directory: 空欄または`fleeks-clean`

5. もし連携が切れている場合：
   - **Disconnect** をクリック
   - **Connect Git Repository** から再連携
   - リポジトリ `Shiki0138/fleeksonline` を選択
   - Import設定：
     - Root Directory: `fleeks-clean`を入力
     - Framework Preset: Next.js
     - Build Settings: デフォルトのまま

### 方法2: Vercel CLIで新規プロジェクトとして再設定

```bash
# 現在のプロジェクトを削除
vercel remove fleeks-clean

# 新規プロジェクトとして再設定
cd fleeks-clean
vercel --prod

# プロンプトで以下を選択:
# - Set up and deploy: Y
# - Which scope: 既存のスコープを選択
# - Link to existing project?: N
# - Project name: fleeks-clean
# - Directory: ./
# - Build Command: デフォルト
# - Output Directory: デフォルト
# - Development Command: デフォルト

# GitHub連携を促すメッセージが表示されたら、ブラウザで連携を完了
```

### 方法3: Deploy Hookを使った代替案（暫定対応）

自動デプロイが復旧するまでの間、以下の方法で対応：

1. **GitHub Actionsを使用**
   `.github/workflows/deploy.yml`を作成：
   ```yaml
   name: Deploy to Vercel
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Vercel Deploy
           run: |
             curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
   ```

2. **GitHubのSecrets設定**
   - リポジトリの Settings → Secrets → Actions
   - `VERCEL_DEPLOY_HOOK`を追加
   - 値: `https://api.vercel.com/v1/integrations/deploy/prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3/amcwVjy8uE`

## 推奨アクション

1. **まずVercelダッシュボードでGit連携状態を確認**
2. **連携が切れていれば再連携（方法1）**
3. **それでも動作しない場合は、新規プロジェクトとして再設定（方法2）**
4. **急ぎの場合は、Deploy HookとGitHub Actionsで代替（方法3）**