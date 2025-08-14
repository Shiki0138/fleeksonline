import { describe, it, expect, beforeEach } from '@jest/globals'
import { contentAccessService } from '@/lib/auth/content-access-service'
import { checkPermission, hasRole, hasAnyRole, hasAllRoles } from '@/lib/auth/rbac-middleware'

// Mock user data
const mockUsers = {
  guest: null,
  freeUser: {
    id: 'free-user-id',
    email: 'free@example.com',
    roles: ['free_user']
  },
  premiumUser: {
    id: 'premium-user-id',
    email: 'premium@example.com',
    roles: ['premium_user']
  },
  adminUser: {
    id: 'admin-user-id',
    email: 'admin@example.com',
    roles: ['admin']
  },
  superAdminUser: {
    id: 'super-admin-id',
    email: 'super@example.com',
    roles: ['super_admin']
  }
}

describe('Content Access Service', () => {
  describe('Article Access', () => {
    // Free articles (1-5, 21-25, 41-45, 61-65)
    it('should allow everyone to access free articles', async () => {
      const freeArticles = ['article_001', 'article_005', 'article_021', 'article_065']
      
      for (const articleId of freeArticles) {
        // Guest access
        const guestAccess = await contentAccessService.canAccessArticle(null, articleId)
        expect(guestAccess.allowed).toBe(true)
        expect(guestAccess.level).toBe('free')
        
        // Free user access
        const freeUserAccess = await contentAccessService.canAccessArticle(
          mockUsers.freeUser.id,
          articleId
        )
        expect(freeUserAccess.allowed).toBe(true)
        
        // Premium user access
        const premiumAccess = await contentAccessService.canAccessArticle(
          mockUsers.premiumUser.id,
          articleId
        )
        expect(premiumAccess.allowed).toBe(true)
      }
    })

    // Partial articles (6-15, 26-35, 46-55, 66-75)
    it('should handle partial article access correctly', async () => {
      const partialArticles = ['article_006', 'article_015', 'article_026', 'article_075']
      
      for (const articleId of partialArticles) {
        // Guest - no access
        const guestAccess = await contentAccessService.canAccessArticle(null, articleId)
        expect(guestAccess.allowed).toBe(false)
        expect(guestAccess.requiredAction).toBe('login')
        
        // Free user - preview only
        const freeUserAccess = await contentAccessService.canAccessArticle(
          mockUsers.freeUser.id,
          articleId
        )
        expect(freeUserAccess.allowed).toBe(false)
        expect(freeUserAccess.previewAllowed).toBe(true)
        expect(freeUserAccess.requiredAction).toBe('upgrade')
        
        // Premium user - full access
        const premiumAccess = await contentAccessService.canAccessArticle(
          mockUsers.premiumUser.id,
          articleId
        )
        expect(premiumAccess.allowed).toBe(true)
      }
    })

    // Premium articles (16-20, 36-40, 56-60, 76-80)
    it('should restrict premium articles to premium users only', async () => {
      const premiumArticles = ['article_016', 'article_020', 'article_056', 'article_080']
      
      for (const articleId of premiumArticles) {
        // Guest - no access
        const guestAccess = await contentAccessService.canAccessArticle(null, articleId)
        expect(guestAccess.allowed).toBe(false)
        expect(guestAccess.requiredAction).toBe('login')
        
        // Free user - no access
        const freeUserAccess = await contentAccessService.canAccessArticle(
          mockUsers.freeUser.id,
          articleId
        )
        expect(freeUserAccess.allowed).toBe(false)
        expect(freeUserAccess.requiredAction).toBe('upgrade')
        expect(freeUserAccess.requiredRoles).toContain('premium_user')
        
        // Premium user - full access
        const premiumAccess = await contentAccessService.canAccessArticle(
          mockUsers.premiumUser.id,
          articleId
        )
        expect(premiumAccess.allowed).toBe(true)
      }
    })

    it('should give admins full access to all articles', async () => {
      const allArticles = ['article_001', 'article_010', 'article_020']
      
      for (const articleId of allArticles) {
        const adminAccess = await contentAccessService.canAccessArticle(
          mockUsers.adminUser.id,
          articleId
        )
        expect(adminAccess.allowed).toBe(true)
        expect(adminAccess.reason).toBe('Admin access')
      }
    })
  })

  describe('Video Access', () => {
    it('should allow everyone to access free videos', async () => {
      const guestAccess = await contentAccessService.canAccessVideo(null, 'video_001', false)
      expect(guestAccess.allowed).toBe(true)
      
      const userAccess = await contentAccessService.canAccessVideo(
        mockUsers.freeUser.id,
        'video_001',
        false
      )
      expect(userAccess.allowed).toBe(true)
    })

    it('should restrict premium videos to premium users', async () => {
      // Guest - no access
      const guestAccess = await contentAccessService.canAccessVideo(null, 'video_002', true)
      expect(guestAccess.allowed).toBe(false)
      expect(guestAccess.requiredAction).toBe('login')
      
      // Free user - no access
      const freeAccess = await contentAccessService.canAccessVideo(
        mockUsers.freeUser.id,
        'video_002',
        true
      )
      expect(freeAccess.allowed).toBe(false)
      expect(freeAccess.requiredAction).toBe('upgrade')
      
      // Premium user - access granted
      const premiumAccess = await contentAccessService.canAccessVideo(
        mockUsers.premiumUser.id,
        'video_002',
        true
      )
      expect(premiumAccess.allowed).toBe(true)
    })
  })

  describe('Forum Access', () => {
    it('should allow everyone to read forum', async () => {
      const guestAccess = await contentAccessService.canAccessForum(null, 'read')
      expect(guestAccess.allowed).toBe(true)
    })

    it('should require authentication for forum writing', async () => {
      const guestAccess = await contentAccessService.canAccessForum(null, 'write')
      expect(guestAccess.allowed).toBe(false)
      expect(guestAccess.requiredAction).toBe('login')
      
      const userAccess = await contentAccessService.canAccessForum(
        mockUsers.freeUser.id,
        'write'
      )
      expect(userAccess.allowed).toBe(true)
    })

    it('should restrict moderation to admins', async () => {
      const userAccess = await contentAccessService.canAccessForum(
        mockUsers.freeUser.id,
        'moderate'
      )
      expect(userAccess.allowed).toBe(false)
      expect(userAccess.requiredRoles).toContain('admin')
      
      const adminAccess = await contentAccessService.canAccessForum(
        mockUsers.adminUser.id,
        'moderate'
      )
      expect(adminAccess.allowed).toBe(true)
    })
  })

  describe('Content Preview', () => {
    it('should generate content preview correctly', () => {
      const fullContent = Array(100).fill(0).map((_, i) => `Line ${i + 1}`).join('\n')
      const preview = contentAccessService.getContentPreview(fullContent, 0.3)
      const previewLines = preview.split('\n')
      
      expect(previewLines.length).toBe(30)
      expect(previewLines[0]).toBe('Line 1')
      expect(previewLines[29]).toBe('Line 30')
    })
  })

  describe('Access Message Formatting', () => {
    it('should format login required message', () => {
      const decision = {
        allowed: false,
        reason: 'Authentication required',
        requiredAction: 'login' as const
      }
      
      const message = contentAccessService.formatAccessMessage(decision)
      expect(message.title).toBe('ログインが必要です')
      expect(message.ctaLink).toBe('/login')
    })

    it('should format upgrade required message', () => {
      const decision = {
        allowed: false,
        reason: 'Premium subscription required',
        level: 'premium' as const,
        requiredAction: 'upgrade' as const
      }
      
      const message = contentAccessService.formatAccessMessage(decision)
      expect(message.title).toBe('プレミアム限定コンテンツ')
      expect(message.ctaLink).toBe('/membership/upgrade')
    })
  })
})

