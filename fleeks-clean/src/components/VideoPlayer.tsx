'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Crown } from 'lucide-react'

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
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 1,
            disablekb: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
            widget_referrer: window.location.href,
            // 埋め込み専用設定
            playsinline: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingTime = Math.max(0, FREE_LIMIT_SECONDS - timeWatched)

  return (
    <div className="relative w-full">
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
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {!isRestricted ? (
          <div ref={playerRef} className="w-full h-full" />
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