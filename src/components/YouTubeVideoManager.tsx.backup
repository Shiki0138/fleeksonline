'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  YouTube,
  Edit,
  Delete,
  Visibility,
  Download,
  Schedule,
  Analytics,
} from '@mui/icons-material';

interface Video {
  id: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  duration: number;
  categoryId?: string;
  tags: string[];
  viewCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
}

interface VideoFormData {
  youtubeVideoId: string;
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
}

const categories = [
  { id: 'beauty', name: '美容技術' },
  { id: 'skincare', name: 'スキンケア' },
  { id: 'makeup', name: 'メイクアップ' },
  { id: 'hair', name: 'ヘアスタイリング' },
  { id: 'nail', name: 'ネイルアート' },
  { id: 'theory', name: '理論・知識' },
];

export default function YouTubeVideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<VideoFormData>({
    youtubeVideoId: '',
    title: '',
    description: '',
    categoryId: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [videoPreview, setVideoPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      if (data.success) {
        setVideos(data.data);
      }
    } catch (error) {
      console.error('動画の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoIdFromUrl = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    // 既にビデオIDの場合
    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
      return url;
    }
    
    return url;
  };

  const fetchVideoPreview = async (videoId: string) => {
    try {
      setImporting(true);
      const response = await fetch(`/api/youtube/video-info?videoId=${videoId}`);
      const data = await response.json();
      
      if (data.success) {
        setVideoPreview(data.data);
        setFormData(prev => ({
          ...prev,
          title: data.data.title,
          description: data.data.description || '',
        }));
      } else {
        alert('YouTube動画の情報を取得できませんでした');
      }
    } catch (error) {
      console.error('YouTube API error:', error);
      alert('YouTube動画の情報取得に失敗しました');
    } finally {
      setImporting(false);
    }
  };

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const videoId = extractVideoIdFromUrl(input);
    setFormData(prev => ({ ...prev, youtubeVideoId: videoId }));
    
    if (videoId && videoId.length === 11) {
      fetchVideoPreview(videoId);
    } else {
      setVideoPreview(null);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    try {
      const url = editingVideo ? `/api/videos/${editingVideo.id}` : '/api/videos';
      const method = editingVideo ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        thumbnailUrl: videoPreview?.thumbnailUrl || `https://img.youtube.com/vi/${formData.youtubeVideoId}/maxresdefault.jpg`,
        duration: videoPreview?.duration || 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (data.success) {
        fetchVideos();
        handleCloseDialog();
      } else {
        alert(data.message || '操作に失敗しました');
      }
    } catch (error) {
      console.error('Video operation failed:', error);
      alert('操作に失敗しました');
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      youtubeVideoId: video.youtubeVideoId,
      title: video.title,
      description: video.description || '',
      categoryId: video.categoryId || '',
      tags: video.tags,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (video: Video) => {
    if (window.confirm(`「${video.title}」を削除しますか？`)) {
      try {
        const response = await fetch(`/api/videos/${video.id}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        if (data.success) {
          fetchVideos();
        } else {
          alert(data.message || '削除に失敗しました');
        }
      } catch (error) {
        console.error('Delete failed:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVideo(null);
    setFormData({
      youtubeVideoId: '',
      title: '',
      description: '',
      categoryId: '',
      tags: [],
    });
    setNewTag('');
    setVideoPreview(null);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          YouTube動画管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          新しい動画を追加
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video.id}>
              <Card>
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                  <Chip
                    icon={<YouTube />}
                    label={formatDuration(video.duration)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                    }}
                  />
                </Box>
                
                <CardContent>
                  <Typography variant="h6" noWrap gutterBottom>
                    {video.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {video.description && video.description.length > 100
                      ? `${video.description.substring(0, 100)}...`
                      : video.description
                    }
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {video.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                    {video.tags.length > 3 && (
                      <Chip label={`+${video.tags.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility fontSize="small" />
                      <Typography variant="body2">{video.viewCount}</Typography>
                    </Box>
                    
                    <Box>
                      <Tooltip title="編集">
                        <IconButton onClick={() => handleEdit(video)} size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton onClick={() => handleDelete(video)} size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 動画追加/編集ダイアログ */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingVideo ? '動画を編集' : '新しい動画を追加'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="YouTube URL または 動画ID"
              placeholder="https://www.youtube.com/watch?v=... または dQw4w9WgXcQ"
              value={formData.youtubeVideoId}
              onChange={handleVideoIdChange}
              margin="normal"
              disabled={importing}
            />
            
            {importing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2 }}>
                <CircularProgress size={20} />
                <Typography>YouTube動画情報を取得中...</Typography>
              </Box>
            )}
            
            {videoPreview && (
              <Alert severity="success" sx={{ my: 2 }}>
                <Typography variant="subtitle2">プレビュー取得成功</Typography>
                <Typography variant="body2">{videoPreview.title}</Typography>
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="タイトル"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="説明"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>カテゴリー</InputLabel>
              <Select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                タグ
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="タグを追加"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                  追加
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.youtubeVideoId || !formData.title || importing}
          >
            {editingVideo ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}