#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🚀 Supabaseテーブル作成スクリプト\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// テーブル作成のSQLクエリ
const createTables = async () => {
  console.log('📊 テーブルを作成中...\n')

  // 1. beauty_users テーブル
  console.log('👥 beauty_users テーブルを作成中...')
  const { error: usersError } = await supabase.rpc('sql', {
    query: `
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
    `
  })

  if (usersError) {
    console.log('❌ beauty_users作成エラー:', usersError.message)
  } else {
    console.log('✅ beauty_users作成完了')
  }

  // 2. beauty_videos テーブル
  console.log('🎬 beauty_videos テーブルを作成中...')
  const { error: videosError } = await supabase.rpc('sql', {
    query: `
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
    `
  })

  if (videosError) {
    console.log('❌ beauty_videos作成エラー:', videosError.message)
  } else {
    console.log('✅ beauty_videos作成完了')
  }

  // 3. beauty_posts テーブル
  console.log('💬 beauty_posts テーブルを作成中...')
  const { error: postsError } = await supabase.rpc('sql', {
    query: `
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
    `
  })

  if (postsError) {
    console.log('❌ beauty_posts作成エラー:', postsError.message)
  } else {
    console.log('✅ beauty_posts作成完了')
  }

  // 4. Row Level Security 有効化
  console.log('🔒 Row Level Securityを設定中...')
  
  const rlsQueries = [
    'ALTER TABLE public.beauty_users ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.beauty_videos ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.beauty_posts ENABLE ROW LEVEL SECURITY;',
    `CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.beauty_users FOR SELECT USING (auth.uid() = id);`,
    `CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.beauty_users FOR UPDATE USING (auth.uid() = id);`,
    `CREATE POLICY IF NOT EXISTS "Public can view video metadata" ON public.beauty_videos FOR SELECT USING (true);`,
    `CREATE POLICY IF NOT EXISTS "Public can view visible posts" ON public.beauty_posts FOR SELECT USING (is_visible = true);`,
    `CREATE POLICY IF NOT EXISTS "Authenticated users can create posts" ON public.beauty_posts FOR INSERT WITH CHECK (auth.uid() = user_id);`
  ]

  for (const query of rlsQueries) {
    const { error } = await supabase.rpc('sql', { query })
    if (error && !error.message.includes('already exists')) {
      console.log('⚠️  RLS設定警告:', error.message)
    }
  }

  console.log('✅ Row Level Security設定完了')

  // 5. サンプルデータ挿入
  console.log('\n📝 サンプルデータを挿入中...')
  
  const sampleVideos = [
    {
      title: '美容師のためのSNS集客入門',
      description: 'InstagramとTikTokを活用した効果的な集客方法を学びます',
      youtube_id: 'dQw4w9WgXcQ', // Rick Roll for demo
      category: 'マーケティング',
      tags: ['SNS', 'Instagram', 'TikTok', '集客'],
      is_premium: true,
      preview_seconds: 300,
      view_count: 125,
      thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      title: 'AI活用で効率化！美容室経営の未来',
      description: '最新のAI技術を使って美容室の業務を効率化する方法',
      youtube_id: 'dQw4w9WgXcQ',
      category: 'テクノロジー',
      tags: ['AI', '効率化', '経営', '未来'],
      is_premium: true,
      preview_seconds: 300,
      view_count: 89,
      thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      title: 'カラーリング技術の基礎から応用まで',
      description: 'プロのカラーリスト直伝！基礎技術から最新トレンドまで',
      youtube_id: 'dQw4w9WgXcQ',
      category: '技術',
      tags: ['カラー', '技術', 'トレンド'],
      is_premium: false,
      preview_seconds: 180,
      view_count: 203,
      thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ]

  const { data: videoData, error: videoInsertError } = await supabase
    .from('beauty_videos')
    .insert(sampleVideos)
    .select()

  if (videoInsertError) {
    console.log('⚠️  サンプル動画データ挿入警告:', videoInsertError.message)
  } else {
    console.log('✅ サンプル動画データ挿入完了')
  }

  console.log('\n🎉 データベースセットアップ完了!')
  console.log('\n📊 作成されたテーブル:')
  console.log('- beauty_users (ユーザー情報)')
  console.log('- beauty_videos (動画データ)')  
  console.log('- beauty_posts (コミュニティ投稿)')
  console.log('- Row Level Security 設定済み')
  console.log('- サンプルデータ挿入済み')
  
  console.log('\n🚀 次のステップ:')
  console.log('1. npm run dev でアプリを起動')
  console.log('2. http://localhost:3000 にアクセス')
  console.log('3. Googleアカウントでログイン')
  console.log('4. 動画コンテンツを確認')
}

// メイン実行
createTables().catch(console.error)