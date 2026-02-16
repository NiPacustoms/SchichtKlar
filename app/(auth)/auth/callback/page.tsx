'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Hier würde normalerweise die OAuth-Callback-Verarbeitung stattfinden
    // Für jetzt leiten wir einfach zum Dashboard weiter
    const timer = setTimeout(() => {
      router.push('/dashboard');
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
