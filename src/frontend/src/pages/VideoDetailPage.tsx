import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Skeleton,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Schedule as ScheduleIcon,
  LocalOffer as TagIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { videoApi } from '@/api/videos';

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const playerRef = useRef<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [timeWarningShown, setTimeWarningShown] = useState(false);

  const isFreeMember = user?.membershipType === 'FREE';
  const maxFreeViewTime = 300; // 5分 = 300秒

  // 動画詳細取得
  const { data: video, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: () => videoApi.getVideoDetail(id!),
    enabled: !!id,
  });

  // お気に入り状態
  const { data: isFavorite = false } = useQuery({
    queryKey: ['favorite', id],
    queryFn: () => videoApi.checkFavorite(id!),
    enabled: !!id && !!user,
  });

  // お気に入り切り替え
  const favoriteMutation = useMutation({
    mutationFn: () => videoApi.toggleFavorite(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // 視聴履歴更新
  const updateHistoryMutation = useMutation({
    mutationFn: (watchedDuration: number) => 
      videoApi.updateViewingHistory(id!, watchedDuration),
  });

  // YouTube Player API読み込み
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      if (video && playerRef.current) {
        const ytPlayer = new window.YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: video.youtubeVideoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              setDuration(event.target.getDuration());
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player && video) {
      window.onYouTubeIframeAPIReady();
    }
  }, [video]);

  // 再生時間監視（無料会員の5分制限）
  useEffect(() => {
    if (!player || !isPlaying || !isFreeMember) return;

    const interval = setInterval(() => {
      const time = player.getCurrentTime();
      setCurrentTime(time);

      // 4分30秒で警告
      if (time >= 270 && !timeWarningShown) {
        setTimeWarningShown(true);
      }

      // 5分で停止
      if (time >= maxFreeViewTime) {
        player.pauseVideo();
        setShowUpgradeDialog(true);
        updateHistoryMutation.mutate(maxFreeViewTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isPlaying, isFreeMember, timeWarningShown]);

  // コンポーネントアンマウント時に視聴履歴を更新
  useEffect(() => {
    return () => {
      if (player && currentTime > 0) {
        updateHistoryMutation.mutate(Math.floor(currentTime));
      }
    };
  }, [currentTime]);

  const handleToggleFavorite = () => {
    favoriteMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={600} sx={{ mb: 2 }} />
        <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 1 }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem' }} width="60%" />
      </Container>
    );
  }

  if (!video) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">動画が見つかりませんでした</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* プレイヤーエリア */}
          <Paper
            elevation={3}
            sx={{
              position: 'relative',
              paddingTop: '56.25%', // 16:9 aspect ratio
              mb: 3,
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            <Box
              ref={playerRef}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />

            {/* 無料会員の時間制限表示 */}
            {isFreeMember && (
              <AnimatePresence>
                {currentTime > 0 && currentTime < maxFreeViewTime && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 10,
                    }}
                  >
                    <Paper
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: currentTime >= 270 ? 'error.main' : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="body2">
                        無料視聴: {formatTime(currentTime)} / {formatTime(maxFreeViewTime)}
                      </Typography>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </Paper>

          {/* 動画情報 */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {video.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={video.category.name}
                    color="primary"
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(video.duration)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {video.viewCount}回視聴
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={handleToggleFavorite}
                disabled={!user}
                sx={{ color: isFavorite ? 'error.main' : 'text.secondary' }}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              {video.description}
            </Typography>

            {/* タグ */}
            {video.tags && video.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {video.tags.map((tag: string, index: number) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    icon={<TagIcon />}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* プログレスバー（無料会員のみ） */}
          {isFreeMember && duration > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                無料視聴可能時間
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(currentTime / maxFreeViewTime) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  '& .MuiLinearProgress-bar': {
                    background: currentTime >= 270
                      ? 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)'
                      : 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
                  },
                }}
              />
            </Box>
          )}
        </motion.div>
      </Container>

      {/* アップグレードダイアログ */}
      <Dialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5">
            無料視聴時間が終了しました
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center" paragraph>
            この動画の続きを視聴するには、プレミアムプランへのアップグレードが必要です。
          </Typography>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              プレミアムプランの特典
            </Typography>
            <Typography variant="body2" paragraph>
              ✓ すべての動画を制限なしで視聴<br />
              ✓ 新しい動画への早期アクセス<br />
              ✓ 視聴履歴・分析機能<br />
              ✓ 優先サポート
            </Typography>
            <Typography variant="h6" color="secondary.main">
              ¥980/月
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setShowUpgradeDialog(false)}
          >
            後で検討する
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/profile')}
            sx={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)',
              },
            }}
          >
            アップグレードする
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};