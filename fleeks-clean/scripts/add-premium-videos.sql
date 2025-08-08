-- FLEEKS Premium Videos 追加スクリプト
-- 実行日: 2025-08-08
-- 説明: 会員向けサービスの動画を追加（プレミアム会員限定）

-- 動画を追加（最新のものから順番に）
INSERT INTO fleeks_videos (youtube_id, title, description, category, duration, is_premium, published_at, view_count)
VALUES
  -- 1. 最新動画
  ('LftOW_bEbBM', 'ビジネス成長のための戦略的思考法', 'ビジネスを次のレベルに成長させるための戦略的思考法を解説します。', 'Instagram集客', 600, true, '2025-08-08', 0),
  
  -- 2. 
  ('l9jjd_zIwo8', 'SNSマーケティングの最新トレンド2025', '2025年のSNSマーケティングトレンドと効果的な活用方法について解説します。', 'SNSマーケティング', 720, true, '2025-08-07', 0),
  
  -- 3.
  ('rk6ASzacqk8', '顧客エンゲージメントを高める心理学的アプローチ', '顧客との深い関係性を構築するための心理学的テクニックを紹介します。', '接客スキル', 900, true, '2025-08-06', 0),
  
  -- 4.
  ('0RmtIqaXWTk', 'Instagram Reelsで爆発的にバズる方法', 'Instagram Reelsを活用してフォロワーを急速に増やす実践的な方法を解説します。', 'Instagram集客', 480, true, '2025-08-05', 0),
  
  -- 5.
  ('2Y89ervRmDE', 'デジタルマーケティングROI最大化の秘訣', 'デジタルマーケティングの投資対効果を最大化するための具体的な手法を紹介します。', 'デジタルマーケティング', 840, true, '2025-08-04', 0),
  
  -- 6.
  ('0Bk1GrOBR1I', '美容サロン経営者のための集客戦略', '美容サロン経営者向けの効果的な集客戦略と実践方法を解説します。', '経営戦略', 1020, true, '2025-08-03', 0),
  
  -- 7.
  ('RXc2twtVqFI', 'リピート率を3倍にする接客テクニック', 'お客様のリピート率を劇的に向上させる接客の極意を伝授します。', '接客スキル', 660, true, '2025-08-02', 0),
  
  -- 8.
  ('NvkWRFf0Ttc', 'SNS広告運用の完全マスターガイド', 'Facebook、Instagram広告の効果的な運用方法を基礎から応用まで解説します。', 'SNSマーケティング', 1200, true, '2025-08-01', 0),
  
  -- 9.
  ('uE_zI5iak6o', 'インフルエンサーマーケティング実践講座', 'インフルエンサーとのコラボレーションで売上を伸ばす方法を解説します。', 'SNSマーケティング', 540, true, '2025-07-31', 0),
  
  -- 10.
  ('vGdVg_Zl1b0', '顧客満足度を最大化するサービス設計', '顧客体験を向上させるサービス設計の考え方と実践方法を紹介します。', '経営戦略', 780, true, '2025-07-30', 0),
  
  -- 11.
  ('cV8ynHlaq6I', 'Instagram Storiesマーケティング完全ガイド', 'Instagram Storiesを活用した効果的なマーケティング手法を解説します。', 'Instagram集客', 420, true, '2025-07-29', 0),
  
  -- 12.
  ('X4I3wHH1cJY', 'ビジネスオーナーのためのブランディング戦略', '強力なブランドを構築するための戦略と実践方法を解説します。', 'デジタルマーケティング', 960, true, '2025-07-28', 0),
  
  -- 13.
  ('fUNdUioJJNk', '口コミマーケティングの科学', '口コミを戦略的に活用してビジネスを成長させる方法を科学的に解説します。', 'SNSマーケティング', 720, true, '2025-07-27', 0),
  
  -- 14.
  ('U43Z0O_PHNE', '美容業界のためのDXガイド', '美容業界におけるデジタルトランスフォーメーションの進め方を解説します。', 'デジタルマーケティング', 840, true, '2025-07-26', 0),
  
  -- 15.
  ('_-0SaFXGeNw', '顧客データを活用した売上向上術', '顧客データの分析と活用で売上を向上させる実践的な方法を紹介します。', '経営戦略', 600, true, '2025-07-25', 0),
  
  -- 16.
  ('6F9lUORkrNA', 'TikTokマーケティング基礎から応用まで', 'TikTokを活用したマーケティングの基礎知識から実践的な活用方法まで解説します。', 'SNSマーケティング', 660, true, '2025-07-24', 0),
  
  -- 17.
  ('vMq5vrfHlKI', '接客業のためのコミュニケーション心理学', '接客におけるコミュニケーションを心理学的アプローチで改善する方法を解説します。', '接客スキル', 900, true, '2025-07-23', 0),
  
  -- 18.
  ('hJ22_BtUoQA', 'ローカルビジネスのためのSEO戦略', '地域密着型ビジネスのためのSEO対策と集客方法を解説します。', 'デジタルマーケティング', 780, true, '2025-07-22', 0),
  
  -- 19.
  ('R6m6YtYj7w8', 'LINEマーケティングで顧客との関係性を深める', 'LINE公式アカウントを活用した効果的な顧客コミュニケーション戦略を解説します。', 'SNSマーケティング', 540, true, '2025-07-21', 0),
  
  -- 20.
  ('xdHq_H-VF80', 'メンバーシップビジネスの成功法則', 'サブスクリプション型ビジネスモデルの構築と運営方法を解説します。', '経営戦略', 1080, true, '2025-07-20', 0)
ON CONFLICT (youtube_id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  is_premium = EXCLUDED.is_premium,
  published_at = EXCLUDED.published_at,
  updated_at = CURRENT_TIMESTAMP;

-- 動画数の確認
SELECT COUNT(*) as total_videos, 
       COUNT(CASE WHEN is_premium = true THEN 1 END) as premium_videos
FROM fleeks_videos;

-- 最新の動画を確認（日付順）
SELECT youtube_id, title, category, published_at
FROM fleeks_videos
WHERE is_premium = true
ORDER BY published_at DESC
LIMIT 20;