describe('RBAC Middleware Helpers', () => {
  describe('Role Checking', () => {
    it('should check single role correctly', () => {
      expect(hasRole(mockUsers.premiumUser, 'premium_user')).toBe(true)
      expect(hasRole(mockUsers.premiumUser, 'admin')).toBe(false)
    })

    it('should check any role correctly', () => {
      expect(hasAnyRole(mockUsers.adminUser, ['admin', 'super_admin'])).toBe(true)
      expect(hasAnyRole(mockUsers.freeUser, ['premium_user', 'admin'])).toBe(false)
    })

    it('should check all roles correctly', () => {
      const multiRoleUser = {
        id: 'multi-role-id',
        email: 'multi@example.com',
        roles: ['free_user', 'premium_user']
      }
      
      expect(hasAllRoles(multiRoleUser, ['free_user', 'premium_user'])).toBe(true)
      expect(hasAllRoles(multiRoleUser, ['free_user', 'admin'])).toBe(false)
    })
  })
})

describe('Permission Patterns', () => {
  describe('Article Number to Access Level Mapping', () => {
    const testCases = [
      // Chapter 1 (1-20)
      { article: 1, expected: 'free' },
      { article: 5, expected: 'free' },
      { article: 6, expected: 'partial' },
      { article: 15, expected: 'partial' },
      { article: 16, expected: 'premium' },
      { article: 20, expected: 'premium' },
      // Chapter 2 (21-40)
      { article: 21, expected: 'free' },
      { article: 25, expected: 'free' },
      { article: 26, expected: 'partial' },
      { article: 35, expected: 'partial' },
      { article: 36, expected: 'premium' },
      { article: 40, expected: 'premium' },
      // Chapter 3 (41-60)
      { article: 41, expected: 'free' },
      { article: 45, expected: 'free' },
      { article: 46, expected: 'partial' },
      { article: 55, expected: 'partial' },
      { article: 56, expected: 'premium' },
      { article: 60, expected: 'premium' },
      // Chapter 4 (61-80)
      { article: 61, expected: 'free' },
      { article: 65, expected: 'free' },
      { article: 66, expected: 'partial' },
      { article: 75, expected: 'partial' },
      { article: 76, expected: 'premium' },
      { article: 80, expected: 'premium' }
    ]

    testCases.forEach(({ article, expected }) => {
      it(`should classify article ${article} as ${expected}`, () => {
        const index = (article - 1) % 20
        let level: string
        
        if (index < 5) level = 'free'
        else if (index < 15) level = 'partial'
        else level = 'premium'
        
        expect(level).toBe(expected)
      })
    })
  })
})

