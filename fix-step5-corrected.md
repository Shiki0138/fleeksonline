# ステップ5の修正版

制約に合わせて、`role`は許可されている値（`'user'`）を使用します。

## 修正されたステップ5

```sql
-- fleeks_profilesテーブルを制約に合わせて更新
UPDATE fleeks_profiles 
SET role = 'user',  -- 制約で許可されている値を使用
    membership_type = 'premium',  -- こちらは制約で許可されている
    updated_at = NOW()
WHERE id IN (
  SELECT ur.user_id 
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'premium_user'
);
```

## 更新結果の確認

```sql
-- 更新されたプロファイルの確認
SELECT 
  role,
  membership_type,
  COUNT(*) as count
FROM fleeks_profiles
GROUP BY role, membership_type
ORDER BY count DESC;
```

## 重要な説明

**RBACシステムでは**:
- `user_roles`テーブルで実際の権限管理（`premium_user`ロール）
- `fleeks_profiles.role`は`'user'`のまま（制約による制限）
- `fleeks_profiles.membership_type`は`'premium'`に設定

**権限判定は**:
- RBACシステム（`user_roles`テーブル）を優先
- `fleeks_profiles`は表示用・互換性維持用

これで182人が有料会員として正しく設定されます！