import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAuthorization, Resource, Action } from '@/lib/auth/rbac-middleware'

// Test endpoint for basic authentication
export const GET = withAuth(async (req: NextRequest, user) => {
  const accessLevels = {
    canAccessFreeContent: true, // Everyone can access free content
    canAccessPremiumContent: user.roles.includes('premium_user') || user.roles.includes('admin') || user.roles.includes('super_admin'),
    canAccessAdminPanel: user.roles.includes('admin') || user.roles.includes('super_admin'),
    userType: user.roles.includes('admin') || user.roles.includes('super_admin') ? 'admin' :
              user.roles.includes('premium_user') ? 'premium' : 'free'
  }

  return NextResponse.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles
    },
    accessLevels,
    timestamp: new Date().toISOString()
  })
})

// Test endpoint for premium content access
export const PUT = withAuth(async (req: NextRequest, user) => {
  const isPremiumUser = user.roles.includes('premium_user') || user.roles.includes('admin') || user.roles.includes('super_admin')
  
  if (!isPremiumUser) {
    return NextResponse.json({
      success: false,
      message: 'Premium subscription required',
      userType: 'free',
      requiredAction: 'upgrade'
    }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    message: 'Premium content access granted',
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles
    },
    contentAccess: 'premium',
    timestamp: new Date().toISOString()
  })
})

// Test endpoint for admin access
export const POST = withAuthorization(
  Resource.ADMIN_PANEL,
  Action.ACCESS
)(async (req: NextRequest, user) => {
  return NextResponse.json({
    success: true,
    message: 'Admin access granted',
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles
    },
    adminPanelAccess: true,
    timestamp: new Date().toISOString()
  })
})