'use client';

import { logger } from '@/lib/logging';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';

/**
 * Error Boundary für alle Auth-Routen (anmelden, registrieren, etc.).
 * Verhindert 500 – zeigt stattdessen Fehlerseite mit Recovery-Optionen.
 * Verwendet nur console.error, um Cascade-Fehler durch Logger zu vermeiden.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error('[AuthError]', error?.message, error);
  }, [error]);

  return (
    <Box
      className="min-h-screen-dynamic"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Anmeldung vorübergehend nicht möglich
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 400 }}>
        {error?.message || 'Unbekannter Fehler'}
      </Typography>
      {error?.digest && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Fehler-ID: {error.digest}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="contained" onClick={() => reset()}>
          Erneut versuchen
        </Button>
        <Button variant="outlined" onClick={() => router.push('/anmelden')}>
          Zur Anmeldeseite
        </Button>
      </Box>
    </Box>
  );
}
