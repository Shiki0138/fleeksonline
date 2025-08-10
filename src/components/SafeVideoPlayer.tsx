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

  // 5分制限処理を完全に分離 - プレーヤー操作は一切行わない
  const handleTimeLimitReached = useCallback(() => {
    if (isDestroyedRef.current) return
    
    console.log('5-minute limit reached - banner overlay display (video continues)')
    
    // タイマーを安全に停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // プレーヤーは一切触らない - 動画継続、音声継続
    // バナーオーバーレイのみ表示
    safeExecute(() => {
      setIsRestricted(true)
    }, 'Failed to set restricted state')

    console.log('Banner overlay displayed - video and audio continue in background')
  }, [safeExecute])

  // プレーヤー状態変更を安全に処理 - エラー発生を完全に防ぐ
  const onPlayerStateChange = useCallback((event: any) => {
    if (isDestroyedRef.current) return
    
    try {
      // eventの存在確認
      if (!event || typeof event.data === 'undefined') {
        console.warn('Invalid player state change event')
        return
      }

      const newIsPlaying = event.data === 1
      
      // State更新を安全に実行
      try {
        setIsPlaying(newIsPlaying)
        if (newIsPlaying) {
          setShowPlayButton(false)
        }
      } catch (stateError) {
        console.warn('State update error (ignored):', stateError)
      }
      
      // 再生中 - タイマー開始（エラーが発生しても他に影響しない）
      if (event.data === 1 && !canWatchFull && !intervalRef.current) {
        try {
          intervalRef.current = setInterval(() => {
            if (isDestroyedRef.current) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              return
            }
            
            try {
              setTimeWatched((prev) => {
                const newTime = prev + 1
                if (newTime >= FREE_LIMIT_SECONDS) {
                  // 非同期で制限処理呼び出し（エラーが発生してもタイマーを壊さない）
                  try {
                    setTimeout(handleTimeLimitReached, 0)
                  } catch (limitError) {
                    console.warn('Time limit handler error (ignored):', limitError)
                  }
                  return prev // 状態更新は停止
                }
                return newTime
              })
            } catch (timeError) {
              console.warn('Time update error (ignored):', timeError)
            }
          }, 1000)
          
          // クリーンアップ追加
          addCleanup(() => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          })
        } catch (timerError) {
          console.warn('Timer setup error (ignored):', timerError)
        }
      }
      // 一時停止または停止 - タイマー停止
      else if ((event.data === 2 || event.data === 0) && intervalRef.current) {
        try {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        } catch (clearError) {
          console.warn('Timer clear error (ignored):', clearError)
        }
      }
    } catch (error) {
      console.warn('Player state change error (completely ignored):', error)
      // エラーが発生してもアプリケーションを継続
    }
  }, [canWatchFull, handleTimeLimitReached, addCleanup])

  // プレーヤー準備完了処理 - 完全エラープルーフ
  const onPlayerReady = useCallback((event: any) => {
    if (isDestroyedRef.current) return
    
    try {
      console.log('Player ready - User type:', userMembershipType)
      
      // 状態更新を安全に実行
      try {
        setPlayerReady(true)
      } catch (stateError) {
        console.warn('Player ready state error (ignored):', stateError)
      }
      
      // 無料会員用のスタイル制御のみ（DOM操作は最小限）
      if (userMembershipType === 'free') {
        console.log('Free user - CSS controls enabled')
      }
    } catch (error) {
      console.warn('Player ready error (completely ignored):', error)
      // エラーが発生してもプレーヤーは動作し続ける
    }
  }, [userMembershipType])

  // YouTube Player API初期化
  useEffect(() => {
    let mounted = true
    isDestroyedRef.current = false

    const initializePlayer = () => {
      if (!mounted || !playerRef.current) return

      try {
        console.log('Initializing YouTube player...')
        
        // YouTube API の存在確認
        // @ts-ignore
        if (!window.YT || !window.YT.Player) {
          console.warn('YouTube API not available')
          if (mounted) {
            setHasError(true)
          }
          return
        }

        // プレーヤー初期化を完全に安全にラップ
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
              onReady: (event: any) => {
                try {
                  onPlayerReady(event)
                } catch (readyError) {
                  console.warn('onReady error (ignored):', readyError)
                }
              },
              onStateChange: (event: any) => {
                try {
                  onPlayerStateChange(event)
                } catch (stateChangeError) {
                  console.warn('onStateChange error (ignored):', stateChangeError)
                }
              },
              onError: (event: any) => {
                console.warn('YouTube Player Error (non-critical):', event?.data || event)
                // エラーでも続行 - 致命的エラーは発生させない
              }
            },
          })
          
          console.log('YouTube player created successfully')
          
          if (mounted && ytPlayer) {
            try {
              setPlayer(ytPlayer)
            } catch (setError) {
              console.warn('Set player error (ignored):', setError)
            }
            
            addCleanup(() => {
              try {
                if (ytPlayer && typeof ytPlayer.destroy === 'function') {
                  ytPlayer.destroy()
                  console.log('Player destroyed safely')
                }
              } catch (e) {
                console.warn('Player cleanup error (ignored):', e)
              }
            })
          }
        } catch (playerCreationError) {
          console.error('YouTube Player creation error:', playerCreationError)
          if (mounted) {
            console.log('Setting hasError to true due to player creation failure')
            try {
              setHasError(true)
            } catch (errorStateError) {
              console.warn('Error setting error state (ignored):', errorStateError)
            }
          }
        }
      } catch (error) {
        console.error('Player initialization error:', error)
        if (mounted) {
          try {
            setHasError(true)
          } catch (errorStateError) {
            console.warn('Error setting error state (ignored):', errorStateError)
          }
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

  // 再生ボタン処理 - 完全エラープルーフ
  const handlePlayVideo = useCallback(() => {
    try {
      if (!player || !playerReady) {
        console.warn('Player not ready for playVideo')
        return
      }
      
      try {
        if (typeof player.playVideo === 'function') {
          player.playVideo()
          console.log('Video play initiated')
        }
      } catch (playError) {
        console.warn('Play video error (ignored):', playError)
      }
      
      try {
        setShowPlayButton(false)
        setIsPlaying(true)
      } catch (stateError) {
        console.warn('Play state update error (ignored):', stateError)
      }
    } catch (error) {
      console.warn('Handle play video error (completely ignored):', error)
    }
  }, [player, playerReady])

  // 全画面表示処理 - 完全エラープルーフ
  const handleFullscreen = useCallback(() => {
    try {
      const container = document.querySelector('.video-container')
      if (!container) {
        console.warn('Video container not found for fullscreen')
        return
      }

      try {
        if (!isFullscreen) {
          // 全画面表示
          if (container.requestFullscreen) {
            container.requestFullscreen().catch(e => console.warn('Fullscreen request error (ignored):', e))
          // @ts-ignore
          } else if (container.webkitRequestFullscreen) {
            // @ts-ignore
            container.webkitRequestFullscreen()
          }
        } else {
          // 全画面終了
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(e => console.warn('Exit fullscreen error (ignored):', e))
          // @ts-ignore
          } else if (document.webkitExitFullscreen) {
            // @ts-ignore
            document.webkitExitFullscreen()
          }
        }
      } catch (fullscreenError) {
        console.warn('Fullscreen operation error (ignored):', fullscreenError)
      }
    } catch (error) {
      console.warn('Handle fullscreen error (completely ignored):', error)
    }
  }, [isFullscreen])

  // 全画面状態の監視 - 完全エラープルーフ
  useEffect(() => {
    const handleFullscreenChange = () => {
      try {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
          // @ts-ignore
          document.webkitFullscreenElement)
        
        try {
          setIsFullscreen(isCurrentlyFullscreen)
        } catch (stateError) {
          console.warn('Fullscreen state update error (ignored):', stateError)
        }
      } catch (error) {
        console.warn('Fullscreen change handler error (ignored):', error)
      }
    }

    try {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    } catch (eventError) {
      console.warn('Fullscreen event listener error (ignored):', eventError)
    }

    return () => {
      try {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      } catch (cleanupError) {
        console.warn('Fullscreen cleanup error (ignored):', cleanupError)
      }
    }
  }, [])

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
          /* バナー広告風オーバーレイ - 動画は背景で継続再生 */
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute inset-0 ${isFullscreen ? 'fullscreen-upgrade' : ''}`}
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
              className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-3 px-6 shadow-lg"
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center space-x-3">
                  <div className="animate-pulse">
                    <Crown className="w-6 h-6 text-yellow-300" />
                  </div>
                  <span className="font-bold text-lg">🎬 プレミアム限定コンテンツ</span>
                </div>
                <div className="text-sm opacity-90">
                  音声継続中...
                </div>
              </div>
            </motion.div>

            {/* メイン誘導エリア */}
            <div className="flex items-center justify-center h-full px-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-center max-w-2xl bg-black/30 rounded-2xl p-8 backdrop-blur-sm border border-white/10 shadow-2xl"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    続きをご覧いただくには
                  </h2>
                  <p className="text-lg text-gray-200 mb-6">
                    FLEEKSプレミアム会員へのアップグレードが必要です
                  </p>
                </motion.div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-4"
                >
                  <a
                    href="https://fleeks.jp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold py-4 px-8 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg shadow-lg"
                  >
                    🚀 今すぐプレミアム会員になる
                  </a>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <a
                      href="/membership/upgrade"
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 border border-white/20 text-sm"
                    >
                      💳 料金プランを見る
                    </a>
                    
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-gray-800/50 hover:bg-gray-700/50 text-yellow-400 font-medium py-3 px-6 rounded-full transition underline text-sm"
                    >
                      🔄 最初から見直す
                    </button>
                  </div>
                </motion.div>
                
                {/* 小さな特典リスト */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                >
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-blue-400 mb-1">🎬</div>
                    <div className="text-white font-semibold text-sm">無制限視聴</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-green-400 mb-1">📱</div>
                    <div className="text-white font-semibold text-sm">全デバイス対応</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-purple-400 mb-1">⭐</div>
                    <div className="text-white font-semibold text-sm">HD画質</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* 音声継続の表示 */}
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

export default function SafeVideoPlayer(props: VideoPlayerProps) {
  return (
    <ErrorBoundary>
      <VideoPlayerCore {...props} />
    </ErrorBoundary>
  )
}