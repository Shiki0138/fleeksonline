import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'

export interface ContentAccessDecision {
  allowed: boolean
  reason: string
  level?: 'free' | 'partial' | 'premium'
  requiredAction?: 'login' | 'upgrade'
  requiredRoles?: string[]
  previewAllowed?: boolean
}

export interface UserAccess {
  userId: string
  roles: string[]
  isPremium: boolean
  isAdmin: boolean
}

// Cache user access info for the request duration
export const getUserAccess = cache(async (userId: string): Promise<UserAccess | null> => {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data: userRoles, error } = await supabase
      .rpc('get_user_roles', { user_uuid: userId })
    
    if (error) {
      console.error('Error fetching user roles:', error)
      return null
    }

    const roleNames = userRoles.map((r: any) => r.role_name)
    
    return {
      userId,
      roles: roleNames,
      isPremium: roleNames.includes('premium_user'),
      isAdmin: roleNames.includes('admin') || roleNames.includes('super_admin')
    }
  } catch (error) {
    console.error('getUserAccess error:', error)
    return null
  }
})

export class ContentAccessService {
  // Check if user can access an article
  async canAccessArticle(
    userId: string | null,
    articleId: string
  ): Promise<ContentAccessDecision> {
    // Extract article number
    const articleNumber = this.extractArticleNumber(articleId)
    if (!articleNumber) {
      return {
        allowed: false,
        reason: 'Invalid article ID'
      }
    }

    // Get article access level
    const accessLevel = this.getArticleAccessLevel(articleNumber)
    
    // Free articles are accessible to everyone
    if (accessLevel === 'free') {
      return {
        allowed: true,
        reason: 'Free content',
        level: 'free'
      }
    }

    // Check if user is authenticated
    if (!userId) {
      return {
        allowed: false,
        reason: 'Authentication required',
        level: accessLevel,
        requiredAction: 'login',
        previewAllowed: false
      }
    }

    // Get user access info
    const userAccess = await getUserAccess(userId)
    if (!userAccess) {
      return {
        allowed: false,
        reason: 'Failed to verify user permissions',
        level: accessLevel
      }
    }

    // Admins have full access
    if (userAccess.isAdmin) {
      return {
        allowed: true,
        reason: 'Admin access',
        level: accessLevel
      }
    }

    // Check partial access
    if (accessLevel === 'partial') {
      // All logged-in users can see preview
      return {
        allowed: userAccess.isPremium,
        reason: userAccess.isPremium ? 'Premium access' : 'Preview access only',
        level: 'partial',
        previewAllowed: true,
        requiredAction: userAccess.isPremium ? undefined : 'upgrade'
      }
    }

    // Premium content
    if (accessLevel === 'premium') {
      if (userAccess.isPremium) {
        return {
          allowed: true,
          reason: 'Premium access',
          level: 'premium'
        }
      }
      
      return {
        allowed: false,
        reason: 'Premium subscription required',
        level: 'premium',
        requiredAction: 'upgrade',
        requiredRoles: ['premium_user']
      }
    }

    return {
      allowed: false,
      reason: 'Access denied',
      level: accessLevel
    }
  }

  // Check if user can access a video
  async canAccessVideo(
    userId: string | null,
    videoId: string,
    isPremiumVideo: boolean
  ): Promise<ContentAccessDecision> {
    // Free videos are accessible to everyone
    if (!isPremiumVideo) {
      return {
        allowed: true,
        reason: 'Free content'
      }
    }

    // Premium videos require authentication
    if (!userId) {
      return {
        allowed: false,
        reason: 'Authentication required',
        requiredAction: 'login'
      }
    }

    // Get user access info
    const userAccess = await getUserAccess(userId)
    if (!userAccess) {
      return {
        allowed: false,
        reason: 'Failed to verify user permissions'
      }
    }

    // Check premium access
    if (userAccess.isPremium || userAccess.isAdmin) {
      return {
        allowed: true,
        reason: userAccess.isAdmin ? 'Admin access' : 'Premium access'
      }
    }

    return {
      allowed: false,
      reason: 'Premium subscription required',
      requiredAction: 'upgrade',
      requiredRoles: ['premium_user']
    }
  }

