# Password Reset "セッションが見つかりません" Error Analysis

## Issue Summary
The password reset flow shows "セッションが見つかりません" (Session not found) error on the `/auth/update-password` page.

## Root Cause Analysis

### 1. **Cookie Setting Issue**
In `/auth/reset/route.ts`, cookies are set with `httpOnly: true`:
```typescript
response.cookies.set('sb-access-token', data.session.access_token, {
  httpOnly: true,  // This prevents client-side JavaScript from reading the cookie!
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7
})
```

### 2. **Client-Side Cookie Reading**
In `/auth/update-password/page.tsx`, the code tries to read cookies from client-side:
```typescript
const accessToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('sb-access-token='))
  ?.split('=')[1]
```
This will FAIL because `httpOnly: true` prevents JavaScript from accessing these cookies!

### 3. **Supabase Client Configuration**
The current Supabase client (`/src/lib/supabase.ts`) uses the old `createClient` method which doesn't handle server-side cookies properly in Next.js App Router.

### 4. **Session Storage Mismatch**
- Server sets cookies (httpOnly)
- Client tries to read cookies (fails due to httpOnly)
- Supabase client uses localStorage/sessionStorage by default
- No proper session synchronization between server and client

## Solution

### Option 1: Remove httpOnly from Cookies (Quick Fix)
Change in `/auth/reset/route.ts`:
```typescript
response.cookies.set('sb-access-token', data.session.access_token, {
  httpOnly: false,  // Allow client-side access
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7
})
```

### Option 2: Use Supabase Auth Helpers (Recommended)
1. Update to use `@supabase/ssr` package
2. Create proper server and browser clients
3. Use cookie-based session management properly

### Option 3: Pass Session via URL Parameters
Instead of relying on cookies, pass the session data through URL parameters or use Supabase's built-in session handling.

## Immediate Fix Recommendation

The quickest fix is to remove `httpOnly: true` from the cookie settings in `/auth/reset/route.ts`. This will allow the client-side code to read the cookies and restore the session.

## Long-term Recommendation

Migrate to the newer Supabase SSR package which handles cookie-based sessions properly in Next.js App Router environments.