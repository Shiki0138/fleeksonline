'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface Video {
  id: string
  title: string
  description: string | null
  youtube_id: string
  thumbnail_url: string | null
  category: string | null
  is_premium: boolean
  preview_seconds: number
  view_count: number
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [user])

  const fetchVideos = async () => {
    try {
      setLoadingVideos(true)
      
      // 動画一覧を取得
      const { data: videosData, error } = await supabase
        .from('beauty_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) {
        console.error('Error fetching videos:', error)
        return
      }

      setVideos(videosData || [])
      
      // 注目動画（view_countが多い）を取得
      const { data: featuredData } = await supabase
        .from('beauty_videos')
        .select('*')
        .order('view_count', { ascending: false })
        .limit(3)

      setFeaturedVideos(featuredData || [])
      
    } catch (error) {
      console.error('Error in fetchVideos:', error)
    } finally {
      setLoadingVideos(false)
    }
  }

  const handleAuth = async (type: 'signin' | 'signup') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Auth error:', error)
      }
    } catch (error) {
      console.error('Error in handleAuth:', error)
    }
  }

  if (loading) {
    return (
      <div className="splash-screen">
        <div className="text-center">
          <div className="ai-shimmer w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-8"></div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Fleeks AI</h1>
          <p className="text-xl text-white/80">最先端の美容学習プラットフォーム</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="glass-morphism m-4 p-6 sticky top-4 z-30">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse-glow"></div>
            <h1 className="text-2xl font-bold gradient-text">Fleeks AI</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#videos" className="text-white/80 hover:text-white transition-colors">動画</a>
            <a href="#community" className="text-white/80 hover:text-white transition-colors">コミュニティ</a>
            <a href="#ai-tools" className="text-white/80 hover:text-white transition-colors">AIツール</a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white/80">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleAuth('signin')}
                  className="btn-secondary text-sm"
                >
                  ログイン
                </button>
                <button 
                  onClick={() => handleAuth('signup')}
                  className="btn-primary text-sm"
                >
                  無料体験
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        {/* ヒーローセクション */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-20"
        >
          <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-8 animate-gradient-shift">
            美容業界の
            <br />
            未来を創る
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
            AI技術で美容師のスキルアップを革新。個別最適化された学習体験で、
            あなたの可能性を最大限に引き出します。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="btn-primary text-lg px-8 py-4">
              🚀 無料で始める
            </button>
            <button className="btn-secondary text-lg px-8 py-4">
              📹 デモを見る
            </button>
          </div>
        </motion.section>

        {/* 注目動画セクション */}
        {featuredVideos.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pb-16"
          >
            <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
              🔥 注目の動画
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="video-card group cursor-pointer"
                >
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    <div className="aspect-video bg-gradient-to-r from-purple-400/20 to-pink-400/20 flex items-center justify-center">
                      <div className="text-6xl opacity-50">🎬</div>
                    </div>
                    {!user && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🔒</div>
                          <p className="text-sm">会員限定</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:gradient-text transition-all">
                    {video.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {video.description || 'プロの技術を学べる実践的なコンテンツです。'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-white/40">
                    <span>{video.category || '技術・テクニック'}</span>
                    <span>👁 {video.view_count || 0}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 機能紹介セクション */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="py-16"
        >
          <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
            🤖 AI搭載の革新機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'パーソナライゼーション',
                description: 'あなたの学習スタイルに合わせてAIが最適なコンテンツを提案'
              },
              {
                icon: '📱',
                title: 'AR美容シミュレーション',
                description: 'カメラを使って実際にメイクアップを試せるAR機能'
              },
              {
                icon: '🎮',
                title: '3D インタラクション',
                description: 'ジェスチャーや音声でコントロールできる直感的なUI'
              },
              {
                icon: '💬',
                title: 'AIアシスタント',
                description: '24時間対応のAI美容コンサルタントがサポート'
              },
              {
                icon: '📊',
                title: 'スキル分析',
                description: 'AIがあなたの成長を分析し、次のステップを提案'
              },
              {
                icon: '🌐',
                title: 'グローバルコミュニティ',
                description: '世界中の美容師とつながり、知識を共有'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="glass-morphism p-8 text-center hover:neon-glow transition-all duration-300 animate-float"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 gradient-text">
                  {feature.title}
                </h3>
                <p className="text-white/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA セクション */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center py-20"
        >
          <div className="glass-morphism p-12 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              今すぐ美容業界の未来に参加しよう
            </h2>
            <p className="text-xl text-white/80 mb-8">
              月額7,980円で全ての機能が使い放題。
              最初の7日間は無料でお試しいただけます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8 py-4">
                💳 無料トライアル開始
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                📞 詳細を相談する
              </button>
            </div>
          </div>
        </motion.section>
      </main>

      {/* フッター */}
      <footer className="glass-morphism m-4 mt-20 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
            <span className="text-xl font-bold gradient-text">Fleeks AI</span>
          </div>
          <p className="text-white/60 mb-4">
            美容業界の未来を創るAI学習プラットフォーム
          </p>
          <div className="flex justify-center space-x-8 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a>
            <a href="#" className="hover:text-white transition-colors">利用規約</a>
            <a href="#" className="hover:text-white transition-colors">お問い合わせ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}