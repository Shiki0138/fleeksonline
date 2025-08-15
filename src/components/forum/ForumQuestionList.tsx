'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageCircle, 
  Eye, 
  ThumbsUp, 
  CheckCircle,
  Clock,
  User,
  TrendingUp,
  Hash,
  Crown,
  AlertTriangle,
  Plus
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Question {
  id: string
  title: string
  content: string
  user: {
    id: string
    nickname: string
    avatar_url?: string
  }
  category: {
    name: string
    slug: string
    icon: string
  }
  tags: string[]
  is_anonymous: boolean
  is_resolved: boolean
  is_admin_question?: boolean
  priority?: 'normal' | 'high'
  view_count: number
  created_at: string
  answers: { count: number }[]
  likes: { count: number }[]
}

export default function ForumQuestionList() {
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')

  // 実際にAPIから取得
  useEffect(() => {
    setLoading(true)
    // API呼び出し
    setTimeout(() => {
      setQuestions([])
      setLoading(false)
    }, 500)
  }, [searchParams])

  const getSortOptions = () => [
    { value: 'newest', label: '新着順', icon: Clock },
    { value: 'popular', label: '人気順', icon: TrendingUp },
    { value: 'unanswered', label: '未回答', icon: MessageCircle },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b pb-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ソートオプション */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchParams.get('category') || searchParams.get('tag') ? '検索結果' : 'すべての質問'}
          </h2>
          
          <div className="flex items-center gap-2">
            {getSortOptions().map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    sortBy === option.value
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 質問リスト */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">まだ質問がありません</h3>
          <p className="text-gray-600 mb-6">最初の質問を投稿してみましょう！</p>
          <Link
            href="/forum/questions/new"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            質問を投稿する
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm divide-y">
          {questions.map((question) => (
          <div key={question.id} className="p-6 hover:bg-gray-50 transition">
            <div className="flex gap-4">
              {/* 統計情報 */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {question.answers[0]?.count || 0}
                  </div>
                  <div className="text-xs text-gray-500">回答</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    {question.likes[0]?.count || 0}
                  </div>
                  <div className="text-xs text-gray-500">いいね</div>
                </div>
              </div>

              {/* 質問内容 */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1">
                      {question.is_admin_question && (
                        <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      {question.priority === 'high' && !question.is_admin_question && (
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <Link
                        href={`/forum/questions/${question.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition line-clamp-2"
                      >
                        {question.title}
                      </Link>
                    </div>
                    
                    <p className="mt-1 text-gray-600 line-clamp-2">
                      {question.content}
                    </p>

                    {/* タグ */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                        {question.category.name}
                      </span>
                      
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          <Hash className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* メタ情報 */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {question.is_anonymous ? '匿名' : question.user.nickname}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(new Date(question.created_at), {
                          addSuffix: true,
                          locale: ja
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {question.view_count}
                      </span>
                    </div>
                  </div>

                  {/* 解決済みバッジ */}
                  {question.is_resolved && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        解決済み
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* ページネーション */}
      <div className="flex justify-center py-8">
        <div className="flex gap-2">
          <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
            前へ
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
            1
          </button>
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            2
          </button>
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            3
          </button>
          <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
            次へ
          </button>
        </div>
      </div>
    </div>
  )
}