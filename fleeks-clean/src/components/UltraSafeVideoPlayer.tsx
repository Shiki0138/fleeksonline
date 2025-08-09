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

// YouTube Player APIを使わない完全安全版
export default function UltraSafeVideoPlayer({ videoId, title, isPremium, userMembershipType, userId }: VideoPlayerProps) {
  const [timeWatched, setTimeWatched] = useState(0)
  const [isRestricted, setIsRestricted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const startTimeRef = useRef<number>(0)
  
  const FREE_LIMIT_SECONDS = 300 // 5分 = 300秒
  const canWatchFull = userMembershipType !== 'free' || !isPremium

  // 5分制限処理 - 完全に安全
  const handleTimeLimitReached = useCallback(() => {
    console.log('5-minute limit reached - safe banner overlay display')
    
    // タイマーを安全に停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // YouTube iframe は一切触らない - バナーのみ表示
    try {
      setIsRestricted(true)
      console.log('Banner overlay displayed - iframe continues untouched')
    } catch (error) {
      console.warn('Banner display error (ignored):', error)
    }
  }, [])

  // 再生ボタンクリック処理
  const handlePlayVideo = useCallback(() => {
    try {
      setShowPlayButton(false)
      setIsPlaying(true)
      
      // YouTube iframe の自動再生を開始
      if (iframeRef.current) {
        const iframe = iframeRef.current
        const currentSrc = iframe.src
        
        // autoplay=1 を追加して再読み込み
        if (!currentSrc.includes('autoplay=1')) {
          iframe.src = currentSrc.replace('autoplay=0', 'autoplay=1')
        }
      }
      
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
    } catch (error) {
      console.warn('Play video error (ignored):', error)
    }
  }, [canWatchFull, handleTimeLimitReached])

  // 全画面処理
  const handleFullscreen = useCallback(() => {
    try {
      const container = document.querySelector('.video-container')
      if (!container) return

      if (!isFullscreen) {
        if (container.requestFullscreen) {
          container.requestFullscreen().catch(e => console.warn('Fullscreen error (ignored):', e))
        // @ts-ignore
        } else if (container.webkitRequestFullscreen) {
          // @ts-ignore
          container.webkitRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(e => console.warn('Exit fullscreen error (ignored):', e))
        // @ts-ignore
        } else if (document.webkitExitFullscreen) {
          // @ts-ignore
          document.webkitExitFullscreen()
        }
      }
    } catch (error) {
      console.warn('Fullscreen operation error (ignored):', error)
    }
  }, [isFullscreen])

  // 全画面状態監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      try {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
          // @ts-ignore
          document.webkitFullscreenElement)
        setIsFullscreen(isCurrentlyFullscreen)
      } catch (error) {
        console.warn('Fullscreen state error (ignored):', error)
      }
    }

    try {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    } catch (error) {
      console.warn('Fullscreen event error (ignored):', error)
    }

    return () => {
      try {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      } catch (error) {
        console.warn('Fullscreen cleanup error (ignored):', error)
      }
    }
  }, [])

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

  // YouTube iframe URL を構築（完全に安全）
  const youtubeUrl = `https://www.youtube.com/embed/${videoId}?` + new URLSearchParams({
    autoplay: '0',
    controls: userMembershipType === 'free' ? '0' : '1',
    modestbranding: '1',
    rel: '0',
    fs: '0',
    iv_load_policy: '3',
    playsinline: '1',
    disablekb: userMembershipType === 'free' ? '1' : '0',
    showinfo: '0',
    cc_load_policy: '0',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  }).toString()

  // エラー表示
  if (hasError) {
    return (
      <div className="relative aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">動画の読み込みエラー</h3>
          <p className="text-gray-300">動画を読み込めませんでした。ページをリロードして再試行してください。</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* 無料会員向けCSS - DOM操作なし、CSS制御のみ */}
      {userMembershipType === 'free' && (
        <style jsx global>{`
          /* 無料会員：YouTube要素を完全非表示 - DOM操作は一切行わない */
          .ultra-safe-container iframe {
            pointer-events: ${showPlayButton ? 'none' : 'auto'} !important;
          }
          
          .ultra-safe-overlay {
            pointer-events: auto !important;
          }
          
          /* YouTube UI要素の非表示（CSS のみ） */
          .ytp-watermark, .ytp-youtube-button, .ytp-title-link, .ytp-title,
          .ytp-chrome-top, .ytp-chrome-top-buttons, .ytp-gradient-top,
          .ytp-share-button, .ytp-watch-later-button, .ytp-overflow-button,
          .ytp-contextmenu, .ytp-popup, .ytp-ce-element, .ytp-pause-overlay,
          .ytp-endscreen-element, .ytp-cued-thumbnail-overlay, .ytp-impression-link,
          a[href*="youtube.com"], a[href*="youtu.be"],
          [title*="YouTube"], [title*="見る"], [title*="共有"], [title*="後で見る"],
          [aria-label*="YouTube"], [aria-label*="見る"], [aria-label*="共有"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: absolute !important;
            left: -9999px !important;
          }
          
          /* 全画面スタイル */
          .fullscreen-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
          }
          
          .fullscreen-container iframe {
            width: 100% !important;
            height: 100% !important;
          }
          
          .fullscreen-banner {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 99999 !important;
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
            <p className="text-xs text-yellow-300/80 mt-1">
              残り視聴時間: {formatTime(remainingTime)}
            </p>
          </div>
        </motion.div>
      )}

      {/* 動画プレーヤー - 完全DOM操作なし */}
      <div className={`video-container relative aspect-video bg-black rounded-lg overflow-hidden ${userMembershipType === 'free' ? 'ultra-safe-container' : ''} ${isFullscreen ? 'fullscreen-container' : ''}`}>
        {!isRestricted ? (
          <>
            {/* YouTube iframe - DOM操作一切なし */}
            <iframe
              ref={iframeRef}
              src={youtubeUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
            
            {/* 無料会員用オーバーレイ - DOM操作なし */}
            {userMembershipType === 'free' && (
              <>
                {/* 再生前オーバーレイ */}
                {showPlayButton && (
                  <div 
                    className="ultra-safe-overlay absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-50 cursor-pointer"
                    onClick={handlePlayVideo}
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-8 shadow-2xl hover:scale-105 transition-transform">
                      <Play className="w-16 h-16 text-gray-800" />
                    </div>
                    <div className="mt-6 text-white text-lg font-medium">
                      タップして再生開始
                    </div>
                    <div className="mt-2 text-white/80 text-sm">
                      無料会員 - 5分プレビュー
                    </div>
                  </div>
                )}
                
                {/* 再生中オーバーレイ */}
                {!showPlayButton && (
                  <>
                    {/* 透明オーバーレイ - YouTube UI をブロック */}
                    <div 
                      className="ultra-safe-overlay absolute inset-0 bg-transparent z-40"
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={(e) => e.preventDefault()}
                    />
                    
                    {/* コントロールバー */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white rounded-lg p-3 z-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-blue-400" />
                          <span className="text-sm">無料プレビュー - 残り {formatTime(remainingTime)}</span>
                        </div>
                        
                        <button
                          onClick={handleFullscreen}
                          className="bg-white/20 hover:bg-white/30 rounded p-2 transition-colors"
                          title="全画面表示"
                        >
                          {isFullscreen ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          /* バナーオーバーレイ - DOM操作なし、iframe は背景で継続 */
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute inset-0 ${isFullscreen ? 'fullscreen-banner' : ''}`}
            style={{ 
              zIndex: 99999,
              pointerEvents: 'auto',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(17,24,39,0.9) 50%, rgba(0,0,0,0.85) 100%)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {/* 上部バナーエリア */}
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2 px-4 shadow-lg"
            >
              <div className="flex items-center justify-center">
                <span className="font-bold text-sm sm:text-base">🎬 プレミアム限定コンテンツ</span>
              </div>
            </motion.div>

            {/* メイン誘導エリア */}
            <div className="flex items-center justify-center h-full px-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-center max-w-lg bg-black/30 rounded-xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">
                    続きをご覧いただくには
                  </h2>
                  <p className="text-sm sm:text-base text-gray-200 mb-4">
                    プレミアム会員への登録が必要です
                  </p>
                </motion.div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3"
                >
                  <a
                    href="https://fleeks.jp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold py-3 px-6 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base shadow-lg"
                  >
                    🚀 今すぐ会員になる
                  </a>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="text-gray-300 hover:text-white text-xs sm:text-sm underline transition"
                  >
                    最初から見直す
                  </button>
                </motion.div>
                
                {/* 特典リスト - 簡素化 */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="mt-4 flex justify-center gap-4 text-xs"
                >
                  <div className="text-gray-300">
                    <span className="text-yellow-400">✓</span> 無制限視聴
                  </div>
                  <div className="text-gray-300">
                    <span className="text-yellow-400">✓</span> HD画質
                  </div>
                  <div className="text-gray-300">
                    <span className="text-yellow-400">✓</span> 広告なし
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* 音声継続表示 */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="absolute bottom-4 left-4 bg-green-600/20 border border-green-500/30 text-green-300 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
            >
              <div className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></div>
              <span>音声継続中</span>
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