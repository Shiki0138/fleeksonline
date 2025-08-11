# パスワードリセット問題の解決策

## 🚨 現在の問題
「リカバリートークンの検証に失敗しました。リンクの有効期限が切れている可能性があります。」

## 🎯 解決策（優先順位順）

### 1. Supabaseのメールテンプレートを`/auth/callback`に変更

**Authentication → Email Templates → Reset Password**

```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするには、下記のリンクをクリックしてください：</p>
<p><a href="{{ .SiteURL }}/auth/callback#access_token={{ .Token }}&type=recovery">パスワードをリセット</a></p>
```

これにより、Supabaseが自動的にトークンを処理します。

### 2. デバッグページでテスト

1. メールテンプレートを一時的に変更：
   ```
   {{ .SiteURL }}/auth/test-reset#access_token={{ .Token }}&type=recovery
   ```

2. パスワードリセットを実行

3. `/auth/test-reset` ページでログを確認

### 3. サーバーサイドルート（/auth/reset）を使用

メールテンプレート：
```html
<p><a href="{{ .SiteURL }}/auth/reset?access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery">パスワードをリセット</a></p>
```

### 4. OTP方式に切り替え

最も確実な方法：
- `/auth/reset-password-otp` を使用
- 6桁のコードで認証

## 📋 チェックリスト

### Supabaseダッシュボード
- [ ] **Site URL**: `https://app.fleeks.jp` が正しく設定されている
- [ ] **Redirect URLs** に以下が含まれている：
  - `https://app.fleeks.jp/auth/callback`
  - `https://app.fleeks.jp/auth/update-password`
  - `https://app.fleeks.jp/auth/reset`
- [ ] **Token Expiry**: 3600秒以上に設定
- [ ] **Enable Email Confirmations**: 有効

### コード
- [ ] middleware.tsで `/auth/*` パスが公開されている
- [ ] Supabaseクライアントが正しく初期化されている
- [ ] ブラウザコンソールでエラーを確認

## 🔧 トラブルシューティング

### 1. トークンが無効
```bash
# デバッグスクリプトを実行
node scripts/test-password-reset-debug.js your-email@example.com
```

### 2. セッションが確立されない
- ブラウザのキャッシュをクリア
- シークレットウィンドウで試す
- 別のブラウザで試す

### 3. それでも動作しない場合

#### A. 手動でテスト
1. Supabaseダッシュボード → Authentication → Users
2. 該当ユーザーの「Send recovery email」をクリック
3. メールのリンクをコピーして内容を確認

#### B. 最小限のテスト
```typescript
// pages/api/test-reset.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: any, res: any) {
  const { token } = req.query
  
  // 直接セッションを作成
  const { data, error } = await supabase.auth.admin.getUserById(token)
  
  res.json({ data, error })
}
```

## 💡 推奨事項

1. **短期的解決**: `/auth/callback` を使用してSupabaseの自動処理に任せる
2. **中期的解決**: OTP方式に移行
3. **長期的解決**: Supabase Auth Helpersを最新版にアップデート

## 📞 サポート

上記すべてを試しても解決しない場合：
1. Supabaseのサポートに問い合わせ
2. コミュニティフォーラムで質問
3. カスタム認証フローの実装を検討