describe('Security Scenarios', () => {
  it('should prevent access with invalid article IDs', async () => {
    const invalidIds = ['', 'invalid', 'article_abc', '../../../etc/passwd']
    
    for (const id of invalidIds) {
      const access = await contentAccessService.canAccessArticle(
        mockUsers.premiumUser.id,
        id
      )
      expect(access.allowed).toBe(false)
      expect(access.reason).toBe('Invalid article ID')
    }
  })

  it('should handle missing user gracefully', async () => {
    const access = await contentAccessService.canAccessArticle(
      'non-existent-user-id',
      'article_001'
    )
    // Should still work for free content
    expect(access.allowed).toBe(true)
  })

  it('should enforce access rules consistently', async () => {
    // Same article, different users
    const articleId = 'article_010' // partial access
    
    const results = await Promise.all([
      contentAccessService.canAccessArticle(null, articleId),
      contentAccessService.canAccessArticle(mockUsers.freeUser.id, articleId),
      contentAccessService.canAccessArticle(mockUsers.premiumUser.id, articleId),
      contentAccessService.canAccessArticle(mockUsers.adminUser.id, articleId)
    ])
    
    expect(results[0].allowed).toBe(false) // guest
    expect(results[1].allowed).toBe(false) // free user
    expect(results[1].previewAllowed).toBe(true) // but can preview
    expect(results[2].allowed).toBe(true) // premium
    expect(results[3].allowed).toBe(true) // admin
  })
})