'use client'

import { motion } from 'framer-motion'
import { Crown, TrendingUp, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ArticleFooterCTAProps {
  isLoggedIn: boolean
  isPremiumUser: boolean
}

export default function ArticleFooterCTA({ isLoggedIn, isPremiumUser }: ArticleFooterCTAProps) {
  // 有料会員の場合はCTAを表示しない
  if (isPremiumUser) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            もっと学んで、売上アップを実現しませんか？
          </h2>
          <p className="text-lg opacity-90">
            有料プランなら全80記事が読み放題。プロの技術を完全マスター！
          </p>
        </div>

        {/* ダッシュボード画像 */}
        <div className="mb-8 rounded-lg overflow-hidden shadow-2xl">
          <div className="relative aspect-video bg-white/10 backdrop-blur">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm opacity-75 mb-2">有料会員限定</p>
                <h3 className="text-xl font-semibold">専用ダッシュボードで学習を管理</h3>
              </div>
            </div>
          </div>
        </div>

        {/* 特典リスト */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <BookOpen className="w-10 h-10 mb-3" />
            <h4 className="font-semibold mb-2">80記事読み放題</h4>
            <p className="text-sm opacity-90">
              初心者から上級者まで体系的に学べる教育コンテンツ
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <TrendingUp className="w-10 h-10 mb-3" />
            <h4 className="font-semibold mb-2">売上向上の実例</h4>
            <p className="text-sm opacity-90">
              成功した美容師の具体的な手法を完全公開
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <Users className="w-10 h-10 mb-3" />
            <h4 className="font-semibold mb-2">限定コミュニティ</h4>
            <p className="text-sm opacity-90">
              同じ目標を持つ仲間と情報交換
            </p>
          </div>
        </div>

        {/* CTA ボタン */}
        <div className="text-center">
          <Link
            href="https://fleeks.jp/"
            className="inline-flex items-center gap-3 bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
          >
            <Crown className="w-6 h-6" />
            有料プランを見る
          </Link>
          
          <p className="mt-4 text-sm opacity-75">
            今なら初月50%OFF！この機会をお見逃しなく
          </p>
        </div>
      </div>
    </motion.div>
  )
}