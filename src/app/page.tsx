'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Target, MessageSquare, Brain, BarChart, Users, ArrowRight, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const features = [
    {
      title: 'Instagram集客戦略',
      description: 'フォロワー増加とエンゲージメント向上の実践的手法',
      icon: TrendingUp,
    },
    {
      title: '経営戦略・マーケティング',
      description: 'データドリブンな意思決定と市場分析手法',
      icon: BarChart,
    },
    {
      title: '接客問題解決スキル',
      description: '顧客満足度向上のための実践的アプローチ',
      icon: Users,
    },
    {
      title: '心理学的アプローチ',
      description: '顧客心理を理解し、ビジネスに活かす方法',
      icon: Brain,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 md:w-96 md:h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob hidden md:block"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-2000 hidden md:block"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 md:w-96 md:h-96 bg-slate-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>
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
              <Target className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                FLEEKS
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-6"
            >
              <a href="/education" className="hidden md:block hover:text-blue-400 transition">
                教育コンテンツ
              </a>
              <a href="/forum" className="hidden md:block hover:text-blue-400 transition">
                フォーラム
              </a>
              <a href="/auth/login" className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white/20 transition text-sm whitespace-nowrap md:bg-transparent md:px-0 md:py-0 md:rounded-none md:hover:text-blue-400 md:hover:bg-transparent md:text-base">
                ログイン
              </a>
              <a href="/auth/signup" className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition text-sm font-medium whitespace-nowrap md:px-6">
                無料会員登録
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
                <BarChart className="w-5 h-5 mr-2 text-blue-400" />
                <span className="text-sm">AI搭載のビジネス成長支援プラットフォーム</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">ローカルビジネスの</span>
                <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">成功へ</span>
                <br />
                <span className="text-2xl sm:text-3xl md:text-5xl whitespace-nowrap">集客と経営戦略を科学する</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                Instagram集客、経営戦略、マーケティング、接客問題解決、心理学的アプローチを統合。
                データとAIの力で、あなたのビジネスを次のレベルへ導きます。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <motion.a
                  href="/auth/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition flex items-center justify-center"
                >
                  無料会員登録
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                </motion.a>
              </div>

              {/* Screenshot Section */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 40 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-16"
              >
                <h2 className="text-2xl font-semibold mb-4">ログイン後のダッシュボード画面</h2>
                <div className="bg-gradient-to-br from-blue-800/20 to-indigo-800/20 rounded-lg p-4 mb-4 overflow-hidden">
                  <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                    <Image
                      src="/images/dashboard-preview.png"
                      alt="FLEEKSダッシュボード - 動画コンテンツとブログ記事の管理画面"
                      width={1600}
                      height={900}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      priority
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-400 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      動画学習コンテンツ
                    </h3>
                    <p className="text-gray-300">
                      Instagram集客、経営戦略、接客スキルなど実践的な動画コンテンツを体系的に学習
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-indigo-400 mb-2 flex items-center">
                      <BarChart className="w-4 h-4 mr-2" />
                      ブログ・記事コンテンツ
                    </h3>
                    <p className="text-gray-300">
                      最新のマーケティングトレンドや実践事例を定期更新でお届け
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Content Features */}
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition text-left"
                  >
                    <div className="flex items-start">
                      <feature.icon className="w-8 h-8 text-blue-400 mr-4 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-300 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">包括的な学習コンテンツ</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              実践的なスキルから理論まで、ビジネス成長に必要なすべてを網羅
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition">
              <Target className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">目標設定と戦略立案</h3>
              <p className="text-gray-300">SMART目標の設定方法と実行可能な戦略の構築</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition">
              <BarChart className="w-12 h-12 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">データ分析と改善</h3>
              <p className="text-gray-300">KPIの設定、分析、PDCAサイクルの実践</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition">
              <Brain className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">AI活用術</h3>
              <p className="text-gray-300">最新のAIツールを活用した業務効率化</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}