# Supabase リダイレクト問題の解決方法

## 問題の原因

プレミアムページと無料会員ページにアクセスした際にログインページにリダイレクトされる問題は、以下の設定の不一致が原因です：

1. **環境変数の不一致**
   - `.env.local`の`NEXTAUTH_URL`が`https://fleeks.jp`に設定されている
   - Vercelの環境では`https://fleeksonline.vercel.app`でアクセスしている

2. **Supabaseの設定**
   - SupabaseダッシュボードのURL設定が正しく設定されていない可能性

## 解決方法

### 1. Supabaseダッシュボードの設定確認

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. **Authentication** → **URL Configuration**に移動
4. 以下の設定を確認・更新：

```
Site URL: https://fleeksonline.vercel.app
Redirect URLs:
- https://fleeksonline.vercel.app/*
- https://fleeks.jp/*
- http://localhost:3000/*
```

### 2. 環境変数の修正

開発環境とVercel環境で異なるURLを使用する場合：

```bash
# Vercel環境用（vercel.jsonまたはVercelダッシュボード）
NEXTAUTH_URL=https://fleeksonline.vercel.app

# ローカル開発用（.env.local）
NEXTAUTH_URL=http://localhost:3000
```

### 3. middleware.tsの確認

現在のミドルウェアは正しく設定されていますが、念のため以下を確認：

- `/premium`と`/free`へのアクセスが許可されている（35-39行目）
- ログが正しく出力されている

### 4. Supabase Auth Helpersの設定

`createClientComponentClient`を使用している場合、以下の設定が必要：

```typescript
// app/supabase-provider.tsx
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  options: {
    auth: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  }
})
```

### 5. デバッグ手順

1. ブラウザのデベロッパーツールを開く
2. Networkタブを確認
3. `/premium`にアクセス時のリダイレクトを確認
4. Consoleタブでミドルウェアのログを確認

### 6. Vercel環境での確認

```bash
# Vercelのログを確認
vercel logs --follow

# 環境変数を確認
vercel env ls
```

## 推奨される対応

1. まず、Supabaseダッシュボードの**URL Configuration**を確認・更新
2. Vercelダッシュボードで`NEXTAUTH_URL`を`https://fleeksonline.vercel.app`に設定
3. デプロイして再度確認

これでリダイレクト問題が解決するはずです。