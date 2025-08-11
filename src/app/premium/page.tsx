'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Target, Play, Clock, Star, LogOut, User, Crown, Edit, Plus, FileText, Youtube, Settings, CheckCircle, GraduationCap, BookOpen, ArrowLeft, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { Profile, Video, EducationContent, EducationChapter } from '@/lib/supabase-client'

// ブログ記事の型定義
interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  tags: string[]
  published_at: string
  thumbnail_url?: string
}

export default function PremiumPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [educationContents, setEducationContents] = useState<EducationContent[]>([])
  const [educationChapters, setEducationChapters] = useState<EducationChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'videos' | 'blog' | 'education'>('videos')
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUser()
    fetchVideos()
    fetchBlogPosts()
    fetchEducationContents()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchWatchHistory()
    }
  }, [profile])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // プロファイル取得
    const { data: profileData, error: profileError } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 管理者権限チェック
    const isAdminEmail = user.email === 'greenroom51@gmail.com'
    
    if (profileData) {
      setProfile(profileData)
      const isAdminUser = profileData.role === 'admin' || isAdminEmail
      setIsAdmin(isAdminUser)
    } else {
      if (isAdminEmail) {
        setIsAdmin(true)
        // 管理者の場合は仮のプロファイルを設定
        setProfile({
          id: user.id,
          username: 'admin',
          full_name: 'Administrator',
          role: 'admin',
          membership_type: 'vip',
          trial_ends_at: null,
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        })
      }
    }
    setIsLoading(false)
  }

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('fleeks_videos')
      .select('*')
      .order('published_at', { ascending: false })

    if (!error && data) {
      setVideos(data)
    }
  }

  const fetchBlogPosts = async () => {
    const { data, error } = await supabase
      .from('fleeks_blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6)

    if (!error && data) {
      setBlogPosts(data)
    }
  }

  const fetchEducationContents = async () => {
    const { data: contents, error: contentsError } = await supabase
      .from('fleeks_education_contents')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (!contentsError && contents) {
      setEducationContents(contents)

      const contentIds = contents.map(c => c.id)
      const { data: chapters } = await supabase
        .from('fleeks_education_chapters')
        .select('*')
        .in('content_id', contentIds)
        .order('order_index', { ascending: true })

      if (chapters) {
        setEducationChapters(chapters)
      }
    }
  }

  const fetchWatchHistory = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from('fleeks_watch_history')
      .select('video_id')
      .eq('user_id', profile.id)

    if (!error && data) {
      setWatchedVideos(new Set(data.map(item => item.video_id)))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navigateToVideo = (videoId: string) => {
    router.push(`/videos/${videoId}`)
  }

  const navigateToBlog = (postId: string) => {
    router.push(`/blog/${postId}`)
  }

  const navigateToEducation = (contentId: string) => {
    router.push(`/education/${contentId}`)
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getContentChapters = (contentId: string) => {
    return educationChapters.filter(chapter => chapter.content_id === contentId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                FLEEKS プレミアム
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition text-white"
                >
                  <Shield className="w-5 h-5" />
                  <span>管理画面へ</span>
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <Target className="w-5 h-5" />
                <span>ダッシュボード</span>
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {profile?.full_name || profile?.username || 'ユーザー'}
                </p>
                <p className="text-xs text-yellow-400">プレミアム会員</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">プレミアムコンテンツ</h1>
          <p className="text-gray-300">すべての動画とコンテンツに無制限でアクセスできます</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-1">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition ${
              activeTab === 'videos'
                ? 'bg-white text-purple-900'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Youtube className="w-5 h-5 inline-block mr-2" />
            動画
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition ${
              activeTab === 'education'
                ? 'bg-white text-purple-900'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-5 h-5 inline-block mr-2" />
            教育コンテンツ
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition ${
              activeTab === 'blog'
                ? 'bg-white text-purple-900'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-5 h-5 inline-block mr-2" />
            ブログ
          </button>
        </div>

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateToVideo(video.id)}
                className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition cursor-pointer group"
              >
                <div className="relative aspect-video bg-black/20">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                  {video.is_premium && (
                    <div className="absolute top-2 right-2">
                      <Crown className="w-5 h-5 text-yellow-400" />
                    </div>
                  )}
                  {watchedVideos.has(video.id) && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 group-hover:text-yellow-300 transition">
                    {video.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(video.published_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {educationContents.map((content) => {
              const chapters = getContentChapters(content.id)
              return (
                <motion.div
                  key={content.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigateToEducation(content.id)}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{content.title}</h3>
                      <p className="text-gray-300 text-sm mb-4">{content.description}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-yellow-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">
                      {chapters.length} チャプター
                    </div>
                    <div className="text-sm text-gray-400">
                      難易度: <span className="text-yellow-400">{content.difficulty}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigateToBlog(post.id)}
                className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition cursor-pointer"
              >
                {post.thumbnail_url && (
                  <img 
                    src={post.thumbnail_url} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="text-xs text-yellow-400 mb-2">{post.category}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{post.author}</span>
                    <span>{new Date(post.published_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}