'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Youtube } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

export default function NewVideoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    youtube_id: '',
    title: '',
    description: '',
    category: 'Instagram集客',
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

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('videos')
        .insert({
          youtube_id: extractYouTubeId(formData.youtube_id),
          title: formData.title,
          description: formData.description,
          category: formData.category,
          duration: parseInt(formData.duration),
          is_premium: formData.is_premium
        })

      if (error) throw error

      toast.success('動画を追加しました')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error adding video:', error)
      toast.error('動画の追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
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

          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <Youtube className="w-8 h-8 mr-3 text-red-500" />
            新規動画を追加
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                YouTube URL または動画ID *
              </label>
              <input
                type="text"
                value={formData.youtube_id}
                onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=xdHq_H-VF80"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                YouTube URLまたは動画IDを入力してください
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                タイトル *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Instagram集客の基礎：フォロワーを増やす5つの戦略"
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
                placeholder="動画の説明を入力してください"
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
                placeholder="1200"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                例: 20分 = 1200秒
              </p>
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
              <p className="text-xs text-gray-400 mt-1 ml-8">
                無料会員は5分までしか視聴できません
              </p>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{isLoading ? '保存中...' : '動画を追加'}</span>
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