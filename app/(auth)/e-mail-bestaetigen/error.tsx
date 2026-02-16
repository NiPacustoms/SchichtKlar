'use client';

import { logger } from '@/lib/logging';

import { useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';

export default function EmailVerifyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('E-Mail-Bestätigungsseite Fehler:', error);
  }, [error]);

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
        <EmailIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Fehler beim Laden
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button variant="contained" onClick={() => reset()} fullWidth>
            Erneut versuchen
          </Button>
          <Button component={Link} href={ROUTES.LOGIN} variant="outlined" fullWidth>
            Zur Anmeldung
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
