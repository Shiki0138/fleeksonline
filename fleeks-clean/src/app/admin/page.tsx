'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Video, FileText, Users, BarChart3, Target, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { Profile } from '@/lib/supabase-client'

export default function AdminDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // プロファイル取得
      const { data: profileData, error: profileError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('Admin check - User:', user.email, 'ID:', user.id)
      console.log('Admin check - Profile:', profileData)
      console.log('Admin check - Profile Error:', profileError)

      // プロファイルエラーの場合でも、メールアドレスで管理者チェック
      if (!profileData && user.email !== 'greenroom51@gmail.com') {
        console.log('Admin check failed - No profile and not admin email')
        router.push('/dashboard')
        return
      }
      
      // プロファイルが存在する場合のチェック
      if (profileData && profileData.role !== 'admin' && user.email !== 'greenroom51@gmail.com') {
        console.log('Admin check failed - Role:', profileData?.role, 'Email:', user.email)
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
      href: '/admin/videos/new',
      color: 'from-red-500 to-red-600'
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
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">総動画数</h3>
              <p className="text-3xl font-bold">--</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">総ブログ記事</h3>
              <p className="text-3xl font-bold">--</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">登録ユーザー</h3>
              <p className="text-3xl font-bold">--</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">月間視聴数</h3>
              <p className="text-3xl font-bold">--</p>
            </div>
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