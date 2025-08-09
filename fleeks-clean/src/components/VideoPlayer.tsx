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
              fs: userMembershipType === 'free' ? 0 : 1,
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
              // プレーヤーが存在する場合のみ一時停止
              if (player && typeof player.pauseVideo === 'function') {
                try {
                  player.pauseVideo()
                  console.log('Video paused at 5-minute limit')
                } catch (e) {
                  console.log('Player pause error (safe to ignore):', e)
                }
              }
              setIsRestricted(true)
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
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
          
          /* モバイル対応 */
          @media (max-width: 768px) {
            .free-member-container iframe {
              pointer-events: none !important;
            }
            
            .ytp-chrome-controls, .ytp-chrome-bottom {
              display: none !important;
              visibility: hidden !important;
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
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${userMembershipType === 'free' ? 'free-member-container' : ''}`}>
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
                    
                    {/* ステータス表示 */}
                    <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs pointer-events-none z-50">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-3 h-3 text-blue-400" />
                        <span>無料プレビュー - 残り {formatTime(remainingTime)}</span>
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
            className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-black/95 flex items-center justify-center"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center p-8 max-w-2xl"
            >
              <div className="mb-8">
                <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  続きはFLEEKS会員限定のコンテンツです
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                  ご興味がある方はこちらをご覧ください
                </p>
              </div>
              
              <div className="space-y-4">
                <a
                  href="https://fleeks.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-10 py-4 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
                >
                  FLEEKS公式サイトへ
                </a>
                
                <div className="mt-6">
                  <a
                    href="/membership/upgrade"
                    className="text-yellow-400 hover:text-yellow-300 underline transition text-sm"
                  >
                    または今すぐアップグレード
                  </a>
                </div>
              </div>
              
              <div className="mt-8 text-sm text-gray-400">
                <p>FLEEKSでは、ビジネスに役立つ多彩なコンテンツをご用意しています</p>
              </div>
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