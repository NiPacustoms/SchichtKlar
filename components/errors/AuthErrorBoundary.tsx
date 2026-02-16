'use client';

import { logger } from '@/lib/logging';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * SOTA Error Boundary für Authentifizierungs-Fehler
 * Implementiert Graceful Degradation nach Frontend-Rules
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // SOTA: Logging für Debugging (nicht in Produktion)
    if (process.env.NODE_ENV === 'development') {
      logger.error('AuthErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // SOTA: Custom Fallback UI nach Design-System
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          className="min-height-viewport"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Paper
            className="glass"
            sx={{
              p: 4,
              maxWidth: 500,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Authentifizierungsfehler
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
              sx={{ minWidth: 120 }}
            >
              Erneut versuchen
            </Button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.message}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
