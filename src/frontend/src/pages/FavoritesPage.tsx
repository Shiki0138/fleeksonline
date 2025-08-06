import React from 'react';
import { Box, Container, Typography } from '@mui/material';

export const FavoritesPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">お気に入り</Typography>
    </Container>
  );
};