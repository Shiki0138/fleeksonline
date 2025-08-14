# 182人を無料会員から有料会員に変更

Supabaseの SQL Editor で以下のクエリを順番に実行してください：

## 1. 変更前の状況確認

```sql
-- 変更前のロール分布を確認
SELECT 'BEFORE CONVERSION - Role Distribution' as status,
  r.display_name as role,
  COUNT(DISTINCT ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.display_name
ORDER BY r.priority DESC;
```

## 2. 無料会員を有料会員に変更

```sql
-- 無料会員を有料会員に変更
DO $$
DECLARE
  free_user_role_id UUID;
  premium_user_role_id UUID;
  converted_count INTEGER;
BEGIN
  -- ロールIDを取得
  SELECT id INTO free_user_role_id FROM roles WHERE name = 'free_user';
  SELECT id INTO premium_user_role_id FROM roles WHERE name = 'premium_user';
  
  -- 変換対象ユーザー数をカウント
  SELECT COUNT(*) INTO converted_count 
  FROM user_roles 
  WHERE role_id = free_user_role_id;
  
  RAISE NOTICE 'Converting % users from free_user to premium_user', converted_count;
  
  -- 全ての free_user ロールを premium_user ロールに変更
  UPDATE user_roles 
  SET role_id = premium_user_role_id,
      granted_at = NOW()
  WHERE role_id = free_user_role_id;
  
  RAISE NOTICE 'Conversion completed: % users converted to premium', converted_count;
END $$;
```

## 3. 変更後の確認

```sql
-- 変更後のロール分布を確認
SELECT 'AFTER CONVERSION - Role Distribution' as status,
  r.display_name as role,
  COUNT(DISTINCT ur.user_id) as user_count,
  CASE 
    WHEN r.name IN ('premium_user', 'admin', 'super_admin') THEN 'HAS PREMIUM ACCESS'
    ELSE 'FREE ONLY'
  END as content_access
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.display_name, r.name
ORDER BY r.priority DESC;
```

## 4. プレミアムアクセス総数確認

```sql
-- プレミアムコンテンツアクセス可能ユーザー総数
SELECT 
  'PREMIUM ACCESS SUMMARY' as summary,
  COUNT(DISTINCT ur.user_id) as total_users_with_premium_access
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name IN ('premium_user', 'admin', 'super_admin');
```

## 5. fleeks_profilesテーブルも更新（整合性のため）

```sql
-- fleeks_profilesテーブルも一致するように更新
UPDATE fleeks_profiles 
SET role = 'paid',
    membership_type = 'premium',
    updated_at = NOW()
WHERE id IN (
  SELECT ur.user_id 
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'premium_user'
);
```

## 6. 管理者ユーザーの確認

```sql
-- 管理者が正常に設定されているか確認
SELECT 
  'Admin verification' as check_type,
  bu.email,
  array_agg(r.name ORDER BY r.priority DESC) as roles,
  CASE 
    WHEN 'admin' = ANY(array_agg(r.name)) OR 'super_admin' = ANY(array_agg(r.name)) 
    THEN 'ADMIN ACCESS CONFIRMED' 
    ELSE 'ERROR: NO ADMIN ACCESS' 
  END as admin_status
FROM beauty_users bu
JOIN user_roles ur ON bu.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE bu.email = 'greenroom51@gmail.com'
GROUP BY bu.id, bu.email;
```

## 7. 最終確認

```sql
-- 最終的なロール分布確認
SELECT 'FINAL STATUS' as status,
  'Admin users: ' || 
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('admin', 'super_admin')) ||
  ', Premium users: ' ||
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'premium_user') ||
  ', Free users: ' ||
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'free_user') ||
  ', Guest users: ' ||
  (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'guest') as distribution;
```

---

## 期待される結果

**変更後:**
- 管理者: 1人（全アクセス権限）
- 有料会員: 182人（プレミアムコンテンツアクセス可能）
- 無料会員: 0人
- プレミアムアクセス可能ユーザー総数: 183人（管理者1人 + 有料会員182人）

これらのクエリを順番に実行して、結果を教えてください！