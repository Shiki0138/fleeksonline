'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  MessageSquare, 
  Search, 
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Question {
  id: string
  title: string
  content: string
  category_id: string
  is_anonymous: boolean
  is_resolved: boolean
  has_admin_answer: boolean
  view_count: number
  created_at: string
  updated_at: string
  user: {
    nickname: string
    membership_type: string
  }
  category: {
    name: string
    icon: string
  }
  answers: any[]
}

export default function AdminForumPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all')
  const [showAll, setShowAll] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })

  useEffect(() => {
    fetchQuestions()
  }, [showAll])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/forum/questions?showAll=${showAll}`)
      const data = await response.json()
      
      if (response.ok) {
        setQuestions(data.questions || [])
      } else {
        toast.error('質問の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question.id)
    setEditForm({
      title: question.title,
      content: question.content
    })
  }

  const handleSaveEdit = async (questionId: string) => {
    try {
      const response = await fetch(`/api/forum/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        toast.success('質問を更新しました')
        setEditingQuestion(null)
        fetchQuestions()
      } else {
        toast.error('更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('エラーが発生しました')
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm('この質問を削除してもよろしいですか？')) return

    try {
      const response = await fetch(`/api/forum/questions/${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('質問を削除しました')
        fetchQuestions()
      } else {
        toast.error('削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('エラーが発生しました')
    }
  }

  const handleResolve = async (questionId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/forum/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_resolved: resolved })
      })

      if (response.ok) {
        toast.success(resolved ? '解決済みにしました' : '未解決に戻しました')
        fetchQuestions()
      } else {
        toast.error('更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('エラーが発生しました')
    }
  }

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' ||
                         (filter === 'answered' && q.has_admin_answer) ||
                         (filter === 'unanswered' && !q.has_admin_answer)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-purple-400" />
                フォーラム管理
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="rounded"
                />
                <span>すべての質問を表示</span>
              </label>
            </div>
          </div>

          {/* 検索とフィルター */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="質問を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'all' 
                    ? 'bg-purple-600' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilter('answered')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'answered' 
                    ? 'bg-purple-600' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                返信済み
              </button>
              <button
                onClick={() => setFilter('unanswered')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'unanswered' 
                    ? 'bg-purple-600' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                未返信
              </button>
            </div>
          </div>

          {/* 統計 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">総質問数</h3>
              <p className="text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">返信済み</h3>
              <p className="text-2xl font-bold">
                {questions.filter(q => q.has_admin_answer).length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">未返信</h3>
              <p className="text-2xl font-bold">
                {questions.filter(q => !q.has_admin_answer).length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">解決済み</h3>
              <p className="text-2xl font-bold">
                {questions.filter(q => q.is_resolved).length}
              </p>
            </div>
          </div>

          {/* 質問リスト */}
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
              >
                {editingQuestion === question.id ? (
                  // 編集モード
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400"
                    />
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(question.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingQuestion(null)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{question.title}</h3>
                        <p className="text-gray-300 line-clamp-3">{question.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {question.has_admin_answer ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            返信済み
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400 text-sm">
                            <Clock className="w-4 h-4" />
                            未返信
                          </span>
                        )}
                        {question.is_resolved && (
                          <span className="flex items-center gap-1 text-blue-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            解決済み
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{question.category.name}</span>
                        <span>投稿者: {question.is_anonymous ? '匿名' : question.user.nickname}</span>
                        <span>閲覧数: {question.view_count}</span>
                        <span>{new Date(question.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/forum/questions/${question.id}`)}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                          title="詳細を見る"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(question)}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                          title="編集"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResolve(question.id, !question.is_resolved)}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                          title={question.is_resolved ? '未解決に戻す' : '解決済みにする'}
                        >
                          {question.is_resolved ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition text-red-400"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}