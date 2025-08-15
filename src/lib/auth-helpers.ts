import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// レート制限回避のための認証ヘルパー
const AUTH_RETRY_DELAY = 500 // 0.5秒に短縮
const MAX_RETRIES = 2 // リトライ回数を減らす
const BACKOFF_MULTIPLIER = 2 // バックオフを早める

let lastAuthAttempt = 0
let retryCount = 0

export async function signInWithRateLimit(email: string, password: string) {
  const supabase = createClientComponentClient()
  
  // 最後の試行から十分な時間が経過しているかチェック
  const now = Date.now()
  const timeSinceLastAttempt = now - lastAuthAttempt
  
  if (timeSinceLastAttempt < AUTH_RETRY_DELAY) {
    const waitTime = AUTH_RETRY_DELAY - timeSinceLastAttempt
    console.log(`Waiting ${waitTime}ms before next auth attempt`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastAuthAttempt = Date.now()
  
  try {
    console.log('Attempting sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Sign in error:', error)
      
      // レート制限エラーの場合
      if (error.message.includes('rate limit') || error.status === 429 || error.message.includes('Too many requests')) {
        retryCount++
        
        if (retryCount > MAX_RETRIES) {
          console.error('Max retries exceeded')
          retryCount = 0 // リセット
          throw new Error('ログイン試行回数が上限に達しました。しばらくお待ちください。')
        }
        
        // 指数バックオフ
        const delay = AUTH_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount)
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // リトライ
        return signInWithRateLimit(email, password)
      }
      
      // レート制限以外のエラーの場合もリセット
      retryCount = 0
      throw error
    }
    
    // 成功時はリトライカウントをリセット
    console.log('Sign in successful')
    retryCount = 0
    return { data, error: null }
    
  } catch (error) {
    console.error('Sign in exception:', error)
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