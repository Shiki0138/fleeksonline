import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const access_token = requestUrl.searchParams.get('access_token')
  const refresh_token = requestUrl.searchParams.get('refresh_token')
  const type = requestUrl.searchParams.get('type')
  
  // ハッシュフラグメントの処理用
  const hash = requestUrl.hash
  
  console.log('[Reset Route] Params:', {
    token_hash,
    access_token: !!access_token,
    refresh_token: !!refresh_token,
    type,
    hash
  })

  if (type === 'recovery' && (access_token || token_hash)) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      // アクセストークンがある場合
      if (access_token) {
        // セッションを設定
        const sessionData: any = {
          access_token,
        }
        
        if (refresh_token) {
          sessionData.refresh_token = refresh_token
        }
        
        const { data, error } = await supabase.auth.setSession(sessionData)
        
        if (!error && data.session) {
          console.log('[Reset Route] Session set successfully')
          return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`)
        }
      }
      
      // token_hashがある場合
      if (token_hash) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery'
        })
        
        if (!error && data.session) {
          console.log('[Reset Route] OTP verified successfully')
          return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`)
        }
      }
      
      console.error('[Reset Route] Failed to establish session')
      return NextResponse.redirect(`${requestUrl.origin}/auth/update-password?error=invalid_token`)
      
    } catch (error) {
      console.error('[Reset Route] Error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/update-password?error=server_error`)
    }
  }
  
  // パラメータが不正な場合
  return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_link`)
}