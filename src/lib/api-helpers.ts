import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// APIルートで管理者権限を検証するヘルパー関数
export async function verifyAdminAccess(request: NextRequest) {
  try {
    // サーバーコンポーネントクライアントを作成
    const supabase = createServerComponentClient({ cookies })
    
    // セッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        isValid: false,
        error: 'No valid session found',
        response: NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
      }
    }
    
    const user = session.user
    
    // 管理者メールアドレスチェック
    const isAdminEmail = user.email === 'greenroom51@gmail.com'
    
    if (!isAdminEmail) {
      // プロファイルから管理者権限を確認
      const { data: profile } = await supabase
        .from('fleeks_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profile?.role !== 'admin') {
        return {
          isValid: false,
          error: 'Admin access required',
          response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }
      }
    }
    
    return {
      isValid: true,
      user,
      session,
      error: null,
      response: null
    }
  } catch (error) {
    console.error('Admin access verification error:', error)
    return {
      isValid: false,
      error: 'Internal server error',
      response: NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  }
}

// Service Role Keyを使用した管理用クライアントを作成
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}