import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  
  console.log('[Auth Callback] Processing callback:', {
    hasCode: !!code,
    hasError: !!error,
    url: requestUrl.toString()
  })

  if (error) {
    console.error('[Auth Callback] Error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/reset-guide?error=${encodeURIComponent(error_description || error)}`
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
          `${requestUrl.origin}/auth/reset-guide?error=${encodeURIComponent(exchangeError.message)}`
        )
      }
      
      if (data.session) {
        console.log('[Auth Callback] Session established, redirecting to update-password')
        // Redirect to the update password page with the session established
        return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`)
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/reset-guide?error=unexpected_error`
      )
    }
  }

  // Default redirect if no code
  console.log('[Auth Callback] No code provided, redirecting to home')
  return NextResponse.redirect(requestUrl.origin)
}