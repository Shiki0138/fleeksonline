'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import QuestionForm from '@/components/forum/QuestionForm'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

export default function NewQuestionPage() {
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
        router.push('/login?redirect=/forum/questions/new')
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

  if (!isPaidMember) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Lock className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              有料会員限定機能です
            </h1>
            <p className="text-gray-600 mb-8">
              フォーラムへの質問投稿は有料会員の方のみご利用いただけます。
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/forum"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                フォーラムに戻る
              </Link>
              <Link
                href="/membership/upgrade"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                有料プランに登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            フォーラムに戻る
          </Link>
        </div>
      </div>
      <QuestionForm user={user} profile={profile} />
    </div>
  )
}