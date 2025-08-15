'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Lock, Crown, Plus, ArrowLeft } from 'lucide-react'
import ForumQuestionList from '@/components/forum/ForumQuestionList'
import ForumCategories from '@/components/forum/ForumCategories'
import ForumHeader from '@/components/forum/ForumHeader'

export default function ForumPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Not logged in - should not happen due to middleware
        router.push('/login?redirect=/forum')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 新しいRBACシステムと従来システムの両方をチェック
  const isPaidMember = profile?.membership_type === 'premium' || 
                      profile?.membership_type === 'vip' || 
                      profile?.role === 'admin' || 
                      profile?.role === 'paid'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Show upgrade prompt for free members
  if (!isPaidMember) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              運営サポートフォーラム
            </h1>
            <p className="text-purple-100 text-lg">
              インスタ集客・AI活用・経営戦略についてご質問ください
            </p>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <Lock className="w-20 h-20 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              フォーラムは有料会員限定機能です
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              システム運営者に直接質問できるフォーラムです。
              インスタ集客の戦略、AI活用方法、経営戦略など、ビジネス成長に関するアドバイスを受けられます。
            </p>
            
            <div className="bg-purple-50 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-purple-900">
                有料会員になると利用できる機能
              </h3>
              <ul className="space-y-3 text-left max-w-xl mx-auto">
                <li className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
                  <span className="text-gray-700">運営者に直接質問を投稿できます</span>
                </li>
                <li className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-purple-600 mt-0.5" />
                  <span className="text-gray-700">インスタ集客・AI活用の専門的なアドバイスが受けられます</span>
                </li>
                <li className="flex items-start gap-3">
                  <Plus className="w-5 h-5 text-purple-600 mt-0.5" />
                  <span className="text-gray-700">他の会員の質問・回答から学べます</span>
                </li>
              </ul>
            </div>

            <Link
              href="/membership/upgrade"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg text-lg"
            >
              <Crown className="w-6 h-6" />
              有料プランで利用を開始する
            </Link>

            <p className="mt-6 text-sm text-gray-500">
              月額わずか500円で、すべての機能が利用可能になります
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // Show forum for paid members
  return (
    <div className="min-h-screen bg-gray-50">
      <ForumHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* サイドバー */}
          <div className="lg:col-span-1">
            <ForumCategories />
          </div>
          
          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            <ForumQuestionList />
          </div>
        </div>
      </div>
    </div>
  )
}