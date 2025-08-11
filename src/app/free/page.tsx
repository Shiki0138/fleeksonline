'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Target, Play, Clock, Star, LogOut, User, Crown, Lock, FileText, Youtube, Settings, CheckCircle, GraduationCap, BookOpen, ArrowLeft, Shield } from 'lucide-react'
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

export default function FreePage() {
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
    console.log('[Free Page] Component mounted')
    console.log('[Free Page] Current pathname:', window.location.pathname)
    const initializePage = async () => {
      await checkUser()
      // ユーザーチェック後にデータを取得
      await fetchVideos()
      await fetchBlogPosts()
      // 教育コンテンツの取得を一時的に無効化
      // await fetchEducationContents()
      console.log('[Free Page] Skipping education contents fetch')
    }
    initializePage()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchWatchHistory()
    }
  }, [profile])

  const checkUser = async () => {
    console.log('[Free Page] Checking user...')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('[Free Page] No user found, redirecting to login')
      router.push('/login')
      return
    }

    console.log('[Free Page] User found:', user.email)

    // プロファイル取得
    const { data: profileData, error: profileError } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('[Free Page] Profile data:', profileData)
    console.log('[Free Page] Profile error:', profileError)

    // 管理者権限チェック
    const isAdminEmail = user.email === 'greenroom51@gmail.com'
    
    if (profileData) {
      setProfile(profileData)
      const isAdminUser = profileData.role === 'admin' || isAdminEmail
      setIsAdmin(isAdminUser)
      console.log('[Free Page] Is admin:', isAdminUser)
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
        console.log('[Free Page] Admin profile set')
      }
    }
    setIsLoading(false)
    console.log('[Free Page] User check complete, no redirect triggered')
  }

  const fetchVideos = async () => {
    // 無料会員は無料動画のみ表示
    const { data, error } = await supabase
      .from('fleeks_videos')
      .select('*')
      .eq('is_premium', false)
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
    try {
      // 無料会員は基礎レベルのコンテンツのみ
      const { data: contents, error: contentsError } = await supabase
        .from('fleeks_education_contents')
        .select('*')
        .eq('is_published', true)
        .eq('difficulty', '基礎')
        .order('display_order', { ascending: true })

      if (contentsError) {
        console.log('[Free Page] Education contents error:', contentsError)
        // テーブルが存在しない場合は空配列を設定
        setEducationContents([])
        setEducationChapters([])
        return
      }

      if (contents && contents.length > 0) {
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
      } else {
        setEducationContents([])
        setEducationChapters([])
      }
    } catch (error) {
      console.error('[Free Page] Error fetching education contents:', error)
      setEducationContents([])
      setEducationChapters([])
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="w-8 h-8 text-gray-600" />
              <span className="text-2xl font-bold text-gray-800">
                FLEEKS 無料会員
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
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <Target className="w-5 h-5" />
                <span>ダッシュボード</span>
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {profile?.full_name || profile?.username || 'ユーザー'}
                </p>
                <p className="text-xs text-gray-600">無料会員</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Upgrade Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">すべてのコンテンツにアクセスしたい方へ</p>
              <p className="text-sm opacity-90">プレミアム会員になると、すべての動画を無制限で視聴できます</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              <Crown className="w-4 h-4 inline mr-2" />
              アップグレード
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">無料コンテンツ</h1>
          <p className="text-gray-600">動画は5分間まで視聴可能です</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition ${
              activeTab === 'videos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Youtube className="w-5 h-5 inline-block mr-2" />
            動画
          </button>
          {/* 教育コンテンツタブを一時的に非表示
          <button
            onClick={() => setActiveTab('education')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition ${
              activeTab === 'education'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="w-5 h-5 inline-block mr-2" />
            教育コンテンツ
          </button>
          */}
          <button
            onClick={() => setActiveTab('blog')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition ${
              activeTab === 'blog'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
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
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer group"
              >
                <div className="relative aspect-video bg-gray-200">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    5分まで
                  </div>
                  {watchedVideos.has(video.id) && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition">
                    {video.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{content.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{content.description}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                      {chapters.length} チャプター
                    </div>
                    <div className="text-sm text-gray-500">
                      難易度: <span className="text-green-600">基礎</span>
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
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
              >
                {post.thumbnail_url && (
                  <img 
                    src={post.thumbnail_url} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="text-xs text-purple-600 mb-2">{post.category}</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
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