  // Check forum access
  async canAccessForum(
    userId: string | null,
    action: 'read' | 'write' | 'moderate'
  ): Promise<ContentAccessDecision> {
    // Anyone can read forum
    if (action === 'read') {
      return {
        allowed: true,
        reason: 'Public forum'
      }
    }

    // Writing requires authentication
    if (!userId) {
      return {
        allowed: false,
        reason: 'Authentication required',
        requiredAction: 'login'
      }
    }

    const userAccess = await getUserAccess(userId)
    if (!userAccess) {
      return {
        allowed: false,
        reason: 'Failed to verify user permissions'
      }
    }

    // All authenticated users can write
    if (action === 'write') {
      return {
        allowed: true,
        reason: 'Authenticated user'
      }
    }

    // Moderation requires admin
    if (action === 'moderate') {
      if (userAccess.isAdmin) {
        return {
          allowed: true,
          reason: 'Admin access'
        }
      }
      
      return {
        allowed: false,
        reason: 'Admin privileges required',
        requiredRoles: ['admin']
      }
    }

    return {
      allowed: false,
      reason: 'Access denied'
    }
  }

  // Batch check multiple articles
  async checkArticleAccess(
    userId: string | null,
    articleIds: string[]
  ): Promise<Map<string, ContentAccessDecision>> {
    const results = new Map<string, ContentAccessDecision>()
    
    // Get user access info once
    const userAccess = userId ? await getUserAccess(userId) : null
    
    for (const articleId of articleIds) {
      const articleNumber = this.extractArticleNumber(articleId)
      if (!articleNumber) {
        results.set(articleId, {
          allowed: false,
          reason: 'Invalid article ID'
        })
        continue
      }

      const accessLevel = this.getArticleAccessLevel(articleNumber)
      
      if (accessLevel === 'free') {
        results.set(articleId, {
          allowed: true,
          reason: 'Free content',
          level: 'free'
        })
      } else if (!userAccess) {
        results.set(articleId, {
          allowed: false,
          reason: userId ? 'Failed to verify permissions' : 'Authentication required',
          level: accessLevel,
          requiredAction: userId ? undefined : 'login'
        })
      } else if (userAccess.isAdmin || userAccess.isPremium) {
        results.set(articleId, {
          allowed: true,
          reason: userAccess.isAdmin ? 'Admin access' : 'Premium access',
          level: accessLevel
        })
      } else if (accessLevel === 'partial') {
        results.set(articleId, {
          allowed: false,
          reason: 'Preview access only',
          level: 'partial',
          previewAllowed: true,
          requiredAction: 'upgrade'
        })
      } else {
        results.set(articleId, {
          allowed: false,
          reason: 'Premium subscription required',
          level: 'premium',
          requiredAction: 'upgrade',
          requiredRoles: ['premium_user']
        })
      }
    }
    
    return results
  }

  // Helper methods
  private extractArticleNumber(articleId: string): number | null {
    const match = articleId.match(/(\d+)/)
    return match ? parseInt(match[1]) : null
  }

  private getArticleAccessLevel(articleNumber: number): 'free' | 'partial' | 'premium' {
    const index = (articleNumber - 1) % 20
    if (index < 5) return 'free'
    if (index < 15) return 'partial'
    return 'premium'
  }

  // Get content preview for partial access
  getContentPreview(content: string, previewRatio: number = 0.3): string {
    const lines = content.split('\n')
    const previewLineCount = Math.max(30, Math.floor(lines.length * previewRatio))
    return lines.slice(0, previewLineCount).join('\n')
  }

  // Format access message for UI
  formatAccessMessage(decision: ContentAccessDecision): {
    title: string
    message: string
    ctaText?: string
    ctaLink?: string
  } {
    if (decision.allowed) {
      return {
        title: '',
        message: ''
      }
    }

    switch (decision.requiredAction) {
      case 'login':
        return {
          title: 'ログインが必要です',
          message: 'このコンテンツを閲覧するにはログインが必要です。',
          ctaText: 'ログインする',
          ctaLink: '/login'
        }
      
      case 'upgrade':
        if (decision.level === 'partial' && decision.previewAllowed) {
          return {
            title: '続きを読むにはプレミアムプランへ',
            message: 'この記事の全文と、他の有料記事すべてが読み放題になります。',
            ctaText: 'プレミアムプランで続きを読む',
            ctaLink: '/membership/upgrade'
          }
        }
        return {
          title: 'プレミアム限定コンテンツ',
          message: 'このコンテンツはプレミアムプラン会員限定です。',
          ctaText: 'プレミアムプランで読む',
          ctaLink: '/membership/upgrade'
        }
      
      default:
        return {
          title: 'アクセスできません',
          message: decision.reason
        }
    }
  }
}

// Export singleton instance
export const contentAccessService = new ContentAccessService()