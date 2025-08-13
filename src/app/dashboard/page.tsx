'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Target, Play, Clock, Star, LogOut, User, Crown, Edit, Plus, FileText, Youtube, Settings, CheckCircle, GraduationCap, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'
import type { Profile, Video, EducationContent, EducationChapter } from '@/lib/supabase-browser'
// import PasswordChangePrompt from '@/components/PasswordChangePrompt' // Temporarily removed

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

export default function DashboardPage() {
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
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

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

    // Check if user needs to change initial password
    if (user.user_metadata?.initial_password === true) {
      setShowPasswordPrompt(true)
    }

    // プロファイル取得
    const { data: profileData, error: profileError } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('Dashboard - User:', user.email, 'ID:', user.id)
    console.log('Dashboard - Profile:', profileData)
    console.log('Dashboard - Profile Error:', profileError)

    // プロファイルの有無に関わらず、メールアドレスで管理者チェック
    const isAdminEmail = user.email === 'greenroom51@gmail.com'
    
    if (profileData) {
      setProfile(profileData)
      // 管理者権限チェック
      const isAdminUser = profileData.role === 'admin' || isAdminEmail
      console.log('Dashboard - Is Admin:', isAdminUser, 'Role:', profileData.role, 'Email:', user.email)
      setIsAdmin(isAdminUser)
      
      // 管理者の自動リダイレクトを削除 - 管理者もダッシュボードを見られるように
    } else {
      // プロファイルがない場合でも管理者フラグを設定
      if (isAdminEmail) {
        setIsAdmin(true)
      }
    }
  }

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('fleeks_videos')
      .select('*')
      .order('published_at', { ascending: false }) // published_atで新しい順に並び替え

    if (!error && data) {
      setVideos(data)
    }
    setIsLoading(false)
  }

  const fetchWatchHistory = async () => {
    if (!profile) return
    
    const { data, error } = await supabase
      .from('fleeks_watch_history')
      .select('video_id')
      .eq('user_id', profile.id)
    
    if (!error && data) {
      const watched = new Set(data.map(item => item.video_id))
      setWatchedVideos(watched)
    }
  }

  const fetchBlogPosts = async () => {
    // 仮のブログデータ（後でSupabaseから取得）
    const mockPosts: BlogPost[] = [
      {
        id: '1',
        title: 'Instagram集客の極意：エンゲージメント率を3倍にする方法',
        content: '',
        excerpt: 'Instagramでの集客を成功させるには、単にフォロワー数を増やすだけでなく、質の高いエンゲージメントを獲得することが重要です...',
        author: 'FLEEKS編集部',
        category: 'Instagram集客',
        tags: ['SNS', 'マーケティング', '集客'],
        published_at: '2025-08-01',
        thumbnail_url: '/blog/instagram-tips.jpg'
      },
      {
        id: '2',
        title: '顧客心理を理解する：リピート率を上げる接客テクニック',
        content: '',
        excerpt: '顧客がリピーターになるかどうかは、初回の接客体験で大きく左右されます。心理学的アプローチを活用した接客方法を解説します...',
        author: 'FLEEKS編集部',
        category: '接客スキル',
        tags: ['心理学', '接客', 'カスタマーサービス'],
        published_at: '2025-07-28',
        thumbnail_url: '/blog/customer-psychology.jpg'
      }
    ]
    setBlogPosts(mockPosts)
  }

  const fetchEducationContents = async () => {
    // 教育コンテンツはまだ準備中なので、空の配列を設定
    setEducationChapters([])
    setEducationContents([])
    
    // TODO: 将来的にはSupabaseから取得
    // 現在は/educationページで静的に表示
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

  const handleAdminAction = (action: string, id?: string) => {
    switch (action) {
      case 'add-video':
        router.push('/admin/videos/new')
        break
      case 'edit-video':
        router.push(`/admin/videos/${id}/edit`)
        break
      case 'add-blog':
        router.push('/admin/blog/new')
        break
      case 'edit-blog':
        router.push(`/admin/blog/${id}/edit`)
        break
      case 'settings':
        router.push('/admin/settings')
        break
      case 'add-education':
        router.push('/admin/education/new')
        break
      case 'edit-education':
        router.push(`/admin/education/${id}/edit`)
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                FLEEKS
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
                >
                  <Settings className="w-5 h-5" />
                  <span>管理画面</span>
                </button>
              )}
              {profile && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{profile.full_name || profile.username}</p>
                    <p className="text-xs text-gray-400 flex items-center justify-end">
                      {isAdmin ? (
                        <>
                          <Crown className="w-3 h-3 mr-1 text-red-400" />
                          管理者
                        </>
                      ) : profile.membership_type === 'vip' ? (
                        <>
                          <Crown className="w-3 h-3 mr-1 text-purple-400" />
                          VIP会員
                        </>
                      ) : profile.membership_type === 'premium' ? (
                        <>
                          <Crown className="w-3 h-3 mr-1 text-yellow-400" />
                          有料会員
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1 text-gray-400" />
                          無料会員
                        </>
                      )}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
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
          <p className="text-gray-300 mb-8">ビジネススキルを次のレベルへ</p>

          {/* Tab Navigation */}
          <div className="flex space-x-6 border-b border-white/20 mb-8">
            <button
              onClick={() => setActiveTab('videos')}
              className={`pb-4 px-2 font-medium transition ${
                activeTab === 'videos'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Youtube className="w-5 h-5 inline mr-2" />
              動画コンテンツ
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`pb-4 px-2 font-medium transition ${
                activeTab === 'blog'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              ブログ記事
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`pb-4 px-2 font-medium transition ${
                activeTab === 'education'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-5 h-5 inline mr-2" />
              教育コンテンツ
            </button>
          </div>

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <>
              {isAdmin && (
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => handleAdminAction('add-video')}
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span>動画を追加</span>
                  </button>
                </div>
              )}

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/10 rounded-xl h-64 animate-pulse"></div>
                  ))
                ) : videos.length > 0 ? (
                  videos.map((video) => {
                    // 無料会員の場合、プレミアム限定動画をフィルタリング
                    if (profile?.membership_type === 'free' && video.is_premium) {
                      // 5分まで視聴可能なので表示はする
                    }
                    
                    return (
                    <motion.div
                      key={video.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        console.log('[Dashboard] Video card clicked:', video.id, video.title);
                        router.push(`/videos/${video.id}`);
                      }}
                      className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition relative group cursor-pointer"
                    >
                      {/* Admin Edit Button */}
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAdminAction('edit-video', video.id)
                          }}
                          className="absolute top-2 right-2 bg-black/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gray-800">
                        {video.youtube_id ? (
                          <img
                            src={`https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
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
                        {/* 閲覧済みバッジ */}
                        {watchedVideos.has(video.id) && (
                          <div className="absolute bottom-2 left-2 bg-green-500/80 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            閲覧済み
                          </div>
                        )}
                      </div>
                      
                      {/* Video Info */}
                      <div 
                        className="p-4"
                      >
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
                  )})
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-400">まだ動画がありません</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Blog Tab */}
          {activeTab === 'blog' && (
            <>
              {isAdmin && (
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => handleAdminAction('add-blog')}
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span>ブログを追加</span>
                  </button>
                </div>
              )}

              {/* Blog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogPosts.map((post) => (
                  <motion.article
                    key={post.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition cursor-pointer relative group"
                  >
                    {/* Admin Edit Button */}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdminAction('edit-blog', post.id)
                        }}
                        className="absolute top-2 right-2 bg-black/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}

                    <div className="p-6">
                      <div className="flex items-center space-x-2 text-xs text-blue-400 mb-2">
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{post.published_at}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{post.title}</h3>
                      <p className="text-gray-300 mb-4">{post.excerpt}</p>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <>
              {isAdmin && (
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => handleAdminAction('add-education')}
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span>教育コンテンツを追加</span>
                  </button>
                </div>
              )}

              {/* Education Content */}
              {educationContents.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 text-center">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-2xl font-semibold mb-2">間もなく公開し、順次投稿します</h3>
                  <p className="text-gray-400">
                    美容師のためのビジネススキルアップコンテンツを準備中です
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Group contents by chapter */}
                  {educationChapters.map((chapter) => {
                    const chapterContents = educationContents.filter(
                      content => content.chapter_id === chapter.id
                    )
                    
                    if (chapterContents.length === 0) return null
                    
                    return (
                      <div key={chapter.id} className="space-y-4">
                        {/* Chapter Header */}
                        <div className="mb-6">
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {chapter.title}
                          </h3>
                          {chapter.description && (
                            <p className="text-gray-400">{chapter.description}</p>
                          )}
                        </div>
                        
                        {/* Chapter Contents Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {chapterContents.map((content) => (
                            <motion.div
                              key={content.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => router.push(`/education/${content.slug}`)}
                              className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition cursor-pointer relative group"
                            >
                              {/* Admin Edit Button */}
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAdminAction('edit-education', content.id)
                                  }}
                                  className="absolute top-2 right-2 bg-black/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Featured Image */}
                              {content.featured_image && (
                                <div className="aspect-video relative">
                                  <img
                                    src={content.featured_image}
                                    alt={content.title}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Premium Badge */}
                                  {content.is_premium && (
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 rounded-full text-xs font-semibold text-black flex items-center">
                                      <Crown className="w-3 h-3 mr-1" />
                                      Premium
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="p-6">
                                {/* Category Badge */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs">
                                    {content.category === 'beginner' ? '新人向け' :
                                     content.category === 'management' ? '経営' :
                                     content.category === 'dx' ? 'DX' : '一般'}
                                  </span>
                                  <div className="flex items-center text-xs text-gray-400">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    <span>{content.reading_time}分</span>
                                  </div>
                                </div>
                                
                                <h4 className="font-semibold text-lg mb-2 line-clamp-2">
                                  {content.title}
                                </h4>
                                
                                {content.excerpt && (
                                  <p className="text-sm text-gray-400 line-clamp-3">
                                    {content.excerpt}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Upgrade CTA for Free Users */}
          {profile?.membership_type === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center"
            >
              <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-3xl font-bold mb-4">有料会員で全てのコンテンツを視聴</h2>
              <p className="text-lg mb-6 opacity-90">
                無料会員は各動画5分まで。有料会員になって全てのコンテンツを無制限でお楽しみください。
              </p>
              <button 
                onClick={() => router.push('/membership/upgrade')}
                className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition cursor-pointer"
              >
                有料プランを見る
              </button>
            </motion.div>
          )}
        </motion.div>
      </main>
      
      {/* Password Change Prompt - Temporarily disabled */}
      {/* showPasswordPrompt && (
        <PasswordChangePrompt 
          onPasswordChanged={() => {
            setShowPasswordPrompt(false)
            // Refresh user data to remove the flag
            checkUser()
          }}
        />
      ) */}
    </div>
  )
}