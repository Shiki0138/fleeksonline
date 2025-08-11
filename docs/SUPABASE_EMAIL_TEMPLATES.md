# Supabase メールテンプレート設定

## 📧 メールアドレス確認（Confirm signup）

```html
<h2>メールアドレスの確認</h2>

<p>こんにちは、</p>
<p>Fleeksへの登録ありがとうございます。メールアドレスを確認するには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">メールアドレスを確認</a></p>
<p>このリンクは24時間有効です。</p>

<p>このメールに心当たりがない場合は、無視してください。</p>
```

## 🔑 パスワードリセット（Reset Password）

```html
<h2>パスワードリセット</h2>

<p>こんにちは、</p>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/update-password#access_token={{ .Token }}&type=recovery">パスワードをリセット</a></p>
<p>このリンクは1時間有効です。</p>

<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
```

## 🎯 招待メール（Invite user）

```html
<h2>Fleeksへの招待</h2>

<p>こんにちは、</p>
<p>Fleeksに招待されました。下記のリンクをクリックしてアカウントを作成してください：</p>
<p><a href="{{ .SiteURL }}/auth/accept-invite?token_hash={{ .TokenHash }}&type=invite">招待を受ける</a></p>
<p>このリンクは7日間有効です。</p>
```

## ✨ マジックリンク（Magic Link）

```html
<h2>ログインリンク</h2>

<p>こんにちは、</p>
<p>下記のリンクをクリックしてログインしてください：</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">ログイン</a></p>
<p>このリンクは1時間有効です。</p>

<p>このログインリクエストに心当たりがない場合は、このメールを無視してください。</p>
```

## 📝 メールアドレス変更（Change Email Address）

```html
<h2>メールアドレスの変更確認</h2>

<p>こんにちは、</p>
<p>メールアドレスの変更を確認するには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change">メールアドレス変更を確認</a></p>
<p>このリンクは24時間有効です。</p>

<p>メールアドレスの変更をリクエストしていない場合は、このメールを無視してください。</p>
```

## ⚙️ 重要な変数

### 利用可能な変数：
- `{{ .SiteURL }}` - サイトのURL（例: https://app.fleeks.jp）
- `{{ .Token }}` - アクセストークン（パスワードリセット用）
- `{{ .TokenHash }}` - トークンハッシュ（確認リンク用）
- `{{ .Email }}` - ユーザーのメールアドレス
- `{{ .NewEmail }}` - 新しいメールアドレス（メール変更時）

### 注意点：
1. **メール確認には `{{ .TokenHash }}` を使用**
2. **パスワードリセットには `{{ .Token }}` を使用**
3. **`{{ .TokenHashDuration }}` は使用しない**（エラーの原因）

## 🔧 設定手順

1. Supabaseダッシュボードにログイン
2. **Authentication** → **Email Templates** を開く
3. 各テンプレートタイプを選択
4. 上記のテンプレートをコピー＆ペースト
5. **Save** をクリック

## 🚨 よくある間違い

### ❌ 間違った例：
```html
<!-- TokenHashを最後に表示してしまっている -->
<p>このリンクは {{ .TokenHashDuration }} 時間有効です。</p>{{ .TokenHash }}

<!-- 間違ったパラメータ名 -->
<a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}&type=signup">

<!-- 存在しない変数 -->
{{ .TokenHashDuration }}
```

### ✅ 正しい例：
```html
<!-- 正しいパラメータ名とハッシュの使用 -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">

<!-- 固定の有効期限を表示 -->
<p>このリンクは24時間有効です。</p>
```

## 🔍 デバッグ

メールが正しく動作しない場合：

1. **Supabase Logs** でエラーを確認
2. **Authentication** → **Settings** でメール設定を確認
3. **URL Configuration** で Site URL が正しいか確認
4. テスト用メールアドレスで動作確認