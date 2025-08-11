import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/'

  // Handle password recovery with token (direct from email)
  if (token && type === 'recovery') {
    console.log('Processing recovery token:', token)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      // Use the token directly to verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
      })
      
      if (error) {
        console.error('Recovery token error:', error)
        // Try alternative approach with exchangeCodeForSession
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(token)
          if (sessionError) {
            return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=invalid_recovery_token`)
          }
          if (sessionData.user) {
            return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`)
          }
        } catch (altErr) {
          console.error('Alternative recovery error:', altErr)
          return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=recovery_failed`)
        }
      }

      if (data.user && data.session) {
        console.log('Recovery successful, redirecting to update-password')
        return NextResponse.redirect(`${requestUrl.origin}/auth/update-password?recovery=true`)
      }
    } catch (err) {
      console.error('Recovery verification error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=recovery_exception`)
    }
  }

  // Handle OAuth code exchange
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        // Check if this is a password recovery
        if (type === 'recovery') {
          return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`)
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from('fleeks_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (data.user.email === 'greenroom51@gmail.com' || profile?.role === 'admin') {
          return NextResponse.redirect(`${requestUrl.origin}/admin`)
        } else {
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        }
      }
    } catch (err) {
      console.error('Auth exchange error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_error`)
    }
  }

  // Return the user to specified redirect URL or dashboard
  return NextResponse.redirect(requestUrl.origin + next)
}