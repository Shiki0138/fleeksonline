import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // 教育コンテンツを取得
    const { data: contents, error } = await supabase
      .from('education_contents')
      .select(`
        id,
        article_number,
        title,
        slug,
        access_level,
        publish_date,
        reading_time,
        status,
        education_chapters (
          category
        )
      `)
      .order('article_number', { ascending: true })

    if (error) {
      console.error('Error fetching education contents:', error)
      return NextResponse.json({ articles: [] })
    }

    // クライアント用のフォーマットに変換
    const articles = contents?.map(content => {
      const publishDate = new Date(content.publish_date)
      const now = new Date()
      const isPublished = content.status === 'published' && publishDate <= now

      return {
        id: `article_${String(content.article_number).padStart(3, '0')}`,
        title: content.title,
        category: content.education_chapters?.category || 'general',
        accessLevel: content.access_level,
        publishDate: content.publish_date,
        isPublished,
        readTime: content.reading_time
      }
    }) || []

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}