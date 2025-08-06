-- ===================================
-- Fleeks AI Beauty Platform
-- データベーススキーマ作成SQL
-- ===================================

-- 1. beauty_users テーブル（ユーザー情報）
CREATE TABLE IF NOT EXISTS public.beauty_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'paid', 'cancelled')),
  subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  ai_preferences JSONB DEFAULT '{}',
  trust_score NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- 2. beauty_videos テーブル（動画コンテンツ）
CREATE TABLE IF NOT EXISTS public.beauty_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_id TEXT NOT NULL,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  category TEXT,
  tags TEXT[],
  ai_analysis JSONB DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT true,
  preview_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 3. beauty_posts テーブル（コミュニティ投稿）
CREATE TABLE IF NOT EXISTS public.beauty_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.beauty_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[],
  ai_moderation JSONB DEFAULT '{}',
  sentiment_score NUMERIC(3,2),
  is_visible BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. beauty_interactions テーブル（ユーザー行動履歴）
CREATE TABLE IF NOT EXISTS public.beauty_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.beauty_users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.beauty_videos(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  duration_watched INTEGER,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. beauty_recommendations テーブル（AIレコメンデーション）
CREATE TABLE IF NOT EXISTS public.beauty_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.beauty_users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.beauty_videos(id) ON DELETE CASCADE,
  score NUMERIC(3,2),
  reason TEXT,
  algorithm TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false,
  UNIQUE(user_id, video_id)
);

-- ===================================
-- Row Level Security (RLS) 設定
-- ===================================

-- RLS有効化
ALTER TABLE public.beauty_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beauty_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beauty_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beauty_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beauty_recommendations ENABLE ROW LEVEL SECURITY;

-- ユーザーポリシー
CREATE POLICY "Users can view own profile" 
  ON public.beauty_users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.beauty_users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.beauty_users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 動画ポリシー（誰でも閲覧可能）
CREATE POLICY "Public can view videos" 
  ON public.beauty_videos FOR SELECT 
  USING (true);

-- 投稿ポリシー
CREATE POLICY "Public can view visible posts" 
  ON public.beauty_posts FOR SELECT 
  USING (is_visible = true);

CREATE POLICY "Authenticated users can create posts" 
  ON public.beauty_posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" 
  ON public.beauty_posts FOR UPDATE 
  USING (auth.uid() = user_id);

-- インタラクションポリシー
CREATE POLICY "Users can create own interactions" 
  ON public.beauty_interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" 
  ON public.beauty_interactions FOR SELECT 
  USING (auth.uid() = user_id);

-- レコメンデーションポリシー
CREATE POLICY "Users can view own recommendations" 
  ON public.beauty_recommendations FOR SELECT 
  USING (auth.uid() = user_id);

-- ===================================
-- インデックス作成（パフォーマンス向上）
-- ===================================

CREATE INDEX idx_beauty_interactions_user_video 
  ON public.beauty_interactions(user_id, video_id);

CREATE INDEX idx_beauty_posts_user_created 
  ON public.beauty_posts(user_id, created_at DESC);

CREATE INDEX idx_beauty_videos_category 
  ON public.beauty_videos(category);

CREATE INDEX idx_beauty_videos_created 
  ON public.beauty_videos(created_at DESC);

-- ===================================
-- サンプルデータ挿入
-- ===================================

-- サンプル動画データ
INSERT INTO public.beauty_videos (title, description, youtube_id, category, tags, view_count, is_premium, preview_seconds, thumbnail_url) VALUES
('【2024最新】美容師のためのSNS集客完全ガイド', 'InstagramとTikTokを活用した効果的な集客方法を詳しく解説。実例を交えながら、今すぐ使えるテクニックを紹介します。', 'dQw4w9WgXcQ', 'マーケティング', ARRAY['SNS', 'Instagram', 'TikTok', '集客', 'マーケティング'], 1250, true, 300, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'),

('AI活用で効率化！美容室経営の未来', '最新のAI技術を使って予約管理、在庫管理、顧客分析を効率化。ChatGPTの活用方法も解説します。', 'jNQXAC9IVRw', 'テクノロジー', ARRAY['AI', 'ChatGPT', '効率化', '経営', 'DX'], 890, true, 300, 'https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg'),

('カラーリング技術の基礎から応用まで', 'プロのカラーリスト直伝！ブリーチからグラデーション、最新のカラートレンドまで完全網羅。', '9bZkp7q19f0', '技術', ARRAY['カラー', '技術', 'ブリーチ', 'グラデーション'], 2030, false, 600, 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg'),

('【初心者向け】美容室開業の完全ロードマップ', '開業資金の準備から物件選び、必要な許可申請まで、美容室開業に必要なすべてを解説します。', 'M7lc1UVf-VE', '経営', ARRAY['開業', '独立', '経営', '資金調達'], 567, true, 300, 'https://i.ytimg.com/vi/M7lc1UVf-VE/maxresdefault.jpg'),

('最新トレンド！韓国風ヘアスタイル完全解説', '人気の韓国風ヘアスタイルの作り方を、カット・パーマ・スタイリングまで詳しく解説します。', 'dQw4w9WgXcQ', 'トレンド', ARRAY['韓国', 'トレンド', 'スタイリング', 'パーマ'], 3456, true, 300, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'),

('【保存版】美容師の手荒れ対策と予防法', '職業病とも言える手荒れの原因から、効果的な対策と予防法まで医学的見地から解説します。', 'jNQXAC9IVRw', '健康・ケア', ARRAY['手荒れ', '健康', 'ケア', '予防'], 1234, false, 600, 'https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg');

-- 完了メッセージ
SELECT 'テーブル作成とサンプルデータ挿入が完了しました！' as message;