import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { pathname } = req.nextUrl
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('[Middleware] =================================')
  console.log('[Middleware] Path:', pathname)
  console.log('[Middleware] Session exists:', !!session)
  console.log('[Middleware] User email:', session?.user?.email)
  console.log('[Middleware] Headers:', Object.fromEntries(req.headers.entries()))
  console.log('[Middleware] =================================')
  
  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/auth/signup', '/auth/reset-password', '/auth/update-password', '/auth/confirm', '/auth/reset-password-otp', '/privacy', '/terms']
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/api/auth/')
  
  // If user is logged in and trying to access login page, redirect them
  if (session && pathname === '/login') {
    console.log('[Middleware] Logged in user accessing login, redirecting...')
    const isAdmin = session.user.email === 'greenroom51@gmail.com'
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = isAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }
  
  // Allow access to protected pages for authenticated users
  const protectedPaths = ['/dashboard', '/premium', '/free', '/videos', '/education', '/blog']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (session && isProtectedPath) {
    console.log('[Middleware] ✅ ALLOWING authenticated access to:', pathname)
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
  
  console.log('[Middleware] No redirect needed, allowing request')
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}