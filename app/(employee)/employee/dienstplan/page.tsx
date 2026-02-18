'use client';

import { NurseScheduleView } from '@/components/schedule/NurseScheduleView';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessAdminArea } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect users with admin area access to admin shifts page
      if (canAccessAdminArea) {
        router.push('/admin/schichten');
        return;
      }
    }
  }, [user, authLoading, router, canAccessAdminArea]);

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

  // Show error if user is admin (should be redirected)
  if (canAccessAdminArea) {
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
  return (
    <PageContainer maxWidth="wide">
      <NurseScheduleView />
    </PageContainer>
  );
}
