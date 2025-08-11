# Supabase メールテンプレート修正ガイド

## 問題
パスワードリセットメールのリンクが `/login?redirect=%2Fauth%2Fupdate-password` にリダイレクトされてしまい、パスワード更新ページ (`/auth/update-password`) に直接遷移しない。

## 根本原因
1. middleware.ts で `/auth/update-password` が publicPaths に含まれていなかった
2. Supabaseのメールテンプレートが正しくてもmiddlewareでブロックされていた
3. ハッシュフラグメント形式のトークンがURLパラメータとして処理されていなかった

## 解決方法

### 1. Supabase ダッシュボードでの設定

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 該当プロジェクトを選択
3. 左側メニューから **Authentication** → **Email Templates** を選択

### 2. Reset Password テンプレートの修正

「Reset Password」テンプレートを以下のように修正：

#### 現在の問題のあるテンプレート例:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .SiteURL }}/login?token={{ .Token }}&type=recovery">Reset Password</a></p>
```

#### 修正後のテンプレート:
```html
<h2>パスワードリセット</h2>
<p>以下のリンクをクリックして、パスワードをリセットしてください：</p>
<p><a href="{{ .SiteURL }}/auth/update-password#access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery">パスワードをリセット</a></p>
```

### 3. 重要な設定ポイント

1. **Site URL の確認**
   - Authentication → URL Configuration で Site URL が正しく設定されているか確認
   - 本番環境: `https://app.fleeks.jp`

2. **Redirect URLs の設定**
   - 以下のURLを追加:
     - `https://app.fleeks.jp/auth/update-password`
     - `https://app.fleeks.jp/dashboard`
     - `https://app.fleeks.jp/login`

### 4. コード側の対応（実装済み）

#### /src/middleware.ts
```typescript
// Public paths に /auth/update-password を追加
const publicPaths = ['/', '/login', '/auth/signup', '/auth/reset-password', '/auth/update-password', '/privacy', '/terms']
```

#### /src/app/login/page.tsx
```typescript
// ハッシュフラグメントとURLパラメータの両方を処理
useEffect(() => {
  // ハッシュフラグメントをチェック
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const hashAccessToken = hashParams.get('access_token')
  const hashType = hashParams.get('type')
  
  // リダイレクトパラメータもチェック
  const redirect = searchParams.get('redirect')
  
  if (hashAccessToken && hashType === 'recovery') {
    window.location.href = `/auth/update-password${window.location.hash}`
  } else if (redirect === '/auth/update-password' && window.location.hash) {
    window.location.href = `/auth/update-password${window.location.hash}`
  }
}, [searchParams])
```

#### /src/app/auth/update-password/page.tsx
```typescript
// ハッシュフラグメントとクエリパラメータの両方に対応
const hashParams = new URLSearchParams(window.location.hash.substring(1))
const urlParams = new URLSearchParams(window.location.search)
```

### 5. テスト手順

1. パスワードリセットをリクエスト
2. メールのリンクをクリック
3. 直接 `/auth/update-password` ページに遷移することを確認
4. 新しいパスワードを設定
5. ダッシュボードにリダイレクトされることを確認

### 6. トラブルシューティング

#### リンクがまだ /login に行く場合:
1. **middleware.ts を確認** - `/auth/update-password` が publicPaths に含まれているか
2. Supabaseのメールテンプレートが正しく保存されているか確認
3. ブラウザのキャッシュをクリア（特にServiceWorkerのキャッシュ）
4. Supabaseの設定変更後、数分待つ（反映に時間がかかる場合がある）
5. ブラウザのコンソールでリダイレクトのログを確認

#### セッションエラーが発生する場合:
1. Redirect URLsに `/auth/update-password` が含まれているか確認
2. Site URLが正しく設定されているか確認