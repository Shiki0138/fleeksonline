import { NextResponse } from 'next/server'

// Route Segment Configを追加
export const dynamic = 'force-dynamic'

export async function GET() {
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