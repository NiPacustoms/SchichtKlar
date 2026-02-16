'use client';

import { logger } from '@/lib/logging';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';

/**
 * Root Error Boundary – fängt Fehler im App-Baum und verhindert 500.
 * Zeigt eine einfache Fehlerseite ohne weitere Abhängigkeiten (kein Logger etc.).
 * Buttons nutzen router.push statt Link, um removeChild-DOM-Fehler zu vermeiden.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error('[RootError]', error?.message, error);
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
        Etwas ist schiefgelaufen
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 400 }}>
        {error?.message || 'Unbekannter Fehler'}
      </Typography>
      {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 2, maxWidth: 420 }}
        >
          Tipp: Bei 500 auf /anmelden den Dev-Server mit &quot;npm run dev&quot; neu starten (nicht
          &quot;npx next dev&quot;).
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="contained" onClick={() => reset()}>
          Erneut versuchen
        </Button>
        <Button variant="outlined" onClick={() => router.push('/')}>
          Zur Startseite
        </Button>
        <Button variant="outlined" onClick={() => router.push('/anmelden')}>
          Anmelden
        </Button>
      </Box>
    </Box>
  );
}
