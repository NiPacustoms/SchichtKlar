'use client';

import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Paper, Typography, Slide } from '@mui/material';
import { GetApp, Close } from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_STORAGE_KEY = 'jobflow:pwaPromptDismissed';
const INSTALL_STORAGE_KEY = 'jobflow:pwaInstalled';

function safeGetItem(storage: Storage | undefined | null, key: string): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(storage: Storage | undefined | null, key: string, value: string) {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, value);
  } catch {
    // Storage kann in bestimmten Browser-Konfigurationen deaktiviert sein
  }
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const isPwaInstalled = () => {
  if (typeof window === 'undefined') return false;

  const matchStandalone = (() => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches;
    } catch {
      return false;
    }
  })();

  const navigatorStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
  const storedInstall = safeGetItem(window.localStorage, INSTALL_STORAGE_KEY) === 'true';

  return matchStandalone || navigatorStandalone || storedInstall;
};

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPwaInstalled()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      if (isPwaInstalled()) {
        return;
      }
      const dismissed = safeGetItem(window.sessionStorage, DISMISS_STORAGE_KEY) === 'true';
      if (dismissed) {
        return;
      }
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInstalled = () => {
      safeSetItem(window.localStorage, INSTALL_STORAGE_KEY, 'true');
      safeSetItem(window.sessionStorage, DISMISS_STORAGE_KEY, 'true');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    if (typeof window !== 'undefined') {
      safeSetItem(window.sessionStorage, DISMISS_STORAGE_KEY, 'true');
    }
  };

  if (isPwaInstalled()) {
    return null;
  }

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Slide direction="down" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        role="dialog"
        aria-labelledby="install-prompt-title"
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: theme => theme.zIndex.appBar + 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          px: 2,
          py: 1.5,
          maxWidth: 360,
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GetApp fontSize="small" />
          </Box>

          <Box>
            <Typography id="install-prompt-title" variant="subtitle1" sx={{ fontWeight: 600 }}>
              JobFlow installieren
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Installiere JobFlow auf deinem Gerät für einen schnelleren Zugriff und eine bessere
              Erfahrung.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={handleInstall}
                variant="contained"
                startIcon={<GetApp fontSize="small" />}
              >
                Installieren
              </Button>
              <Button size="small" onClick={handleDismiss} startIcon={<Close fontSize="small" />}>
                Später
              </Button>
            </Box>
          </Box>
        </Box>

        <IconButton
          aria-label="Installationshinweis schließen"
          size="small"
          onClick={handleDismiss}
          sx={{ mt: -0.5 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
}
