import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const access_token = requestUrl.searchParams.get('access_token')
  const refresh_token = requestUrl.searchParams.get('refresh_token')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')
  
  console.log('[Reset Route] Full URL:', request.url)
  console.log('[Reset Route] Params:', {
    token_hash,
    access_token: !!access_token,
    refresh_token: !!refresh_token,
    type,
    error,
    error_code,
    error_description
  })

  // エラーがある場合
  if (error || error_code) {
    console.error('[Reset Route] Error from Supabase:', { error, error_code, error_description })
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${error || error_code}`)
  }


  if (type === 'recovery') {
    try {
      // token_hashを使用した検証（推奨）
      if (token_hash) {
        console.log('[Reset Route] Verifying with token_hash')
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery'
        })
        
        if (!error && data.session) {
          console.log('[Reset Route] OTP verified successfully, user:', data.user?.email)
          // セッションをクッキーに保存
          const response = NextResponse.redirect(`${requestUrl.origin}/auth/update-password?verified=true`)
          response.cookies.set('sb-access-token', data.session.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
          if (data.session.refresh_token) {
            response.cookies.set('sb-refresh-token', data.session.refresh_token, {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30 // 30 days
            })
          }
          return response
        } else {
          console.error('[Reset Route] Token hash verification failed:', error)
        }
      }
      
      // access_tokenとrefresh_tokenを使用（フォールバック）
      if (access_token && refresh_token) {
        console.log('[Reset Route] Setting session with tokens')
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })
        
        if (!error && data.session) {
          console.log('[Reset Route] Session set successfully, user:', data.user?.email)
          const response = NextResponse.redirect(`${requestUrl.origin}/auth/update-password?verified=true`)
          response.cookies.set('sb-access-token', data.session.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
          })
          return response
        } else {
          console.error('[Reset Route] Session setting failed:', error)
        }
      }
      
      // どちらも失敗した場合
      console.error('[Reset Route] All verification methods failed')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_recovery_link`)
      
    } catch (error) {
      console.error('[Reset Route] Exception:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=server_error`)
    }
  }
  
  // recoveryタイプでない場合
  return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_link_type`)
}