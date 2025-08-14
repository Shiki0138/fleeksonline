# RBAC Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the current hardcoded access control system to the new Role-Based Access Control (RBAC) system.

## Migration Steps

### 1. Database Migration

First, backup your database before running the migration:

```bash
# Backup current database
supabase db dump > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migration script
supabase db push < scripts/migrate-rbac-system.sql
```

### 2. Update Environment Variables

Remove the following deprecated environment variables:
- `ADMIN_EMAILS`
- `ADMIN_PASSWORD`
- `EMERGENCY_CODE`
- `NEXT_PUBLIC_DEV_BYPASS_CODE`

### 3. Update API Routes

Replace existing API routes with RBAC-enabled versions:

#### Before:
```typescript
// Old hardcoded approach
export async function GET(request: Request) {
  const session = await getSession()
  
  // Hardcoded admin check
  if (session?.user?.email !== 'greenroom51@gmail.com') {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // ... rest of logic
}
```

#### After:
```typescript
// New RBAC approach
import { withAuthorization, Resource, Action } from '@/lib/auth/rbac-middleware'

export const GET = withAuthorization(
  Resource.ADMIN_PANEL,
  Action.ACCESS
)(async (req, user) => {
  // User is already authorized
  // ... rest of logic
})
```

### 4. Update Component Access Checks

#### Before:
```typescript
// In components
const isPremiumUser = profile?.role === 'paid' || profile?.role === 'admin'
const hasFullAccess = accessLevel === 'free' || isPremiumUser
```

#### After:
```typescript
// In components
import { contentAccessService } from '@/lib/auth/content-access-service'

const accessDecision = await contentAccessService.canAccessArticle(
  user?.id,
  articleId
)

if (!accessDecision.allowed) {
  // Show upgrade CTA or login prompt
  const { title, message, ctaText, ctaLink } = 
    contentAccessService.formatAccessMessage(accessDecision)
}
```

### 5. Update useAuth Hook

Update the `useAuth` hook to use the new role system:

```typescript
// src/hooks/useAuth.tsx
import { getUserAccess } from '@/lib/auth/content-access-service'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // Get user roles using new system
        const userAccess = await getUserAccess(session.user.id)
        if (userAccess) {
          setRoles(userAccess.roles)
        }
      }
      
      setLoading(false)
    }
    
    getUser()
  }, [])
  
  return {
    user,
    roles,
    isPremium: roles.includes('premium_user'),
    isAdmin: roles.includes('admin') || roles.includes('super_admin'),
    loading
  }
}
```

### 6. Remove Deprecated Files

Remove the following files that are no longer needed:
- `/src/app/api/auth/emergency-login/route.ts`
- `/src/app/api/auth/bypass-login/route.ts`
- Any other backdoor authentication routes

### 7. Update Middleware

Update your middleware to use the new RBAC system:

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Check admin panel access
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    // Check admin role
    const { data: hasAdminAccess } = await supabase
      .rpc('user_has_permission', {
        user_uuid: session.user.id,
        resource_name: 'admin_panel',
        action_name: 'access'
      })
    
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }
  
  return res
}
```

## Testing Checklist

### User Roles Testing

- [ ] Guest users can only access free articles
- [ ] Free users can access free articles and partial content
- [ ] Premium users can access all articles
- [ ] Admin users can access admin panel and all content
- [ ] Super admin users have all permissions

### Content Access Testing

- [ ] Free articles (1-5, 21-25, etc.) are accessible to everyone
- [ ] Partial articles show preview to free users
- [ ] Premium articles are blocked for non-premium users
- [ ] Proper CTAs are shown based on user status

### API Security Testing

- [ ] Unauthenticated requests are rejected with 401
- [ ] Unauthorized requests are rejected with 403
- [ ] All access attempts are logged in audit table
- [ ] Rate limiting is working correctly

### Migration Validation

- [ ] All existing users are migrated to correct roles
- [ ] User sessions continue to work after migration
- [ ] No hardcoded admin checks remain
- [ ] All backdoor endpoints are removed

## Rollback Plan

If issues arise during migration:

1. Restore database from backup:
```bash
supabase db reset
psql -U postgres -d your_database < backup-YYYYMMDD-HHMMSS.sql
```

2. Revert code changes:
```bash
git revert <migration-commit-hash>
```

3. Restore environment variables

## Monitoring

After migration, monitor:

1. **Access Audit Logs**
```sql
SELECT 
  resource,
  action,
  allowed,
  COUNT(*) as count
FROM access_audit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY resource, action, allowed
ORDER BY count DESC;
```

2. **Failed Access Attempts**
```sql
SELECT 
  user_id,
  resource,
  action,
  reason,
  COUNT(*) as attempts
FROM access_audit_log
WHERE allowed = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, resource, action, reason
ORDER BY attempts DESC;
```

3. **User Role Distribution**
```sql
SELECT 
  r.display_name,
  COUNT(DISTINCT ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.display_name
ORDER BY r.priority DESC;
```

## Support

If you encounter issues during migration:

1. Check the audit logs for detailed error information
2. Review the security audit report for context
3. Test with the provided test cases
4. Contact the development team with specific error messages

## Post-Migration Tasks

1. **Update Documentation**
   - Update API documentation with new authentication requirements
   - Document role permissions for support team
   - Create user guides for role management

2. **Train Support Team**
   - How to check user permissions
   - How to grant/revoke roles
   - How to read audit logs

3. **Security Review**
   - Schedule penetration testing
   - Review audit logs weekly
   - Update security policies