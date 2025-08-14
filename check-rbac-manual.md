# 現在のRBAC状況確認

Supabaseのデータベースに直接接続して、以下のSQLクエリを実行してください：

## 1. 現在のロール分布確認

```sql
-- 1. 現在のロール分布
SELECT 
  r.display_name as role,
  COUNT(DISTINCT ur.user_id) as user_count,
  CASE 
    WHEN r.name IN ('premium_user', 'admin', 'super_admin') THEN 'CAN ACCESS PREMIUM'
    ELSE 'FREE ONLY'
  END as premium_access
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.display_name, r.name
ORDER BY r.priority DESC;
```

## 2. プレミアムアクセス可能ユーザーの総数

```sql
-- 2. プレミアムコンテンツアクセス可能ユーザー総数
SELECT 
  'Premium content access summary' as summary,
  COUNT(DISTINCT ur.user_id) as total_premium_users
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name IN ('premium_user', 'admin', 'super_admin');
```

## 3. 182人の無料ユーザーの詳細分析

```sql
-- 3. 無料ユーザーの元のロール分析
SELECT 
  'Current free_user role analysis' as analysis,
  r.name as role_name,
  fp.role as original_fleeks_role,
  COUNT(*) as count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN beauty_users bu ON ur.user_id = bu.id
LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE r.name = 'free_user'
GROUP BY r.name, fp.role;
```

## 4. 管理者ユーザーの確認

```sql
-- 4. 管理者ユーザーの確認
SELECT 
  'Admin user check' as check_type,
  bu.email,
  array_agg(r.name ORDER BY r.priority DESC) as assigned_roles,
  CASE 
    WHEN 'admin' = ANY(array_agg(r.name)) OR 'super_admin' = ANY(array_agg(r.name)) 
    THEN 'ADMIN ACCESS' 
    ELSE 'NO ADMIN ACCESS' 
  END as admin_status
FROM beauty_users bu
JOIN user_roles ur ON bu.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE bu.email = 'greenroom51@gmail.com'
GROUP BY bu.id, bu.email;
```

---

これらのクエリを実行して、結果を教えてください。

**期待される結果:**
- 無料会員（free_user）: 182人 → これを有料会員に変更したい
- 管理者（admin）: 1人（greenroom51@gmail.com）
- プレミアムアクセス可能: 1人（現在は管理者のみ）