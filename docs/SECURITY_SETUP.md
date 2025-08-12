# セキュリティ設定ガイド

## 環境変数の安全な管理

### 1. ローカル開発環境

1. `.env.example`をコピーして`.env.local`を作成
```bash
cp .env.example .env.local
```

2. `.env.local`に実際のAPIキーを設定
```bash
# 編集
nano .env.local
```

### 2. APIキーの取得方法

#### Gemini API
1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. APIキーを作成
3. `.env.local`の`GEMINI_API_KEY`に設定

#### Supabase
1. Supabaseダッシュボードの「Settings」→「API」
2. 各キーをコピー
3. `.env.local`に設定

### 3. 本番環境（Vercel）

1. Vercelダッシュボードで環境変数を設定
2. Settings → Environment Variables
3. 各APIキーを追加（絶対にコードにハードコーディングしない）

### 4. セキュリティチェックリスト

- [ ] `.env.local`がgitignoreに含まれている
- [ ] APIキーがコード内にハードコーディングされていない
- [ ] 本番用と開発用のAPIキーを分けている
- [ ] APIキーに適切な権限制限を設定
- [ ] 定期的にAPIキーをローテーション

### 5. Gitからの機密情報削除

もし誤ってコミットした場合：
```bash
# BFG Repo-Cleanerを使用
java -jar bfg.jar --delete-files .env.local
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 6. 推奨されるAPIキーの制限

#### Gemini API
- IPアドレス制限を設定
- 使用量の上限を設定

#### YouTube API
- HTTPリファラー制限を設定
- 特定のドメインからのみアクセス許可

### 7. 環境変数の検証

アプリケーション起動時に必要な環境変数をチェック：
```javascript
// utils/env-check.js
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

## 重要な注意事項

1. **絶対にAPIキーをGitHubにプッシュしない**
2. **ドキュメントにも実際のAPIキーを書かない**
3. **環境変数は常にVercelなどのホスティングサービスで管理**
4. **定期的にAPIキーをローテーション**
5. **最小権限の原則に従ってAPIキーの権限を設定**