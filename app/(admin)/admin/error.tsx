'use client';

import { logger } from '@/lib/logging';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';

/**
 * Admin Error Boundary – fängt Fehler in Admin-Routen und verhindert 500.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error('[AdminError]', error?.message, error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography component="div" variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Fehler beim Laden
      </Typography>
      <Typography
        component="div"
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, maxWidth: 400 }}
      >
        {String(error?.message || 'Unbekannter Fehler')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="contained" onClick={() => reset()}>
          Erneut versuchen
        </Button>
        <Button variant="outlined" onClick={() => router.push('/admin/uebersicht')}>
          Zum Dashboard
        </Button>
      </Box>
    </Box>
  );
}
