import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Types
export enum Resource {
  ARTICLE = 'article',
  VIDEO = 'video',
  FORUM = 'forum',
  USER_PROFILE = 'user_profile',
  ADMIN_PANEL = 'admin_panel'
}

export enum Action {
  READ = 'read',
  WRITE = 'write',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  ACCESS = 'access',
  READ_PARTIAL = 'read_partial'
}

export interface AuthUser {
  id: string
  email: string
  roles: string[]
}

export interface AccessDecision {
  allowed: boolean
  reason: string
  requiredAction?: string
  requiredRoles?: string[]
}

// Middleware factory for API routes
export function withAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const supabase = createServerComponentClient({ cookies })
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .rpc('get_user_roles', { user_uuid: session.user.id })
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError)
        return NextResponse.json(
          { error: 'Failed to verify user permissions' },
          { status: 500 }
        )
      }

      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        roles: userRoles.map((r: any) => r.role_name)
      }

      // Audit log - authentication success
      await logAccess(supabase, {
        userId: user.id,
        resource: 'api',
        action: 'authenticate',
        resourceId: req.url,
        allowed: true,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      })

      return handler(req, user)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Authorization middleware factory
export function withAuthorization(
  resource: Resource,
  action: Action,
  getResourceId?: (req: NextRequest) => string | undefined
) {
  return function(
    handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
  ) {
    return withAuth(async (req: NextRequest, user: AuthUser) => {
      try {
        const supabase = createServerComponentClient({ cookies })
        const resourceId = getResourceId ? getResourceId(req) : undefined
        
        // Check permission
        const { data: hasPermission, error: permissionError } = await supabase
          .rpc('user_has_permission', {
            user_uuid: user.id,
            resource_name: resource,
            action_name: action
          })
        
        if (permissionError) {
          console.error('Permission check error:', permissionError)
          return NextResponse.json(
            { error: 'Failed to verify permissions' },
            { status: 500 }
          )
        }

        // Audit log
        await logAccess(supabase, {
          userId: user.id,
          resource,
          action,
          resourceId,
          allowed: hasPermission,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        })

        if (!hasPermission) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              required: {
                resource,
                action
              }
            },
            { status: 403 }
          )
        }

        return handler(req, user)
      } catch (error) {
        console.error('Authorization middleware error:', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    })
  }
}

// Helper function to check specific permissions
export async function checkPermission(
  userId: string,
  resource: Resource,
  action: Action,
  resourceId?: string
): Promise<AccessDecision> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Special handling for content-specific permissions
    if (resource === Resource.ARTICLE && resourceId) {
      return checkArticleAccess(userId, resourceId, action)
    }
    
    const { data: hasPermission, error } = await supabase
      .rpc('user_has_permission', {
        user_uuid: userId,
        resource_name: resource,
        action_name: action
      })
    
    if (error) {
      console.error('Permission check error:', error)
      return {
        allowed: false,
        reason: 'Permission check failed'
      }
    }

    return {
      allowed: hasPermission,
      reason: hasPermission ? 'User has required permission' : 'User lacks required permission'
    }
  } catch (error) {
    console.error('checkPermission error:', error)
    return {
      allowed: false,
      reason: 'Permission check error'
    }
  }
}

// Check article-specific access
async function checkArticleAccess(
  userId: string,
  articleId: string,
  action: Action
): Promise<AccessDecision> {
  const supabase = createServerComponentClient({ cookies })
  
  // Extract article number from ID
  const articleNumber = parseInt(articleId.replace('article_', '').replace('.json', ''))
  if (isNaN(articleNumber)) {
    return {
      allowed: false,
      reason: 'Invalid article ID'
    }
  }

  // Determine access level based on article number pattern
  const accessLevel = getArticleAccessLevel(articleNumber)
  
  // Get user roles
  const { data: userRoles } = await supabase
    .rpc('get_user_roles', { user_uuid: userId })
  
  const roleNames = userRoles?.map((r: any) => r.role_name) || []
  
  // Check access based on level and roles
  if (accessLevel === 'free') {
    return {
      allowed: true,
      reason: 'Free content'
    }
  }
  
  if (accessLevel === 'partial' && action === Action.READ_PARTIAL) {
    if (roleNames.includes('free_user') || roleNames.includes('premium_user') || roleNames.includes('admin')) {
      return {
        allowed: true,
        reason: 'Partial access granted'
      }
    }
  }
  
  if (accessLevel === 'premium' || (accessLevel === 'partial' && action === Action.READ)) {
    if (roleNames.includes('premium_user') || roleNames.includes('admin') || roleNames.includes('super_admin')) {
      return {
        allowed: true,
        reason: 'Premium access granted'
      }
    }
    
    return {
      allowed: false,
      reason: 'Premium subscription required',
      requiredAction: 'upgrade',
      requiredRoles: ['premium_user']
    }
  }
  
  return {
    allowed: false,
    reason: 'Access denied'
  }
}

// Get article access level based on number
function getArticleAccessLevel(articleNumber: number): 'free' | 'partial' | 'premium' {
  const index = (articleNumber - 1) % 20
  if (index < 5) return 'free'
  if (index < 15) return 'partial'
  return 'premium'
}

// Audit logging helper
async function logAccess(
  supabase: any,
  data: {
    userId: string
    resource: string
    action: string
    resourceId?: string
    allowed: boolean
    reason?: string
    ipAddress: string
    userAgent: string
  }
) {
  try {
    await supabase
      .from('access_audit_log')
      .insert({
        user_id: data.userId,
        resource: data.resource,
        action: data.action,
        resource_id: data.resourceId,
        allowed: data.allowed,
        reason: data.reason,
        ip_address: data.ipAddress,
        user_agent: data.userAgent
      })
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't fail the request if audit logging fails
  }
}

// Role checking helpers
export function hasRole(user: AuthUser, role: string): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: AuthUser, roles: string[]): boolean {
  return roles.some(role => user.roles.includes(role))
}

export function hasAllRoles(user: AuthUser, roles: string[]): boolean {
  return roles.every(role => user.roles.includes(role))
}