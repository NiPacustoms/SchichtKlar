'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Button, Box, useMediaQuery, useTheme } from '@mui/material';
import { Close, CheckCircle, ErrorOutline, Warning, Info } from '@mui/icons-material';
import { AppError, ErrorSeverity } from '@/lib/errors';
import { logger } from '@/lib/logging';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  severity: ToastSeverity;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ErrorToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
  onAction?: (id: string, action: string) => void;
}

/**
 * Enhanced Error Toast Component
 * 
 * Provides standardized toast messages with different severity levels,
 * action buttons, and configurable duration.
 */
export function ErrorToast({ message, onClose, onAction }: ErrorToastProps) {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  
  const getSeverityIcon = () => {
    switch (message.severity) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <ErrorOutline />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <ErrorOutline />;
    }
  };
  
  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => onClose(message.id), 300);
  }, [message.id, onClose]);
  
  const handleAction = () => {
    if (message.action) {
      message.action.onClick();
      if (onAction) {
        onAction(message.id, message.action.label);
      }
    }
  };
  
  useEffect(() => {
    if (!message.persistent && message.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, message.duration || 6000);
      
      return () => clearTimeout(timer);
    }
  }, [message.duration, message.persistent, handleClose]);
  
  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      anchorOrigin={{ 
        vertical: isMobile ? 'bottom' : 'top', 
        horizontal: isMobile ? 'center' : 'right' 
      }}
      autoHideDuration={message.persistent ? null : (message.duration || 6000)}
      sx={{
        bottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 72px)' : undefined,
      }}
    >
      <Alert
        severity={message.severity}
        onClose={handleClose}
        icon={getSeverityIcon()}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {message.action && (
              <Button
                size="small"
                onClick={handleAction}
                sx={{ color: 'inherit' }}
              >
                {message.action.label}
              </Button>
            )}
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: 'inherit', minWidth: 44, minHeight: 44 }}
            >
              <Close />
            </IconButton>
          </Box>
        }
        sx={{
          minWidth: isMobile ? 'calc(100vw - 32px)' : 300,
          maxWidth: isMobile ? 'calc(100vw - 32px)' : 400,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle>
          {message.severity === 'success' ? 'Erfolg' :
           message.severity === 'error' ? 'Fehler' :
           message.severity === 'warning' ? 'Warnung' :
           'Information'}
        </AlertTitle>
        {message.message}
      </Alert>
    </Snackbar>
  );
}

/**
 * Toast Manager Hook
 * 
 * Provides a centralized way to manage toast messages throughout the application.
 */
export function useToastManager() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      id,
      duration: 6000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const clearAllToasts = () => {
    setToasts([]);
  };
  
  const showSuccess = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      message,
      severity: 'success',
      ...options
    });
  };
  
  const showError = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      message,
      severity: 'error',
      duration: 8000,
      ...options
    });
  };
  
  const showWarning = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      message,
      severity: 'warning',
      ...options
    });
  };
  
  const showInfo = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      message,
      severity: 'info',
      ...options
    });
  };
  
  const showAppError = (error: AppError, options?: Partial<ToastMessage>) => {
    return addToast({
      message: error.userMessage,
      severity: error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.ERROR ? 'error' :
                error.severity === ErrorSeverity.WARNING ? 'warning' : 'info',
      duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 8000,
      persistent: error.severity === ErrorSeverity.CRITICAL,
      action: error.isRetryable() ? {
        label: 'Erneut versuchen',
        onClick: () => {
          // This would typically trigger a retry mechanism
          logger.info('Retry requested for error:', error.code);
        }
      } : undefined,
      ...options
    });
  };
  
  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAppError
  };
}

/**
 * Toast Container Component
 * 
 * Renders all active toast messages.
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastManager();
  
  return (
    <>
      {toasts.map(toast => (
        <ErrorToast
          key={toast.id}
          message={toast}
          onClose={removeToast}
        />
      ))}
    </>
  );
}
