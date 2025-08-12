# Supabaseメールテンプレート設定ガイド

## 現在の問題

URLが `#access_token=` 形式（フラグメント）で送信されているため、サーバー側でパラメータを受け取れません。

## 解決策

### 方法1: コードで対応（実装済み）
`/auth/update-password/page.tsx` を修正して、URLフラグメントからトークンを取得するように実装しました。

### 方法2: Supabaseのメールテンプレートを修正（推奨）

Supabaseダッシュボードで以下の設定を行ってください：

1. **Supabaseダッシュボード** → **Authentication** → **Email Templates**
2. **Reset Password** テンプレートを選択
3. 以下のいずれかのテンプレートに更新：

#### オプションA: 新しいtoken_hash方式（最も安全）
```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/reset?token_hash={{ .TokenHash }}&type=recovery">パスワードをリセット</a></p>
```

#### オプションB: クエリパラメータ方式
```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/update-password?access_token={{ .Token }}&type=recovery">パスワードをリセット</a></p>
```

#### オプションC: 現在の形式のまま（コードで対応）
```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/update-password#access_token={{ .Token }}&type=recovery">パスワードをリセット</a></p>
```

## 重要な注意事項

1. **{{ .SiteURL }}** が正しく設定されているか確認
   - 本番: `https://app.fleeks.jp`
   - 開発: `http://localhost:3000`

2. **Redirect URLs** の設定も確認
   - Supabase → Authentication → URL Configuration
   - Site URL: `https://app.fleeks.jp`
   - Redirect URLs に以下を追加:
     - `https://app.fleeks.jp/auth/callback`
     - `https://app.fleeks.jp/auth/reset`
     - `https://app.fleeks.jp/auth/update-password`

## テスト手順

1. パスワードリセットをリクエスト
2. メールのリンクをクリック
3. ブラウザのコンソールでログを確認
4. 新しいパスワードを設定

## トラブルシューティング

- コンソールログで `[UpdatePassword] Hash params:` を確認
- トークンが正しく取得できているか確認
- セッションの設定エラーがないか確認