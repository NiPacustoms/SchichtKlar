'use client';

import { Alert, Button, Box } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DISMISS_STORAGE_KEY = 'email-verification-banner-dismissed';

export function EmailVerificationBanner() {
  const { user, firebaseUser, sendEmailVerificationEmail } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1';
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || !firebaseUser || firebaseUser.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      await sendEmailVerificationEmail();
      setSent(true);
    } catch {
      // Error is thrown to caller; toast can be shown by parent if needed
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="info"
        onClose={handleDismiss}
        action={
          <Button color="inherit" size="small" onClick={handleResend} disabled={sending || sent}>
            {sending ? 'Wird gesendet…' : sent ? 'E-Mail gesendet' : 'E-Mail erneut senden'}
          </Button>
        }
      >
        Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen einen Link zur Bestätigung
        gesendet.
      </Alert>
    </Box>
  );
}
