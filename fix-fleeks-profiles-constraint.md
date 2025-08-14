# fleeks_profiles制約エラーの修正

## エラーの原因
`fleeks_profiles`テーブルの`role`カラムにCHECK制約があり、`'paid'`が許可されていない可能性があります。

## 解決方法

### 1. 現在の制約を確認

```sql
-- fleeks_profilesテーブルの制約を確認
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'fleeks_profiles'::regclass
AND contype = 'c'; -- CHECK constraints
```

### 2. roleカラムの許可値を確認

```sql
-- roleカラムの制約詳細を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fleeks_profiles' AND column_name = 'role';
```

### 3A. 制約を一時的に削除してから更新（推奨）

```sql
-- 現在のrole制約を削除
ALTER TABLE fleeks_profiles DROP CONSTRAINT IF EXISTS fleeks_profiles_role_check;

-- fleeks_profilesを更新（安全なrole値を使用）
UPDATE fleeks_profiles 
SET role = 'user',  -- 'paid'の代わりに'user'を使用
    membership_type = 'premium',
    updated_at = NOW()
WHERE id IN (
  SELECT ur.user_id 
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'premium_user'
);

-- 新しい制約を追加（paidも許可）
ALTER TABLE fleeks_profiles 
ADD CONSTRAINT fleeks_profiles_role_check 
CHECK (role IN ('user', 'admin', 'paid', 'free'));
```

### 3B. または、制約に合わせてrole値を調整

```sql
-- 制約を確認した上で、許可されている値を使用
UPDATE fleeks_profiles 
SET role = 'user',  -- 許可されている値を使用
    membership_type = 'premium',
    updated_at = NOW()
WHERE id IN (
  SELECT ur.user_id 
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'premium_user'
);
```

### 4. 更新結果の確認

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

### 5. 管理者の確認

```sql
-- 管理者が正しく設定されているか確認
SELECT 
  fp.role as profile_role,
  fp.membership_type,
  array_agg(r.name) as rbac_roles
FROM fleeks_profiles fp
JOIN beauty_users bu ON fp.id = bu.id
JOIN user_roles ur ON bu.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE bu.email = 'greenroom51@gmail.com'
GROUP BY fp.id, fp.role, fp.membership_type;
```

---

## 推奨実行順序

1. **ステップ1**: 制約確認
2. **ステップ3A**: 制約削除 → 更新 → 新制約追加
3. **ステップ4**: 結果確認
4. **ステップ5**: 管理者確認

まず**ステップ1**を実行して、現在の制約内容を確認してください。