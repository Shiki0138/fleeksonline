# Supabase パスワードリセット設定完全ガイド

## 🚨 重要: 現在の問題
- パスワードリセットリンクが機能しない
- 「リカバリートークンの検証に失敗しました」エラー
- セッションが確立されない

## 📋 Supabaseダッシュボードでの確認手順

### 1. Authentication設定の確認

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. **Authentication** → **Providers** を開く
4. **Email** が有効になっていることを確認

### 2. URL Configuration の設定

**Authentication** → **URL Configuration** で以下を設定：

```
Site URL: https://app.fleeks.jp

Redirect URLs:
- https://app.fleeks.jp/auth/update-password
- https://app.fleeks.jp/dashboard
- https://app.fleeks.jp/login
- https://app.fleeks.jp/admin
```

### 3. Email Templates の修正

**Authentication** → **Email Templates** → **Reset Password** で以下に修正：

```html
<h2>パスワードリセット</h2>
<p>こんにちは、</p>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/update-password?token={{ .Token }}&type=recovery&email={{ .Email }}">パスワードをリセット</a></p>
<p>このリンクは1時間有効です。</p>
<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
```

### 4. 重要な設定項目

**Authentication** → **Settings** で確認：

- **Password Recovery Template**: カスタムテンプレートを使用
- **Token Expiry**: 3600秒（1時間）- 必要に応じて延長
- **Enable Email Confirmations**: 有効

## 🔧 トラブルシューティング

### 問題1: refresh_tokenが空
**原因**: Supabaseの新しいバージョンではrefresh_tokenを使わない場合がある
**解決**: access_tokenのみで処理するロジックを実装済み

### 問題2: ハッシュフラグメントが処理されない
**原因**: クライアントサイドルーティングの問題
**解決**: 手動でハッシュを解析して処理

### 問題3: セッションが確立されない
**原因**: Supabaseクライアントの初期化タイミング
**解決**: 複数の方法で検証を試行

## 🎯 代替ソリューション

### OTP（ワンタイムパスワード）方式への移行

```typescript
// パスワードリセットリクエスト
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `https://app.fleeks.jp/auth/update-password`,
  captchaToken: undefined,
  options: {
    data: {
      // カスタムデータを追加可能
    }
  }
})

// OTPコードの検証
const { data, error } = await supabase.auth.verifyOtp({
  email: email,
  token: otpCode,
  type: 'recovery'
})
```

## 📊 デバッグ情報の確認

ブラウザのコンソールで以下を確認：
1. `[UpdatePassword]` で始まるログ
2. ハッシュフラグメントの内容
3. セッション確立の試行結果

## ✅ 確認チェックリスト

- [ ] Site URLが正しく設定されている
- [ ] Redirect URLsに必要なURLが全て含まれている
- [ ] メールテンプレートが正しい形式
- [ ] トークンの有効期限が適切（最低1時間）
- [ ] メールが実際に送信されている
- [ ] リンクをクリックしてから1時間以内である

## 🆘 それでも解決しない場合

1. Supabaseのサポートに問い合わせ
2. 最新のauth-helpersパッケージにアップデート
3. カスタムのパスワードリセットフローを実装