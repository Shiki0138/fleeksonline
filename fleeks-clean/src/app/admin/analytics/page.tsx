'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, TrendingUp, Users, Video, FileText, Eye, Clock, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface Analytics {
  totalUsers: number
  totalVideos: number
  totalBlogs: number
  totalViews: number
  premiumUsers: number
  freeUsers: number
  avgWatchTime: number
  popularVideos: Array<{
    id: string
    title: string
    view_count: number
  }>
  userGrowth: Array<{
    date: string
    count: number
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalVideos: 0,
    totalBlogs: 0,
    totalViews: 0,
    premiumUsers: 0,
    freeUsers: 0,
    avgWatchTime: 0,
    popularVideos: [],
    userGrowth: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      // ユーザー統計
      const { count: totalUsers } = await supabase
        .from('fleeks_profiles')
        .select('*', { count: 'exact', head: true })

      const { count: premiumUsers } = await supabase
        .from('fleeks_profiles')
        .select('*', { count: 'exact', head: true })
        .in('membership_type', ['premium', 'vip'])

      // 動画統計
      const { data: videos, count: totalVideos } = await supabase
        .from('fleeks_videos')
        .select('id, title, view_count', { count: 'exact' })
        .order('view_count', { ascending: false })
        .limit(5)

      // ブログ統計
      const { count: totalBlogs } = await supabase
        .from('fleeks_blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      // 総視聴回数
      const { data: viewData } = await supabase
        .from('fleeks_videos')
        .select('view_count')
      
      const totalViews = viewData?.reduce((sum, video) => sum + (video.view_count || 0), 0) || 0

      // ダミーデータ（実際の実装では期間別のデータを取得）
      const userGrowth = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 5
        }
      })

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalVideos: totalVideos || 0,
        totalBlogs: totalBlogs || 0,
        totalViews,
        premiumUsers: premiumUsers || 0,
        freeUsers: (totalUsers || 0) - (premiumUsers || 0),
        avgWatchTime: 425, // ダミーデータ
        popularVideos: videos || [],
        userGrowth
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>管理画面に戻る</span>
          </button>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-purple-500" />
              アナリティクス
            </h1>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400"
            >
              <option value="7d" className="bg-gray-800">過去7日間</option>
              <option value="30d" className="bg-gray-800">過去30日間</option>
              <option value="90d" className="bg-gray-800">過去90日間</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : (
            <>
              {/* 主要指標 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-green-400" />
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-sm text-gray-400 mb-1">総ユーザー数</h3>
                  <p className="text-3xl font-bold">{formatNumber(analytics.totalUsers)}</p>
                  <p className="text-xs text-green-400 mt-2">+12% from last month</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Video className="w-8 h-8 text-red-400" />
                    <Eye className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-sm text-gray-400 mb-1">総視聴回数</h3>
                  <p className="text-3xl font-bold">{formatNumber(analytics.totalViews)}</p>
                  <p className="text-xs text-red-400 mt-2">+25% from last month</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-sm text-gray-400 mb-1">平均視聴時間</h3>
                  <p className="text-3xl font-bold">{formatTime(analytics.avgWatchTime)}</p>
                  <p className="text-xs text-blue-400 mt-2">+5% from last month</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-sm text-gray-400 mb-1">公開記事数</h3>
                  <p className="text-3xl font-bold">{analytics.totalBlogs}</p>
                  <p className="text-xs text-purple-400 mt-2">+8 this month</p>
                </motion.div>
              </div>

              {/* メンバーシップ分布 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-4">メンバーシップ分布</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">無料会員</span>
                        <span className="text-sm font-medium">{analytics.freeUsers}</span>
                      </div>
                      <div className="bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gray-400 h-2 rounded-full"
                          style={{ width: `${(analytics.freeUsers / analytics.totalUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">プレミアム会員</span>
                        <span className="text-sm font-medium">{analytics.premiumUsers}</span>
                      </div>
                      <div className="bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full"
                          style={{ width: `${(analytics.premiumUsers / analytics.totalUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-4">人気動画 TOP 5</h2>
                  <div className="space-y-3">
                    {analytics.popularVideos.map((video, index) => (
                      <div key={video.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                          <p className="text-sm line-clamp-1">{video.title}</p>
                        </div>
                        <span className="text-sm text-gray-400">{formatNumber(video.view_count)} views</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* ユーザー成長グラフ（簡易版） */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4">ユーザー成長</h2>
                <div className="h-64 flex items-end space-x-2">
                  {analytics.userGrowth.map((data, index) => (
                    <div
                      key={data.date}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-400 hover:to-blue-300 transition-all cursor-pointer group relative"
                      style={{ height: `${(data.count / 15) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {data.count} users
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-gray-400">
                  <span>{analytics.userGrowth[0]?.date}</span>
                  <span>{analytics.userGrowth[analytics.userGrowth.length - 1]?.date}</span>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}