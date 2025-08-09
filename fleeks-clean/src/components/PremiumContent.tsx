'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, ArrowRight, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface PremiumContentProps {
  content: string
  previewContent: string
  isPremium: boolean
  postId: string
  readingTime?: number
}

export default function PremiumContent({ 
  content, 
  previewContent, 
  isPremium, 
  postId,
  readingTime = 5 
}: PremiumContentProps) {
  const router = useRouter()
  const { user, membershipType } = useAuth()
  const [showFullContent, setShowFullContent] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)

  // 有料会員かどうかチェック
  const canViewPremium = membershipType === 'premium' || membershipType === 'vip'
  
  useEffect(() => {
    // コンテンツが有料で、ユーザーが有料会員の場合は全文表示
    if (isPremium && canViewPremium) {
      setShowFullContent(true)
    } else if (!isPremium) {
      // 無料コンテンツは全員に表示
      setShowFullContent(true)
    }
  }, [isPremium, canViewPremium])

  // 読書進捗の追跡
  useEffect(() => {
    if (!showFullContent || !user) return

    const handleScroll = () => {
      const scrolled = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(Math.round((scrolled / height) * 100), 100)
      setReadingProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showFullContent, user])

  // 進捗をデータベースに保存（デバウンス付き）
  useEffect(() => {
    if (!user || readingProgress === 0) return

    const timer = setTimeout(async () => {
      try {
        await fetch('/api/reading-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            progress: readingProgress
          })
        })
      } catch (error) {
        console.error('Failed to save reading progress:', error)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [readingProgress, postId, user])

  if (showFullContent) {
    return (
      <div className="prose prose-lg max-w-none">
        {/* 進捗バー */}
        {user && (
          <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${readingProgress}%` }}
            />
          </div>
        )}
        
        <div dangerouslySetInnerHTML={{ __html: content }} />
        
        {/* 読了メッセージ */}
        {readingProgress === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-center"
          >
            <h3 className="text-2xl font-bold mb-2">読了おめでとうございます！🎉</h3>
            <p className="text-gray-600">この記事の理解度をチェックしてみましょう</p>
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
              理解度テストを受ける
            </button>
          </motion.div>
        )}
      </div>
    )
  }

  // 有料コンテンツのプレビュー表示
  return (
    <div>
      {/* プレビューコンテンツ */}
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: previewContent }} />
      </div>

      {/* 有料会員登録促進エリア */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mt-8"
      >
        {/* ぼかしエフェクト */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
        
        {/* 有料会員登録CTA */}
        <div className="relative mt-12 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          
          <h3 className="text-2xl font-bold mb-2">
            ここから先は有料会員限定コンテンツです
          </h3>
          
          <p className="text-gray-600 mb-6">
            このコンテンツには、実際の成功事例と具体的な数値、
            すぐに使えるテンプレートが含まれています
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm">残り約{readingTime}分の内容</span>
            </div>
          </div>

          {/* 価格表示 */}
          <div className="mb-6">
            <div className="text-3xl font-bold text-blue-600">
              月額 ¥1,980
            </div>
            <p className="text-sm text-gray-500 mt-1">
              いつでもキャンセル可能
            </p>
          </div>

          {/* CTA ボタン */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/membership/upgrade')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition"
          >
            <Crown className="w-5 h-5" />
            有料会員になって続きを読む
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* 特典リスト */}
          <div className="mt-8 text-left max-w-md mx-auto">
            <h4 className="font-semibold mb-3">有料会員特典：</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                全80記事以上の教育コンテンツが読み放題
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                ダウンロード可能なPDF版
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                実践的なテンプレート・チェックリスト
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                月1回のオンラインセミナー参加権
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}