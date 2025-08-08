-- self.138@gmail.com のメール確認エラーを修正するSQL（修正版）

-- 1. まず、ユーザーの現在の状態を確認
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    banned_until
FROM auth.users 
WHERE email = 'self.138@gmail.com';

-- 2. メール確認を強制的に完了させる（confirmed_atは除外）
UPDATE auth.users 
SET email_confirmed_at = NOW()
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
    banned_until,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'メール確認済み'
        ELSE 'メール未確認'
    END as confirmation_status
FROM auth.users 
WHERE email = 'self.138@gmail.com';

-- 5. もしまだエラーが出る場合は、ユーザーを一旦削除して再作成
-- 注意: 実行前に既存のプロファイルデータをバックアップすること

-- バックアップ（実行前に確認）
SELECT 
    fp.*,
    au.email
FROM fleeks_profiles fp
JOIN auth.users au ON fp.id = au.id
WHERE au.email = 'self.138@gmail.com';

-- プロファイル削除（必要に応じて）
-- DELETE FROM fleeks_profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'self.138@gmail.com');

-- beauty_users削除（必要に応じて）
-- DELETE FROM beauty_users WHERE id = (SELECT id FROM auth.users WHERE email = 'self.138@gmail.com');

-- ユーザー削除（必要に応じて）
-- DELETE FROM auth.users WHERE email = 'self.138@gmail.com';

-- 再作成する場合は、Supabase Dashboard > Authentication > Users で
-- Email: self.138@gmail.com
-- Auto Confirm User: ✅ チェック
-- として作成してください