# Improved Access Control Architecture

## Overview

This document outlines the improved Role-Based Access Control (RBAC) architecture for the FLEEKS premium content system.

## Core Principles

1. **Least Privilege**: Users have minimal permissions needed
2. **Separation of Concerns**: Clear boundaries between authentication and authorization
3. **Server-Side Enforcement**: All access control decisions made server-side
4. **Audit Trail**: All access attempts are logged
5. **Zero Trust**: Never trust client-side data

## Architecture Components

### 1. Authentication Layer

```typescript
// Authentication Service
interface AuthenticationService {
  authenticate(credentials: Credentials): Promise<AuthToken>
  validateToken(token: string): Promise<TokenPayload>
  refreshToken(refreshToken: string): Promise<AuthToken>
  logout(userId: string): Promise<void>
}

// Secure token storage using httpOnly cookies
interface SecureTokenStorage {
  setTokens(res: Response, tokens: AuthTokens): void
  getTokens(req: Request): AuthTokens | null
  clearTokens(res: Response): void
}
```

### 2. Authorization Layer

```typescript
// Role-Based Access Control
interface Role {
  id: string
  name: string
  permissions: Permission[]
  priority: number // For role hierarchy
}

interface Permission {
  id: string
  resource: string
  action: string
  conditions?: PermissionCondition[]
}

interface PermissionCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'nin'
  value: any
}

// User roles and permissions
enum SystemRole {
  GUEST = 'guest',
  FREE_USER = 'free_user',
  PREMIUM_USER = 'premium_user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Resource-based permissions
enum Resource {
  ARTICLE = 'article',
  VIDEO = 'video',
  FORUM = 'forum',
  USER_PROFILE = 'user_profile',
  ADMIN_PANEL = 'admin_panel'
}

enum Action {
  READ = 'read',
  WRITE = 'write',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage'
}
```

### 3. Database Schema

```sql
-- Users table (existing)
CREATE TABLE beauty_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Improved profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES beauty_users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles mapping
CREATE TABLE user_roles (
  user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES beauty_users(id),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, role_id)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions mapping
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  conditions JSONB,
  PRIMARY KEY (role_id, permission_id)
);

-- Audit log
CREATE TABLE access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES beauty_users(id),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id TEXT,
  allowed BOOLEAN NOT NULL,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content access rules
CREATE TABLE content_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  access_level TEXT NOT NULL,
  required_roles UUID[] NOT NULL,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id)
);
```

### 4. Middleware Architecture

```typescript
// Authentication Middleware
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tokens = getTokensFromCookies(req)
    if (!tokens) {
      throw new UnauthorizedError('No authentication tokens')
    }

    const payload = await validateAccessToken(tokens.accessToken)
    req.user = payload
    next()
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      // Try to refresh token
      const newTokens = await refreshTokens(req)
      if (newTokens) {
        setTokenCookies(res, newTokens)
        req.user = newTokens.payload
        next()
      } else {
        res.status(401).json({ error: 'Authentication required' })
      }
    } else {
      res.status(401).json({ error: 'Invalid authentication' })
    }
  }
}

// Authorization Middleware Factory
export function authorize(
  resource: Resource,
  action: Action,
  getResourceId?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user
      if (!user) {
        throw new UnauthorizedError('User not authenticated')
      }

      const resourceId = getResourceId ? getResourceId(req) : undefined
      const hasPermission = await checkPermission(
        user.id,
        resource,
        action,
        resourceId
      )

      // Audit log
      await logAccessAttempt({
        userId: user.id,
        resource,
        action,
        resourceId,
        allowed: hasPermission,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions')
      }

      next()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message })
      } else {
        res.status(401).json({ error: 'Authorization failed' })
      }
    }
  }
}
```

### 5. Permission Checking Service

