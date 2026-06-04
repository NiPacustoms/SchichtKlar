 'use client';

import { AlertColor, Snackbar, Alert, Button, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
  action?: React.ReactNode;
}

let toastState: ToastState = {
  open: false,
  message: '',
  severity: 'info',
};

let setToastState: Dispatch<SetStateAction<ToastState>> | null = null;

export function useToast() {
  const [state, setState] = useState<ToastState>(toastState);

  if (!setToastState) {
    setToastState = setState;
  }

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    const newState = { open: true, message, severity };
    setState(newState);
    toastState = newState;
  }, []);

  const hideToast = useCallback(() => {
    const newState = { ...toastState, open: false };
    setState(newState);
    toastState = newState;
  }, []);

  return { toastState: state, showToast, hideToast };
}

export function ToastProvider() {
  const { toastState, hideToast } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  return (
    <Snackbar
      open={toastState.open}
      autoHideDuration={toastState.action ? 6000 : 5000}
      onClose={hideToast}
      anchorOrigin={{
        vertical: isMobile ? 'bottom' : 'top',
        horizontal: isMobile ? 'center' : 'right',
      }}
      sx={{
        bottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 72px)' : undefined,
      }}
    >
      <Alert
        onClose={hideToast}
        severity={toastState.severity}
        variant="filled"
        action={toastState.action}
        sx={{
          width: isMobile ? 'calc(100vw - 32px)' : '100%',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : 400,
        }}
      >
        {toastState.message}
      </Alert>
    </Snackbar>
  );
}

export const toast = {
  success: (message: string) => {
    if (setToastState) setToastState({ open: true, message, severity: 'success' });
  },
  error: (message: string) => {
    if (setToastState) setToastState({ open: true, message, severity: 'error' });
  },
  warning: (message: string) => {
    if (setToastState) setToastState({ open: true, message, severity: 'warning' });
  },
  info: (message: string) => {
    if (setToastState) setToastState({ open: true, message, severity: 'info' });
  },

  /**
   * Zeigt einen Toast mit "Rückgängig"-Button.
   * Die übergebene `action` wird nach `delayMs` ausgeführt – außer der Nutzer klickt "Rückgängig".
   */
  undoable: (message: string, action: () => void | Promise<void>, delayMs = 5000): Promise<void> => {
    return new Promise((resolve) => {
      if (!setToastState) { void action(); resolve(); return; }

      let cancelled = false;
      const timer = setTimeout(async () => {
        if (!cancelled) { await action(); resolve(); }
      }, delayMs);

      const undoButton = (
        <Button
          size="small"
          color="inherit"
          sx={{ fontWeight: 700, ml: 1 }}
          onClick={() => {
            cancelled = true;
            clearTimeout(timer);
            if (setToastState) setToastState((s) => ({ ...s, open: false }));
            resolve();
          }}
        >
          Rückgängig
        </Button>
      );

      setToastState({ open: true, message, severity: 'info', action: undoButton });
    });
  },
};
