'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/auth-helpers-nextjs'

export interface RBACUser {
  id: string
  email: string
  roles: string[]
  permissions: string[]
}

export function useRBACAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [rbacUser, setRbacUser] = useState<RBACUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          
          // Get user roles using new RBAC system
          const { data: userRoles, error: rolesError } = await supabase
            .rpc('get_user_roles', { user_uuid: session.user.id })
          
          if (!rolesError && userRoles) {
            const roles = userRoles.map((r: any) => r.role_name)
            
            // Get user permissions
            const { data: userPermissions, error: permError } = await supabase
              .from('user_permissions')
              .select('permission_name')
              .eq('user_id', session.user.id)
            
            const permissions = userPermissions?.map(p => p.permission_name) || []
            
            setRbacUser({
              id: session.user.id,
              email: session.user.email!,
              roles,
              permissions
            })
          }
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setRbacUser(null)
        } else if (session?.user) {
          setUser(session.user)
          // Refresh RBAC data when auth state changes
          getUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Helper functions
  const hasRole = (role: string): boolean => {
    return rbacUser?.roles.includes(role) || false
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => rbacUser?.roles.includes(role)) || false
  }

  const hasPermission = (permission: string): boolean => {
    return rbacUser?.permissions.includes(permission) || false
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(perm => rbacUser?.permissions.includes(perm)) || false
  }

  const isPremium = (): boolean => {
    return hasAnyRole(['premium_user', 'admin', 'super_admin'])
  }

  const isAdmin = (): boolean => {
    return hasAnyRole(['admin', 'super_admin'])
  }

  const canAccessAdminPanel = (): boolean => {
    return hasPermission('admin_panel.access')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRbacUser(null)
  }

  return {
    // Basic auth
    user,
    loading,
    signOut,
    
    // RBAC specific
    rbacUser,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    
    // Convenience methods
    isPremium,
    isAdmin,
    canAccessAdminPanel,
    
    // Legacy compatibility
    membershipType: rbacUser?.roles.includes('premium_user') ? 'premium' : 
                   rbacUser?.roles.includes('admin') ? 'vip' : 'free'
  }
}