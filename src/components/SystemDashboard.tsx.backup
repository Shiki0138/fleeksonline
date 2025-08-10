'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  People,
  VideoLibrary,
  Article,
  LiveTv,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

interface SystemStats {
  totalUsers: number;
  premiumUsers: number;
  totalVideos: number;
  totalViews: number;
  totalBlogPosts: number;
  activeStreams: number;
  scheduledContent: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'video_upload' | 'blog_post' | 'stream_start';
  description: string;
  timestamp: Date;
  user: string;
}

export default function SystemDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalBlogPosts: 0,
    activeStreams: 0,
    scheduledContent: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // 30秒ごとにデータを更新
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 実際の実装では、複数のAPIエンドポイントから並行してデータを取得
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity'),
      ]);

      if (statsRes.ok && activityRes.ok) {
        const statsData = await statsRes.json();
        const activityData = await activityRes.json();
        
        setStats(statsData.data);
        setRecentActivity(activityData.data);
        setSystemHealth('healthy');
      } else {
        setSystemHealth('warning');
      }
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
      setSystemHealth('error');
      
      // フォールバック用のサンプルデータ
      setStats({
        totalUsers: 1247,
        premiumUsers: 312,
        totalVideos: 89,
        totalViews: 15420,
        totalBlogPosts: 45,
        activeStreams: 3,
        scheduledContent: 12,
      });
      
      setRecentActivity([
        {
          id: '1',
          type: 'user_signup',
          description: '新規ユーザー登録',
          timestamp: new Date(Date.now() - 5 * 60000),
          user: 'user@example.com',
        },
        {
          id: '2',
          type: 'video_upload',
          description: 'YouTube動画「美容基礎講座#1」を追加',
          timestamp: new Date(Date.now() - 15 * 60000),
          user: 'admin@fleeks.com',
        },
        {
          id: '3',
          type: 'stream_start',
          description: 'ライブ配信「Q&A セッション」を開始',
          timestamp: new Date(Date.now() - 30 * 60000),
          user: 'instructor@fleeks.com',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_signup':
        return <People />;
      case 'video_upload':
        return <VideoLibrary />;
      case 'blog_post':
        return <Article />;
      case 'stream_start':
        return <LiveTv />;
      default:
        return <CheckCircle />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
  };

  const conversionRate = stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        システムダッシュボード
      </Typography>

      {/* システム状態 */}
      <Alert 
        severity={systemHealth === 'healthy' ? 'success' : systemHealth === 'warning' ? 'warning' : 'error'}
        sx={{ mb: 3 }}
      >
        <Typography variant="subtitle1">
          システム状態: {systemHealth === 'healthy' ? '正常' : systemHealth === 'warning' ? '注意' : 'エラー'}
        </Typography>
        {systemHealth === 'healthy' && '全てのサービスが正常に動作しています'}
        {systemHealth === 'warning' && '一部のサービスで問題が発生している可能性があります'}
        {systemHealth === 'error' && 'システムに問題が発生しています。管理者に連絡してください'}
      </Alert>

      {/* 主要統計 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    総ユーザー数
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                </div>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    プレミアム会員
                  </Typography>
                  <Typography variant="h4">
                    {stats.premiumUsers.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={conversionRate} 
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    転換率: {conversionRate.toFixed(1)}%
                  </Typography>
                </div>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    動画コンテンツ
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalVideos}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    総視聴回数: {stats.totalViews.toLocaleString()}
                  </Typography>
                </div>
                <VideoLibrary color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    アクティブ配信
                  </Typography>
                  <Typography variant="h4">
                    {stats.activeStreams}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    予定: {stats.scheduledContent}件
                  </Typography>
                </div>
                <LiveTv color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 最近のアクティビティ */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最近のアクティビティ
              </Typography>
              
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={`${activity.user} • ${formatTimeAgo(activity.timestamp)}`}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => window.location.href = '/admin/activity'}
              >
                全てのアクティビティを表示
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* クイックアクション */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                クイックアクション
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<VideoLibrary />}
                  onClick={() => window.location.href = '/admin/videos'}
                >
                  動画管理
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<LiveTv />}
                  onClick={() => window.location.href = '/admin/streams'}
                >
                  配信管理
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<Article />}
                  onClick={() => window.location.href = '/admin/blog'}
                >
                  ブログ管理
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  onClick={() => window.location.href = '/admin/users'}
                >
                  ユーザー管理
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                システム状態
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  icon={<CheckCircle />} 
                  label="API サービス" 
                  color="success" 
                  size="small" 
                />
                <Chip 
                  icon={<CheckCircle />} 
                  label="データベース" 
                  color="success" 
                  size="small" 
                />
                <Chip 
                  icon={<CheckCircle />} 
                  label="ストリーミング" 
                  color="success" 
                  size="small" 
                />
                <Chip 
                  icon={<Schedule />} 
                  label="自動投稿" 
                  color="warning" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}