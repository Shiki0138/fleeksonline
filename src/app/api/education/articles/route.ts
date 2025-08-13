import { NextResponse } from 'next/server'

// Route Segment Configを追加
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // JSONファイルから記事を読み込む
    const fs = require('fs').promises
    const path = require('path')
    
    const articlesDir = path.join(process.cwd(), 'data', 'education-articles')
    const files = await fs.readdir(articlesDir)
    const articleFiles = files.filter((f: string) => f.endsWith('.json')).sort()
    
    console.log(`Found ${articleFiles.length} article files`)
    
    const articles = []
    
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
        
        // 現在の日付より前の記事のみ公開とする
        const today = new Date()
        const dayOffset = Math.floor((articleNumber - 1) / 2) // 2記事ずつ公開
        const publishDate = new Date(today)
        publishDate.setDate(today.getDate() - dayOffset)
        
        articles.push({
          id: articleData.id,
          title: articleData.title,
          category: articleData.category,
          accessLevel,
          publishDate: publishDate.toISOString(),
          isPublished: publishDate <= today,
          readTime: 7
        })
      } catch (err) {
        console.error(`Error loading ${file}:`, err)
      }
    }
    
    // ソート
    articles.sort((a, b) => {
      const numA = parseInt(a.id.replace('article_', ''))
      const numB = parseInt(b.id.replace('article_', ''))
      return numA - numB
    })
    
    return NextResponse.json({ articles })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}