import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { Database } from './supabase'

// Server-side auth helper - cached for performance
export const getServerSession = cache(async () => {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
})

// Get current user with profile
export const getCurrentUser = cache(async () => {
  const session = await getServerSession()
  
  if (!session) {
    return null
  }
  
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  try {
    const { data: user, error } = await supabase
      .from('beauty_users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('User fetch error:', error)
    return null
  }
})

// Check if user has active subscription
export const hasActiveSubscription = cache(async () => {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }
  
  // Check subscription status
  if (user.subscription_status === 'paid') {
    return true
  }
  
  // Check trial period
  if (user.subscription_status === 'trial' && user.subscription_expires_at) {
    const expiryDate = new Date(user.subscription_expires_at)
    return expiryDate > new Date()
  }
  
  return false
})

// Check if user is admin
export const isAdmin = cache(async () => {
  const session = await getServerSession()
  
  if (!session) {
    return false
  }
  
  // Check if user email matches admin email
  if (session.user.email === process.env.ADMIN_EMAIL) {
    return true
  }
  
  // Check user metadata for admin role
  if (session.user.user_metadata?.role === 'admin') {
    return true
  }
  
  return false
})

// Auth error messages in Japanese
export const authErrorMessages: Record<string, string> = {
  'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
  'Email not confirmed': 'メールアドレスが確認されていません。確認メールをご確認ください',
  'User already registered': 'このメールアドレスは既に登録されています',
  'auth_failed': '認証に失敗しました。もう一度お試しください',
  'callback_error': '認証コールバックエラーが発生しました',
  'session_error': 'セッションの取得に失敗しました',
  'access_denied': 'アクセスが拒否されました',
  'server_error': 'サーバーエラーが発生しました',
  'default': '予期しないエラーが発生しました'
}

// Get localized error message
export function getAuthErrorMessage(error: string | null): string {
  if (!error) return authErrorMessages.default
  return authErrorMessages[error] || error
}

// Subscription status labels in Japanese
export const subscriptionStatusLabels = {
  free: '無料プラン',
  trial: 'トライアル',
  paid: '有料プラン',
  cancelled: 'キャンセル済み'
} as const

// Format date in Japanese
export function formatDateJapanese(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}