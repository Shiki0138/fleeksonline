import React, { useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { AppBar } from './AppBar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useSocket } from '@/hooks/useSocket';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { tokens } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  
  // Initialize socket connection and event listeners
  useSocket();

  useEffect(() => {
    if (tokens?.accessToken) {
      connect(tokens.accessToken);
    }

    return () => {
      disconnect();
    };
  }, [tokens?.accessToken, connect, disconnect]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for AppBar height
          ml: 30, // Account for Sidebar width
        }}
      >
        {children}
      </Box>
    </Box>
  );
};