'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Target, ArrowLeft, Calendar, Clock, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import VideoPlayer from '@/components/VideoPlayer'
import type { Profile, Video } from '@/lib/supabase-client'

export default function VideoPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = params.id as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [video, setVideo] = useState<Video | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkUser()
    fetchVideo()
  }, [videoId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profileData } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
  }

  const fetchVideo = async () => {
    // 動画情報を取得
    const { data: videoData, error: videoError } = await supabase
      .from('fleeks_videos')
      .select('*')
      .eq('id', videoId)
      .single()

    console.log('Video fetch result:', { videoData, videoError })

    if (videoError) {
      console.error('Error fetching video:', videoError)
      setIsLoading(false)
      return
    }

    if (!videoData) {
      console.error('No video found with ID:', videoId)
      setIsLoading(false)
      return
    }

    setVideo(videoData)
    
    // 動画が公開設定でない場合、プレミアム会員のみアクセス可能かチェック
    if (videoData.is_premium && profile?.membership_type === 'free') {
      // is_premiumがtrueなら、プレミアム会員限定
      // ただし、VideoPlayerコンポーネントで5分制限があるので、ここでは制限しない
    }
    
    // 視聴履歴を記録または更新
    if (profile) {
      try {
        await supabase.from('fleeks_watch_history').upsert({
          user_id: profile.id,
          video_id: videoData.id,
          watched_seconds: 0,
          last_position: 0,
          completed: false,
          last_watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        })
      } catch (historyError) {
        // watch_historyテーブルが存在しない場合は無視
        console.log('Watch history logging skipped:', historyError)
      }
    }

    // 関連動画を取得
    const { data: relatedData } = await supabase
      .from('fleeks_videos')
      .select('*')
      .eq('category', videoData.category)
      .neq('id', videoData.id)
      .limit(5)
      .order('published_at', { ascending: false })

    if (relatedData) {
      setRelatedVideos(relatedData)
    }

    setIsLoading(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="animate-pulse">読み込み中...</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-2">動画が見つかりません</p>
          <button onClick={() => router.push('/dashboard')} className="text-blue-400 hover:underline">
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>ダッシュボードに戻る</span>
              </button>
              <div className="flex items-center space-x-2">
                <Target className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  FLEEKS
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {video.youtube_id ? (
                <VideoPlayer
                  videoId={video.youtube_id}
                  title={video.title}
                  isPremium={video.is_premium}
                  userMembershipType={profile?.membership_type || 'free'}
                  userId={profile?.id}
                />
              ) : (
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl mb-2">動画が利用できません</p>
                    <p className="text-sm text-gray-400">YouTube IDが設定されていません</p>
                  </div>
                </div>
              )}

              {/* Video Details */}
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(video.published_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>{video.view_count} 回視聴</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                    {video.category}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2">動画の説明</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{video.description}</p>
              </div>
            </motion.div>
          </div>

          {/* Related Videos */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4">関連動画</h3>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <div
                    key={relatedVideo.id}
                    onClick={() => router.push(`/videos/${relatedVideo.id}`)}
                    className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/15 transition cursor-pointer"
                  >
                    <div className="flex space-x-3 p-3">
                      <div className="relative w-32 h-20 bg-gray-800 rounded flex-shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${relatedVideo.youtube_id}/mqdefault.jpg`}
                          alt={relatedVideo.title}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-xs">
                          {formatDuration(relatedVideo.duration)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {relatedVideo.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {relatedVideo.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}