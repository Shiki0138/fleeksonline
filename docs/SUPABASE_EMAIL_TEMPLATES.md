# Supabase Email Templates - 最適化されたテンプレート

## 1. Confirm Signup (新規登録確認)

### 日本語版
```html
<h2>FLEEKS へようこそ！</h2>
<p>この度は FLEEKS にご登録いただき、ありがとうございます。</p>
<p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">メールアドレスを確認</a></p>
<p>このリンクは24時間有効です。</p>
<p>心当たりのない場合は、このメールを無視してください。</p>
```

### 英語版
```html
<h2>Welcome to FLEEKS!</h2>
<p>Thank you for signing up for FLEEKS.</p>
<p>Please click the button below to confirm your email address:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm Email</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't request this, please ignore this email.</p>
```

## 2. Reset Password (パスワードリセット)

### 日本語版（推奨） - 新しい形式（code使用）
```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするリクエストを受け付けました。</p>
<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
<p><a href="{{ .SiteURL }}/auth/update-password?code={{ .Code }}">パスワードをリセット</a></p>
<p>このリンクは1時間有効です。</p>
<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
```

### 日本語版（代替） - 古い形式（ConfirmationURL使用）
```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするリクエストを受け付けました。</p>
<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
<p>このリンクは1時間有効です。</p>
<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
```

### 英語版
```html
<h2>Reset Password</h2>
<p>We received a request to reset your password.</p>
<p>Click the link below to set a new password:</p>
<p><a href="{{ .SiteURL }}/auth/update-password?code={{ .Code }}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request a password reset, please ignore this email.</p>
```

## 3. Invite User (ユーザー招待)

### 日本語版
```html
<h2>FLEEKS への招待</h2>
<p>FLEEKS へ招待されました。</p>
<p>以下のリンクをクリックして、アカウントを作成してください：</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">招待を受ける</a></p>
<p>このリンクは7日間有効です。</p>
```

### 英語版
```html
<h2>You've been invited to FLEEKS</h2>
<p>You have been invited to join FLEEKS.</p>
<p>Click the link below to create your account:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Accept Invitation</a></p>
<p>This link will expire in 7 days.</p>
```

## 4. Magic Link (マジックリンクログイン)

### 日本語版
```html
<h2>ログインリンク</h2>
<p>以下のリンクをクリックして、FLEEKS にログインしてください：</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">ログイン</a></p>
<p>このリンクは1時間有効です。</p>
<p>このログインをリクエストしていない場合は、このメールを無視してください。</p>
```

### 英語版
```html
<h2>Login Link</h2>
<p>Click the link below to log in to FLEEKS:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">Log In</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this login, please ignore this email.</p>
```

## 5. Change Email Address (メールアドレス変更)

### 日本語版
```html
<h2>メールアドレスの変更確認</h2>
<p>メールアドレスの変更をリクエストされました。</p>
<p>以下のリンクをクリックして、新しいメールアドレスを確認してください：</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change">メールアドレスを確認</a></p>
<p>このリンクは24時間有効です。</p>
<p>心当たりのない場合は、このメールを無視してください。</p>
```

### 英語版
```html
<h2>Confirm Email Change</h2>
<p>You requested to change your email address.</p>
<p>Click the link below to confirm your new email address:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change">Confirm Email</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't request this change, please ignore this email.</p>
```

## 重要な注意事項

### 1. URL パラメータについて
- **Confirm Signup, Invite, Magic Link, Email Change**: `token_hash` を使用
- **Reset Password**: `access_token` を使用（Supabaseの仕様）

### 2. トークン変数
- `{{ .SiteURL }}` - サイトのベースURL（例: https://app.fleeks.jp）
- `{{ .TokenHash }}` - 確認用トークンハッシュ
- `{{ .Token }}` - アクセストークン（パスワードリセット用）

### 3. Supabase設定の重要ポイント
1. **Authentication > URL Configuration** で以下を設定：
   - Site URL: `https://app.fleeks.jp`
   - Redirect URLs: 
     ```
     https://app.fleeks.jp/**
     https://app.fleeks.jp/auth/confirm
     https://app.fleeks.jp/auth/update-password
     https://app.fleeks.jp/auth/callback
     ```

2. **Email Templates** で各テンプレートを更新
   - **Reset Password template** では `{{ .ConfirmationURL }}` を使用するか、
   - カスタムURLで `{{ .Code }}` を使用（推奨）

3. **SMTP設定**（有料プランの場合）:
   - カスタムSMTPを有効化
   - SendGrid等のSMTPサービスを設定

4. **重要: Password Reset設定**
   - **Authentication > Email Templates > Reset Password** で
   - Redirect to: `https://app.fleeks.jp/auth/update-password`
   - これにより、Supabaseが自動的に `?code=` パラメータを付与します

### 4. トラブルシューティング

#### パスワードリセットが機能しない場合
1. URLに `#` が含まれている場合は `?` に手動で変更
2. 例: `/auth/update-password#access_token=xxx` → `/auth/update-password?access_token=xxx`

#### メールが届かない場合
1. 迷惑メールフォルダを確認
2. Supabaseの無料プランの場合、1時間に3通までの制限あり
3. Rate Limitsを確認（Project Settings > Auth > Rate Limits）

### 5. カスタムスタイリング（オプション）
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
    <h2 style="color: #1a73e8; margin-bottom: 20px;">タイトル</h2>
    <p style="color: #333; line-height: 1.6;">本文</p>
    <p style="margin: 30px 0;">
      <a href="{{ .SiteURL }}/..." 
         style="background-color: #1a73e8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
        ボタンテキスト
      </a>
    </p>
  </div>
</div>
```