import { NextRequest, NextResponse } from 'next/server'
import { withAuthorization, Resource, Action } from '@/lib/auth/rbac-middleware'
import { contentAccessService } from '@/lib/auth/content-access-service'
import path from 'path'
import fs from 'fs/promises'

// GET /api/education/articles/secure - Get articles with proper access control
export const GET = withAuthorization(
  Resource.ARTICLE,
  Action.READ
)(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url)
    const articleId = url.searchParams.get('id')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // Single article request
    if (articleId) {
      // Check article access
      const accessDecision = await contentAccessService.canAccessArticle(
        user.id,
        articleId
      )

      if (!accessDecision.allowed) {
        return NextResponse.json({
          error: 'Access denied',
          message: accessDecision.reason,
          requiredAction: accessDecision.requiredAction,
          accessLevel: accessDecision.level
        }, { status: 403 })
      }

      // Load article
      const articlePath = path.join(
        process.cwd(),
        'data',
        'education-articles',
        `${articleId}.json`
      )

      try {
        const articleData = await fs.readFile(articlePath, 'utf-8')
        const article = JSON.parse(articleData)
        
        // If partial access, return preview only
        if (accessDecision.previewAllowed && !accessDecision.allowed) {
          article.content = contentAccessService.getContentPreview(article.content)
          article.isPreview = true
        }

        return NextResponse.json({
          article,
          access: {
            level: accessDecision.level,
            isPreview: accessDecision.previewAllowed && !accessDecision.allowed,
            canReadFull: accessDecision.allowed
          }
        })
      } catch (error) {
        return NextResponse.json({
          error: 'Article not found'
        }, { status: 404 })
      }
    }

    // List articles with access info
    const articlesDir = path.join(process.cwd(), 'data', 'education-articles')
    const files = await fs.readdir(articlesDir)
    const articleFiles = files.filter(f => f.endsWith('.json'))
    
    // Check access for all articles
    const articleIds = articleFiles.map(f => f.replace('.json', ''))
    const accessMap = await contentAccessService.checkArticleAccess(user.id, articleIds)
    
    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFiles = articleFiles.slice(startIndex, endIndex)
    
    // Load article metadata
    const articles = await Promise.all(
      paginatedFiles.map(async (filename) => {
        const articleId = filename.replace('.json', '')
        const filePath = path.join(articlesDir, filename)
        const data = await fs.readFile(filePath, 'utf-8')
        const article = JSON.parse(data)
        const access = accessMap.get(articleId)!
        
        return {
          id: articleId,
          number: parseInt(articleId.replace('article_', '')),
          title: article.title,
          category: article.category,
          keywords: article.keywords,
          publishedAt: article.generatedAt,
          access: {
            level: access.level,
            canRead: access.allowed,
            canPreview: access.previewAllowed,
            requiredAction: access.requiredAction
          }
        }
      })
    )

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: articleFiles.length,
        totalPages: Math.ceil(articleFiles.length / limit)
      },
      user: {
        roles: user.roles,
        isPremium: user.roles.includes('premium_user'),
        isAdmin: user.roles.includes('admin') || user.roles.includes('super_admin')
      }
    })
  } catch (error) {
    console.error('Articles API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
})