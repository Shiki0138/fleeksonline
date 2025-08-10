# 🔐 Supabase管理者アカウント設定手順

## 管理者アカウント作成

### 方法1: Supabaseダッシュボードから作成（推奨）

1. **Supabaseダッシュボードにアクセス**
   - https://app.supabase.com にログイン
   - FLEEKSプロジェクトを選択

2. **Authentication → Users**
   - 「Invite User」または「Create User」ボタンをクリック

3. **ユーザー情報を入力**
   ```
   Email: greenroom51@gmail.com
   Password: Fkyosai51
   Email Confirmed: ✓ (チェックを入れる)
   ```

4. **User Metadata を設定**
   ```json
   {
     "full_name": "システム管理者",
     "role": "admin"
   }
   ```

5. **作成後、ユーザーIDをコピー**

6. **SQL Editorで管理者プロフィールを作成**
   ```sql
   INSERT INTO profiles (id, full_name, role, membership_type, created_at, updated_at)
   VALUES (
     'ここにユーザーIDを貼り付け',
     'システム管理者',
     'admin',
     'vip',
     NOW(),
     NOW()
   );
   ```

### 方法2: コマンドラインから作成

1. **環境変数を設定**
   ```bash
   # .env.production.local ファイルに実際の値を設定
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

2. **スクリプトを実行**
   ```bash
   cd /path/to/fleeks-clean
   node scripts/create-admin.js
   ```

### 方法3: Supabase CLI を使用

```bash
# Supabase CLIをインストール
npm install -g supabase

# ログイン
supabase login

# ユーザー作成
supabase users create \
  --email greenroom51@gmail.com \
  --password Fkyosai51 \
  --user-metadata '{"full_name":"システム管理者","role":"admin"}'
```

## 管理者権限の確認

### SQLで確認
```sql
-- ユーザー情報の確認
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'greenroom51@gmail.com';

-- プロフィール情報の確認
SELECT * FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'greenroom51@gmail.com');
```

## セキュリティ設定

### Row Level Security (RLS) ポリシー
管理者用のRLSポリシーが必要な場合：

```sql
-- 管理者は全てのデータを閲覧可能
CREATE POLICY "Admins can view all data" ON profiles
FOR SELECT USING (
  auth.jwt() ->> 'email' = 'greenroom51@gmail.com'
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 管理者は全てのデータを更新可能
CREATE POLICY "Admins can update all data" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

## トラブルシューティング

### ログインできない場合
1. メールアドレスとパスワードが正確か確認
2. Email Confirmedがtrueになっているか確認
3. Supabaseの環境変数が正しく設定されているか確認

### 権限が反映されない場合
1. profilesテーブルに管理者レコードが存在するか確認
2. roleフィールドが'admin'になっているか確認
3. RLSポリシーが正しく設定されているか確認

## 注意事項

- パスワードは定期的に変更することを推奨
- 二要素認証の有効化を検討
- 管理者アクションのログを記録することを推奨
- 本番環境では管理者アカウントは最小限に制限