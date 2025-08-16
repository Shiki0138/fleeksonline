import { NextResponse } from 'next/server'
import { EDUCATION_ARTICLES, formatArticle } from '@/lib/education-articles'
import { createClient } from '@supabase/supabase-js'

// Route Segment Configを追加
export const dynamic = 'force-dynamic'

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // データベースから記事情報を取得
    const { data: dbArticles, error } = await supabase
      .from('education_contents')
      .select('id, article_number, title, category, publish_date, status')
      .order('article_number')
    
    if (error) {
      console.error('Database error:', error)
      // データベースエラーの場合は静的データにフォールバック
      return getFallbackData()
    }
    
    if (dbArticles && dbArticles.length > 0) {
      // データベースのデータを使用
      const now = new Date()
      const articles = dbArticles.map(dbArticle => {
        const publishDate = new Date(dbArticle.publish_date)
        const isPublished = publishDate <= now
        
        return {
          id: dbArticle.id,
          title: dbArticle.title,
          category: dbArticle.category,
          accessLevel: getAccessLevel(dbArticle.article_number),
          publishDate: publishDate.toISOString(),
          isPublished,
          readTime: 7
        }
      })
      
      console.log(`Returning ${articles.length} articles from database`)
      return NextResponse.json({ articles })
    } else {
      // データベースにデータがない場合は静的データを使用
      return getFallbackData()
    }
  } catch (error) {
    console.error('API Error:', error)
    return getFallbackData()
  }
}

// アクセスレベルを判定する関数
function getAccessLevel(articleNumber: number): 'free' | 'partial' | 'premium' {
  const index = (articleNumber - 1) % 20
  if (index < 5) return 'free'
  if (index < 15) return 'partial'
  return 'premium'
}

// フォールバック用の静的データ取得関数
function getFallbackData() {
  // 全記事を対象とする（欠番フィルタリングを削除）
  const articles = EDUCATION_ARTICLES
    .map(formatArticle)
  
  console.log(`Returning ${articles.length} articles from static data (fallback)`)
  return NextResponse.json({ articles })
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