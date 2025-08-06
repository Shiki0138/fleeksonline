import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

const steps = ['アカウント情報', 'プラン選択', '確認'];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    membershipType: 'FREE',
  });

  const handleNext = () => {
    if (activeStep === 0) {
      // バリデーション
      if (!formData.email || !formData.username || !formData.password || !formData.firstName || !formData.lastName) {
        setError('すべての項目を入力してください');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('パスワードが一致しません');
        return;
      }
      if (formData.password.length < 8) {
        setError('パスワードは8文字以上で入力してください');
        return;
      }
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登録に失敗しました');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="ユーザー名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="姓"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="名"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Box>

            <TextField
              fullWidth
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="8文字以上で入力してください"
            />

            <TextField
              fullWidth
              label="パスワード（確認）"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </>
        );

      case 1:
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={formData.membershipType}
              onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
            >
              <Paper
                sx={{
                  mb: 2,
                  p: 3,
                  border: formData.membershipType === 'FREE' ? '2px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
                onClick={() => setFormData({ ...formData, membershipType: 'FREE' })}
              >
                <FormControlLabel
                  value="FREE"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="h6">無料プラン</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ・動画の最初の5分間を視聴可能<br />
                        ・基本的な機能を利用可能
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              <Paper
                sx={{
                  p: 3,
                  border: formData.membershipType === 'PREMIUM' ? '2px solid #EC4899' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  background: formData.membershipType === 'PREMIUM' ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)' : undefined,
                }}
                onClick={() => setFormData({ ...formData, membershipType: 'PREMIUM' })}
              >
                <FormControlLabel
                  value="PREMIUM"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="h6">
                        プレミアムプラン
                        <Typography component="span" sx={{ ml: 1, color: 'secondary.main' }}>
                          ¥980/月
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ・すべての動画を制限なしで視聴可能<br />
                        ・新しい動画への早期アクセス<br />
                        ・視聴履歴・分析機能<br />
                        ・優先サポート
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>
          </FormControl>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              登録内容の確認
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">メールアドレス</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.email}</Typography>

              <Typography variant="body2" color="text.secondary">ユーザー名</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.username}</Typography>

              <Typography variant="body2" color="text.secondary">お名前</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.lastName} {formData.firstName}</Typography>

              <Typography variant="body2" color="text.secondary">プラン</Typography>
              <Typography variant="body1">
                {formData.membershipType === 'FREE' ? '無料プラン' : 'プレミアムプラン (¥980/月)'}
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 5,
              borderRadius: 3,
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* ロゴ */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}
              >
                FLEEKS
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                新規アカウント登録
              </Typography>
            </Box>

            {/* ステッパー */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* エラーメッセージ */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* コンテンツ */}
            <Box sx={{ mb: 4 }}>
              {renderStepContent()}
            </Box>

            {/* ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                戻る
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  sx={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)',
                    },
                  }}
                >
                  {isLoading ? '登録中...' : '登録する'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)',
                    },
                  }}
                >
                  次へ
                </Button>
              )}
            </Box>

            {/* リンク */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                すでにアカウントをお持ちの方は{' '}
                <Link component={RouterLink} to="/login" underline="hover">
                  ログイン
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};