import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// 環境変数を明示的にチェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません:', {
    url: supabaseUrl ? '設定済み' : '未設定',
    key: supabaseAnonKey ? '設定済み' : '未設定'
  })
}

// ブラウザ用Supabaseクライアント（auth-helpersを使用）
export const supabase = createClientComponentClient()

// 代替のブラウザ用Supabaseクライアント（環境変数を直接使用）
export const supabaseDirectClient = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null

// デバッグ用関数
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    console.log('Supabase接続チェック:', { 
      connected: !error, 
      session: data?.session ? '存在' : 'なし',
      error 
    })
    return !error
  } catch (err) {
    console.error('Supabase接続エラー:', err)
    return false
  }
}