'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Crown, Play } from 'lucide-react'

interface VideoPlayerProps {
  videoId: string
  title?: string
  isPremium: boolean
  userMembershipType: 'free' | 'premium' | 'vip'
  userId?: string
}

// 最もシンプルで確実な実装
export default function SimpleVideoPlayer({ videoId, title, isPremium, userMembershipType, userId }: VideoPlayerProps) {
  const [timeWatched, setTimeWatched] = useState(0)
  const [isRestricted, setIsRestricted] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(true)
  const [videoStarted, setVideoStarted] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const FREE_LIMIT_SECONDS = 300 // 5分 = 300秒
  const canWatchFull = userMembershipType !== 'free' || !isPremium

  // 5分制限処理
  const handleTimeLimitReached = useCallback(() => {
    console.log('5-minute limit reached')
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsRestricted(true)
  }, [])

  // 再生ボタンクリック処理
  const handlePlayClick = useCallback(() => {
    console.log('Play button clicked')
    setShowPlayButton(false)
    setVideoStarted(true)
    
    // 無料会員の場合はタイマー開始
    if (!canWatchFull) {
      startTimeRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setTimeWatched(elapsed)
        
        if (elapsed >= FREE_LIMIT_SECONDS) {
          handleTimeLimitReached()
        }
      }, 1000)
    }
  }, [canWatchFull, handleTimeLimitReached])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingTime = Math.max(0, FREE_LIMIT_SECONDS - timeWatched)

  return (
    <div className="relative w-full">
      {/* 無料会員向けCSS */}
      {userMembershipType === 'free' && (
        <style jsx global>{`
          /* YouTube iframeは通常通り操作可能 */
          .free-video-container {
            position: relative !important;
          }
          
          /* 上部と下部のコントロール領域をブロック */
          .controls-blocker-top {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 60px !important;
            background: transparent !important;
            z-index: 20 !important;
            pointer-events: auto !important;
            cursor: default !important;
          }
          
          .controls-blocker-bottom {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 60px !important;
            background: black !important;
            z-index: 20 !important;
            pointer-events: auto !important;
          }
          
          /* サイドのコントロールブロッカー */
          .controls-blocker-right {
            position: absolute !important;
            top: 60px !important;
            right: 0 !important;
            bottom: 60px !important;
            width: 100px !important;
            background: transparent !important;
            z-index: 20 !important;
            pointer-events: auto !important;
            cursor: default !important;
          }
        `}</style>
      )}

      {/* 制限メッセージ */}
      {!canWatchFull && !isRestricted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-200">
              無料会員は5分間のプレビューが可能です
            </p>
            {videoStarted && (
              <p className="text-xs text-yellow-300/80 mt-1">
                残り視聴時間: {formatTime(remainingTime)}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* 動画プレーヤー */}
      <div ref={containerRef} className={`relative aspect-video bg-black rounded-lg overflow-hidden ${userMembershipType === 'free' ? 'free-video-container' : ''}`}>
        {!isRestricted ? (
          <>
            {/* シンプルなiframe埋め込み */}
            {videoStarted ? (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&fs=0&showinfo=0`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen={userMembershipType !== 'free'}
                  title={title}
                />
                
                {/* 無料会員向けコントロールブロッカー */}
                {userMembershipType === 'free' && (
                  <>
                    {/* 上部ブロッカー（YouTubeロゴ、共有ボタンなど） */}
                    <div className="controls-blocker-top" />
                    
                    {/* 右側ブロッカー（設定メニューなど） */}
                    <div className="controls-blocker-right" />
                    
                    {/* 下部カスタムコントロールバー */}
                    <div className="controls-blocker-bottom">
                      <div className="h-full flex items-center px-4">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-3">
                            <Lock className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-white">無料プレビュー</span>
                            <span className="text-sm text-yellow-300">残り {formatTime(remainingTime)}</span>
                          </div>
                          <a
                            href="https://fleeks.jp/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-4 py-1.5 rounded-full text-xs font-bold hover:from-yellow-300 hover:to-orange-300 transition shadow-lg"
                          >
                            🚀 プレミアム会員になる
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  }}
                />
              </div>
            )}
            
            {/* 再生ボタン */}
            {showPlayButton && (
              <button
                onClick={handlePlayClick}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 sm:p-8 shadow-2xl hover:scale-105 active:scale-95 transition-transform">
                  <Play className="w-12 h-12 sm:w-16 sm:h-16 text-gray-800 fill-gray-800" />
                </div>
                <div className="mt-4 sm:mt-6 text-white text-base sm:text-lg font-medium">
                  タップして再生
                </div>
                {userMembershipType === 'free' && isPremium && (
                  <div className="mt-2 text-white/80 text-xs sm:text-sm">
                    無料会員 - 5分プレビュー
                  </div>
                )}
              </button>
            )}
          </>
        ) : (
          /* 5分制限後のオーバーレイ */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center max-w-lg bg-black/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-white/10 shadow-2xl"
            >
              <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mx-auto mb-2 sm:mb-3" />
              <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">
                続きをご覧いただくには
              </h2>
              <p className="text-xs sm:text-sm text-gray-200 mb-3 sm:mb-4">
                プレミアム会員への登録が必要です
              </p>
              
              <a
                href="https://fleeks.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold py-2.5 sm:py-3 px-6 rounded-full hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-sm shadow-lg"
              >
                🚀 今すぐ会員になる
              </a>
              
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-gray-300 hover:text-white text-xs underline transition"
              >
                最初から見直す
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* 動画情報 */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {isPremium && (
          <div className="flex items-center mt-2">
            <Crown className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-sm text-yellow-400">プレミアムコンテンツ</span>
          </div>
        )}
      </div>
    </div>
  )
}