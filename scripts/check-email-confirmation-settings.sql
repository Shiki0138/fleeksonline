-- Supabaseのメール確認設定をチェック
-- Supabase SQL Editorで実行してください

-- 1. 現在の認証設定を確認
SELECT 
    key,
    value
FROM auth.config
WHERE key IN (
    'external_email_enabled',
    'mailer_autoconfirm',
    'mailer_secure_email_change_enabled',
    'site_url'
);

-- 2. 最近作成されたユーザーのメール確認状態を確認
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    confirmation_sent_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. メール確認が必要かどうかのポリシーを確認
-- (Supabaseダッシュボードで設定されている場合)
SELECT 
    schemaname,
    tablename,
    policyname,
    definition
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'auth';

-- 重要な設定の確認方法：
-- 1. Supabaseダッシュボード → Authentication → Settings → Email Auth
--    - "Confirm email" が有効になっているか確認
--    - "Site URL" が正しく設定されているか確認（https://app.fleeks.jp）
--    - "Redirect URLs" に /auth/confirm が含まれているか確認

-- 2. Email Templates → Confirm signup
--    - {{ .ConfirmationURL }} が正しく使われているか確認
--    - カスタムテンプレートの場合、リンクが正しいか確認

-- メール確認を無効にする場合（推奨しません）：
-- UPDATE auth.config SET value = 'true' WHERE key = 'mailer_autoconfirm';