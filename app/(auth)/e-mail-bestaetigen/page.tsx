'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Button, Paper, Alert, CircularProgress } from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { toast } from '@/lib/utils/toast';
import { ROUTES } from '@/lib/constants/routes';

export default function EmailVerifyPage() {
  const { user, firebaseUser, loading, sendEmailVerificationEmail } = useAuth();
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !firebaseUser) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (firebaseUser.emailVerified) {
      const target = user.role === 'admin' ? ROUTES.ADMIN.SHIFTS : ROUTES.EMPLOYEE.DASHBOARD;
      router.replace(target);
    }
  }, [loading, user, firebaseUser, router]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await sendEmailVerificationEmail();
      toast.success('E-Mail wurde erneut gesendet. Bitte prüfen Sie Ihren Posteingang.');
    } catch (_e) {
      toast.error('Versand fehlgeschlagen: ' + (_e instanceof Error ? _e.message : 'Unbekannt'));
    } finally {
      setResendLoading(false);
    }
  };

  if (loading || !user || !firebaseUser) {
    return (
      <Box
        className="min-h-screen-dynamic"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (firebaseUser.emailVerified) {
    return null;
  }

  return (
    <Box
      className="min-h-screen-dynamic"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper sx={{ maxWidth: 440, p: 4, textAlign: 'center' }} elevation={0}>
        <EmailIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          E-Mail bestätigen
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Bitte bestätigen Sie Ihre E-Mail-Adresse, um die App nutzen zu können. Wir haben eine
          E-Mail an <strong>{firebaseUser.email}</strong> gesendet.
        </Typography>
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          Klicken Sie den Link in der E-Mail. Danach können Sie die App normal nutzen.
        </Alert>
        <Button variant="contained" onClick={handleResend} disabled={resendLoading} fullWidth>
          {resendLoading ? 'Wird gesendet…' : 'E-Mail erneut senden'}
        </Button>
      </Paper>
    </Box>
  );
}
