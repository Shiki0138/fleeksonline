'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Crown, Play, Pause } from 'lucide-react'

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
  const [showMobileOverlay, setShowMobileOverlay] = useState(true)
  const [hasError, setHasError] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // エラーハンドリング
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('VideoPlayer Error:', error)
      setHasError(true)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const FREE_LIMIT_SECONDS = 300 // 5分 = 300秒
  const canWatchFull = userMembershipType !== 'free' || !isPremium

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
              autoplay: 0, // モバイルでは自動再生を無効化
              controls: 1, // 基本コントロールは表示（CSSで制御）
              modestbranding: 1,
              rel: 0,
              fs: userMembershipType === 'free' ? 0 : 1, // 無料会員はフルスクリーン無効
              iv_load_policy: 3,
              origin: window.location.origin,
              playsinline: 1, // iOS Safari用のインライン再生
              disablekb: userMembershipType === 'free' ? 1 : 0, // 無料会員はキーボード操作無効
              showinfo: 0, // 動画情報を非表示
              cc_load_policy: 0, // 字幕を非表示
              enablejsapi: 1, // JavaScript APIを有効化
              widget_referrer: window.location.href, // モバイル対応
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
  }, [videoId])

  const onPlayerReady = (event: any) => {
    console.log('Player ready - User type:', userMembershipType)
    
    // 無料会員の場合、再生時間を監視
    if (!canWatchFull) {
      console.log('Free user watching premium content - 5 minute limit applies')
    }
    
    // モバイルデバイスの検出と対応
    if (isMobile) {
      console.log('Mobile device detected - User Agent:', navigator.userAgent)
      
      // モバイルでのプレーヤー設定を確認
      try {
        const iframe = document.querySelector('iframe')
        if (iframe) {
          // iframeにモバイル用の属性を追加
          iframe.setAttribute('playsinline', '1')
          iframe.setAttribute('webkit-playsinline', '1')
          iframe.style.pointerEvents = 'auto'
          console.log('Mobile iframe attributes set')
        }
      } catch (e) {
        console.error('Error setting mobile attributes:', e)
      }
    }
    
    // 無料会員の場合、YouTubeロゴやリンクを定期的にチェックして削除
    if (userMembershipType === 'free') {
      const hideYouTubeElements = () => {
        const elementsToHide = [
          '.ytp-watermark',
          '.ytp-youtube-button', 
          '.ytp-title-link',
          '.ytp-chrome-top',
          '.ytp-chrome-top-buttons',
          '.ytp-gradient-top',
          '.ytp-share-button',
          '.ytp-watch-later-button',
          '.ytp-overflow-button',
          '[title*="YouTube"]',
          '[title*="見る"]',
          '[title*="後で見る"]',
          '[title*="共有"]',
          '[aria-label*="YouTube"]',
          '[aria-label*="見る"]',
          '[aria-label*="後で見る"]',
          '[aria-label*="共有"]',
          'a[href*="youtube.com"]',
          'a[href*="youtu.be"]',
          '.ytp-ce-element',
          '.ytp-pause-overlay',
          '.ytp-endscreen-element',
          '.ytp-context-menu',
          '.ytp-popup'
        ]
        
        elementsToHide.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          elements.forEach(element => {
            if (element instanceof HTMLElement) {
              element.style.display = 'none'
              element.style.visibility = 'hidden'
              element.style.opacity = '0'
              element.style.pointerEvents = 'none'
              element.style.width = '0'
              element.style.height = '0'
              element.style.overflow = 'hidden'
              // 要素を完全に削除
              element.remove()
            }
          })
        })
        
        // iframe内の要素も制御
        const iframe = document.querySelector('iframe')
        if (iframe && iframe.contentWindow) {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
            if (iframeDoc) {
              elementsToHide.forEach(selector => {
                const iframeElements = iframeDoc.querySelectorAll(selector)
                iframeElements.forEach((element: Element) => {
                  if (element instanceof HTMLElement) {
                    element.style.display = 'none'
                    element.remove()
                  }
                })
              })
            }
          } catch (e) {
            // クロスドメインエラーは無視
          }
        }
      }
      
      // 初期実行
      setTimeout(hideYouTubeElements, 1000)
      // 定期実行（新しい要素が動的に追加される可能性があるため）
      const interval = setInterval(hideYouTubeElements, 2000)
      
      // クリーンアップ
      return () => clearInterval(interval)
    }
  }

  const onPlayerStateChange = (event: any) => {
    console.log('Player state changed:', event.data)
    
    // 再生状態の更新
    setIsPlaying(event.data === 1)
    
    // モバイルオーバーレイを非表示
    if (event.data === 1 && isMobile) {
      setShowMobileOverlay(false)
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

  // 無料会員用の再生/一時停止制御
  const handlePlayPause = () => {
    if (!player) return
    
    if (isPlaying) {
      player.pauseVideo()
    } else {
      if (timeWatched >= FREE_LIMIT_SECONDS) {
        setIsRestricted(true)
        return
      }
      player.playVideo()
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
      {/* 無料会員向けのCSS（YouTubeリンクを隠すスタイル） */}
      {userMembershipType === 'free' && (
        <style jsx global>{`
          /* 無料会員向け：YouTubeに遷移する全ての要素を完全非表示 */
          .ytp-watermark,
          .ytp-youtube-button,
          .ytp-title-link,
          .ytp-title,
          .ytp-show-cards-title,
          .ytp-cards-button,
          .ytp-context-menu,
          .ytp-context-menu-popup,
          .ytp-popup,
          .ytp-miniplayer-button,
          .ytp-size-button,
          .ytp-remote-button,
          .ytp-share-button,
          .ytp-watch-later-button,
          .ytp-overflow-button,
          .ytp-chrome-top,
          .ytp-chrome-top-buttons,
          .ytp-title-channel,
          .ytp-title-channel-logo,
          .ytp-title-expanded-overlay,
          .ytp-ce-element,
          .ytp-pause-overlay,
          .ytp-contextmenu,
          .ytp-endscreen-element,
          .annotation,
          .iv-click-target,
          .ytp-impression-link,
          .ytp-videowall-still,
          .ytp-ce-covering-overlay,
          .ytp-ce-element-show,
          .ytp-ce-covering-image,
          .ytp-gradient-top,
          .ytp-chrome-controls .ytp-button[aria-label*="YouTube"],
          .ytp-chrome-controls .ytp-button[aria-label*="見る"],
          .ytp-chrome-controls .ytp-button[aria-label*="後で見る"],
          .ytp-chrome-controls .ytp-button[aria-label*="共有"],
          .ytp-chrome-controls .ytp-button[aria-label*="Watch"],
          .ytp-chrome-controls .ytp-button[aria-label*="Share"],
          .ytp-chrome-controls .ytp-button[title*="YouTube"],
          .ytp-chrome-controls .ytp-button[title*="見る"],
          .ytp-chrome-controls .ytp-button[title*="後で見る"],
          .ytp-chrome-controls .ytp-button[title*="共有"],
          .ytp-button:not(.ytp-play-button):not(.ytp-volume-slider):not(.ytp-time-display):not(.ytp-progress-bar),
          a[data-sessionlink*="feature=player-title"],
          a[href*="youtube.com/watch"],
          a[href*="youtu.be"],
          [title*="YouTube で視聴"],
          [title*="YouTubeで視聴"],
          [title*="Watch on YouTube"],
          [aria-label*="YouTube"],
          [aria-label*="見る"],
          [aria-label*="後で見る"],
          [aria-label*="共有"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          /* 右上のボタンエリア全体を非表示 */
          .ytp-chrome-top,
          .ytp-gradient-top {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* コンテクストメニューを完全に無効化 */
          .ytp-contextmenu,
          .ytp-popup {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          
          /* 無料会員向け：選択を無効化 */
          .free-member-container {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* iframeコンテナ内のポインターイベント制御 */
          .free-member-container iframe {
            pointer-events: auto !important;
          }
          
          /* より強力な非表示 */
          .html5-video-player .ytp-chrome-top {
            display: none !important;
          }
          
          /* モバイル向けの追加制御 */
          @media (max-width: 768px) {
            .ytp-watermark,
            .ytp-chrome-top,
            .ytp-chrome-bottom .ytp-button:not(.ytp-play-button):not(.ytp-volume-slider):not(.ytp-time-display),
            .ytp-cued-thumbnail-overlay,
            .ytp-pause-overlay {
              display: none !important;
            }
            
            /* モバイルでのタッチ操作制御 */
            .free-member-container {
              -webkit-touch-callout: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* 無料会員ラベルをモバイル向けに調整 */
            .free-member-label {
              font-size: 11px;
              padding: 0.25rem 0.5rem;
            }
            
            /* プレーヤーコントロールの基本的な部分は表示 */
            .ytp-chrome-bottom {
              display: flex !important;
            }
            
            .ytp-play-button,
            .ytp-volume-slider,
            .ytp-time-display,
            .ytp-progress-bar {
              display: block !important;
              pointer-events: auto !important;
            }
            
            /* モバイルiframe用のスタイル */
            .mobile-youtube-player {
              -webkit-touch-callout: default;
              -webkit-user-select: none;
              touch-action: manipulation;
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
            
            {/* 無料会員用のオーバーレイ */}
            {userMembershipType === 'free' && (
              <>
                {/* YouTubeロゴエリアをブロック */}
                <div 
                  className="absolute top-0 right-0 w-20 h-12 bg-transparent z-20 pointer-events-auto"
                  onClick={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ userSelect: 'none' }}
                />
                
                {/* 動画タイトルエリアをブロック */}
                <div 
                  className="absolute top-0 left-0 right-20 h-12 bg-transparent z-15 pointer-events-auto"
                  onClick={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ userSelect: 'none' }}
                />
                
                {/* 無料会員の警告表示 */}
                <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs pointer-events-none z-10 free-member-label">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3 h-3 text-blue-400" />
                    <span>無料会員 - 5分プレビュー中</span>
                  </div>
                </div>
                
                {/* 右クリック防止オーバーレイ */}
                <div 
                  className="absolute inset-0 bg-transparent pointer-events-auto z-5"
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                  }}
                  onClick={(e) => {
                    // YouTube関連のクリックをブロック
                    const target = e.target as HTMLElement
                    if (target && (
                      target.closest('.ytp-watermark') ||
                      target.closest('.ytp-youtube-button') ||
                      target.closest('[title*="YouTube"]') ||
                      target.closest('a[href*="youtube.com"]') ||
                      target.closest('a[href*="youtu.be"]')
                    )) {
                      e.preventDefault()
                      e.stopPropagation()
                      return false
                    }
                  }}
                  style={{ 
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }}
                />
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