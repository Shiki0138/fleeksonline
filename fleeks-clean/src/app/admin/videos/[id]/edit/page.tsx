'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Trash2, Youtube } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'
import type { Video } from '@/lib/supabase-client'

export default function EditVideoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [video, setVideo] = useState<Video | null>(null)
  const [formData, setFormData] = useState({
    youtube_id: '',
    title: '',
    description: '',
    category: '',
    duration: '',
    is_premium: false
  })

  const categories = [
    'Instagram集客',
    'SNSマーケティング',
    '接客スキル',
    'デジタルマーケティング',
    '経営戦略'
  ]

  useEffect(() => {
    fetchVideo()
  }, [params.id])

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('fleeks_videos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      if (data) {
        setVideo(data)
        setFormData({
          youtube_id: data.youtube_id,
          title: data.title,
          description: data.description || '',
          category: data.category || 'Instagram集客',
          duration: data.duration.toString(),
          is_premium: data.is_premium
        })
      }
    } catch (error) {
      console.error('Error fetching video:', error)
      toast.error('動画の読み込みに失敗しました')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('fleeks_videos')
        .update({
          youtube_id: formData.youtube_id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          duration: parseInt(formData.duration),
          is_premium: formData.is_premium,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success('動画を更新しました')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating video:', error)
      toast.error('動画の更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この動画を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('fleeks_videos')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast.success('動画を削除しました')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error('動画の削除に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </button>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center">
              <Youtube className="w-8 h-8 mr-3 text-red-500" />
              動画を編集
            </h1>
            <button
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 flex items-center space-x-2 transition"
            >
              <Trash2 className="w-5 h-5" />
              <span>削除</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                YouTube動画ID
              </label>
              <input
                type="text"
                value={formData.youtube_id}
                onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                タイトル *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                カテゴリー *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-800">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                動画の長さ（秒） *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span>プレミアム動画として設定</span>
              </label>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{isSaving ? '保存中...' : '変更を保存'}</span>
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition"
              >
                キャンセル
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}