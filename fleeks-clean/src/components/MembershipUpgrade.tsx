'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Star,
  VideoLibrary,
  Download,
  Hd,
  Block,
  Payment,
} from '@mui/icons-material';
import Crown from './icons/Crown';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  color: 'primary' | 'secondary' | 'warning';
}

const membershipPlans: MembershipPlan[] = [
  {
    id: 'free',
    name: '無料会員',
    price: 0,
    period: '永久',
    features: [
      '動画5分間プレビュー',
      '基本的なコンテンツアクセス',
      'コミュニティ参加',
    ],
    color: 'secondary',
  },
  {
    id: 'premium',
    name: 'プレミアム会員',
    price: 7980,
    period: '月額',
    features: [
      '全動画無制限視聴',
      'HD画質での視聴',
      '広告なし',
      'ダウンロード機能',
      '限定コンテンツアクセス',
      'プレミアムサポート',
    ],
    popular: true,
    color: 'primary',
  },
  {
    id: 'vip',
    name: 'VIP会員',
    price: 14980,
    period: '月額',
    features: [
      'プレミアム会員の全特典',
      '4K画質での視聴',
      '独占コンテンツ',
      '1対1メンタリング',
      'ライブ配信優先アクセス',
      '特別イベント招待',
      '専用コミュニティ',
    ],
    color: 'warning',
  },
];

interface MembershipUpgradeProps {
  currentPlan?: string;
  onUpgradeSuccess?: () => void;
}

export default function MembershipUpgrade({
  currentPlan = 'free',
  onUpgradeSuccess,
}: MembershipUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  const handleUpgradeClick = (planId: string) => {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    
    try {
      // 支払い処理のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 実際の実装では、Stripe, PayPal等の決済APIを使用
      const response = await fetch('/api/membership/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          paymentData,
        }),
      });
      
      if (response.ok) {
        setShowPaymentDialog(false);
        onUpgradeSuccess?.();
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'premium':
        return <Star />;
      case 'vip':
        return <Crown />;
      default:
        return <VideoLibrary />;
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        会員プラン
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
        あなたに最適なプランを選択してください
      </Typography>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {membershipPlans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: currentPlan === plan.id ? 2 : 1,
                borderColor: currentPlan === plan.id ? 'primary.main' : 'divider',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              {plan.popular && (
                <Chip
                  label="人気"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: 20,
                    zIndex: 1,
                  }}
                />
              )}
              {currentPlan === plan.id && (
                <Chip
                  label="現在のプラン"
                  color="success"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: 20,
                    zIndex: 1,
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {getPlanIcon(plan.id)}
                </Box>
                
                <Typography variant="h5" gutterBottom>
                  {plan.name}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" color={plan.color}>
                    ¥{plan.price.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.period}
                  </Typography>
                </Box>

                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant={plan.popular ? 'contained' : 'outlined'}
                  color={plan.color}
                  onClick={() => handleUpgradeClick(plan.id)}
                  disabled={currentPlan === plan.id || plan.id === 'free'}
                  size="large"
                >
                  {currentPlan === plan.id
                    ? '現在のプラン'
                    : plan.id === 'free'
                    ? '無料プラン'
                    : `${plan.name}にアップグレード`
                  }
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 支払いダイアログ */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => !paymentLoading && setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment />
            {selectedPlan && 
              membershipPlans.find(p => p.id === selectedPlan)?.name
            }にアップグレード
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedPlan && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info">
                月額 ¥{membershipPlans.find(p => p.id === selectedPlan)?.price.toLocaleString()}
                の料金が請求されます
              </Alert>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="カード番号"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  cardNumber: e.target.value
                }))}
                disabled={paymentLoading}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="有効期限"
                placeholder="MM/YY"
                value={paymentData.expiry}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  expiry: e.target.value
                }))}
                disabled={paymentLoading}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                placeholder="123"
                value={paymentData.cvv}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  cvv: e.target.value
                }))}
                disabled={paymentLoading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="カード名義人"
                value={paymentData.name}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                disabled={paymentLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setShowPaymentDialog(false)}
            disabled={paymentLoading}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={paymentLoading || !paymentData.cardNumber || !paymentData.name}
            startIcon={paymentLoading ? <CircularProgress size={20} /> : <Payment />}
          >
            {paymentLoading ? '処理中...' : '支払いを完了'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}