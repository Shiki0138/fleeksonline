import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit as EditIcon, Lock as LockIcon } from '@mui/icons-material';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const Profile: React.FC = () => {
  const { user, updateProfile, changePassword, isLoading, error } = useAuthStore();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setSuccess('Password changed successfully');
      setIsPasswordDialogOpen(false);
      resetPassword();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handlePasswordDialogClose = () => {
    setIsPasswordDialogOpen(false);
    resetPassword();
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile Settings
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}
              src={user?.avatar}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role: {user?.role}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>

          <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)} sx={{ mt: 2 }}>
            <TextField
              {...registerProfile('name')}
              margin="normal"
              required
              fullWidth
              label="Full Name"
              error={!!profileErrors.name}
              helperText={profileErrors.name?.message}
            />

            <TextField
              {...registerProfile('email')}
              margin="normal"
              required
              fullWidth
              label="Email Address"
              type="email"
              error={!!profileErrors.email}
              helperText={profileErrors.email?.message}
            />

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<EditIcon />}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Update Profile'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Account Information */}
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              User ID: {user?.id}
            </Typography>
          </Box>
        </Paper>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onClose={handlePasswordDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                {...registerPassword('currentPassword')}
                margin="normal"
                required
                fullWidth
                label="Current Password"
                type="password"
                error={!!passwordErrors.currentPassword}
                helperText={passwordErrors.currentPassword?.message}
              />

              <TextField
                {...registerPassword('newPassword')}
                margin="normal"
                required
                fullWidth
                label="New Password"
                type="password"
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword?.message}
              />

              <TextField
                {...registerPassword('confirmPassword')}
                margin="normal"
                required
                fullWidth
                label="Confirm New Password"
                type="password"
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword?.message}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePasswordDialogClose}>Cancel</Button>
            <Button
              onClick={handlePasswordSubmit(onPasswordSubmit)}
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};