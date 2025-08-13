import { Metadata } from 'next'
import ForumQuestionList from '@/components/forum/ForumQuestionList'
import ForumCategories from '@/components/forum/ForumCategories'
import ForumHeader from '@/components/forum/ForumHeader'

export const metadata: Metadata = {
  title: 'フォーラム | FLEEKS',
  description: '美容師同士で質問・回答し合うコミュニティフォーラム',
}

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ForumHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* サイドバー */}
          <div className="lg:col-span-1">
            <ForumCategories />
          </div>
          
          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            <ForumQuestionList />
          </div>
        </div>
      </div>
    </div>
  )
}