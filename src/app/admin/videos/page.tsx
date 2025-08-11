'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Video, Plus, Edit, Trash2, Play, Crown, Eye, Calendar, Clock } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

interface VideoData {
  id: string
  title: string
  description: string
  youtube_id: string
  video_url?: string
  duration: number
  thumbnail_url?: string
  is_premium: boolean
  status: 'draft' | 'published' | 'archived'
  category: string
  tags?: string[]
  published_at?: string
  created_at: string
  updated_at: string
  view_count?: number
}

export default function AdminVideosPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [videos, setVideos] = useState<VideoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'premium'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [filter])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if admin by email
      if (user.email === 'greenroom51@gmail.com') {
        return
      }

      // Check profile for admin role
      const { data: profileData } = await supabase
        .from('fleeks_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('管理者アクセスチェックエラー:', error)
      router.push('/login')
    }
  }

  const fetchVideos = async () => {
    try {
      let query = supabase
        .from('fleeks_videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter === 'published') {
        query = query.eq('status', 'published')
      } else if (filter === 'draft') {
        query = query.eq('status', 'draft')
      } else if (filter === 'premium') {
        query = query.eq('is_premium', true)
      }

      const { data, error } = await query

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
      toast.error('動画の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この動画を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('fleeks_videos')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('動画を削除しました')
      fetchVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error('動画の削除に失敗しました')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">公開中</span>
      case 'draft':
        return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">下書き</span>
      case 'archived':
        return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs">アーカイブ</span>
      default:
        return null
    }
  }

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>管理画面に戻る</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white flex items-center">
              <Video className="w-10 h-10 mr-3 text-blue-400" />
              動画管理
            </h1>
            <Link
              href="/admin/videos/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>新規動画を追加</span>
            </Link>
          </div>
        </div>

        {/* 検索とフィルター */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="タイトル、説明、カテゴリで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-gray-400"
          />

          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'published' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
              }`}
            >
              公開中
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'draft' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
              }`}
            >
              下書き
            </button>
            <button
              onClick={() => setFilter('premium')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'premium' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
              }`}
            >
              プレミアム
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm text-gray-400 mb-1">総動画数</h3>
            <p className="text-2xl font-bold text-white">{videos.length}</p>
          </motion.div>
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm text-gray-400 mb-1">公開中</h3>
            <p className="text-2xl font-bold text-white">
              {videos.filter(v => v.status === 'published').length}
            </p>
          </motion.div>
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm text-gray-400 mb-1">プレミアム動画</h3>
            <p className="text-2xl font-bold text-white">
              {videos.filter(v => v.is_premium).length}
            </p>
          </motion.div>
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm text-gray-400 mb-1">総視聴回数</h3>
            <p className="text-2xl font-bold text-white">
              {videos.reduce((sum, v) => sum + (v.view_count || 0), 0).toLocaleString()}
            </p>
          </motion.div>
        </div>

        {/* 動画一覧 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-300">動画が見つかりません</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-black/20 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    動画
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    視聴回数
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    公開日
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-24 h-14 bg-black/40 rounded overflow-hidden flex-shrink-0">
                          {video.youtube_id ? (
                            <img
                              src={`https://img.youtube.com/vi/${video.youtube_id}/default.jpg`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 bg-black text-white text-xs px-1">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-white">{video.title}</p>
                          <p className="text-sm text-gray-400">{video.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(video.status)}
                    </td>
                    <td className="px-6 py-4">
                      {video.is_premium ? (
                        <span className="flex items-center text-purple-400">
                          <Crown className="w-4 h-4 mr-1" />
                          プレミアム
                        </span>
                      ) : (
                        <span className="text-gray-400">無料</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center text-gray-300">
                        <Eye className="w-4 h-4 mr-1" />
                        {(video.view_count || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {video.published_at ? (
                        <span className="flex items-center text-gray-300 text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(video.published_at)}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/videos/${video.id}/edit`}
                          className="text-blue-400 hover:text-blue-300 transition"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}