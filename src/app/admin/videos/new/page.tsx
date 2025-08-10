'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Youtube, Loader2, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

export default function NewVideoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [formData, setFormData] = useState({
    youtube_id: '',
    title: '',
    description: '',
    category: 'Instagram集客',
    duration: 0,
    is_premium: true, // デフォルトでプレミアム動画
    is_public: false // 全員に公開するかどうか
  })

  const categories = [
    'Instagram集客',
    'SNSマーケティング',
    '接客スキル',
    'デジタルマーケティング',
    '経営戦略'
  ]

  const extractYouTubeId = (url: string) => {
    // URLから動画IDを抽出（既にIDの場合はそのまま返す）
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : url
  }

  // YouTube動画情報を取得（タイトルと動画の長さ）
  const fetchVideoInfo = async (videoId: string) => {
    setIsLoadingVideo(true)
    try {
      // まずoEmbed APIでタイトルを取得
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json()
        
        // NoEmbed APIを使用して動画の長さも取得
        const noembedResponse = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        let duration = 0
        
        if (noembedResponse.ok) {
          const noembedData = await noembedResponse.json()
          // duration_msがある場合は秒に変換
          if (noembedData.duration) {
            duration = noembedData.duration // NoEmbedは秒単位で返す
          }
        }
        
        setFormData(prev => ({
          ...prev,
          title: oembedData.title || prev.title,
          duration: duration || 300 // 取得できない場合は5分をデフォルト
        }))
        
        toast.success('動画情報を取得しました')
      } else {
        toast.error('動画情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching video info:', error)
      toast.error('動画情報の取得に失敗しました')
    } finally {
      setIsLoadingVideo(false)
    }
  }

  // YouTube URLまたはIDが変更されたら自動的に情報を取得
  const handleYouTubeInputChange = (value: string) => {
    const videoId = extractYouTubeId(value)
    setFormData({ ...formData, youtube_id: videoId })
    
    // YouTube IDは11文字で、有効な文字のみ含む
    if (videoId && videoId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(videoId)) {
      fetchVideoInfo(videoId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('fleeks_videos')
        .insert({
          youtube_id: formData.youtube_id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          duration: formData.duration,
          is_premium: !formData.is_public // is_publicがfalse（チェックなし）の場合、プレミアム動画
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
                YouTube URL または 動画ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.youtube_id}
                  onChange={(e) => handleYouTubeInputChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=xdHq_H-VF80 または xdHq_H-VF80"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 pr-10"
                  required
                  disabled={isLoadingVideo}
                />
                {isLoadingVideo && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                YouTube URLまたは動画IDを入力すると、タイトルと動画の長さが自動的に取得されます
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
                placeholder={isLoadingVideo ? "動画情報を取得中..." : "動画タイトル（自動取得されます）"}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                required
                readOnly={isLoadingVideo}
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

            {/* 動画の長さは自動取得のため非表示 */}
            <input
              type="hidden"
              value={formData.duration}
            />

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-400"
                />
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">全員に公開</span>
                </div>
              </label>
              <p className="text-xs text-gray-400 mt-2 ml-8">
                チェックを入れると、無料会員も含めて全員がこの動画を視聴できます。<br />
                チェックなしの場合、プレミアム会員限定となります。
              </p>
            </div>

            {formData.duration > 0 && (
              <div className="text-sm text-gray-400">
                動画の長さ: {Math.floor(formData.duration / 60)}分{formData.duration % 60}秒
              </div>
            )}

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={isLoading || isLoadingVideo}
                className="flex-1 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
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