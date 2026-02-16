 'use client';

/**
 * Toast notification system using MUI Snackbar
 */

import { AlertColor, Snackbar, Alert, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

let toastState: ToastState = {
  open: false,
  message: '',
  severity: 'info'
};

let setToastState: Dispatch<SetStateAction<ToastState>> | null = null;

/**
 * Toast hook for managing toast notifications
 */
export function useToast() {
  const [state, setState] = useState<ToastState>(toastState);
  
  if (!setToastState) {
    setToastState = setState;
  }

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    const newState = {
      open: true,
      message,
      severity
    };
    setState(newState);
    toastState = newState;
  }, []);

  const hideToast = useCallback(() => {
    const newState = { ...toastState, open: false };
    setState(newState);
    toastState = newState;
  }, []);

  return {
    toastState: state,
    showToast,
    hideToast
  };
}

/**
 * Toast component to be rendered in the app
 */
export function ToastProvider() {
  const { toastState, hideToast } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  return (
    <Snackbar
      open={toastState.open}
      autoHideDuration={5000}
      onClose={hideToast}
      anchorOrigin={{ 
        vertical: isMobile ? 'bottom' : 'top', 
        horizontal: isMobile ? 'center' : 'right' 
      }}
      sx={{
        bottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 72px)' : undefined,
      }}
    >
      <Alert
        onClose={hideToast}
        severity={toastState.severity}
        variant="filled"
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

/**
 * Global toast functions
 */
export const toast = {
  success: (message: string) => {
    if (setToastState) {
      setToastState({
        open: true,
        message,
        severity: 'success'
      });
    }
  },
  
  error: (message: string) => {
    if (setToastState) {
      setToastState({
        open: true,
        message,
        severity: 'error'
      });
    }
  },
  
  warning: (message: string) => {
    if (setToastState) {
      setToastState({
        open: true,
        message,
        severity: 'warning'
      });
    }
  },
  
  info: (message: string) => {
    if (setToastState) {
      setToastState({
        open: true,
        message,
        severity: 'info'
      });
    }
  }
};
