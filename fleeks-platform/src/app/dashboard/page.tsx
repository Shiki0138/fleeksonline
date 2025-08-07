'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Play, Clock, Star, LogOut, User, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { Profile, Video } from '@/lib/supabase-client'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkUser()
    fetchVideos()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // プロファイル取得
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
  }

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setVideos(data)
    }
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-pink-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                FLEEKS
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              {profile && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{profile.full_name || profile.username}</p>
                    <p className="text-xs text-gray-400 flex items-center justify-end">
                      {profile.membership_type === 'premium' ? (
                        <>
                          <Crown className="w-3 h-3 mr-1 text-yellow-400" />
                          プレミアム会員
                        </>
                      ) : (
                        '無料会員'
                      )}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <LogOut className="w-5 h-5" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">ダッシュボード</h1>
          <p className="text-gray-300 mb-8">美容スキルを次のレベルへ</p>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeleton
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-xl h-64 animate-pulse"></div>
              ))
            ) : videos.length > 0 ? (
              videos.map((video) => (
                <motion.div
                  key={video.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-800">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                      {formatDuration(video.duration)}
                    </div>
                    {/* Premium Badge */}
                    {video.is_premium && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 rounded-full text-xs font-semibold text-black flex items-center">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </div>
                    )}
                  </div>
                  
                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{video.category}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm">4.9</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">まだ動画がありません</p>
              </div>
            )}
          </div>

          {/* Upgrade CTA for Free Users */}
          {profile?.membership_type === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center"
            >
              <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-3xl font-bold mb-4">プレミアムで全ての動画を視聴</h2>
              <p className="text-lg mb-6 opacity-90">
                無料会員は各動画5分まで。プレミアム会員になって全てのコンテンツをお楽しみください。
              </p>
              <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition">
                プレミアムプランを見る
              </button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}