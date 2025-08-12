'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ArticleGateProps {
  accessLevel: 'free' | 'partial' | 'premium'
  content: {
    title: string
    leadText: string
    firstSection?: string
    premiumSections?: string[]
    summary?: string
  }
  articleId: string
}

export default function ArticleGate({ accessLevel, content, articleId }: ArticleGateProps) {
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // ユーザーのプラン情報を確認（実際の実装に合わせて調整）
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .single()
        
        setIsPremiumUser(profile?.subscription_plan === 'premium')
      }
    } catch (error) {
      console.error('Error checking user status:', error)
    } finally {
      setLoading(false)
    }
  }

  // 無料記事の場合はそのまま表示
  if (accessLevel === 'free' || isPremiumUser) {
    return <div>{/* 通常の記事表示 */}</div>
  }

  // 部分公開記事
  if (accessLevel === 'partial') {
    return (
      <article className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{content.title}</h1>
        <div className="prose prose-lg mb-8">
          <p className="lead-text text-xl text-gray-600 mb-6">{content.leadText}</p>
          {content.firstSection && (
            <div dangerouslySetInnerHTML={{ __html: content.firstSection }} />
          )}
        </div>

        {/* 有料コンテンツゲート */}
        <div className="relative mt-12">
          {/* ぼかし処理されたプレビュー */}
          <div className="filter blur-sm opacity-50 pointer-events-none">
            <h2 className="text-2xl font-bold mb-4">続きのコンテンツ...</h2>
            <p className="text-gray-600">
              ここから先は有料会員限定のコンテンツです。プロの技術と実践的なノウハウが詰まった内容をお楽しみください。
            </p>
          </div>

          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/80 flex items-center justify-center"
          >
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                続きは有料会員限定
              </h3>
              
              <p className="text-gray-600 mb-6">
                この記事の続きを読むには有料プランへの登録が必要です
              </p>

              <div className="bg-purple-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold mb-3">この記事で学べること</h4>
                <ul className="text-left space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>実践的なテクニックの詳細解説</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>成功事例の具体的な分析</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>すぐに使えるテンプレート</span>
                  </li>
                </ul>
              </div>

              <Link
                href="https://fleeks.jp/"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
              >
                有料プランを見る
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </article>
    )
  }

  // 完全有料記事
  return (
    <article className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 md:p-12"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>

          <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
          
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            <span>有料会員限定コンテンツ</span>
          </div>

          {content.summary && (
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              {content.summary}
            </p>
          )}

          <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
            <h3 className="text-xl font-semibold mb-4">この記事で得られる知識</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">実践的なスキル</h4>
                  <p className="text-sm text-gray-600">明日から使える具体的なテクニック</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">成功事例の詳細</h4>
                  <p className="text-sm text-gray-600">実際の成功パターンを完全公開</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">独自のメソッド</h4>
                  <p className="text-sm text-gray-600">他では学べない特別な内容</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">実装テンプレート</h4>
                  <p className="text-sm text-gray-600">すぐに活用できる資料付き</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="https://fleeks.jp/"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
            >
              有料プランを見る
              <ArrowRight className="w-6 h-6" />
            </Link>
            
            <p className="text-sm text-gray-500">
              月額プランで全80記事が読み放題
            </p>
          </div>
        </div>
      </motion.div>
    </article>
  )
}