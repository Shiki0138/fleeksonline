# GitHub Secrets設定手順

## 必要なSecrets

以下の値をGitHub Repository Secretsに設定する必要があります。

### 1. VERCEL_TOKEN
1. https://vercel.com/account/tokens にアクセス
2. 「Create Token」をクリック
3. Token Name: `fleeksonline-github-actions`
4. Scope: Full Account
5. 「Create」をクリック
6. 生成されたトークンをコピー

### 2. VERCEL_ORG_ID
- 値: `team_CxYuNDI2LPUdzABJOsjF35QQ`

### 3. VERCEL_PROJECT_ID
- 値: `prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3`

## GitHub Secretsの設定方法

1. https://github.com/Shiki0138/fleeksonline/settings/secrets/actions にアクセス
2. 「New repository secret」をクリック
3. 以下を順番に追加：

   - Name: `VERCEL_TOKEN`
     - Secret: （Vercelで生成したトークン）
   
   - Name: `VERCEL_ORG_ID`
     - Secret: `team_CxYuNDI2LPUdzABJOsjF35QQ`
   
   - Name: `VERCEL_PROJECT_ID`
     - Secret: `prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3`

## 確認方法

すべてのSecretsを設定後、小さな変更をプッシュして自動デプロイが動作することを確認：

```bash
git add .
git commit -m "ci: Add GitHub Actions for Vercel deployment"
git push origin main
```

その後、https://github.com/Shiki0138/fleeksonline/actions でワークフローの実行状況を確認。