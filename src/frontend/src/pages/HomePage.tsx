import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Paper,
  Button,
  Avatar,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { videoApi } from '@/api/videos';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // カテゴリー取得
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => videoApi.getCategories(),
  });

  // 動画一覧取得
  const { data: videosData, isLoading } = useQuery({
    queryKey: ['videos', selectedCategory, searchQuery],
    queryFn: () => videoApi.getVideos({
      categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
      search: searchQuery || undefined,
    }),
  });

  const videos = videosData?.data || [];

  const handleVideoClick = (videoId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/video/${videoId}`);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 10000) {
      return `${Math.floor(count / 10000)}万回`;
    } else if (count >= 1000) {
      return `${Math.floor(count / 1000)}千回`;
    }
    return `${count}回`;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* ヒーローセクション */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              FLEEKS
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
              プレミアムな学習動画を、あなたのペースで
            </Typography>
          </motion.div>

          {/* 会員ステータス表示 */}
          {isAuthenticated && user && (
            <Paper
              elevation={0}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                background: user.membershipType === 'PREMIUM' 
                  ? 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.firstName?.[0]}
              </Avatar>
              <Typography variant="body2">
                {user.firstName} {user.lastName}さん
              </Typography>
              <Chip
                label={user.membershipType === 'PREMIUM' ? 'プレミアム会員' : '無料会員'}
                size="small"
                sx={{
                  bgcolor: user.membershipType === 'PREMIUM' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                }}
              />
            </Paper>
          )}
        </Box>

        {/* 検索バー */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="動画を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              maxWidth: 600,
              mx: 'auto',
              display: 'block',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.paper',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* カテゴリータブ */}
        <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, value) => setSelectedCategory(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
            }}
          >
            <Tab label="すべて" value="all" />
            {categories.map((category: any) => (
              <Tab key={category.id} label={category.name} value={category.id} />
            ))}
          </Tabs>
        </Box>

        {/* 動画グリッド */}
        <Grid container spacing={3}>
          {isLoading ? (
            // スケルトンローディング
            Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" sx={{ fontSize: '1.2rem' }} />
                    <Skeleton variant="text" sx={{ fontSize: '0.9rem' }} />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            // 動画カード
            videos.map((video: any) => (
              <Grid item xs={12} sm={6} md={4} key={video.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -5 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: 4,
                        '& .play-overlay': {
                          opacity: 1,
                        },
                      },
                    }}
                    onClick={() => handleVideoClick(video.id)}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={video.thumbnailUrl}
                        alt={video.title}
                      />
                      {/* 再生時間 */}
                      <Chip
                        label={formatDuration(video.duration)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                        }}
                      />
                      {/* プレイオーバーレイ */}
                      <Box
                        className="play-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      >
                        <IconButton
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                        >
                          <PlayIcon sx={{ fontSize: 40 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom noWrap>
                        {video.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 2,
                        }}
                      >
                        {video.description}
                      </Typography>

                      {/* タグ */}
                      <Box sx={{ mb: 2 }}>
                        {video.tags?.slice(0, 3).map((tag: string, index: number) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            icon={<TagIcon />}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>

                      {/* 統計情報 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ViewIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {formatViewCount(video.viewCount)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FavoriteIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {video._count?.favorites || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2 }}>
                      {!isAuthenticated ? (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<PlayIcon />}
                          onClick={() => navigate('/login')}
                        >
                          ログインして視聴
                        </Button>
                      ) : user?.membershipType === 'FREE' ? (
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ScheduleIcon />}
                        >
                          5分間プレビュー
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<PlayIcon />}
                        >
                          視聴する
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))
          )}
        </Grid>

        {/* 動画がない場合 */}
        {!isLoading && videos.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              動画が見つかりませんでした
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};