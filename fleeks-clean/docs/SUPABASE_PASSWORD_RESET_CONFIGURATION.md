# Supabaseパスワードリセット設定ガイド

## 現在の問題状況

**問題URL**: `https://app.fleeks.jp/auth/update-password?token=893717&type=recovery`  
**エラー**: 404 Not Found  
**原因**: Supabaseの認証設定とリダイレクトURL設定の不一致

## 1. 現在の実装状況

### ✅ 完了済み
- パスワード更新ページ: `/src/app/auth/update-password/page.tsx`
- 認証コールバックハンドラ: `/src/app/auth/callback/route.ts`
- パスワードリセット機能の実装
- メール送信機能（テスト済み）

### ❌ 修正が必要
- Supabaseダッシュボードでの認証設定
- リダイレクトURL設定

## 2. Supabaseダッシュボード設定手順

### Step 1: Supabaseプロジェクトにアクセス
1. https://app.supabase.com にアクセス
2. プロジェクト「fleeks」を選択
3. 左メニューから「Authentication」を選択

### Step 2: URL Configuration
**Settings → URL Configuration**

#### 現在の推奨設定:
```
Site URL: https://app.fleeks.jp
```

#### Redirect URLs（追加が必要）:
```
https://app.fleeks.jp/auth/callback
https://app.fleeks.jp/auth/update-password
https://app.fleeks.jp/dashboard
https://app.fleeks.jp/admin
```

### Step 3: Email Templates設定
**Settings → Email Templates → Reset Password**

#### Subject（推奨）:
```
パスワードをリセットしてください - FLEEKS
```

#### Template（推奨）:
```html
<h2>パスワードリセット</h2>
<p>こんにちは</p>
<p>パスワードのリセットをリクエストされました。</p>
<p>以下のリンクをクリックして新しいパスワードを設定してください：</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password">パスワードをリセット</a></p>
<p>このリクエストに心当たりがない場合は、このメールを無視してください。</p>
<p>FLEEKS チーム</p>
```

#### Redirect URL:
```
https://app.fleeks.jp/auth/callback
```

## 3. 設定確認方法

### Method 1: Supabaseダッシュボード確認
1. Authentication → Settings → URL Configuration
2. Site URL が `https://app.fleeks.jp` に設定されているか
3. Redirect URLs にすべての必要なURLが含まれているか

### Method 2: テスト実行
```bash
node scripts/test-password-reset.js
```

### Method 3: 実際のフローテスト
1. greenroom51@gmail.com でパスワードリセットを実行
2. メールのリンクをクリック
3. 正しく `/auth/update-password` ページに到達するか確認

## 4. 問題の解決フロー

### 現在のURL構造:
```
メールのリンク → https://app.fleeks.jp/auth/callback?token_hash=...&type=recovery
                     ↓
                 callback/route.ts で処理
                     ↓
                 type=recovery の場合 → /auth/update-password にリダイレクト
```

### エラーが発生する原因:
1. **Site URLの不一致**: Supabaseの設定が `https://app.fleeks.jp` 以外になっている
2. **Redirect URL未登録**: `/auth/callback` が許可されたURLに含まれていない
3. **テンプレート設定**: メールテンプレートのリダイレクトURLが間違っている

## 5. 緊急修正手順

### Priority 1: 即座に修正
1. Supabaseダッシュボード → Authentication → Settings
2. Site URL を `https://app.fleeks.jp` に変更
3. Redirect URLs に以下を追加:
   - `https://app.fleeks.jp/auth/callback`
   - `https://app.fleeks.jp/auth/update-password`

### Priority 2: 確認とテスト
1. 設定保存後、新しいパスワードリセットメールを送信
2. メールのリンクが正しく動作することを確認

## 6. 監視とログ

### 確認すべきログ
- Supabase Authentication logs
- Next.js application logs
- Vercel deployment logs

### 監視ポイント
- パスワードリセット成功率
- 404エラー発生率
- コールバック処理の成功率

## 7. セキュリティ考慮事項

### 重要な設定
- HTTPS必須（本番環境）
- トークンの有効期限（デフォルト1時間）
- メール配信の信頼性

### 推奨事項
- パスワード強度の検証
- レート制限の実装
- ログイン試行回数の制限

## トラブルシューティング

### よくある問題

1. **404エラー**
   - Site URLの設定確認
   - Redirect URLsの登録確認

2. **メールが届かない**
   - SMTP設定の確認
   - スパムフォルダの確認

3. **トークンエラー**
   - トークンの有効期限確認
   - URL形式の確認

### サポート情報
- Supabaseドキュメント: https://supabase.com/docs/guides/auth
- プロジェクトURL: https://kbvaekypkszvzrwlbkug.supabase.co

---

## 次のステップ

1. ✅ Supabaseダッシュボードでの設定変更
2. ✅ パスワードリセット機能のテスト
3. ✅ 本番環境での動作確認
4. ✅ ユーザー向けドキュメント更新