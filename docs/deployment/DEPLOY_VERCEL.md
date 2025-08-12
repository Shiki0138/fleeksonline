# 🚀 Vercelデプロイ手順

## 現在の状況
ビルドエラーが多いため、手動でVercelダッシュボードからデプロイすることを推奨します。

## 手順

### 1. Vercelダッシュボードにアクセス
```
https://vercel.com/dashboard
```

### 2. 新規プロジェクト作成
- 「Add New...」→「Project」
- 「Import Git Repository」をスキップ
- 「Deploy from Local」を選択

### 3. プロジェクト設定
- Project Name: `fleeks-app`
- Framework: Next.js
- Root Directory: ./

### 4. 環境変数設定
```
NEXT_PUBLIC_SUPABASE_URL = あなたのURL
NEXT_PUBLIC_SUPABASE_ANON_KEY = あなたのキー
NEXTAUTH_SECRET = あなたのシークレット
```

### 5. デプロイコマンド
```bash
# プロジェクトディレクトリで
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean

# Vercel CLIでアップロード
npx vercel --prod
```

### 6. カスタムドメイン設定
- Settings → Domains
- Add: `app.fleeks.jp`

### 7. ムームーDNS設定
```
サブドメイン: app
種別: CNAME
内容: cname.vercel-dns.com
```

## 代替案: GitHubを使用

### 1. GitHubリポジトリ作成
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなたのアカウント/fleeks-app.git
git push -u origin main
```

### 2. VercelでGitHubインポート
- Vercelダッシュボード → Import Git Repository
- GitHubアカウント連携
- リポジトリ選択
- 自動デプロイ設定

## トラブルシューティング

### ビルドエラーの場合
1. 不要なファイルを削除
2. package.jsonの依存関係を最小限に
3. シンプルなページから始める

### 成功のポイント
- 最初はシンプルなページで動作確認
- 徐々に機能を追加
- エラーが出たら一つずつ解決