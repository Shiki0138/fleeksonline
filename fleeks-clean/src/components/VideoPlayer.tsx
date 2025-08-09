'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Crown, Play } from 'lucide-react'

interface VideoPlayerProps {
  videoId: string
  title?: string
  isPremium: boolean
  userMembershipType: 'free' | 'premium' | 'vip'
  userId?: string
}

export default function VideoPlayer({ videoId, title, isPremium, userMembershipType, userId }: VideoPlayerProps) {
  const [timeWatched, setTimeWatched] = useState(0)
  const [isRestricted, setIsRestricted] = useState(false)
  const [player, setPlayer] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const FREE_LIMIT_SECONDS = 300 // 5分 = 300秒
  const canWatchFull = userMembershipType !== 'free' || !isPremium

  // エラーハンドリング
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('VideoPlayer Error:', error)
      setHasError(true)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  useEffect(() => {
    // YouTube Player APIがすでに読み込まれているかチェック
    // @ts-ignore
    if (window.YT && window.YT.Player) {
      initializePlayer()
      return
    }

    // YouTube Player APIを読み込み
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer()
    }

    function initializePlayer() {
      if (playerRef.current) {
        try {
          // @ts-ignore
          const ytPlayer = new window.YT.Player(playerRef.current, {
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              controls: userMembershipType === 'free' ? 0 : 1, // 無料会員は完全カスタムコントロール
              modestbranding: 1,
              rel: 0,
              fs: 0, // 全画面はカスタム実装で制御
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
                console.error('YouTube Player Error:', event.data)
              }
            },
          })
          setPlayer(ytPlayer)
        } catch (error) {
          console.error('Player initialization error:', error)
          setHasError(true)
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (player) {
        player.destroy()
      }
    }
  }, [videoId, userMembershipType])

  const onPlayerReady = (event: any) => {
    console.log('Player ready - User type:', userMembershipType)
    
    // 無料会員の場合、再生時間を監視
    if (!canWatchFull) {
      console.log('Free user watching premium content - 5 minute limit applies')
    }
    
    // 無料会員の場合、YouTube要素を完全に隠す
    if (userMembershipType === 'free') {
      console.log('Setting up free user interface')
      
      const hideYouTubeElements = () => {
        // より強力なセレクタで YouTube 関連要素を削除
        const selectors = [
          '.ytp-watermark', '.ytp-youtube-button', '.ytp-title-link', '.ytp-title',
          '.ytp-chrome-top', '.ytp-chrome-top-buttons', '.ytp-gradient-top',
          '.ytp-share-button', '.ytp-watch-later-button', '.ytp-overflow-button',
          '.ytp-contextmenu', '.ytp-popup', '.ytp-ce-element', '.ytp-pause-overlay',
          '.ytp-endscreen-element', '.ytp-chrome-controls', '.ytp-chrome-bottom',
          'a[href*="youtube.com"]', 'a[href*="youtu.be"]', '.ytp-cued-thumbnail-overlay',
          '[title*="YouTube"]', '[title*="見る"]', '[title*="共有"]', '[title*="後で見る"]',
          '[aria-label*="YouTube"]', '[aria-label*="見る"]', '[aria-label*="共有"]'
        ]
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.display = 'none !important'
              el.style.visibility = 'hidden !important'
              el.style.pointerEvents = 'none !important'
              el.remove()
            }
          })
        })
        
        // iframe の pointer-events を無効化
        const iframe = document.querySelector('iframe')
        if (iframe) {
          iframe.style.pointerEvents = userMembershipType === 'free' ? 'none' : 'auto'
        }
      }
      
      // 定期的に要素を削除
      const hideInterval = setInterval(hideYouTubeElements, 500)
      setTimeout(() => clearInterval(hideInterval), 30000) // 30秒後に停止
      
      // 初回実行
      setTimeout(hideYouTubeElements, 100)
    }
  }

  const onPlayerStateChange = (event: any) => {
    console.log('Player state changed:', event.data, 'User type:', userMembershipType)
    
    // 再生状態の更新
    const newIsPlaying = event.data === 1
    setIsPlaying(newIsPlaying)
    
    if (newIsPlaying) {
      setShowPlayButton(false)
    }
    
    // 再生中
    if (event.data === 1) {
      if (!canWatchFull && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setTimeWatched((prev) => {
            const newTime = prev + 1
            if (newTime >= FREE_LIMIT_SECONDS) {
              console.log('5-minute limit reached - showing upgrade message')
              
              // タイマーを停止
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              
              // フェードアウト効果で制限画面を表示
              setTimeout(() => {
                setIsRestricted(true)
                // プレーヤーを安全に停止
                if (player && typeof player.pauseVideo === 'function') {
                  try {
                    player.pauseVideo()
                    console.log('Video paused safely after fade')
                  } catch (e) {
                    console.log('Player pause error (ignored):', e)
                  }
                }
              }, 500) // 0.5秒後に制限画面表示
            }
            return newTime
          })
        }, 1000)
      }
    } 
    // 一時停止または停止
    else if (event.data === 2 || event.data === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const handlePlayVideo = () => {
    console.log('Play button clicked - User type:', userMembershipType)
    if (player && player.playVideo) {
      try {
        player.playVideo()
        setShowPlayButton(false)
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing video:', error)
      }
    }
  }

  // 全画面表示の切り替え
  const handleFullscreen = () => {
    const container = document.querySelector('.video-container')
    if (!container) return

    if (!isFullscreen) {
      // 全画面表示
      if (container.requestFullscreen) {
        container.requestFullscreen()
      // @ts-ignore
      } else if (container.webkitRequestFullscreen) {
        // @ts-ignore
        container.webkitRequestFullscreen()
      // @ts-ignore  
      } else if (container.msRequestFullscreen) {
        // @ts-ignore
        container.msRequestFullscreen()
      }
    } else {
      // 全画面終了
      if (document.exitFullscreen) {
        document.exitFullscreen()
      // @ts-ignore
      } else if (document.webkitExitFullscreen) {
        // @ts-ignore
        document.webkitExitFullscreen()
      // @ts-ignore
      } else if (document.msExitFullscreen) {
        // @ts-ignore
        document.msExitFullscreen()
      }
    }
  }

  // 全画面状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
        // @ts-ignore
        document.webkitFullscreenElement || 
        // @ts-ignore
        document.msFullscreenElement)
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingTime = Math.max(0, FREE_LIMIT_SECONDS - timeWatched)

  // エラー状態の場合の表示
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
      {/* 無料会員向けのCSS */}
      {userMembershipType === 'free' && (
        <style jsx global>{`
          /* 無料会員向け：YouTube要素の完全非表示 */
          .free-member-container iframe {
            pointer-events: none !important;
          }
          
          .free-member-container .free-overlay {
            pointer-events: auto !important;
          }
          
          /* YouTube関連要素の完全非表示 */
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
          
          /* 無料会員コンテナの制御 */
          .free-member-container {
            position: relative;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
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
            aspect-ratio: unset !important;
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
            z-index: 10000 !important;
          }
          
          /* モバイル対応 */
          @media (max-width: 768px) {
            .free-member-container iframe {
              pointer-events: none !important;
            }
            
            .ytp-chrome-controls, .ytp-chrome-bottom {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* モバイル全画面調整 */
            .fullscreen-video .absolute.bottom-4 {
              bottom: 8px !important;
              left: 8px !important;
              right: 8px !important;
            }
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
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        return false
                      }}
                      onClick={(e) => {
                        // 全てのクリックをブロック
                        e.preventDefault()
                        e.stopPropagation()
                        return false
                      }}
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
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-gradient-to-br from-gray-900/95 to-black/95 flex items-center justify-center ${isFullscreen ? 'fullscreen-upgrade' : ''}`}
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