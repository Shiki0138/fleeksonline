# Password Reset Session Restoration Fix

## Problem Analysis

The "セッションが見つかりません" (Session not found) error occurs because:

1. **Cookie Path Issue**: Cookies are being set without an explicit `path` parameter, which might default to the current path rather than root
2. **Cookie Security Settings**: Using `secure: true` on localhost without HTTPS can prevent cookies from being set
3. **Supabase Client State**: The standard Supabase client might not immediately recognize manually set cookies

## Root Cause

The main issue is in `/src/app/auth/reset/route.ts` where cookies are set with:
- `secure: true` - This requires HTTPS, which might not be available in development
- No explicit `path: '/'` - Cookies might not be available across different paths

## Solution

### 1. Update Cookie Settings in `/src/app/auth/reset/route.ts`

```typescript
// Replace lines 47-52 and 78-89 with:

const response = NextResponse.redirect(`${requestUrl.origin}/auth/update-password?verified=true`)

// Set cookies with proper configuration
response.cookies.set('sb-access-token', data.session.access_token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production', // Only secure in production
  sameSite: 'lax',
  path: '/', // Explicit path to ensure availability across all routes
  maxAge: 60 * 60 * 24 * 7 // 7 days
})

if (data.session.refresh_token) {
  response.cookies.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: 'lax',
    path: '/', // Explicit path to ensure availability across all routes
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
}
```

### 2. Alternative: Use Supabase's Built-in Session Management

Instead of manually setting cookies, use Supabase's exchange code for session:

```typescript
// In /src/app/auth/reset/route.ts
if (token_hash) {
  // Don't manually set cookies, let Supabase handle it
  const redirectUrl = new URL('/auth/update-password', requestUrl.origin)
  redirectUrl.searchParams.set('token_hash', token_hash)
  redirectUrl.searchParams.set('type', 'recovery')
  return NextResponse.redirect(redirectUrl)
}
```

Then in `/src/app/auth/update-password/page.tsx`:

```typescript
useEffect(() => {
  const handleTokenExchange = async () => {
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    
    if (token_hash && type === 'recovery') {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'recovery'
      })
      
      if (data.session) {
        setIsValidSession(true)
        // Clean URL
        window.history.replaceState({}, document.title, '/auth/update-password')
      }
    }
  }
  
  handleTokenExchange()
}, [])
```

### 3. Debug Approach

Add this debug code to `/src/app/auth/update-password/page.tsx` to see what's happening:

```typescript
// After line 62, add:
console.log('[UpdatePassword] Cookie check:')
console.log('All cookies:', document.cookie)
console.log('Access token found:', !!accessToken)
console.log('Refresh token found:', !!refreshToken)
```

## Recommended Fix

The simplest and most reliable fix is to update the cookie settings in `/src/app/auth/reset/route.ts` to:
1. Use `secure: process.env.NODE_ENV === 'production'`
2. Add explicit `path: '/'`

This ensures cookies work in both development and production environments.