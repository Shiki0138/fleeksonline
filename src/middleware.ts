import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { pathname } = req.nextUrl
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('[Middleware] Path:', pathname, 'Session:', !!session, 'Email:', session?.user?.email)
  
  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/auth/signup', '/auth/reset-password', '/privacy', '/terms']
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/api/auth/')
  
  // If user is logged in and trying to access login page, redirect them
  if (session && pathname === '/login') {
    console.log('[Middleware] Logged in user accessing login, redirecting...')
    const isAdmin = session.user.email === 'greenroom51@gmail.com'
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = isAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }
  
  // Allow access to premium and free pages for authenticated users
  if (session && (pathname === '/premium' || pathname === '/free')) {
    console.log('[Middleware] Allowing access to:', pathname)
    return res
  }
  
  // If user is not logged in and trying to access protected route
  if (!session && !isPublicPath) {
    console.log('[Middleware] No session for protected route, redirecting to login')
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // For admin routes, check if user is admin
  if (pathname.startsWith('/admin') && session) {
    const isAdminEmail = session.user.email === 'greenroom51@gmail.com'
    
    if (!isAdminEmail) {
      // Check profile for admin role
      const { data: profile } = await supabase
        .from('fleeks_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        console.log('[Middleware] Non-admin user accessing admin route, redirecting to dashboard')
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}