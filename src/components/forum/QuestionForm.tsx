'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Send, 
  X, 
  AlertCircle, 
  Crown, 
  Eye, 
  EyeOff,
  MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'

interface QuestionFormProps {
  user?: any
  profile?: any
}

export default function QuestionForm({ user, profile }: QuestionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    tags: [] as string[],
    is_anonymous: false,
    is_admin_question: false
  })

  const categories = [
    { id: '1', name: '管理者への質問', description: '運営者への直接質問（管理者が優先対応）', isAdmin: true },
    { id: '2', name: 'インスタ集客', description: 'Instagram集客の戦略とテクニック' },
    { id: '3', name: '経営戦略', description: 'ビジネス戦略と成長戦術' },
    { id: '4', name: '生成AI活用', description: 'ChatGPTやAIツールの活用方法' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      toast.error('すべての必須項目を入力してください')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/forum/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create question')
      }

      toast.success('質問を投稿しました！')
      router.push('/forum')
    } catch (error: any) {
      console.error('Error creating question:', error)
      if (error.message.includes('Premium membership required')) {
        toast.error('フォーラムへの投稿には有料会員登録が必要です')
      } else {
        toast.error('質問の投稿に失敗しました: ' + error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white px-8 py-6">
            <h1 className="text-2xl font-bold mb-2">新しい質問を投稿</h1>
            <p className="text-purple-100">
              運営チームに質問して、ビジネス成長のアドバイスをもらおう
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                質問タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="具体的で分かりやすいタイトルをつけてください"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={200}
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.title.length}/200文字
              </div>
            </div>

            {/* カテゴリー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`relative cursor-pointer p-4 border rounded-lg transition ${
                      formData.category_id === category.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={formData.category_id === category.id}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        category_id: e.target.value,
                        is_admin_question: category.isAdmin || false
                      }))}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      {category.isAdmin && <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 管理者質問の説明 */}
            {formData.is_admin_question && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">管理者への質問</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      この質問は管理者が優先的に対応します。プラットフォームの使い方や技術的なサポートが必要な場合にご利用ください。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 質問内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                質問内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="できるだけ詳しく状況を説明してください。具体的な情報があると、より良い回答が期待できます。"
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                required
              />
            </div>


            {/* オプション */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">投稿オプション</h3>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                  className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    {formData.is_anonymous ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium">匿名で投稿</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    チェックすると、あなたの名前の代わりに「匿名ユーザー」と表示されます
                  </p>
                </div>
              </label>
            </div>

            {/* 送信ボタン */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    投稿中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    質問を投稿
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}