import { NextResponse } from 'next/server'

// 静的な記事リスト（フォールバック用）
const STATIC_ARTICLES = [
  { number: 1, title: "美容師のための効果的な挨拶とその心理学的効果", category: "beginner" },
  { number: 7, title: "ヘアケア知識の基礎：髪質診断からトリートメント選定まで", category: "beginner" },
  { number: 8, title: "スタイリング剤の選び方と効果的な使用方法", category: "beginner" },
  { number: 9, title: "美容師のための解剖学：頭皮と髪の構造を理解する", category: "beginner" },
  { number: 10, title: "接客マナーの基本：リピーターを生む接客術", category: "beginner" },
  { number: 11, title: "ハサミの選び方とメンテナンス方法", category: "beginner" },
  { number: 12, title: "カット理論の基礎：ベーシックカットから応用まで", category: "beginner" },
  { number: 13, title: "薬剤知識：安全な施術のための化学基礎", category: "beginner" },
  { number: 14, title: "美容師のための皮膚科学：アレルギーとパッチテスト", category: "beginner" },
  { number: 15, title: "シザーワークの基本動作と練習方法", category: "beginner" },
  // 他の記事も追加...
]

export async function GET() {
  try {
    const articles = STATIC_ARTICLES.map(article => {
      const articleNumber = article.number
      const index = (articleNumber - 1) % 20
      let accessLevel = 'free'
      if (index >= 5 && index < 15) accessLevel = 'partial'
      else if (index >= 15) accessLevel = 'premium'
      
      const today = new Date()
      const publishDate = new Date(today)
      publishDate.setDate(today.getDate() - 30)
      
      return {
        id: `article_${String(articleNumber).padStart(3, '0')}`,
        title: article.title,
        category: article.category,
        accessLevel,
        publishDate: publishDate.toISOString(),
        isPublished: true,
        readTime: 7
      }
    })
    
    return NextResponse.json({ articles })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}