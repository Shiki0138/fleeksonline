'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Video, FileText, Users, BarChart3, Target, LogOut, BookOpen } from 'lucide-react'
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
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchStats()
    }
  }, [profile])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('Admin check - User:', user.email, 'ID:', user.id)

      // Check if admin by email first
      if (user.email === 'greenroom51@gmail.com') {
        console.log('Admin email confirmed')
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
      
      // ユーザー数を取得（beauty_usersテーブルから）
      const { count: userCount } = await supabase
        .from('beauty_users')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalVideos: videoCount || 0,
        totalBlogs: blogCount || 0,
        totalUsers: userCount || 0,
        monthlyViews: 0 // これは別途実装が必要
      })
    } catch (error) {
      console.error('統計情報の取得エラー:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    { icon: BarChart3, label: 'ダッシュボード', href: '/admin', active: true },
    { icon: Video, label: '動画管理', href: '/admin/videos' },
    { icon: FileText, label: 'ブログ管理', href: '/admin/blog' },
    { icon: BookOpen, label: '教育コンテンツ', href: '/admin/education' },
    { icon: Users, label: 'ユーザー管理', href: '/admin/users' },
    { icon: Settings, label: '設定', href: '/admin/settings' }
  ]

  const statCards = [
    { label: '動画数', value: stats.totalVideos, icon: Video, color: 'bg-blue-500' },
    { label: 'ブログ記事', value: stats.totalBlogs, icon: FileText, color: 'bg-green-500' },
    { label: '会員数', value: stats.totalUsers, icon: Users, color: 'bg-purple-500' },
    { label: '月間視聴数', value: stats.monthlyViews.toLocaleString(), icon: BarChart3, color: 'bg-yellow-500' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold">FLEEKS Admin</span>
          </div>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-blue-600 border-r-3 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>
        
        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-gray-700 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">
            {profile?.full_name || profile?.username}さん、お疲れ様です
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">最近のアクティビティ</h2>
          <div className="space-y-4">
            <p className="text-gray-600">アクティビティログは準備中です...</p>
          </div>
        </div>
      </main>
    </div>
  )
}