import { NextResponse } from 'next/server'
import { EDUCATION_ARTICLES, formatArticle } from '@/lib/education-articles'

// Route Segment Configを追加
export const dynamic = 'force-dynamic'

export async function GET() {
  // 本番環境ではファイルシステムアクセスができないため、
  // 存在する記事番号に基づいて静的データをフィルタリング
  try {
    // 存在する記事番号（欠番を除く）
    const existingArticleNumbers = [
      1, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
      42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
      62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80
    ]
    
    const articles = EDUCATION_ARTICLES
      .filter(article => existingArticleNumbers.includes(article.number))
      .map(formatArticle)
    
    console.log(`Returning ${articles.length} articles (excluding missing files)`)
    return NextResponse.json({ articles })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}

// ファイルシステムからの読み込み（開発環境用）
export async function GET_FROM_FILES() {
  try {
    // JSONファイルから記事を読み込む
    const fs = require('fs').promises
    const path = require('path')
    
    const articlesDir = path.join(process.cwd(), 'data', 'education-articles')
    
    // ディレクトリの存在確認
    try {
      await fs.access(articlesDir)
    } catch (err) {
      console.error('Articles directory not found:', articlesDir)
      console.error('Current working directory:', process.cwd())
      return NextResponse.json({ 
        articles: [],
        error: 'Articles directory not found',
        path: articlesDir,
        cwd: process.cwd()
      })
    }
    
    const files = await fs.readdir(articlesDir)
    const articleFiles = files.filter((f: string) => f.endsWith('.json')).sort()
    
    console.log(`Found ${articleFiles.length} article files in ${articlesDir}`)
    console.log('Files:', articleFiles.slice(0, 10)) // デバッグ用：最初の10ファイルを表示
    
    const articles = []
    let successCount = 0
    let errorCount = 0
    
    for (const file of articleFiles) {
      try {
        const filePath = path.join(articlesDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const articleData = JSON.parse(content)
        
        // 記事番号を抽出
        const articleNumber = parseInt(articleData.id.replace('article_', ''))
        
        // アクセスレベルを判定
        const index = (articleNumber - 1) % 20
        let accessLevel = 'free'
        if (index >= 5 && index < 15) accessLevel = 'partial'
        else if (index >= 15) accessLevel = 'premium'
        
        // すべての記事を公開済みとする
        const today = new Date()
        const publishDate = new Date(today)
        publishDate.setDate(today.getDate() - 30) // 30日前に公開済みとする
        
        articles.push({
          id: articleData.id,
          title: articleData.title,
          category: articleData.category,
          accessLevel,
          publishDate: publishDate.toISOString(),
          isPublished: publishDate <= today,
          readTime: 7
        })
        successCount++
      } catch (err) {
        console.error(`Error loading ${file}:`, err)
        errorCount++
        // エラーがあってもcontinue
        continue
      }
    }
    
    console.log(`Successfully loaded: ${successCount}, Errors: ${errorCount}`)
    
    // ソート
    articles.sort((a, b) => {
      const numA = parseInt(a.id.replace('article_', ''))
      const numB = parseInt(b.id.replace('article_', ''))
      return numA - numB
    })
    
    console.log(`Returning ${articles.length} articles`)
    return NextResponse.json({ articles })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}