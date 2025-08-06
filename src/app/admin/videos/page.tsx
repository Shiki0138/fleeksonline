'use client'

import { useState } from 'react'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function AdminVideosPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    youtube_id: '',
    category: '',
    tags: '',
    is_premium: true,
    preview_seconds: 300
  })

  // 管理者チェック（簡易的 - 本番では適切な権限管理を実装）
  const isAdmin = user?.email === 'leadfive.138@gmail.com'

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-morphism p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
          <p className="text-white/60">管理者としてログインしてください</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // YouTube URLからIDを抽出
      let youtubeId = videoData.youtube_id
      const youtubeUrlMatch = youtubeId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
      if (youtubeUrlMatch) {
        youtubeId = youtubeUrlMatch[1]
      }

      // タグを配列に変換
      const tags = videoData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)

      // サムネイル URL を生成
      const thumbnail_url = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`

      // データベースに保存
      const { data, error } = await supabase
        .from('beauty_videos')
        .insert({
          title: videoData.title,
          description: videoData.description,
          youtube_id: youtubeId,
          category: videoData.category,
          tags: tags,
          is_premium: videoData.is_premium,
          preview_seconds: videoData.preview_seconds,
          thumbnail_url: thumbnail_url,
          view_count: 0
        })
        .select()

      if (error) {
        throw error
      }

      toast.success('動画を追加しました！')
      
      // フォームをリセット
      setVideoData({
        title: '',
        description: '',
        youtube_id: '',
        category: '',
        tags: '',
        is_premium: true,
        preview_seconds: 300
      })

    } catch (error: any) {
      console.error('Error adding video:', error)
      toast.error('動画の追加に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism p-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-8">動画管理</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">タイトル *</label>
              <input
                type="text"
                required
                value={videoData.title}
                onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                className="input-field w-full"
                placeholder="例: 美容師のためのSNS集客入門"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">説明</label>
              <textarea
                value={videoData.description}
                onChange={(e) => setVideoData({ ...videoData, description: e.target.value })}
                className="input-field w-full h-24"
                placeholder="動画の内容を詳しく説明してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">YouTube URL または ID *</label>
              <input
                type="text"
                required
                value={videoData.youtube_id}
                onChange={(e) => setVideoData({ ...videoData, youtube_id: e.target.value })}
                className="input-field w-full"
                placeholder="https://youtu.be/xxxxx または xxxxx"
              />
              <p className="text-xs text-white/60 mt-1">限定公開のURLをそのまま貼り付けてください</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">カテゴリー</label>
                <select
                  value={videoData.category}
                  onChange={(e) => setVideoData({ ...videoData, category: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">選択してください</option>
                  <option value="マーケティング">マーケティング</option>
                  <option value="技術">技術</option>
                  <option value="経営">経営</option>
                  <option value="トレンド">トレンド</option>
                  <option value="テクノロジー">テクノロジー</option>
                  <option value="健康・ケア">健康・ケア</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">プレビュー時間（秒）</label>
                <input
                  type="number"
                  value={videoData.preview_seconds}
                  onChange={(e) => setVideoData({ ...videoData, preview_seconds: parseInt(e.target.value) })}
                  className="input-field w-full"
                  min="0"
                  max="600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">タグ（カンマ区切り）</label>
              <input
                type="text"
                value={videoData.tags}
                onChange={(e) => setVideoData({ ...videoData, tags: e.target.value })}
                className="input-field w-full"
                placeholder="SNS, Instagram, 集客, マーケティング"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={videoData.is_premium}
                  onChange={(e) => setVideoData({ ...videoData, is_premium: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span>有料会員限定</span>
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? '追加中...' : '動画を追加'}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 glass-morphism p-6"
        >
          <h2 className="text-xl font-semibold mb-4">使い方</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>YouTubeで動画を「限定公開」に設定</li>
            <li>動画のURLをコピー</li>
            <li>上のフォームに情報を入力</li>
            <li>「動画を追加」をクリック</li>
          </ol>
          <div className="mt-4 p-4 bg-purple-600/20 rounded-lg">
            <p className="text-sm">
              💡 <strong>ヒント</strong>: 限定公開動画は URLを知っている人だけが視聴できます。
              プラットフォーム上では認証されたユーザーのみがアクセス可能です。
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}