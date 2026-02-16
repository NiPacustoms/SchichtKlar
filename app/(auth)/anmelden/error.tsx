'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logging';
import { Box, Button, Typography } from '@mui/material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Login page error', error);
  }, [error]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Etwas ist schiefgelaufen.
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {error?.message || 'Unbekannter Fehler'}
      </Typography>
      {error?.digest && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Fehler-ID: {error.digest}
        </Typography>
      )}
      <Button variant="contained" onClick={() => reset()}>
        Erneut versuchen
      </Button>
    </Box>
  );
}
