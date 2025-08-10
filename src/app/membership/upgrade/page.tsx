'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Target, Crown, Check, ArrowLeft, CreditCard, Shield, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { Profile } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  price: number
  period: string
  description: string
  features: PlanFeature[]
  recommended?: boolean
}

export default function MembershipUpgradePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'vip'>('premium')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

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
      // すでにプレミアム会員以上の場合はダッシュボードへ
      if (profileData.membership_type !== 'free') {
        router.push('/dashboard')
      }
    }
  }

  const plans: Record<'premium' | 'vip', Plan> = {
    premium: {
      name: '有料会員',
      price: 7980,
      period: '月額',
      description: 'ビジネススキルを本格的に学びたい方へ',
      features: [
        { text: '全動画を無制限で視聴', included: true },
        { text: 'HD画質での視聴', included: true },
        { text: '限定コンテンツへのアクセス', included: true },
        { text: '広告なしの快適な視聴体験', included: true },
        { text: 'ダウンロード機能', included: true },
        { text: 'プレミアムサポート', included: true },
        { text: '1対1メンタリング', included: false },
        { text: '特別イベント優先招待', included: false },
      ],
      recommended: true
    },
    vip: {
      name: 'VIP会員',
      price: 14980,
      period: '月額',
      description: '最高のサポートと独占コンテンツ',
      features: [
        { text: '全動画を無制限で視聴', included: true },
        { text: '4K画質での視聴', included: true },
        { text: '限定コンテンツへのアクセス', included: true },
        { text: '広告なしの快適な視聴体験', included: true },
        { text: 'ダウンロード機能', included: true },
        { text: 'VIPサポート', included: true },
        { text: '月1回の1対1メンタリング', included: true },
        { text: '特別イベント優先招待', included: true },
      ]
    }
  }

  const handleUpgrade = async () => {
    if (!profile) return
    
    setIsProcessing(true)
    
    try {
      // 実際の決済処理はここに実装
      // Stripe, Square, PayPalなどの決済APIを統合
      
      // デモ用：メンバーシップを更新
      const { error } = await supabase
        .from('fleeks_profiles')
        .update({
          membership_type: selectedPlan,
          membership_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success(`${plans[selectedPlan].name}へのアップグレードが完了しました！`)
      router.push('/dashboard')
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error('アップグレードに失敗しました')
    } finally {
      setIsProcessing(false)
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
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>ダッシュボードに戻る</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              有料会員で全ての動画を視聴
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              ビジネススキルを次のレベルへ。今すぐアップグレードして、
              <br />
              全てのコンテンツにアクセスしましょう。
            </p>
            
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">無制限アクセス</h3>
                <p className="text-sm text-gray-300">
                  全ての動画を時間制限なしで視聴
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <Zap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">限定コンテンツ</h3>
                <p className="text-sm text-gray-300">
                  有料会員限定の特別動画
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">広告なし</h3>
                <p className="text-sm text-gray-300">
                  快適な視聴体験をお約束
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {Object.entries(plans).map(([key, plan]) => (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedPlan(key as 'premium' | 'vip')}
                className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transition-all ${
                  selectedPlan === key 
                    ? 'ring-4 ring-blue-400 bg-white/15' 
                    : 'hover:bg-white/15'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-400 to-indigo-400 text-black px-4 py-1 rounded-full text-sm font-semibold">
                    おすすめ
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  <div className="text-4xl font-bold">
                    ¥{plan.price.toLocaleString()}
                    <span className="text-base font-normal text-gray-400">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check 
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          feature.included ? 'text-green-400' : 'text-gray-600'
                        }`} 
                      />
                      <span className={feature.included ? '' : 'text-gray-500'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  {selectedPlan === key && (
                    <div className="text-blue-400 font-semibold">
                      ✓ 選択中
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
            >
              <CreditCard className="w-6 h-6" />
              <span>
                {isProcessing 
                  ? '処理中...' 
                  : `${plans[selectedPlan].name}にアップグレード`
                }
              </span>
            </button>
            
            <p className="text-sm text-gray-400 mt-4">
              いつでもキャンセル可能 • 安全な決済
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-400 mb-4">信頼できる決済方法</p>
            <div className="flex justify-center space-x-8">
              <div className="text-gray-500">
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="text-gray-500">
                <Shield className="w-8 h-8" />
              </div>
              {/* 実際にはStripe, PayPal等のロゴを表示 */}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}