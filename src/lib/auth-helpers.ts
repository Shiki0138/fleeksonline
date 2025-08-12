import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// レート制限回避のための認証ヘルパー
const AUTH_RETRY_DELAY = 1000 // 1秒
const MAX_RETRIES = 3
const BACKOFF_MULTIPLIER = 1.5 // より穏やかなバックオフ

let lastAuthAttempt = 0
let retryCount = 0

export async function signInWithRateLimit(email: string, password: string) {
  const supabase = createClientComponentClient()
  
  // 最後の試行から十分な時間が経過しているかチェック
  const now = Date.now()
  const timeSinceLastAttempt = now - lastAuthAttempt
  
  if (timeSinceLastAttempt < AUTH_RETRY_DELAY) {
    const waitTime = AUTH_RETRY_DELAY - timeSinceLastAttempt
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastAuthAttempt = Date.now()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      // レート制限エラーの場合
      if (error.message.includes('rate limit') || error.status === 429) {
        retryCount++
        
        if (retryCount > MAX_RETRIES) {
          throw new Error('ログイン試行回数が上限に達しました。30分後に再度お試しください。')
        }
        
        // 指数バックオフ
        const delay = AUTH_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // リトライ
        return signInWithRateLimit(email, password)
      }
      
      throw error
    }
    
    // 成功時はリトライカウントをリセット
    retryCount = 0
    return { data, error: null }
    
  } catch (error) {
    return { data: null, error }
  }
}

// セッション確認（新規認証を避ける）
export async function checkExistingSession() {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Session check error:', error)
    return null
  }
}

// 認証状態の監視（重複防止）
let authStateListenerActive = false

export function setupAuthStateListener(callback: (user: any) => void) {
  if (authStateListenerActive) {
    console.log('Auth state listener already active, skipping setup')
    return () => {}
  }
  
  authStateListenerActive = true
  const supabase = createClientComponentClient()
  
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    // サインイン系イベントは無視（ループ防止）
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      callback(session?.user || null)
    } else if (event === 'SIGNED_OUT') {
      callback(null)
    }
  })
  
  return () => {
    authStateListenerActive = false
    listener.subscription.unsubscribe()
  }
}