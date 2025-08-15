# Supabase メール確認設定ガイド

## 問題
- メール確認リンクをクリックしてもログイン画面に遷移される
- 確認処理が正しく動作していない

## 解決方法

### 1. Supabaseダッシュボードでの設定

1. **Authentication → URL Configuration** を開く
2. **Site URL** が正しく設定されているか確認：
   ```
   https://app.fleeks.jp
   ```

3. **Redirect URLs** に以下を追加：
   ```
   https://app.fleeks.jp/auth/confirm
   https://app.fleeks.jp/auth/update-password
   https://app.fleeks.jp/auth/callback
   ```

### 2. Email Templatesの設定

1. **Authentication → Email Templates → Confirm signup** を開く
2. テンプレートを以下のように更新：

```html
<h2>メールアドレスの確認</h2>
<p>FLEEKSへようこそ！</p>
<p>以下のボタンをクリックしてメールアドレスを確認してください：</p>
<p><a href="{{ .ConfirmationURL }}">メールアドレスを確認する</a></p>

<p>リンクが動作しない場合は、以下のURLをブラウザにコピー＆ペーストしてください：</p>
<p>{{ .ConfirmationURL }}</p>

<p>このメールに心当たりがない場合は、無視してください。</p>
```

### 3. 重要な設定の確認

1. **Authentication → Settings** で以下を確認：
   - **Enable Email Confirmations** が有効
   - **Enable Custom SMTP** を使用している場合は、SMTPが正しく設定されているか

2. **メール確認を一時的に無効にする場合**（開発環境のみ推奨）：
   - **Enable Email Confirmations** をオフにする
   - または、SQLエディタで以下を実行：
   ```sql
   UPDATE auth.config SET value = 'true' WHERE key = 'mailer_autoconfirm';
   ```

### 4. デバッグ方法

1. Supabase Logsで確認：
   - **Edge Functions** → **Logs** でメール送信ログを確認
   - エラーメッセージがないか確認

2. ブラウザのNetworkタブで確認：
   - 確認リンクをクリックした時のリクエストを確認
   - リダイレクト先が正しいか確認

### 5. 代替案

メール確認が正しく動作しない場合の一時的な対策：

1. **手動でユーザーを確認済みにする**：
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'user@example.com';
```

2. **メール確認を無効にする**（本番環境では推奨しません）：
- Supabaseダッシュボードで設定を変更
- または上記のSQLを実行

## 確認後の動作

正しく設定されていれば：
1. ユーザーがメール内のリンクをクリック
2. `/auth/confirm` ページで確認処理
3. 成功メッセージを表示
4. 3秒後に `/login` へリダイレクト