```typescript
class PermissionService {
  async checkPermission(
    userId: string,
    resource: Resource,
    action: Action,
    resourceId?: string
  ): Promise<boolean> {
    // Get user roles
    const userRoles = await this.getUserRoles(userId)
    
    // Check each role's permissions
    for (const role of userRoles) {
      const permissions = await this.getRolePermissions(role.id)
      
      for (const permission of permissions) {
        if (permission.resource === resource && permission.action === action) {
          // Check conditions if any
          if (permission.conditions && resourceId) {
            const conditionsMet = await this.evaluateConditions(
              permission.conditions,
              userId,
              resourceId
            )
            if (conditionsMet) return true
          } else {
            return true
          }
        }
      }
    }
    
    return false
  }

  async evaluateConditions(
    conditions: PermissionCondition[],
    userId: string,
    resourceId: string
  ): Promise<boolean> {
    // Implement condition evaluation logic
    // This could check things like ownership, status, etc.
    return true
  }
}
```

### 6. Content Access Control

```typescript
class ContentAccessService {
  async canAccessArticle(
    userId: string | null,
    articleId: string
  ): Promise<AccessDecision> {
    // Get article access rules
    const accessRule = await this.getContentAccessRule('article', articleId)
    
    if (!accessRule) {
      // Default rules based on article number
      const articleNumber = this.extractArticleNumber(articleId)
      const defaultLevel = this.getDefaultAccessLevel(articleNumber)
      
      if (defaultLevel === 'free') {
        return { allowed: true, reason: 'Free content' }
      }
    }

    if (!userId) {
      return { 
        allowed: false, 
        reason: 'Authentication required',
        requiredAction: 'login'
      }
    }

    // Check user roles
    const userRoles = await this.getUserRoles(userId)
    const userRoleIds = userRoles.map(r => r.id)
    
    // Check if user has required roles
    const hasRequiredRole = accessRule.requiredRoles.some(
      roleId => userRoleIds.includes(roleId)
    )

    if (!hasRequiredRole) {
      return {
        allowed: false,
        reason: 'Premium subscription required',
        requiredAction: 'upgrade',
        requiredRoles: accessRule.requiredRoles
      }
    }

    // Check time-based access
    const now = new Date()
    if (accessRule.validFrom && now < accessRule.validFrom) {
      return {
        allowed: false,
        reason: 'Content not yet available',
        availableFrom: accessRule.validFrom
      }
    }

    if (accessRule.validUntil && now > accessRule.validUntil) {
      return {
        allowed: false,
        reason: 'Content access expired',
        expiredAt: accessRule.validUntil
      }
    }

    return { allowed: true, reason: 'User has required role' }
  }
}
```

### 7. API Implementation

```typescript
// Protected API route example
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Get user from secure session
    const session = await getServerSession(request)
    
    // Check article access
    const accessDecision = await contentAccessService.canAccessArticle(
      session?.userId,
      params.slug
    )

    if (!accessDecision.allowed) {
      return NextResponse.json(
        { 
          error: accessDecision.reason,
          requiredAction: accessDecision.requiredAction 
        },
        { status: 403 }
      )
    }

    // Load and return article
    const article = await loadArticle(params.slug)
    
    // Log successful access
    await auditService.logAccess({
      userId: session?.userId,
      resource: 'article',
      resourceId: params.slug,
      action: 'read',
      allowed: true
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Article access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Create new database tables
2. Implement authentication service with secure token storage
3. Migrate existing user roles to new system
4. Add audit logging

### Phase 2: Core Implementation (Week 2)
1. Implement permission service
2. Create authorization middleware
3. Add content access control service
4. Update API routes with new middleware

### Phase 3: Migration (Week 3)
1. Migrate existing access control logic
2. Update all components to use new system
3. Remove old hardcoded checks
4. Comprehensive testing

### Phase 4: Enhancement (Week 4)
1. Add admin UI for role management
2. Implement permission caching
3. Add real-time permission updates
4. Performance optimization

## Security Best Practices

1. **Token Security**
   - Use httpOnly, secure, sameSite cookies
   - Short access token lifetime (15 minutes)
   - Longer refresh token lifetime (7 days)
   - Token rotation on refresh

2. **Rate Limiting**
   - API endpoint rate limiting
   - Failed authentication attempt limiting
   - Resource access rate limiting

3. **Input Validation**
   - Strict schema validation for all inputs
   - Sanitize user inputs
   - Parameterized queries only

4. **Monitoring**
   - Real-time alerts for suspicious activity
   - Regular audit log reviews
   - Failed access attempt monitoring

5. **Regular Reviews**
   - Quarterly permission audits
   - Annual security assessments
   - Continuous vulnerability scanning