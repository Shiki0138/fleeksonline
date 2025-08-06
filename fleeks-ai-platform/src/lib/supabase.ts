import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// サーバーサイド用のクライアント（管理者権限）
export const supabaseAdmin = createClient(
  supabaseUrl, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// データベース型定義
export interface Database {
  public: {
    Tables: {
      beauty_users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_status: 'free' | 'trial' | 'paid' | 'cancelled'
          subscription_id: string | null
          subscription_expires_at: string | null
          ai_preferences: any
          trust_score: number
          created_at: string
          updated_at: string
          last_login_at: string | null
          metadata: any
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'trial' | 'paid' | 'cancelled'
          subscription_id?: string | null
          subscription_expires_at?: string | null
          ai_preferences?: any
          trust_score?: number
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          metadata?: any
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'trial' | 'paid' | 'cancelled'
          subscription_id?: string | null
          subscription_expires_at?: string | null
          ai_preferences?: any
          trust_score?: number
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          metadata?: any
        }
      }
      beauty_videos: {
        Row: {
          id: string
          title: string
          description: string | null
          youtube_id: string
          duration_seconds: number | null
          thumbnail_url: string | null
          category: string | null
          tags: string[] | null
          ai_analysis: any
          view_count: number
          is_premium: boolean
          preview_seconds: number
          created_at: string
          updated_at: string
          metadata: any
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          youtube_id: string
          duration_seconds?: number | null
          thumbnail_url?: string | null
          category?: string | null
          tags?: string[] | null
          ai_analysis?: any
          view_count?: number
          is_premium?: boolean
          preview_seconds?: number
          created_at?: string
          updated_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          youtube_id?: string
          duration_seconds?: number | null
          thumbnail_url?: string | null
          category?: string | null
          tags?: string[] | null
          ai_analysis?: any
          view_count?: number
          is_premium?: boolean
          preview_seconds?: number
          created_at?: string
          updated_at?: string
          metadata?: any
        }
      }
      beauty_posts: {
        Row: {
          id: string
          user_id: string
          content: string
          images: string[] | null
          ai_moderation: any
          sentiment_score: number | null
          is_visible: boolean
          likes_count: number
          replies_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          images?: string[] | null
          ai_moderation?: any
          sentiment_score?: number | null
          is_visible?: boolean
          likes_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          images?: string[] | null
          ai_moderation?: any
          sentiment_score?: number | null
          is_visible?: boolean
          likes_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']