'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Smile, 
  TrendingUp, 
  Scissors, 
  Beaker, 
  Briefcase, 
  MessageCircle,
  Hash
} from 'lucide-react'

const iconMap: { [key: string]: any } = {
  'smile': Smile,
  'trending-up': TrendingUp,
  'scissors': Scissors,
  'beaker': Beaker,
  'briefcase': Briefcase,
  'message-circle': MessageCircle,
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  postCount?: number
}

const defaultCategories: Category[] = [
  {
    id: '1',
    name: '接客・サービス',
    slug: 'customer-service',
    description: 'お客様対応について',
    icon: 'smile',
    postCount: 234
  },
  {
    id: '2',
    name: '経営・マーケティング',
    slug: 'business-marketing',
    description: '美容室経営について',
    icon: 'trending-up',
    postCount: 189
  },
  {
    id: '3',
    name: '技術相談',
    slug: 'technical-advice',
    description: '技術的な相談',
    icon: 'scissors',
    postCount: 312
  },
  {
    id: '4',
    name: '商品・薬剤',
    slug: 'products-chemicals',
    description: '商品情報交換',
    icon: 'beaker',
    postCount: 156
  },
  {
    id: '5',
    name: 'キャリア・転職',
    slug: 'career-job',
    description: 'キャリア相談',
    icon: 'briefcase',
    postCount: 98
  },
  {
    id: '6',
    name: 'その他・雑談',
    slug: 'others-chat',
    description: 'その他の話題',
    icon: 'message-circle',
    postCount: 245
  }
]

const popularTags = [
  { name: 'カラー', count: 89 },
  { name: 'パーマ', count: 67 },
  { name: '接客', count: 54 },
  { name: '集客', count: 48 },
  { name: '独立', count: 42 },
  { name: 'SNS', count: 38 },
  { name: '料金', count: 35 },
  { name: '教育', count: 31 },
]

export default function ForumCategories() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  )
  const [selectedTag, setSelectedTag] = useState<string | null>(
    searchParams.get('tag')
  )

  const handleCategorySelect = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    params.delete('tag') // カテゴリー選択時はタグをリセット
    router.push(`/forum?${params.toString()}`)
    setSelectedCategory(slug)
    setSelectedTag(null)
  }

  const handleTagSelect = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tag', tag)
    params.delete('category') // タグ選択時はカテゴリーをリセット
    router.push(`/forum?${params.toString()}`)
    setSelectedTag(tag)
    setSelectedCategory(null)
  }

  return (
    <div className="space-y-6">
      {/* カテゴリー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">カテゴリー</h2>
        
        <div className="space-y-2">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              !selectedCategory 
                ? 'bg-purple-50 text-purple-700 font-medium' 
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            すべての質問
          </button>
          
          {defaultCategories.map((category) => {
            const Icon = iconMap[category.icon] || MessageCircle
            const isSelected = selectedCategory === category.slug
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.slug)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  isSelected 
                    ? 'bg-purple-50 text-purple-700 font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {category.postCount}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 人気のタグ */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">人気のタグ</h2>
        
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => handleTagSelect(tag.name)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
                selectedTag === tag.name
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Hash className="w-3 h-3" />
              {tag.name}
              <span className="text-xs text-gray-500">({tag.count})</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* 質問するボタン（モバイル用） */}
      <div className="lg:hidden">
        <Link
          href="/forum/questions/new"
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          質問する
        </Link>
      </div>
    </div>
  )
}