# 🔐 FLEEKS Platform - カスタム認証テーブル設定ガイド

## 📋 beauty_users テーブルを使用したセットアップ

お使いのSupabaseプロジェクトでは標準の `auth.users` テーブルではなく、`beauty_users` カスタムテーブルを使用しているため、専用のセットアップが必要です。

## 🚀 セットアップ手順

### ステップ1: メインマイグレーション実行

**Supabase SQL Editorで実行:**

```sql
-- scripts/supabase-migration-custom-auth.sql の内容をコピー＆ペースト
```

このスクリプトは以下を実行します：
- ✅ beauty_users テーブルの確認/作成
- ✅ profiles, videos, blog_posts テーブルの作成
- ✅ カスタム認証関数の作成
- ✅ RLS ポリシーの設定

### ステップ2: トリガー設定

**Supabase SQL Editorで実行:**

```sql
-- scripts/beauty-users-trigger.sql の内容をコピー＆ペースト
```

これにより新規ユーザー登録時に自動的にプロファイルが作成されます。

### ステップ3: 管理者ユーザー作成

**Supabase SQL Editorで実行:**

```sql
-- scripts/create-admin-user-custom.sql の内容をコピー＆ペースト
```

### ステップ4: パスワード設定

beauty_usersテーブルのパスワード設定方法は実装に依存します：

#### オプション1: Supabase Auth統合の場合
Supabase Dashboard → Authentication → Users で作成

#### オプション2: カスタム実装の場合
```sql
-- パスワードハッシュ関数が必要
UPDATE beauty_users 
SET encrypted_password = crypt('Fkyosai51', gen_salt('bf'))
WHERE email = 'greenroom51@gmail.com';
```

### ステップ5: 検証

以下のクエリで設定を確認：

```sql
-- 管理者ユーザーの確認
SELECT 
  u.id,
  u.email,
  p.role,
  p.membership_type
FROM beauty_users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'greenroom51@gmail.com';

-- テーブル構造の確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- RLSポリシーの確認
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🔧 アプリケーション側の対応

### Supabaseクライアントの設定

`src/lib/supabase-client.ts` にカスタム認証ヘルパーを追加済み：

```typescript
// カスタム認証の使用例
import { customAuth } from '@/lib/supabase-client'

// 現在のユーザー取得
const user = await customAuth.getCurrentUser()

// プロファイル取得
const profile = await customAuth.getProfile(user.id)
```

### 認証フローの調整

コンポーネント内で beauty_users テーブルを参照する場合：

```typescript
// ログインチェック
const checkUser = async () => {
  const user = await customAuth.getCurrentUser()
  if (!user) {
    router.push('/auth/login')
    return
  }
  
  const profile = await customAuth.getProfile(user.id)
  // ...
}
```

## ⚠️ 注意事項

### 1. 認証方式の確認
- Supabase標準認証を使用しているか
- 完全カスタム認証を使用しているか
- ハイブリッド方式か

### 2. パスワード管理
- beauty_users.encrypted_password の暗号化方式
- パスワードリセット機能の実装
- セッション管理の方法

### 3. RLS関数の動作
- `get_current_user_id()` 関数がセッション情報を正しく取得できるか
- JWT トークンの設定が必要か

## 🔍 トラブルシューティング

### エラー: "relation 'auth.users' does not exist"
→ beauty_users を参照するように修正済み

### エラー: "function auth.uid() does not exist"
→ カスタム関数 `get_current_user_id()` を使用

### エラー: "permission denied for table beauty_users"
→ RLS ポリシーを確認、管理者権限でアクセス

## 📱 フロントエンド実装例

### ログインページの修正
```typescript
// カスタム認証を使用する場合
const handleLogin = async (email: string, password: string) => {
  // 実装に応じてカスタマイズ
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  // または直接 beauty_users テーブルを確認
  // const user = await customAuth.getCurrentUser()
}
```

### 管理者チェック
```typescript
const isAdmin = async () => {
  const user = await customAuth.getCurrentUser()
  if (!user) return false
  
  const profile = await customAuth.getProfile(user.id)
  return profile?.role === 'admin' || user.email === 'greenroom51@gmail.com'
}
```

## 🎯 次のステップ

1. ✅ SQLスクリプトを順番に実行
2. ✅ 管理者ユーザーのパスワード設定方法を確認
3. ✅ フロントエンドの認証フローを調整
4. ✅ 動作テスト実施

このセットアップにより、beauty_users テーブルを使用したカスタム認証環境でFLEEKSプラットフォームが正常に動作します。