-- フォーラム投稿権限の修正スクリプト

-- 1. 管理者ユーザーを premium会員に設定（テスト用）
UPDATE fleeks_profiles 
SET membership_type = 'premium'
WHERE role = 'admin';

-- 2. 既存の管理者ユーザーがいない場合、サンプル管理者を作成
-- (実際のユーザーIDに置き換えてください)
-- INSERT INTO fleeks_profiles (id, role, membership_type, nickname, email)
-- VALUES ('your-admin-user-id', 'admin', 'premium', 'Admin User', 'admin@fleeks.jp')
-- ON CONFLICT (id) DO UPDATE SET
--   role = 'admin',
--   membership_type = 'premium';

-- 3. フォーラムのカテゴリーが存在することを確認
INSERT INTO forum_categories (name, slug, description, icon, display_order) 
SELECT * FROM (VALUES
  ('接客・サービス', 'customer-service', 'お客様対応、接客マナー、コミュニケーションについて', 'smile', 1),
  ('経営・マーケティング', 'business-marketing', '美容室経営、集客、マーケティング戦略について', 'trending-up', 2),
  ('技術相談', 'technical-advice', 'カット、カラー、パーマなどの技術的な相談', 'scissors', 3),
  ('商品・薬剤', 'products-chemicals', 'シャンプー、トリートメント、薬剤についての情報交換', 'beaker', 4),
  ('キャリア・転職', 'career-job', 'キャリアアップ、転職、独立についての相談', 'briefcase', 5),
  ('その他・雑談', 'others-chat', 'その他の話題や雑談', 'message-circle', 6)
) AS v(name, slug, description, icon, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM forum_categories WHERE slug = v.slug
);

-- 4. 現在のユーザーの権限状況を確認するクエリ
SELECT 
  id,
  nickname,
  email,
  role,
  membership_type,
  CASE 
    WHEN membership_type IN ('premium', 'vip') OR role IN ('admin', 'paid') THEN 'フォーラム投稿可能'
    ELSE 'フォーラム投稿不可（有料会員登録が必要）'
  END as forum_access
FROM fleeks_profiles
ORDER BY created_at DESC
LIMIT 10;