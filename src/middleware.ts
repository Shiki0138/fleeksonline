import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { pathname } = req.nextUrl
  
  // Check authentication for protected routes
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Check admin role or specific admin email
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    const isAdminEmail = session.user.email === 'greenroom51@gmail.com'
    const isAdminRole = profile?.role === 'admin'
    
    if (!isAdminRole && !isAdminEmail) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Protect API routes
  if (pathname.startsWith('/api/admin')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin role for admin API routes
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    const isAdminEmail = session.user.email === 'greenroom51@gmail.com'
    const isAdminRole = profile?.role === 'admin'
    
    if (!isAdminRole && !isAdminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/admin/:path*'
  ]
}