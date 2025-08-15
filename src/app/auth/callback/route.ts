import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const type = requestUrl.searchParams.get('type') // signup, recovery, etc.
  
  console.log('[Auth Callback] Processing callback:', {
    hasCode: !!code,
    hasError: !!error,
    type,
    url: requestUrl.toString()
  })

  if (error) {
    console.error('[Auth Callback] Error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/confirm?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/confirm?error=${encodeURIComponent(exchangeError.message)}`
        )
      }
      
      if (data.session) {
        console.log('[Auth Callback] Session established for type:', type)
        
        // Handle different callback types
        switch (type) {
          case 'recovery':
            // Password reset flow
            return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`)
          case 'signup':
          case 'email_confirmation':
            // Email confirmation flow
            return NextResponse.redirect(`${requestUrl.origin}/auth/confirm?success=email_confirmed`)
          default:
            // General authentication
            return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        }
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/confirm?error=unexpected_error`
      )
    }
  }

  // Default redirect if no code
  console.log('[Auth Callback] No code provided, redirecting to login')
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}