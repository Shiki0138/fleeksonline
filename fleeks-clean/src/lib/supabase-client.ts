import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Single Supabase client instance for the entire application
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Type definitions for database tables
export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  role: 'user' | 'admin'
  membership_type: 'free' | 'premium' | 'vip'
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  title: string
  description: string | null
  youtube_id: string | null
  video_url: string | null
  thumbnail_url: string | null
  category: string
  duration: number
  is_premium: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  view_count?: number
}

export interface EducationContent {
  id: string
  chapter_id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featured_image: string | null
  category: 'general' | 'beginner' | 'management' | 'dx'
  tags: string[]
  reading_time: number
  is_premium: boolean
  status: 'draft' | 'published' | 'archived'
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
  education_chapters?: EducationChapter
  chapter?: EducationChapter
}

export interface EducationChapter {
  id: string
  chapter_number: number
  title: string
  description: string | null
  icon: string | null
  color_scheme: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface WatchHistory {
  id: string
  user_id: string
  video_id: string
  watched_duration: number
  completed: boolean
  last_watched_at: string
  created_at: string
  updated_at: string
}