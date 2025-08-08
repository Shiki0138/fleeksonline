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
  const playerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const FREE_LIMIT_SECONDS = 300 // 5分 = 300秒
  const canWatchFull = userMembershipType !== 'free' || !isPremium

  useEffect(() => {
    // YouTube Player APIを読み込み
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      if (playerRef.current) {
        // @ts-ignore
        const ytPlayer = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1, // 基本コントロールは表示（CSSで制御）
            modestbranding: 1,
            rel: 0,
            fs: userMembershipType === 'free' ? 0 : 1, // 無料会員はフルスクリーン無効
            iv_load_policy: 3,
            origin: window.location.origin,
            playsinline: 1,
            disablekb: userMembershipType === 'free' ? 1 : 0, // 無料会員はキーボード操作無効
            showinfo: 0, // 動画情報を非表示
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: (event: any) => {
              console.error('YouTube Player Error:', event.data)
              // エラーコード: 2 = 無効な動画ID, 5 = HTML5プレーヤーエラー, 100 = 動画が見つからない, 101/150 = 埋め込み不可
            }
          },
        })
        setPlayer(ytPlayer)
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
    // 無料会員の場合、再生時間を監視
    if (!canWatchFull) {
      console.log('Free user watching premium content - 5 minute limit applies')
    }
  }

  const onPlayerStateChange = (event: any) => {
    // 再生状態の更新
    setIsPlaying(event.data === 1)
    
    // 再生中
    if (event.data === 1) {
      if (!canWatchFull && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setTimeWatched((prev) => {
            const newTime = prev + 1
            if (newTime >= FREE_LIMIT_SECONDS) {
              player.pauseVideo()
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

  return (
    <div className="relative w-full">
      {/* 無料会員向けのCSS（YouTubeリンクを隠すスタイル） */}
      {userMembershipType === 'free' && (
        <style jsx>{`
          /* 無料会員向け：YouTube特有の要素を非表示 */
          .ytp-watermark,
          .ytp-youtube-button,
          .ytp-title-link,
          .ytp-title,
          .ytp-show-cards-title,
          .ytp-cards-button,
          .ytp-context-menu-popup,
          .ytp-popup,
          .ytp-miniplayer-button,
          .ytp-size-button,
          .ytp-remote-button,
          .ytp-share-button,
          .ytp-watch-later-button,
          .ytp-overflow-button {
            display: none !important;
          }
          
          /* 無料会員：右クリック防止だけで、基本的な再生は許可 */
          iframe {
            pointer-events: auto;
          }
          
          .player-overlay {
            pointer-events: auto;
          }
          
          /* 無料会員向け：選択を無効化 */
          .free-member-container {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
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
                {/* 無料会員の警告表示 */}
                <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs pointer-events-none z-10">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3 h-3 text-blue-400" />
                    <span>無料会員 - 5分プレビュー中</span>
                  </div>
                </div>
                
                {/* 右クリック防止（軽量版） */}
                <div 
                  className="absolute inset-0 bg-transparent pointer-events-none z-5"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ 
                    userSelect: 'none',
                    pointerEvents: 'none' // 基本的な再生は妨害しない
                  }}
                />
              </>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-indigo-900/90 flex items-center justify-center"
          >
            <div className="text-center p-8 max-w-md">
              <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">視聴制限に達しました</h3>
              <p className="text-gray-300 mb-6">
                この動画の続きを視聴するには、プレミアム会員へのアップグレードが必要です
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-3">
                  <Crown className="w-8 h-8 text-yellow-400 mr-2" />
                  <span className="text-xl font-semibold">プレミアム会員特典</span>
                </div>
                <ul className="text-sm text-gray-300 space-y-2 text-left">
                  <li>✓ 全動画を無制限で視聴</li>
                  <li>✓ HD画質での視聴</li>
                  <li>✓ 限定コンテンツへのアクセス</li>
                  <li>✓ 広告なしの快適な視聴体験</li>
                </ul>
              </div>
              <a
                href="/membership/upgrade"
                className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold px-8 py-3 rounded-full hover:shadow-lg transition"
              >
                プレミアムにアップグレード
              </a>
            </div>
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