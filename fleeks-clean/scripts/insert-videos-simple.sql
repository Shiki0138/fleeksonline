-- Simple video insertion - minimal columns only
-- Run fix-database-schema.sql first to ensure all columns exist

INSERT INTO videos (
  youtube_id,
  title,
  description,
  category,
  duration,
  is_premium
) VALUES
  ('xdHq_H-VF80', 'Instagram集客の基礎：フォロワーを増やす5つの戦略', 'Instagramでビジネスを成長させるための基本戦略を解説。', 'Instagram集客', 1200, true),
  ('R6m6YtYj7w8', '顧客心理を掴む接客術：リピート率80%の秘密', '心理学的アプローチを活用した接客方法を実践的に解説。', '接客スキル', 1800, true),
  ('hJ22_BtUoQA', 'ローカルビジネスのためのMEO対策完全ガイド', 'Googleマイビジネスを活用した地域集客の方法を徹底解説。', 'デジタルマーケティング', 2400, true),
  ('vMq5vrfHlKI', 'インスタライブで売上を3倍にする方法', 'ライブコマースの成功事例と実践的なテクニック。', 'Instagram集客', 1500, true),
  ('6F9lUORkrNA', '価格設定の心理学：利益を最大化する戦略', '行動経済学に基づいた価格設定の方法を解説。', '経営戦略', 2100, true),
  ('_-0SaFXGeNw', 'SNS広告運用の基礎：少額予算で始める集客', 'Facebook/Instagram広告の基本設定から効果測定まで。', 'デジタルマーケティング', 1950, false),
  ('U43Z0O_PHNE', 'リールで爆発的にフォロワーを増やす方法', 'Instagramリールのアルゴリズムを理解し、バズるコンテンツを作る方法。', 'Instagram集客', 1650, true),
  ('X4I3wHH1cJY', 'ストーリーズを使った集客テクニック10選', 'Instagramストーリーズの機能を最大限活用する方法。', 'Instagram集客', 1350, false),
  ('cV8ynHlaq6I', 'クレーム対応の極意：ピンチをチャンスに変える', '難しいお客様への対応方法を心理学的アプローチで解説。', '接客スキル', 1750, true),
  ('vGdVg_Zl1b0', '競合分析の基本：差別化戦略の立て方', '競合店舗の分析方法と自店の強みを見つける方法。', '経営戦略', 2050, true)
ON CONFLICT (youtube_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  is_premium = EXCLUDED.is_premium,
  updated_at = NOW();