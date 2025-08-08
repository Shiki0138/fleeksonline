import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// クライアントコンポーネント用
export const supabase = createClientComponentClient({
  options: {
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }
  }
})

// サーバーコンポーネント用（必要に応じて）
export const supabaseAdmin = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// カスタム認証テーブルを使用する場合のヘルパー関数
export const customAuth = {
  // beauty_usersテーブルを使用した認証チェック
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // beauty_usersテーブルからユーザー情報を取得
    const { data: beautyUser } = await supabase
      .from('beauty_users')
      .select('*')
      .eq('email', user.email)
      .single()
    
    return beautyUser
  },
  
  // プロファイル情報の取得
  async getProfile(userId: string) {
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return profile
  }
}

// 型定義
export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  membership_type: 'free' | 'premium' | 'vip'
  membership_expires_at: string | null
  role?: string
  created_at: string
  updated_at: string
}

export type Video = {
  id: string
  youtube_id: string
  title: string
  description: string | null
  duration: number
  thumbnail_url: string | null
  is_premium: boolean
  category: string | null
  tags: string[]
  view_count: number
  published_at: string
  created_at: string
  updated_at: string
}

export type WatchHistory = {
  id: string
  user_id: string
  video_id: string
  watched_seconds: number
  last_position: number
  completed: boolean
  last_watched_at: string
  created_at: string
}

export type Favorite = {
  id: string
  user_id: string
  video_id: string
  created_at: string
}