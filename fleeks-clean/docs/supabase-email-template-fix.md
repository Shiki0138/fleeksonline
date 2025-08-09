# Supabase メールテンプレートのドメイン修正手順

## 問題
現在、パスワードリセットメールのリンクが間違ったドメイン（subsidy-seven.vercel.app）を指している

## 修正手順

### 1. Supabaseダッシュボードにログイン
1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択

### 2. Authentication設定を開く
1. 左側のメニューから「Authentication」をクリック
2. 「Email Templates」タブを選択

### 3. メールテンプレートを更新

#### Reset Password（パスワードリセット）
```html
<h2>パスワードリセット</h2>

<p>こんにちは、</p>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/update-password?token={{ .Token }}&type=recovery">パスワードをリセット</a></p>
<p>このリンクは {{ .TokenHashDuration }} 時間有効です。</p>

<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
```

#### Confirm Email（メール確認）
```html
<h2>メールアドレスの確認</h2>

<p>こんにちは、</p>
<p>FLEEKSへの登録ありがとうございます。メールアドレスを確認するには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}&type=signup">メールアドレスを確認</a></p>
<p>このリンクは {{ .TokenHashDuration }} 時間有効です。</p>
```

#### Magic Link（マジックリンク）
```html
<h2>ログインリンク</h2>

<p>こんにちは、</p>
<p>下記のリンクをクリックしてログインしてください：</p>
<p><a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}&type=magiclink">ログイン</a></p>
<p>このリンクは {{ .TokenHashDuration }} 時間有効です。</p>
```

### 4. URL設定を更新

1. 「Authentication」→「URL Configuration」に移動
2. 以下の設定を確認・更新：

```
Site URL: https://app.fleeks.jp
Redirect URLs: 
- https://app.fleeks.jp/**
- https://app.fleeks.jp/auth/callback
- https://app.fleeks.jp/auth/update-password
```

### 5. 環境変数の確認

Vercelダッシュボードで環境変数を確認：

1. https://vercel.com/dashboard にログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」
4. 以下を確認：

```
NEXT_PUBLIC_SITE_URL = https://app.fleeks.jp
```

### 6. Supabase URLの構成

正しいURL構成：
- **開発環境**: http://localhost:3000
- **本番環境**: https://app.fleeks.jp

### 7. テスト手順

1. パスワードリセットをテスト
   ```
   1. https://app.fleeks.jp/auth/reset-password にアクセス
   2. メールアドレスを入力
   3. 受信したメールのリンクをクリック
   4. 正しいドメイン（app.fleeks.jp）にリダイレクトされることを確認
   ```

2. 新規登録をテスト
   ```
   1. https://app.fleeks.jp/auth/signup にアクセス
   2. 新規登録
   3. 確認メールのリンクが正しいドメインを指していることを確認
   ```

### 8. トラブルシューティング

#### メールが届かない場合
1. Supabaseの「Authentication」→「Providers」→「Email」を確認
2. SMTPが正しく設定されているか確認
3. スパムフォルダを確認

#### リンクが機能しない場合
1. トークンの有効期限を確認（デフォルト24時間）
2. URLエンコーディングの問題がないか確認
3. ブラウザのコンソールでエラーを確認

### 9. カスタムSMTPの設定（オプション）

信頼性を高めるため、カスタムSMTPを設定することを推奨：

1. 「Authentication」→「Providers」→「Email」
2. 「Enable Custom SMTP」をオン
3. SMTP設定を入力：
   - SendGrid、AWS SES、Mailgunなどを使用
   - 送信元メールアドレスを設定（例：no-reply@fleeks.jp）

### 重要な注意点

- **{{ .SiteURL }}** は自動的に正しいドメインに置換されます
- メールテンプレートを変更した後は、必ずテストを実施
- 本番環境での変更は慎重に行う
- バックアップを取ってから変更する