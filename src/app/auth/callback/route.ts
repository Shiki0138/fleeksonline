import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
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
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`)
    }
  }

  // Return the user to specified redirect URL or dashboard
  return NextResponse.redirect(requestUrl.origin + next)
}