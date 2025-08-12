# Vercel環境変数設定ガイド

## 必要な環境変数

Vercelのダッシュボードで以下の環境変数を設定してください：

### 1. Supabase設定（既に設定済み）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. 認証設定（既に設定済み）
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### 3. Gemini API設定（新規追加が必要）
```
GEMINI_API_KEY=AIzaSyCoK4hFqqvsOeAyUJ4DcUepvBGQ7iU0aYk
```

### 4. その他の必須設定
```
# セキュリティキー（openssl rand -hex 32で生成）
ENCRYPTION_KEY=your_generated_encryption_key

# JWT秘密鍵（openssl rand -base64 64で生成）
JWT_SECRET=your_generated_jwt_secret
```

## 設定手順

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. Settings → Environment Variables
4. 上記の環境変数を追加
5. 保存後、再デプロイ

## 注意事項

- `GEMINI_API_KEY`は教育コンテンツ生成に必須です
- `ENCRYPTION_KEY`と`JWT_SECRET`は必ず新しく生成してください
- 本番環境では`NEXTAUTH_URL`を`https://app.fleeks.jp`に設定