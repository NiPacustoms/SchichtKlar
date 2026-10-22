'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Stack, Link } from '@mui/material';
import { Cookie } from '@mui/icons-material';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Hydration Guard: Warte bis nach dem ersten Client-Render
    setMounted(true);
  }, []);

  useEffect(() => {
    // Nur nach Hydration auf localStorage zugreifen
    if (!mounted) return;

    // Prüfe, ob Consent bereits gegeben wurde
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Zeige Banner nach kurzer Verzögerung für bessere UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', 'accepted');
      localStorage.setItem('cookieConsentDate', new Date().toISOString());
    }
    setShowBanner(false);
  };

  // Während SSR oder vor Hydration: nichts rendern (verhindert Hydration-Mismatch)
  if (!mounted || !showBanner) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 3,
        zIndex: 9999,
        boxShadow: 3,
        borderRadius: 0,
        borderTop: '2px solid',
        borderColor: 'primary.main',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Cookie sx={{ fontSize: 40, color: 'primary.main', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
            Nur notwendige Cookies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Schichtklar speichert nur technisch notwendige Daten im Browser – für die Anmeldung und
            Ihre Einstellungen. Kein Tracking, keine Werbe- oder Analyse-Cookies. Mehr dazu in der{' '}
            <Link href="/recht/datenschutz" underline="hover" target="_blank" rel="noopener noreferrer">
              Datenschutzerklärung
            </Link>
            .
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
          <Button variant="contained" onClick={handleAccept} sx={{ minWidth: 100 }}>
            Verstanden
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
