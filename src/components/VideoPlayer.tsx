'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Alert, LinearProgress, Skeleton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, Fullscreen, Upgrade, Timer } from '@mui/icons-material';
import { useVideoAccess } from '../hooks/useVideoAccess';
import VideoUpgradeModal from './VideoUpgradeModal';
import { useRouter } from 'next/navigation';

interface VideoPlayerProps {
  videoId: string;
  youtubeVideoId: string;
  title: string;
  duration: number;
  userMembershipType: 'FREE' | 'PREMIUM' | 'VIP';
  onUpgradeClick?: () => void;
}

export default function VideoPlayer({
  videoId,
  youtubeVideoId,
  title,
  duration,
  userMembershipType,
  onUpgradeClick
}: VideoPlayerProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Use video access hook
  const {
    accessState,
    loading: accessLoading,
    error: accessError,
    isPremiumUser,
    updateWatchedDuration,
    freeUserLimit,
  } = useVideoAccess({
    videoId,
    userMembershipType,
    videoDuration: duration,
  });

  const timeLimit = isPremiumUser ? duration : Math.min(freeUserLimit, duration);

  useEffect(() => {
    // YouTube APIの読み込み
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [youtubeVideoId]);

  const initializePlayer = () => {
    playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
      videoId: youtubeVideoId,
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = () => {
    setPlayerReady(true);
    // If user has watched before, seek to last position
    if (accessState.watchedDuration > 0 && accessState.watchedDuration < freeUserLimit) {
      playerRef.current?.seekTo(accessState.watchedDuration, true);
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startTimeTracking();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      stopTimeTracking();
    }
  };

  const startTimeTracking = () => {
    intervalRef.current = setInterval(async () => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // Update watched duration every 5 seconds
        if (time - lastUpdateRef.current >= 5) {
          lastUpdateRef.current = time;
          const hasReached = await updateWatchedDuration(Math.floor(time));
          
          // Check if free user has reached limit
          if (!isPremiumUser && hasReached) {
            playerRef.current.pauseVideo();
            setShowUpgradeDialog(true);
          }
        }

        // Also check immediate limit
        if (!isPremiumUser && time >= freeUserLimit && accessState.canWatch) {
          playerRef.current.pauseVideo();
          setShowUpgradeDialog(true);
          await updateWatchedDuration(freeUserLimit);
        }
      }
    }, 1000);
  };

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Update final watched duration
    if (currentTime > 0) {
      updateWatchedDuration(Math.floor(currentTime));
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current && playerReady) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        if (!accessState.canWatch) {
          setShowUpgradeDialog(true);
        } else {
          playerRef.current.playVideo();
        }
      }
    }
  };

  const handleUpgrade = useCallback((plan: 'premium' | 'vip') => {
    setShowUpgradeDialog(false);
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      router.push(`/upgrade?plan=${plan}&from=video`);
    }
  }, [onUpgradeClick, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / timeLimit) * 100;
  const remainingTime = isPremiumUser 
    ? Math.max(0, duration - currentTime)
    : Math.max(0, accessState.remainingTime);

  // Show loading state while fetching access data
  if (accessLoading) {
    return (
      <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
        <Skeleton variant="rectangular" height={450} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={60} />
        <Skeleton variant="text" height={40} width="60%" />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      {/* 動画プレイヤー */}
      <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        <div
          id={`youtube-player-${videoId}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
        
        {/* オーバーレイ（制限到達時） */}
        {!isPremiumUser && accessState.hasReachedLimit && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
          }}>
            <Timer sx={{ fontSize: 48, mb: 2, color: 'error.main' }} />
            <Typography variant="h4" gutterBottom>
              無料プレビューが終了しました
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
              続きを視聴するにはプレミアム会員にアップグレードしてください
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Upgrade />}
              onClick={() => setShowUpgradeDialog(true)}
              sx={{ 
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                boxShadow: 3,
              }}
            >
              今すぐアップグレード
            </Button>
          </Box>
        )}
      </Box>

      {/* コントロールバー */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Button
            onClick={togglePlayPause}
            startIcon={isPlaying ? <Pause /> : <PlayArrow />}
            variant="outlined"
          >
            {isPlaying ? '一時停止' : '再生'}
          </Button>
          
          <Box sx={{ flexGrow: 1, mx: 2 }}>
            <Box sx={{
              width: '100%',
              height: 4,
              bgcolor: 'grey.300',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <Box sx={{
                width: `${progressPercentage}%`,
                height: '100%',
                bgcolor: isFreeMember ? 'warning.main' : 'primary.main',
                transition: 'width 0.3s ease',
              }} />
            </Box>
          </Box>
          
          <Typography variant="body2">
            {formatTime(currentTime)} / {formatTime(timeLimit)}
          </Typography>
        </Box>

        {/* 無料会員向け制限表示 */}
        {!isPremiumUser && (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity={accessState.hasReachedLimit ? 'error' : 'warning'}
              icon={<Timer />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setShowUpgradeDialog(true)}
                  startIcon={<Upgrade />}
                >
                  アップグレード
                </Button>
              }
            >
              {accessState.hasReachedLimit
                ? '無料プレビュー時間が終了しました'
                : `無料プレビュー残り時間: ${formatTime(remainingTime)}`
              }
            </Alert>
            
            {/* Progress bar for free limit */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                視聴進捗: {Math.floor((accessState.watchedDuration / freeUserLimit) * 100)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(accessState.watchedDuration / freeUserLimit) * 100}
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.800',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: accessState.hasReachedLimit ? 'error.main' : 'warning.main',
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* アップグレードモーダル */}
      <VideoUpgradeModal
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        onUpgrade={handleUpgrade}
        currentVideoTitle={title}
        remainingTime={remainingTime}
      />
    </Box>
  );
}

// グローバル型定義の拡張
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}