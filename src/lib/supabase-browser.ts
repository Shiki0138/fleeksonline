import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Browser-specific Supabase client for client components
export const supabase = createClientComponentClient()

// Re-export types from the main supabase-client file
export type { Profile, Video, EducationContent, EducationChapter, WatchHistory } from './supabase-client'