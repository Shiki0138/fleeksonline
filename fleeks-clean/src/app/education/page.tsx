'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { BookOpen, Clock, Lock, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Chapter {
  id: string
  chapter_number: number
  title: string
  description: string
}

interface EducationContent {
  id: string
  title: string
  slug: string
  excerpt: string
  is_premium: boolean
  reading_time: number
  featured_image?: string
  education_chapters: Chapter
}

export default function EducationPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [contents, setContents] = useState<Record<string, EducationContent[]>>({})
  const [loading, setLoading] = useState(true)
  const { membershipType } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEducationData()
  }, [])

  const fetchEducationData = async () => {
    // 章を取得
    const { data: chaptersData } = await supabase
      .from('education_chapters')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (chaptersData) {
      setChapters(chaptersData)
    }

    // コンテンツを取得
    const { data: contentsData } = await supabase
      .from('education_contents')
      .select(`
        id,
        title,
        slug,
        excerpt,
        is_premium,
        reading_time,
        featured_image,
        chapter_id,
        education_chapters!inner (
          id,
          chapter_number,
          title,
          description
        )
      `)
      .eq('status', 'published')
      .order('sort_order')

    if (contentsData) {
      // 章ごとにグループ化
      const grouped = contentsData.reduce((acc, content) => {
        const chapterId = content.chapter_id
        if (!acc[chapterId]) {
          acc[chapterId] = []
        }
        acc[chapterId].push(content)
        return acc
      }, {} as Record<string, EducationContent[]>)
      
      setContents(grouped)
    }

    setLoading(false)
  }

  const canAccessPremium = membershipType === 'premium' || membershipType === 'vip'

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            美容師向け教育コンテンツ
          </h1>
          <p className="text-xl text-gray-200">
            プロフェッショナルを目指すための体系的な学習プログラム
          </p>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="container mx-auto px-4 py-12">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="mb-12">
            {/* 章タイトル */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                第{chapter.chapter_number}章
              </h2>
              <h3 className="text-2xl mb-2">{chapter.title}</h3>
              <p className="text-gray-400">{chapter.description}</p>
            </div>

            {/* コンテンツリスト */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents[chapter.id]?.map((content) => (
                <Link
                  key={content.id}
                  href={`/education/${content.slug}`}
                  className="group"
                >
                  <div className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-all hover:scale-105">
                    {/* サムネイル */}
                    {content.featured_image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={content.featured_image}
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {content.is_premium && !canAccessPremium && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                            <Lock className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* コンテンツ情報 */}
                    <div className="p-6">
                      <h4 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition">
                        {content.title}
                      </h4>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {content.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {content.reading_time}分
                          </span>
                          {content.is_premium && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Lock className="w-4 h-4" />
                              有料
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* プレミアム会員への誘導 */}
        {!canAccessPremium && (
          <div className="mt-16 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              すべてのコンテンツにアクセス
            </h2>
            <p className="mb-6 text-gray-200">
              有料会員になると、80以上の専門コンテンツが読み放題
            </p>
            <Link
              href="/membership/upgrade"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              有料会員になる
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}