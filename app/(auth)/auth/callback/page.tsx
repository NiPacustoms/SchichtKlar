'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // OAuth-Callback: Weiterleitung zur Startseite (nach Rolle → Arbeitsplatz/Übersicht)
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      className="min-height-viewport"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="h6">Authentifizierung läuft...</Typography>
      <Typography variant="body2" color="text.secondary">
        Sie werden in Kürze weitergeleitet.
      </Typography>
    </Box>
  );
}
