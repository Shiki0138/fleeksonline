import React from 'react';
import { Box, Container, Typography } from '@mui/material';

export const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">プロフィール</Typography>
    </Container>
  );
};