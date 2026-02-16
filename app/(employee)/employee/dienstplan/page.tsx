'use client';

import { NurseScheduleView } from '@/components/schedule/NurseScheduleView';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect Admins/Dispatchers to admin shifts page
      if (user.role === 'admin' || user.role === 'dispatcher') {
        router.push('/admin/schichten');
        return;
      }
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Nicht angemeldet
          </Typography>
          <Typography variant="body2">
            Bitte melde dich an, um auf den Dienstplan zuzugreifen.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Show error if user is admin/dispatcher (should be redirected)
  if (user.role === 'admin' || user.role === 'dispatcher') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            Weiterleitung...
          </Typography>
          <Typography variant="body2">
            Du wirst zur Admin-Schichtverwaltung weitergeleitet.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Show nurse schedule view
  return <NurseScheduleView />;
}
