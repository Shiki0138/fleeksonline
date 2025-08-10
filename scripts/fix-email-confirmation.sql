-- self.138@gmail.com のメール確認エラーを修正するSQL

-- 1. まず、ユーザーの現在の状態を確認
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    banned_until
FROM auth.users 
WHERE email = 'self.138@gmail.com';

-- 2. メール確認を強制的に完了させる
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'self.138@gmail.com' 
AND email_confirmed_at IS NULL;

-- 3. もしユーザーがbanされている場合の解除
UPDATE auth.users 
SET banned_until = NULL
WHERE email = 'self.138@gmail.com' 
AND banned_until IS NOT NULL;

-- 4. 確認（メール確認が完了していることを確認）
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    banned_until,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'メール確認済み'
        ELSE 'メール未確認'
    END as confirmation_status
FROM auth.users 
WHERE email = 'self.138@gmail.com';

-- 5. beauty_usersテーブルにも存在することを確認
SELECT 
    bu.id,
    bu.email,
    au.email_confirmed_at
FROM beauty_users bu
LEFT JOIN auth.users au ON bu.id = au.id
WHERE bu.email = 'self.138@gmail.com';

-- 6. プロファイルも確認
SELECT 
    fp.id,
    fp.username,
    fp.membership_type,
    au.email,
    au.email_confirmed_at
FROM fleeks_profiles fp
JOIN auth.users au ON fp.id = au.id
WHERE au.email = 'self.138@gmail.com';