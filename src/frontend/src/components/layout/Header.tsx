import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar>
        {/* ロゴ */}
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          FLEEKS
        </Typography>

        {/* ユーザーメニュー */}
        {isAuthenticated && user ? (
          <>
            <Chip
              label={user.membershipType === 'PREMIUM' ? 'プレミアム' : '無料'}
              size="small"
              sx={{
                mr: 2,
                bgcolor: user.membershipType === 'PREMIUM' 
                  ? 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
              }}
            />
            <IconButton
              onClick={handleMenuClick}
              sx={{ color: 'white' }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.firstName?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  background: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  navigate('/profile');
                  handleMenuClose();
                }}
              >
                <PersonIcon sx={{ mr: 1 }} />
                プロフィール
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate('/favorites');
                  handleMenuClose();
                }}
              >
                <FavoriteIcon sx={{ mr: 1 }} />
                お気に入り
              </MenuItem>
              {user?.email === 'greenroom51@gmail.com' && (
                <MenuItem
                  onClick={() => {
                    navigate('/admin');
                    handleMenuClose();
                  }}
                >
                  <AdminIcon sx={{ mr: 1 }} />
                  管理者ダッシュボード
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                ログアウト
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)',
              },
            }}
          >
            ログイン
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};