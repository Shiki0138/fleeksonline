# 🚨 重要：Supabaseメールテンプレート修正

## 問題の根本原因

現在のメールで送信されているURL:
```
https://app.fleeks.jp/auth/update-password#access_token=418449&refresh_token=&type=recovery
```

`access_token=418449` は**無効なトークン**です。これはJWT形式ではありません。

## 修正方法

### Supabaseダッシュボードで以下を設定：

1. **Authentication** → **Email Templates** → **Reset Password**

2. 以下のテンプレートに変更（最も推奨）：

```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/reset?token_hash={{ .TokenHash }}&type=recovery">パスワードをリセット</a></p>
```

### なぜこの修正が必要か

- `{{ .Token }}` は正しいJWTアクセストークンを提供しない可能性があります
- `{{ .TokenHash }}` は確実に動作する検証用トークンです
- `/auth/reset` ルートはtoken_hashを使用してOTP検証を行います

### 代替案（もし上記が動作しない場合）

```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
```

これは Supabase が自動的に正しいURLを生成します。

## 確認方法

1. メールテンプレートを更新
2. パスワードリセットをリクエスト
3. メールのリンクが以下の形式になっているか確認：
   - `?token_hash=xxx` （推奨）
   - または正しいJWT形式のaccess_token

## 重要な注意事項

現在の `access_token=418449` のような数値だけのトークンは**絶対に動作しません**。