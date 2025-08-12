import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen } from 'lucide-react'
import PremiumContent from '@/components/PremiumContent'

interface EducationContent {
  id: string
  title: string
  slug: string
  content: string
  preview_content?: string
  excerpt: string
  is_premium: boolean
  reading_time: number
  featured_image?: string
  education_chapters: {
    id: string
    chapter_number: number
    title: string
  }
}

export default async function EducationContentPage({
  params
}: {
  params: { slug: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  
  // slugから記事番号を抽出（例: "001" -> 1）
  const articleNumber = parseInt(params.slug, 10)
  
  // コンテンツを取得
  const { data: content, error } = await supabase
    .from('education_contents')
    .select(`
      *,
      education_chapters (
        id,
        chapter_number,
        title
      )
    `)
    .eq('article_number', articleNumber)
    .single()

  if (error || !content) {
    notFound()
  }
  
  // 公開チェック
  const now = new Date()
  const publishDate = new Date(content.publish_date)
  if (content.status !== 'published' || publishDate > now) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/education"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            教育コンテンツ一覧に戻る
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
            <span>第{content.education_chapters.chapter_number}章</span>
            <span>•</span>
            <span>{content.education_chapters.title}</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {content.title}
          </h1>
          
          <div className="flex items-center gap-4 text-gray-300">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {content.reading_time}分で読了
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {content.is_premium ? '有料コンテンツ' : '無料コンテンツ'}
            </span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* アイキャッチ画像 */}
          {content.featured_image && (
            <img
              src={content.featured_image}
              alt={content.title}
              className="w-full h-auto rounded-lg mb-8"
            />
          )}
          
          {/* コンテンツ本文 */}
          <div className="prose prose-lg prose-invert max-w-none">
            <PremiumContent
              content={content.content}
              previewContent={content.preview_content || ''}
              isPremium={content.is_premium}
              postId={content.id}
              readingTime={content.reading_time}
            />
          </div>

          {/* ナビゲーション */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <Link
              href="/education"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              他のコンテンツを見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// 動的なメタデータ
export async function generateMetadata({
  params
}: {
  params: { slug: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: content } = await supabase
    .from('education_contents')
    .select('title, excerpt')
    .eq('slug', params.slug)
    .single()

  if (!content) {
    return {
      title: 'コンテンツが見つかりません',
    }
  }

  return {
    title: content.title,
    description: content.excerpt,
  }
}