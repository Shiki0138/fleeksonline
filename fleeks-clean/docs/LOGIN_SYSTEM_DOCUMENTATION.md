# Fleeks ログインシステム ドキュメント

## 🚀 システム概要

Fleeksプラットフォームのログインシステムは、Supabase Authを使用した堅牢な認証システムです。

## 🔐 認証フロー

### 1. 基本ログイン手順
```
ユーザー → ログイン画面 → Supabase認証 → 権限チェック → 適切なページへリダイレクト
```

### 2. 管理者判定ロジック
```typescript
// 管理者の判定は2段階で実施
1. メールアドレスチェック: greenroom51@gmail.com
2. プロフィールロールチェック: role === 'admin'
```

## 👥 ユーザータイプとリダイレクト

### 管理者 (Admin)
- **判定条件**: `email === 'greenroom51@gmail.com'` または `role === 'admin'`
- **リダイレクト先**: `/admin`
- **権限**: 全機能アクセス可能

### 一般ユーザー (User)
- **判定条件**: 上記以外のすべての認証済みユーザー
- **リダイレクト先**: `/dashboard`  
- **権限**: ユーザー機能のみ

## 🛠️ エラーハンドリング

### 日本語エラーメッセージ対応
```typescript
const errorTranslations = {
  'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
  'Email not confirmed': 'メールアドレスが確認されていません。確認メールをご確認ください。',
  'Too many requests': 'ログイン試行回数が上限に達しました。しばらくお待ちください。'
}
```

## 🎯 セキュリティ機能

### 1. 多重認証チェック
- Supabase認証による基本認証
- データベース権限による二次認証
- フロントエンド権限チェック

### 2. エラーハンドリング
- 詳細エラー情報の隠蔽（セキュリティ向上）
- 日本語エラーメッセージでユーザビリティ向上
- ログイン試行制限

## 📊 データベース構造

### 必要テーブル
1. **auth.users** (Supabase管理)
   - id: ユーザーID
   - email: メールアドレス
   - encrypted_password: 暗号化パスワード

2. **fleeks_profiles** (カスタムテーブル)
   - id: ユーザーID (auth.usersとリンク)
   - role: ユーザーロール ('admin', 'user', 'paid')
   - membership_type: メンバーシップタイプ

## 🔧 環境設定

### 必要な環境変数
```env
NEXT_PUBLIC_SUPABASE_URL=https://kbvaekypkszvzrwlbkug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 テスト手順

### 1. 管理者ログインテスト
```bash
URL: http://localhost:3000/login
Email: greenroom51@gmail.com
Password: [実際のパスワード]
期待結果: /admin にリダイレクト
```

### 2. 一般ユーザーログインテスト
```bash
URL: http://localhost:3000/login  
Email: [一般ユーザーのメール]
Password: [ユーザーのパスワード]
期待結果: /dashboard にリダイレクト
```

### 3. エラーケーステスト
- 間違ったパスワード
- 存在しないメールアドレス
- 空のフィールド

## 🔄 メンテナンス

### 定期チェック項目
1. Supabaseプロジェクトの健全性確認
2. データベース接続状況
3. RLSポリシーの確認
4. ユーザー権限の整合性

### トラブルシューティング
1. **ログインできない場合**
   - Supabase接続を確認
   - 環境変数の確認
   - データベースの `fleeks_profiles` テーブル確認

2. **権限エラーの場合**  
   - RLSポリシーの確認
   - ユーザーロールの確認

## 📝 最近の修正履歴

### 2025-08-10 - ログイン機能強化
- 日本語エラーメッセージ対応
- 管理者判定ロジックの改善
- 成功メッセージとローディング状態の追加
- プロファイル取得エラーの堅牢性向上

## 🚀 今後の改善予定

1. 二要素認証の実装
2. ソーシャルログイン対応
3. パスワードリセット機能の強化
4. セッション管理の最適化

---

**更新日**: 2025-08-10  
**担当者**: Claude Code Development Team