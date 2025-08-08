# ユーザー作成手順

## Supabaseダッシュボードで一般ユーザーを作成

### 1. Supabaseダッシュボードにアクセス
1. https://app.supabase.com にログイン
2. プロジェクトを選択

### 2. 新規ユーザーを作成
1. 左メニューの「Authentication」をクリック
2. 「Users」タブを選択
3. 「Add user」→「Create new user」をクリック
4. 以下の情報を入力：
   - Email: `mail@invest-master.net`
   - Password: `Skyosai51`
   - Auto Confirm User: ✓ チェック

### 3. プロファイルを作成（SQLエディタで実行）
```sql
-- ユーザーIDを確認（Authenticationページでコピー）
-- 以下のuser_idを実際のIDに置き換えて実行

INSERT INTO fleeks_profiles (
  id,
  username,
  full_name,
  membership_type,
  role,
  created_at,
  updated_at
) VALUES (
  'ここにユーザーIDを入力', -- Authenticationページからコピー
  'invest-master',
  'Invest Master',
  'free',
  'user',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

## 管理者アクセスの確認

### 現在の管理者アクセス制御:

1. **ハードコードされた管理者メール**: `greenroom51@gmail.com`
2. **roleベースの制御**: `fleeks_profiles`テーブルの`role`が`admin`のユーザー

### 管理者のみアクセス可能なページ:
- `/admin` - 管理ダッシュボード
- `/admin/videos/*` - 動画管理
- `/admin/blog/*` - ブログ管理
- `/admin/users` - ユーザー管理
- `/admin/analytics` - アナリティクス
- `/admin/settings` - システム設定

これらのページは`middleware.ts`で保護されています。