'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Crown, Play } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

interface VideoPlayerProps {
  videoId: string
  title?: string
  isPremium: boolean
  userMembershipType: 'free' | 'premium' | 'vip'
  userId?: string
}

function VideoPlayerCore({ videoId, title, isPremium, userMembershipType, userId }: VideoPlayerProps) {
  const [timeWatched, setTimeWatched] = useState(0)
  const [isRestricted, setIsRestricted] = useState(false)
  const [player, setPlayer] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  
  const playerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupRef = useRef<(() => void)[]>([])
  const isDestroyedRef = useRef(false)
  
  const FREE_LIMIT_SECONDS = 300 // 5分 = 300秒
  const canWatchFull = userMembershipType !== 'free' || !isPremium

  // 安全なクリーンアップ関数
  const addCleanup = useCallback((fn: () => void) => {
    cleanupRef.current.push(fn)
  }, [])

  const safeExecute = useCallback((fn: () => void, errorMessage: string) => {
    if (isDestroyedRef.current) return
    try {
      fn()
    } catch (error) {
      console.warn(`${errorMessage}:`, error)
    }
  }, [])

  // 5分制限処理を完全に分離
  const handleTimeLimitReached = useCallback(() => {
    if (isDestroyedRef.current) return
    
    console.log('5-minute limit reached - safe overlay display')
    
    // タイマーを安全に停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // プレーヤーを触らない - オーバーレイのみ表示
    safeExecute(() => {
      setIsRestricted(true)
    }, 'Failed to set restricted state')

    console.log('Safe overlay displayed - no player manipulation')
  }, [safeExecute])

  // プレーヤー状態変更を安全に処理
  const onPlayerStateChange = useCallback((event: any) => {
    if (isDestroyedRef.current) return
    
    safeExecute(() => {
      const newIsPlaying = event.data === 1
      setIsPlaying(newIsPlaying)
      
      if (newIsPlaying) {
        setShowPlayButton(false)
      }
      
      // 再生中 - タイマー開始
      if (event.data === 1 && !canWatchFull && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (isDestroyedRef.current) return
          
          setTimeWatched((prev) => {
            const newTime = prev + 1
            if (newTime >= FREE_LIMIT_SECONDS) {
              // 非同期でhandleTimeLimitReached呼び出し
              setTimeout(handleTimeLimitReached, 0)
              return prev // 状態更新は停止
            }
            return newTime
          })
        }, 1000)
        
        addCleanup(() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        })
      }
      // 一時停止または停止 - タイマー停止
      else if ((event.data === 2 || event.data === 0) && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 'Player state change error')
  }, [canWatchFull, handleTimeLimitReached, addCleanup, safeExecute])

  // プレーヤー準備完了処理
  const onPlayerReady = useCallback((event: any) => {
    if (isDestroyedRef.current) return
    
    safeExecute(() => {
      setPlayerReady(true)
      console.log('Player ready - User type:', userMembershipType)
      
      // 無料会員用のスタイル制御のみ（DOM操作は最小限）
      if (userMembershipType === 'free') {
        console.log('Free user - CSS controls enabled')
      }
    }, 'Player ready error')
  }, [userMembershipType, safeExecute])

  // YouTube Player API初期化
  useEffect(() => {
    let mounted = true
    isDestroyedRef.current = false

    const initializePlayer = () => {
      if (!mounted || !playerRef.current) return

      try {
        // @ts-ignore
        const ytPlayer = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: userMembershipType === 'free' ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
            playsinline: 1,
            disablekb: userMembershipType === 'free' ? 1 : 0,
            showinfo: 0,
            cc_load_policy: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: (event: any) => {
              console.warn('YouTube Player Error (non-critical):', event.data)
              // エラーでも続行 - Error Boundaryでキャッチ
            }
          },
        })
        
        if (mounted) {
          setPlayer(ytPlayer)
          addCleanup(() => {
            try {
              if (ytPlayer && typeof ytPlayer.destroy === 'function') {
                ytPlayer.destroy()
              }
            } catch (e) {
              console.warn('Player cleanup error (ignored):', e)
            }
          })
        }
      } catch (error) {
        console.error('Player initialization error:', error)
        if (mounted) {
          setHasError(true)
        }
      }
    }

    // @ts-ignore
    if (window.YT && window.YT.Player) {
      initializePlayer()
    } else {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      // @ts-ignore
      window.onYouTubeIframeAPIReady = () => {
        if (mounted) initializePlayer()
      }
    }

    return () => {
      mounted = false
      isDestroyedRef.current = true
      
      // 全クリーンアップを実行
      cleanupRef.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (e) {
          console.warn('Cleanup error (ignored):', e)
        }
      })
      cleanupRef.current = []
    }
  }, [videoId, userMembershipType, onPlayerReady, onPlayerStateChange, addCleanup])

  // 再生ボタン処理
  const handlePlayVideo = useCallback(() => {
    if (!player || !playerReady) return
    
    safeExecute(() => {
      player.playVideo()
      setShowPlayButton(false)
      setIsPlaying(true)
    }, 'Play video error')
  }, [player, playerReady, safeExecute])

  // 全画面表示処理
  const handleFullscreen = useCallback(() => {
    const container = document.querySelector('.video-container')
    if (!container) return

    safeExecute(() => {
      if (!isFullscreen) {
        // 全画面表示
        if (container.requestFullscreen) {
          container.requestFullscreen()
        // @ts-ignore
        } else if (container.webkitRequestFullscreen) {
          // @ts-ignore
          container.webkitRequestFullscreen()
        }
      } else {
        // 全画面終了
        if (document.exitFullscreen) {
          document.exitFullscreen()
        // @ts-ignore
        } else if (document.webkitExitFullscreen) {
          // @ts-ignore
          document.webkitExitFullscreen()
        }
      }
    }, 'Fullscreen toggle error')
  }, [isFullscreen, safeExecute])

  // 全画面状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      safeExecute(() => {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
          // @ts-ignore
          document.webkitFullscreenElement)
        setIsFullscreen(isCurrentlyFullscreen)
      }, 'Fullscreen state error')
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [safeExecute])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingTime = Math.max(0, FREE_LIMIT_SECONDS - timeWatched)

  // エラー状態の表示
  if (hasError) {
    return (
      <div className="relative aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">動画の読み込みエラー</h3>
          <p className="text-gray-300">動画を読み込めませんでした。ページをリロードして再試行してください。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* 無料会員向けのCSS - DOM操作なし */}
      {userMembershipType === 'free' && (
        <style jsx global>{`
          /* 無料会員向け：YouTube要素の完全非表示 - CSS制御のみ */
          .ytp-watermark, .ytp-youtube-button, .ytp-title-link, .ytp-title,
          .ytp-chrome-top, .ytp-chrome-top-buttons, .ytp-gradient-top,
          .ytp-chrome-controls, .ytp-chrome-bottom, .ytp-share-button,
          .ytp-watch-later-button, .ytp-overflow-button, .ytp-contextmenu,
          .ytp-popup, .ytp-ce-element, .ytp-pause-overlay, .ytp-endscreen-element,
          .ytp-cued-thumbnail-overlay, .ytp-impression-link,
          a[href*="youtube.com"], a[href*="youtu.be"],
          [title*="YouTube"], [title*="見る"], [title*="共有"], [title*="後で見る"],
          [aria-label*="YouTube"], [aria-label*="見る"], [aria-label*="共有"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
          }
          
          .free-member-container {
            position: relative;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
          }
          
          .free-member-container iframe {
            pointer-events: ${userMembershipType === 'free' ? 'none' : 'auto'} !important;
          }
          
          .free-overlay {
            pointer-events: auto !important;
          }
          
          /* 全画面表示のスタイル */
          .fullscreen-video {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
          }
          
          .fullscreen-video iframe {
            width: 100% !important;
            height: 100% !important;
          }
          
          .fullscreen-upgrade {
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

      {/* 動画プレーヤー */}
      <div className={`video-container relative aspect-video bg-black rounded-lg overflow-hidden ${userMembershipType === 'free' ? 'free-member-container' : ''} ${isFullscreen ? 'fullscreen-video' : ''}`}>
        {!isRestricted ? (
          <>
            <div ref={playerRef} className="w-full h-full" />
            
            {/* 無料会員用の完全制御オーバーレイ */}
            {userMembershipType === 'free' && (
              <>
                {/* 再生前のオーバーレイ */}
                {showPlayButton && (
                  <div 
                    className="free-overlay absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-50 cursor-pointer"
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
                
                {/* 再生中のオーバーレイ */}
                {!showPlayButton && (
                  <>
                    {/* 全面を覆うオーバーレイ */}
                    <div 
                      className="free-overlay absolute inset-0 bg-transparent z-40"
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={(e) => e.preventDefault()}
                      style={{ userSelect: 'none', pointerEvents: 'auto' }}
                    />
                    
                    {/* コントロールバー */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white rounded-lg p-3 pointer-events-none z-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-blue-400" />
                          <span className="text-sm">無料プレビュー - 残り {formatTime(remainingTime)}</span>
                        </div>
                        
                        {/* 全画面ボタン */}
                        <button
                          onClick={handleFullscreen}
                          className="pointer-events-auto bg-white/20 hover:bg-white/30 rounded p-2 transition-colors"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center ${isFullscreen ? 'fullscreen-upgrade' : ''}`}
            style={{ 
              zIndex: 99999,
              pointerEvents: 'auto',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center p-8 max-w-2xl"
            >
              <div className="mb-8">
                <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-4xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
                >
                  続きはFLEEKS会員限定のコンテンツです
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xl text-gray-300 mb-8"
                >
                  5分間のプレビューをご視聴いただき、ありがとうございました
                </motion.p>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="space-y-6"
              >
                <a
                  href="https://fleeks.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-12 py-5 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 text-xl shadow-lg"
                >
                  FLEEKS公式サイトで詳細を見る
                </a>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <a
                    href="/membership/upgrade"
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 border border-white/20"
                  >
                    今すぐアップグレード
                  </a>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="text-yellow-400 hover:text-yellow-300 font-medium transition underline"
                  >
                    動画を最初から見直す
                  </button>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-10 text-center"
              >
                <p className="text-sm text-gray-400 mb-4">
                  FLEEKSプレミアム会員になると
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-blue-400 mb-2">🎬</div>
                    <div className="text-white font-semibold">無制限視聴</div>
                    <div className="text-gray-400">全動画を時間制限なしで</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-green-400 mb-2">📱</div>
                    <div className="text-white font-semibold">全デバイス対応</div>
                    <div className="text-gray-400">PC・スマホ・タブレット</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-purple-400 mb-2">⭐</div>
                    <div className="text-white font-semibold">プレミアム機能</div>
                    <div className="text-gray-400">高画質・オフライン視聴</div>
                  </div>
                </div>
              </motion.div>
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

export default function SafeVideoPlayer(props: VideoPlayerProps) {
  return (
    <ErrorBoundary>
      <VideoPlayerCore {...props} />
    </ErrorBoundary>
  )
}