'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Video, FileText, Users, BarChart3, Target, LogOut, BookOpen, Crown, Lock } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Profile } from '@/lib/supabase-client'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalBlogs: 0,
    totalUsers: 0,
    monthlyViews: 0
  })

  useEffect(() => {
    console.log('[Admin Page] Component mounted, checking admin access...')
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchStats()
    }
  }, [profile])

  const checkAdminAccess = async () => {
    try {
      console.log('[Admin Page] Starting admin access check...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[Admin Page] getUser result:', { user })
      
      if (!user) {
        console.log('[Admin Page] No user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('[Admin Page] User found - Email:', user.email, 'ID:', user.id)

      // Check if admin by email first
      if (user.email === 'greenroom51@gmail.com') {
        console.log('[Admin Page] Admin email confirmed, setting profile...')
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
        setIsLoading(false)
        return
      }

      // プロファイル取得
      const { data: profileData, error: profileError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('Admin check - Profile:', profileData)
      console.log('Admin check - Profile Error:', profileError)

      if (profileError) {
        console.error('プロファイル取得エラー:', profileError)
        // If no profile, but we have user, redirect to dashboard
        router.push('/dashboard')
        return
      }

      if (profileData) {
        if (profileData.role !== 'admin') {
          console.log('User is not admin, redirecting to dashboard')
          router.push('/dashboard')
          return
        }
        setProfile(profileData)
      }
    } catch (error) {
      console.error('管理者アクセスチェックエラー:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // 動画数を取得
      const { count: videoCount } = await supabase
        .from('fleeks_videos')
        .select('*', { count: 'exact', head: true })
      
      // ブログ数を取得
      const { count: blogCount } = await supabase
        .from('fleeks_blog_posts')
        .select('*', { count: 'exact', head: true })
      
      // ユーザー数を取得
      const { count: userCount } = await supabase
        .from('fleeks_profiles')
        .select('*', { count: 'exact', head: true })

      // 月間視聴数を計算（過去30日間）
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: watchHistory } = await supabase
        .from('fleeks_watch_history')
        .select('id')
        .gte('last_watched_at', thirtyDaysAgo.toISOString())
      
      const monthlyViews = watchHistory?.length || 0

      setStats({
        totalVideos: videoCount || 0,
        totalBlogs: blogCount || 0,
        totalUsers: userCount || 0,
        monthlyViews: monthlyViews
      })
    } catch (error) {
      console.error('統計情報の取得エラー:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">管理者権限を確認中...</div>
      </div>
    )
  }

  const adminMenuItems = [
    {
      title: '動画管理',
      description: '動画の追加、編集、削除',
      icon: Video,
      href: '/admin/videos',
      color: 'from-red-500 to-red-600'
    },
    {
      title: '教育コンテンツ', 
      description: '美容師向け教育コンテンツの管理',
      icon: BookOpen,
      href: '/admin/education',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'ブログ管理', 
      description: 'ブログ投稿の作成と管理',
      icon: FileText,
      href: '/admin/blog',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'ユーザー管理',
      description: 'ユーザーアカウントの管理',
      icon: Users,
      href: '/admin/users',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'アナリティクス',
      description: '利用統計とパフォーマンス',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'システム設定',
      description: 'プラットフォーム設定',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-gray-500 to-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                FLEEKS 管理画面
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name || profile?.username}</p>
                <p className="text-xs text-red-400">管理者</p>
              </div>
              <button
                onClick={() => {
                  console.log('Navigating to premium page...')
                  window.location.href = '/premium'
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
              >
                <Crown className="w-5 h-5" />
                <span>有料会員ページ</span>
              </button>
              <button
                onClick={() => {
                  console.log('Navigating to free page...')
                  window.location.href = '/free'
                }}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
              >
                <Lock className="w-5 h-5" />
                <span>無料会員ページ</span>
              </button>
              <button
                onClick={() => {
                  console.log('ダッシュボードへ遷移します')
                  router.push('/dashboard')
                }}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <Target className="w-5 h-5" />
                <span>ダッシュボード</span>
              </button>
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
          <h1 className="text-4xl font-bold mb-2">管理ダッシュボード</h1>
          <p className="text-gray-300 mb-12">FLEEKS Platformの管理機能</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-sm text-gray-400 mb-2">総動画数</h3>
              <p className="text-3xl font-bold">{stats.totalVideos}</p>
            </motion.div>
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-sm text-gray-400 mb-2">総ブログ記事</h3>
              <p className="text-3xl font-bold">{stats.totalBlogs}</p>
            </motion.div>
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm text-gray-400 mb-2">登録ユーザー</h3>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </motion.div>
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-sm text-gray-400 mb-2">月間視聴数</h3>
              <p className="text-3xl font-bold">{stats.monthlyViews}</p>
            </motion.div>
          </div>

          {/* Admin Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminMenuItems.map((item, index) => (
              <motion.div
                key={item.title}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(item.href)}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6"
          >
            <h2 className="text-2xl font-semibold mb-6">最近のアクティビティ</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <p className="font-medium">新規動画が追加されました</p>
                  <p className="text-sm text-gray-400">2時間前</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <p className="font-medium">ブログ記事が公開されました</p>
                  <p className="text-sm text-gray-400">5時間前</p>
                </div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">新規ユーザーが登録しました</p>
                  <p className="text-sm text-gray-400">1日前</p>
                </div>
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}