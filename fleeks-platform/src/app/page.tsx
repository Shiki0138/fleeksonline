'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Brain, Zap, ArrowRight, Play, Star, Users, Award } from 'lucide-react'

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-8 h-8 text-pink-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                FLEEKS
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-6"
            >
              <a href="/login" className="hover:text-pink-400 transition">ログイン</a>
              <a href="/signup" className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-full hover:shadow-lg hover:shadow-pink-500/25 transition">
                無料で始める
              </a>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
                <Brain className="w-5 h-5 mr-2 text-pink-400" />
                <span className="text-sm">AI搭載の次世代美容学習プラットフォーム</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  美容のプロフェッショナルへ
                </span>
                <br />
                <span className="text-4xl md:text-5xl">AIと共に成長する</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                最先端のAI技術があなたの学習を個別最適化。
                プロの技術を効率的に習得し、美容業界で輝くキャリアを築きましょう。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <motion.a
                  href="/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl hover:shadow-pink-500/25 transition flex items-center justify-center"
                >
                  無料トライアルを開始
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                </motion.a>
                <motion.a
                  href="/demo"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  デモを見る
                </motion.a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-pink-400 mr-2" />
                    <span className="text-3xl font-bold">10,000+</span>
                  </div>
                  <span className="text-gray-400">アクティブユーザー</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-6 h-6 text-yellow-400 mr-2" />
                    <span className="text-3xl font-bold">4.9</span>
                  </div>
                  <span className="text-gray-400">ユーザー評価</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Award className="w-6 h-6 text-purple-400 mr-2" />
                    <span className="text-3xl font-bold">500+</span>
                  </div>
                  <span className="text-gray-400">プロ講師陣</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition">
              <Zap className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">AI学習アシスタント</h3>
              <p className="text-gray-300">あなたの学習進度に合わせて最適なカリキュラムを自動生成</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition">
              <Brain className="w-12 h-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">スマート分析</h3>
              <p className="text-gray-300">技術の習得度をリアルタイムで分析し、弱点を克服</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition">
              <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">実践的カリキュラム</h3>
              <p className="text-gray-300">現場で使える技術を厳選した実践的な学習コンテンツ</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}