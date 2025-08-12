'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Star,
  WorkspacePremium,
  PlayCircle,
  Download,
  HD,
  NoAds,
  Support,
  Speed,
} from '@mui/icons-material';

interface VideoUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'premium' | 'vip') => void;
  currentVideoTitle?: string;
  remainingTime?: number;
}

interface PlanFeature {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}

const premiumFeatures: PlanFeature[] = [
  { icon: <PlayCircle />, text: '全動画を無制限で視聴', highlight: true },
  { icon: <HD />, text: 'HD画質での視聴' },
  { icon: <NoAds />, text: '広告なしの快適な視聴体験' },
  { icon: <Download />, text: 'オフライン視聴用ダウンロード' },
  { icon: <Support />, text: 'プレミアムサポート' },
];

const vipFeatures: PlanFeature[] = [
  { icon: <Star />, text: 'プレミアム会員の全特典', highlight: true },
  { icon: <WorkspacePremium />, text: '4K画質での視聴' },
  { icon: <Speed />, text: '最速アクセス・優先配信' },
  { icon: <Star />, text: '独占コンテンツ・限定動画' },
  { icon: <Support />, text: '24時間VIPサポート' },
];

export default function VideoUpgradeModal({
  open,
  onClose,
  onUpgrade,
  currentVideoTitle,
  remainingTime = 0,
}: VideoUpgradeModalProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}分${secs}秒`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div">
            🎬 プレミアムコンテンツをお楽しみください
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Current Status */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <Typography variant="body1" color="warning.main" gutterBottom>
            ⏱️ 無料プレビューは残り{formatTime(remainingTime)}です
          </Typography>
          {currentVideoTitle && (
            <Typography variant="body2" color="grey.400">
              視聴中: {currentVideoTitle}
            </Typography>
          )}
        </Box>

        {/* Plans */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Premium Plan */}
          <Card 
            sx={{ 
              flex: 1,
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              border: '2px solid',
              borderColor: 'primary.main',
              position: 'relative',
            }}
          >
            <Chip
              label="おすすめ"
              color="primary"
              size="small"
              sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
            />
            <CardContent>
              <Typography variant="h6" align="center" color="primary" gutterBottom>
                プレミアム会員
              </Typography>
              <Typography variant="h3" align="center" color="white" gutterBottom>
                ¥7,980
                <Typography component="span" variant="body2" color="grey.400">
                  /月
                </Typography>
              </Typography>
              <List dense sx={{ mb: 2 }}>
                {premiumFeatures.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: feature.highlight ? 'primary.main' : 'grey.400' }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature.text}
                      primaryTypographyProps={{ 
                        color: feature.highlight ? 'white' : 'grey.300',
                        fontWeight: feature.highlight ? 600 : 400,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={() => onUpgrade('premium')}
                sx={{ mt: 2 }}
              >
                プレミアムに登録
              </Button>
            </CardContent>
          </Card>

          {/* VIP Plan */}
          <Card 
            sx={{ 
              flex: 1,
              bgcolor: 'rgba(251, 191, 36, 0.1)',
              border: '2px solid',
              borderColor: 'warning.main',
            }}
          >
            <CardContent>
              <Typography variant="h6" align="center" color="warning.main" gutterBottom>
                VIP会員
              </Typography>
              <Typography variant="h3" align="center" color="white" gutterBottom>
                ¥14,980
                <Typography component="span" variant="body2" color="grey.400">
                  /月
                </Typography>
              </Typography>
              <List dense sx={{ mb: 2 }}>
                {vipFeatures.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: feature.highlight ? 'warning.main' : 'grey.400' }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature.text}
                      primaryTypographyProps={{ 
                        color: feature.highlight ? 'white' : 'grey.300',
                        fontWeight: feature.highlight ? 600 : 400,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                size="large"
                onClick={() => onUpgrade('vip')}
                sx={{ mt: 2 }}
              >
                VIPに登録
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Additional Benefits */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="grey.300" align="center">
            ✨ 今すぐアップグレードして、すべての美容コンテンツにアクセス
          </Typography>
          <Typography variant="body2" color="grey.500" align="center" sx={{ mt: 1 }}>
            いつでもキャンセル可能 • 安全な決済 • 即時アクセス
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button onClick={onClose} color="inherit" sx={{ color: 'grey.400' }}>
          後で検討する
        </Button>
      </DialogActions>
    </Dialog>
  );
}