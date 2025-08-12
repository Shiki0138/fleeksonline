# Supabase リダイレクトURL設定ガイド

## 問題の概要
パスワードリセットのメールリンクをクリックするとトップページにリダイレクトされる問題の解決方法。

## 必要な設定

### 1. Supabase Dashboard での設定

**Authentication > URL Configuration** で以下を設定：

#### Site URL
```
https://app.fleeks.jp
```

#### Redirect URLs (すべて追加)
```
https://app.fleeks.jp/**
https://app.fleeks.jp/auth/callback
https://app.fleeks.jp/auth/update-password
https://app.fleeks.jp/auth/confirm
https://app.fleeks.jp/auth/reset-guide
```

### 2. Email Templates の設定

**Authentication > Email Templates > Reset Password** で：

#### Template 内容
```html
<h2>パスワードリセット</h2>
<p>パスワードをリセットするリクエストを受け付けました。</p>
<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
<p>このリンクは1時間有効です。</p>
<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
```

#### Redirect To の設定
```
https://app.fleeks.jp/auth/callback
```

**重要**: `Redirect To` を `/auth/callback` に設定することで、コードの交換を適切に処理できます。

### 3. アプリケーション側の実装

以下のルート構造が必要：

```
/src/app/auth/
├── callback/
│   └── route.ts        # コード交換を処理
├── update-password/
│   └── page.tsx        # パスワード更新フォーム
└── reset-guide/
    └── page.tsx        # メール送信フォーム
```

## 動作フロー

1. ユーザーが `/auth/reset-guide` でメールアドレスを入力
2. Supabase がパスワードリセットメールを送信
3. メール内のリンクが `https://app.fleeks.jp/auth/callback?code=xxx` を指す
4. `/auth/callback/route.ts` がコードをセッションに交換
5. 成功したら `/auth/update-password` にリダイレクト
6. ユーザーが新しいパスワードを設定

## トラブルシューティング

### まだトップページにリダイレクトされる場合

1. **Redirect URLs の確認**
   - Supabase Dashboard で上記のURLがすべて登録されているか確認
   - 特に `/auth/callback` が含まれているか確認

2. **Email Template の確認**
   - `{{ .ConfirmationURL }}` を使用しているか確認
   - カスタムURLではなく、Supabaseが生成するURLを使用

3. **ブラウザのキャッシュをクリア**
   - 古いリダイレクト設定がキャッシュされている可能性

4. **ログの確認**
   - ブラウザの開発者ツールでネットワークタブを確認
   - リダイレクトのチェーンを追跡

## 設定完了後のテスト手順

1. パスワードリセットをリクエスト
2. メールを受信
3. リンクをクリック
4. `/auth/callback` → `/auth/update-password` の順にリダイレクトされることを確認
5. 新しいパスワードを設定できることを確認