import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  VideoLibrary as VideoIcon,
  Article as BlogIcon,
  LiveTv as LiveIcon,
  People as UsersIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { adminApi } from '@/api/admin';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [videoDialog, setVideoDialog] = useState(false);
  const [blogDialog, setBlogDialog] = useState(false);
  const [liveDialog, setLiveDialog] = useState(false);
  const [error, setError] = useState('');
  
  // 動画追加フォーム
  const [videoForm, setVideoForm] = useState({
    youtubeUrl: '',
    categoryId: '',
    customTitle: '',
    customDescription: '',
    tags: '',
  });

  // ブログ投稿フォーム
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    tags: '',
    isPublished: false,
  });

  // ライブ配信フォーム
  const [liveForm, setLiveForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    scheduledAt: '',
    tags: '',
    isPrivate: false,
  });

  // 管理者チェック
  if (user?.email !== 'greenroom51@gmail.com') {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">
          管理者権限が必要です
        </Alert>
      </Container>
    );
  }

  // 統計情報取得
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
  });

  // カテゴリー一覧取得
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminApi.getCategories(),
  });

  // 動画追加
  const addVideoMutation = useMutation({
    mutationFn: (data: any) => adminApi.addVideoFromUrl(data),
    onSuccess: () => {
      setVideoDialog(false);
      setVideoForm({ youtubeUrl: '', categoryId: '', customTitle: '', customDescription: '', tags: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || '動画の追加に失敗しました');
    },
  });

  // ブログ投稿
  const addBlogMutation = useMutation({
    mutationFn: (data: any) => adminApi.createBlogPost(data),
    onSuccess: () => {
      setBlogDialog(false);
      setBlogForm({ title: '', content: '', excerpt: '', categoryId: '', tags: '', isPublished: false });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'ブログ投稿に失敗しました');
    },
  });

  // ライブ配信作成
  const addLiveMutation = useMutation({
    mutationFn: (data: any) => adminApi.createLiveStream(data),
    onSuccess: () => {
      setLiveDialog(false);
      setLiveForm({ title: '', description: '', categoryId: '', scheduledAt: '', tags: '', isPrivate: false });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'ライブ配信の作成に失敗しました');
    },
  });

  const handleVideoSubmit = () => {
    const tags = videoForm.tags ? videoForm.tags.split(',').map(tag => tag.trim()) : [];
    addVideoMutation.mutate({
      ...videoForm,
      tags,
    });
  };

  const handleBlogSubmit = () => {
    const tags = blogForm.tags ? blogForm.tags.split(',').map(tag => tag.trim()) : [];
    addBlogMutation.mutate({
      ...blogForm,
      tags,
    });
  };

  const handleLiveSubmit = () => {
    const tags = liveForm.tags ? liveForm.tags.split(',').map(tag => tag.trim()) : [];
    addLiveMutation.mutate({
      ...liveForm,
      tags,
      scheduledAt: liveForm.scheduledAt ? new Date(liveForm.scheduledAt).toISOString() : null,
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            管理者ダッシュボード
          </Typography>
          <Typography variant="body1" color="text.secondary">
            FLEEKS プラットフォームの管理
          </Typography>
        </Box>

        {/* 統計カード */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <UsersIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4">{stats.overview.totalUsers}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        総ユーザー数
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VideoIcon color="secondary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4">{stats.overview.totalVideos}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        総動画数
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AnalyticsIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4">{stats.overview.totalViews}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        総視聴数
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <UsersIcon color="warning" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4">{stats.overview.premiumUsers}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        プレミアム会員
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* タブメニュー */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, value) => setCurrentTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<VideoIcon />} label="動画管理" />
            <Tab icon={<BlogIcon />} label="ブログ管理" />
            <Tab icon={<LiveIcon />} label="ライブ配信" />
            <Tab icon={<UsersIcon />} label="ユーザー管理" />
          </Tabs>
        </Paper>

        {/* タブコンテンツ */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">動画管理</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setVideoDialog(true)}
            >
              動画追加
            </Button>
          </Box>
          {/* 動画一覧はここに実装 */}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">ブログ管理</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setBlogDialog(true)}
            >
              ブログ投稿
            </Button>
          </Box>
          {/* ブログ一覧はここに実装 */}
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">ライブ配信管理</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setLiveDialog(true)}
            >
              配信作成
            </Button>
          </Box>
          {/* ライブ配信一覧はここに実装 */}
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6">ユーザー管理</Typography>
          {/* ユーザー一覧はここに実装 */}
        </TabPanel>
      </Container>

      {/* 動画追加ダイアログ */}
      <Dialog open={videoDialog} onClose={() => setVideoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>YouTube動画を追加</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              fullWidth
              label="YouTube URL"
              value={videoForm.youtubeUrl}
              onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <FormControl fullWidth required>
              <InputLabel>カテゴリー</InputLabel>
              <Select
                value={videoForm.categoryId}
                onChange={(e) => setVideoForm({ ...videoForm, categoryId: e.target.value })}
              >
                {categories.map((category: any) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="カスタムタイトル（オプション）"
              value={videoForm.customTitle}
              onChange={(e) => setVideoForm({ ...videoForm, customTitle: e.target.value })}
              helperText="空欄の場合はYouTubeのタイトルを使用"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="カスタム説明（オプション）"
              value={videoForm.customDescription}
              onChange={(e) => setVideoForm({ ...videoForm, customDescription: e.target.value })}
              helperText="空欄の場合はYouTubeの説明を使用"
            />
            <TextField
              fullWidth
              label="タグ（カンマ区切り）"
              value={videoForm.tags}
              onChange={(e) => setVideoForm({ ...videoForm, tags: e.target.value })}
              placeholder="プログラミング, React, JavaScript"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoDialog(false)}>キャンセル</Button>
          <Button
            onClick={handleVideoSubmit}
            variant="contained"
            disabled={!videoForm.youtubeUrl || !videoForm.categoryId || addVideoMutation.isPending}
          >
            {addVideoMutation.isPending ? '追加中...' : '動画追加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ブログ投稿ダイアログ */}
      <Dialog open={blogDialog} onClose={() => setBlogDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>ブログ記事を投稿</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              fullWidth
              label="タイトル"
              value={blogForm.title}
              onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={8}
              label="本文"
              value={blogForm.content}
              onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="抜粋"
              value={blogForm.excerpt}
              onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
              helperText="記事の要約（150文字程度）"
            />
            <TextField
              fullWidth
              label="タグ（カンマ区切り）"
              value={blogForm.tags}
              onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
              placeholder="技術, 開発, チュートリアル"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="blog-published"
                checked={blogForm.isPublished}
                onChange={(e) => setBlogForm({ ...blogForm, isPublished: e.target.checked })}
              />
              <label htmlFor="blog-published">すぐに公開する</label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlogDialog(false)}>キャンセル</Button>
          <Button
            onClick={handleBlogSubmit}
            variant="contained"
            disabled={!blogForm.title || !blogForm.content || addBlogMutation.isPending}
          >
            {addBlogMutation.isPending ? '投稿中...' : '投稿'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ライブ配信作成ダイアログ */}
      <Dialog open={liveDialog} onClose={() => setLiveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>ライブ配信を作成</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              fullWidth
              label="配信タイトル"
              value={liveForm.title}
              onChange={(e) => setLiveForm({ ...liveForm, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="配信説明"
              value={liveForm.description}
              onChange={(e) => setLiveForm({ ...liveForm, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>カテゴリー</InputLabel>
              <Select
                value={liveForm.categoryId}
                onChange={(e) => setLiveForm({ ...liveForm, categoryId: e.target.value })}
              >
                {categories.map((category: any) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="datetime-local"
              label="配信開始予定時刻"
              value={liveForm.scheduledAt}
              onChange={(e) => setLiveForm({ ...liveForm, scheduledAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="空欄の場合はすぐに配信開始"
            />
            <TextField
              fullWidth
              label="タグ（カンマ区切り）"
              value={liveForm.tags}
              onChange={(e) => setLiveForm({ ...liveForm, tags: e.target.value })}
              placeholder="ライブ, 配信, リアルタイム"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="live-private"
                checked={liveForm.isPrivate}
                onChange={(e) => setLiveForm({ ...liveForm, isPrivate: e.target.checked })}
              />
              <label htmlFor="live-private">プライベート配信（限定公開）</label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLiveDialog(false)}>キャンセル</Button>
          <Button
            onClick={handleLiveSubmit}
            variant="contained"
            disabled={!liveForm.title || addLiveMutation.isPending}
          >
            {addLiveMutation.isPending ? '作成中...' : '配信作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};