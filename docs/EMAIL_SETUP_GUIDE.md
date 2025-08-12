# Supabase メール設定ガイド

## 問題の症状

- 新規登録ができない
- パスワードリセットメールが届かない
- 「このメールアドレスは既に登録されています」というエラーが出る

## 解決方法

### 1. Supabaseダッシュボードでメール設定を確認

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. **Authentication** → **Email Templates**に移動

### 2. SMTP設定の確認

1. **Project Settings** → **Auth**に移動
2. **SMTP Settings**セクションを確認
3. 以下の設定が必要：
   - Enable Custom SMTP: ON
   - SMTP Host（例：smtp.sendgrid.net）
   - SMTP Port（例：587）
   - SMTP User
   - SMTP Password
   - Sender email
   - Sender name

### 3. メールテンプレートの確認

Authentication → Email Templatesで以下を確認：
- **Confirm signup**: 新規登録確認メール
- **Reset password**: パスワードリセットメール

### 4. Rate Limitsの確認

Project Settings → Auth → Rate Limitsで：
- Email送信の制限を確認
- 必要に応じて制限を緩和

## 手動でのアカウント操作

### ユーザー状態の確認
```bash
node scripts/check-user-account.js
```

### パスワードリセットメールの送信
```bash
node scripts/send-password-reset.js "self.138@gmail.com"
```

### 管理画面からの操作
1. 管理者アカウント（greenroom51@gmail.com）でログイン
2. `/admin/users`にアクセス
3. ユーザーを検索
4. パスワードリセットボタンをクリック

## Supabase無料プランの制限

無料プランでは以下の制限があります：
- メール送信: 1時間あたり3通まで
- カスタムSMTP設定: 利用不可（有料プランのみ）

## 推奨される対応

1. **開発環境**: Supabaseの標準メール機能を使用
2. **本番環境**: 
   - Supabase有料プランにアップグレード
   - SendGridなどのSMTPサービスを設定
   - または、カスタムメール送信APIを実装

## 代替案：手動でのユーザー作成

管理画面から手動でユーザーを作成：
1. 管理者でログイン
2. `/admin/users`にアクセス
3. 「新規ユーザー作成」ボタンをクリック
4. メールアドレスとパスワードを入力
5. 作成後、そのパスワードでログイン可能