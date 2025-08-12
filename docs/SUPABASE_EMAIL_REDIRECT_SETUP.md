# Supabase Email Template の Redirect To 設定方法

## 設定場所

### 1. Supabase Dashboard にログイン
https://supabase.com/dashboard にアクセスしてプロジェクトを選択

### 2. Authentication セクションへ移動
左側のメニューから「Authentication」をクリック

### 3. Email Templates タブを選択
Authentication ページ内の上部タブから「Email Templates」を選択

### 4. Reset Password テンプレートを編集

## 2つの設定方法

### 方法1: Email Templates 内で直接設定（推奨）

1. **Reset Password** テンプレートを選択
2. テンプレート編集画面で以下のように設定：

```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするリクエストを受け付けました。</p>
<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
<p><a href="{{ .SiteURL }}/auth/callback?code={{ .Token }}&type=recovery">パスワードをリセット</a></p>
<p>このリンクは1時間有効です。</p>
```

**重要**: `{{ .ConfirmationURL }}` の代わりに、明示的に `/auth/callback` へのパスを指定

### 方法2: URL Configuration での設定

もし「Redirect To」フィールドが見つからない場合：

1. **Authentication** → **URL Configuration** へ移動
2. **Redirect URLs** セクションに以下を追加：
   ```
   https://app.fleeks.jp/auth/callback
   https://app.fleeks.jp/auth/update-password
   https://app.fleeks.jp/**
   ```

3. **Email Templates** に戻り、テンプレートで `{{ .ConfirmationURL }}` を使用：
   ```html
   <p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
   ```

## 確認方法

### テンプレートの変数確認
Email Templates の編集画面で利用可能な変数：
- `{{ .Token }}` - 認証トークン
- `{{ .SiteURL }}` - サイトのベースURL
- `{{ .ConfirmationURL }}` - Supabaseが生成する確認URL
- `{{ .Email }}` - ユーザーのメールアドレス

### 動作確認
1. テスト用アカウントでパスワードリセットをリクエスト
2. 受信したメールのリンクをホバーして、URLを確認
3. 期待されるURL形式：
   - `https://app.fleeks.jp/auth/callback?code=xxxxx&type=recovery`
   または
   - `https://app.fleeks.jp/auth/update-password#access_token=xxxxx&type=recovery`

## トラブルシューティング

### 「Redirect To」フィールドが見つからない場合

Supabaseのバージョンによってはこのフィールドが存在しない場合があります。その場合は：

1. **Email Template内で直接URLを指定**（方法1）
2. **またはカスタムSMTP設定を使用**

### カスタムSMTP設定（Pro/Team プランのみ）

1. **Project Settings** → **Auth** → **SMTP Settings**
2. カスタムSMTPプロバイダーを設定
3. 完全にカスタマイズされたメールテンプレートを使用可能

## 推奨設定

最もシンプルで確実な方法：

```html
<!-- Reset Password Email Template -->
<h2>パスワードリセット</h2>
<p>パスワードをリセットするリクエストを受け付けました。</p>
<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
<p><a href="{{ .SiteURL }}/auth/callback{{ .ConfirmationURL }}">パスワードをリセット</a></p>
<p>このリンクは1時間有効です。</p>
<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
```

この設定により、Supabaseが生成するトークンを含むURLが `/auth/callback` 経由で処理されます。