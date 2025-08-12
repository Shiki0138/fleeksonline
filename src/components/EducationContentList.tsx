'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, Calendar, CheckCircle, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  category: 'beginner' | 'management' | 'dx' | 'general'
  accessLevel: 'free' | 'partial' | 'premium'
  publishDate: string
  isPublished: boolean
  readTime?: number
}

const CHAPTERS = {
  beginner: { name: '初心者編', icon: '🌱', color: 'blue' },
  management: { name: '経営編', icon: '💼', color: 'green' },
  dx: { name: 'DX編', icon: '🚀', color: 'purple' },
  general: { name: '総合編', icon: '🎯', color: 'orange' }
}

export default function EducationContentList() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      // 実際の実装では、APIから記事リストを取得
      // ここではサンプルデータを生成
      const sampleArticles = generateSampleArticles()
      setArticles(sampleArticles)
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  // サンプル記事データの生成（実際の実装では不要）
  const generateSampleArticles = (): Article[] => {
    const articles: Article[] = []
    const today = new Date()
    const categories: Array<'beginner' | 'management' | 'dx' | 'general'> = ['beginner', 'management', 'dx', 'general']
    
    let articleNumber = 1
    categories.forEach((category, chapterIndex) => {
      for (let i = 1; i <= 20; i++) {
        const dayOffset = Math.floor((articleNumber - 1) / 2)
        const publishDate = new Date(today)
        publishDate.setDate(today.getDate() + dayOffset)
        
        const isPublished = publishDate <= today
        
        articles.push({
          id: `article_${String(articleNumber).padStart(3, '0')}`,
          title: getArticleTitle(category, i),
          category,
          accessLevel: i <= 5 ? 'free' : i <= 15 ? 'partial' : 'premium',
          publishDate: publishDate.toISOString(),
          isPublished,
          readTime: 7
        })
        
        articleNumber++
      }
    })
    
    return articles
  }

  // 記事タイトルの取得（実際の実装では不要）
  const getArticleTitle = (category: string, index: number): string => {
    const titles: Record<string, string[]> = {
      beginner: [
        '美容師のための効果的な挨拶とその心理学的効果',
        'アイコンタクトの重要性と実践的なテクニック',
        '初回カウンセリングで信頼を得る5つのポイント',
        'プロの美容師が実践する聴き方の技術',
        '失敗しない！新人美容師のための接客マナー',
        // ... 他のタイトル
      ],
      management: [
        '美容室の売上を向上させる価格設定の考え方',
        'リピート率90%を実現する顧客管理の方法',
        // ... 他のタイトル
      ],
      // ... 他のカテゴリー
    }
    
    return titles[category]?.[index - 1] || `${CHAPTERS[category as keyof typeof CHAPTERS].name} 第${index}回`
  }

  const filteredArticles = selectedChapter === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedChapter)

  const getAccessLevelBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case 'free':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            無料
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            <Crown className="w-3 h-3" />
            一部有料
          </span>
        )
      case 'premium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
            <Lock className="w-3 h-3" />
            有料限定
          </span>
        )
    }
  }

  const formatPublishDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '本日公開'
    if (diffDays === 1) return '明日公開'
    if (diffDays <= 7) return `${diffDays}日後に公開`
    
    return date.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">教育コンテンツ一覧</h1>
        <p className="text-gray-600">
          全80記事で美容師としてのスキルを体系的に学べます
        </p>
      </div>

      {/* チャプターフィルター */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedChapter('all')}
          className={`px-4 py-2 rounded-full font-medium transition ${
            selectedChapter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          すべて
        </button>
        {Object.entries(CHAPTERS).map(([key, chapter]) => (
          <button
            key={key}
            onClick={() => setSelectedChapter(key)}
            className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
              selectedChapter === key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{chapter.icon}</span>
            {chapter.name}
          </button>
        ))}
      </div>

      {/* 進捗表示 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">公開状況</h3>
          <div className="text-sm text-gray-600">
            {articles.filter(a => a.isPublished).length} / {articles.length} 記事公開済み
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${(articles.filter(a => a.isPublished).length / articles.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* 記事グリッド */}
      <div className="grid gap-4">
        {Object.entries(CHAPTERS).map(([categoryKey, chapter]) => {
          const categoryArticles = filteredArticles.filter(
            article => article.category === categoryKey
          )
          
          if (categoryArticles.length === 0 && selectedChapter !== 'all') return null
          
          return (
            <div key={categoryKey} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{chapter.icon}</span>
                <h2 className="text-xl font-bold">{chapter.name}</h2>
                <span className="text-sm text-gray-500">
                  ({categoryArticles.length}記事)
                </span>
              </div>
              
              <div className="grid gap-3">
                {categoryArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      bg-white rounded-lg border p-4
                      ${article.isPublished 
                        ? 'border-gray-200 hover:border-purple-300 hover:shadow-md transition-all' 
                        : 'border-gray-100 bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {article.isPublished ? (
                            <Link
                              href={`/education/${article.id}`}
                              className="font-semibold text-gray-900 hover:text-purple-600 transition"
                            >
                              {article.title}
                            </Link>
                          ) : (
                            <span className="font-semibold text-gray-500">
                              {article.title}
                            </span>
                          )}
                          {getAccessLevelBadge(article.accessLevel)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {article.isPublished ? (
                            <>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {article.readTime}分で読了
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                公開中
                              </span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Calendar className="w-4 h-4" />
                              {formatPublishDate(article.publishDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {article.isPublished && (
                        <Link
                          href={`/education/${article.id}`}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          読む →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center"
      >
        <h3 className="text-2xl font-bold mb-4">
          すべての記事を今すぐ読みたい方へ
        </h3>
        <p className="mb-6 opacity-90">
          有料プランなら、公開予定の記事も含めて全80記事が即座に閲覧可能！
        </p>
        <Link
          href="https://fleeks.jp/"
          className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition"
        >
          <Crown className="w-5 h-5" />
          有料プランを見る
        </Link>
      </motion.div>
    </div>
  )
}