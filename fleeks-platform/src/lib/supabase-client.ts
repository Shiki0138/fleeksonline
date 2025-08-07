import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// クライアントコンポーネント用
export const supabase = createClientComponentClient()

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

// 型定義
export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  membership_type: 'free' | 'premium'
  membership_expires_at: string | null
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