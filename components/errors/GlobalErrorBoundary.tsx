'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Alert, AlertTitle, Collapse } from '@mui/material';
import { ErrorOutline, Refresh, Home, BugReport } from '@mui/icons-material';
import { AppError, ErrorSeverity, createAppError, ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logging';

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  showDetails?: boolean;
  maxRetries?: number;
  component?: string;
}

/**
 * Global Error Boundary for Root-Level Error Handling
 *
 * Catches all unhandled errors in the React component tree and provides
 * graceful degradation with recovery options.
 */
export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    try {
      return {
        hasError: true,
        error: createAppError(error),
      };
    } catch (e) {
      return {
        hasError: true,
        error: createAppError(new Error(String(e))),
      };
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      const appError = createAppError(error, ErrorCode.UNKNOWN_ERROR);
      this.setState({
        error: appError,
        errorInfo,
      });
      if (this.props.onError) this.props.onError(appError, errorInfo);
      try {
        logger.error('Global Error Boundary caught an error:', appError.toObject());
      } catch {
        // Last-resort fallback if logger itself fails
        logger.error('Error boundary fallback', error instanceof Error ? error : new Error(String(error)));
      }
    } catch (e) {
      this.setState({
        error: createAppError(new Error(String(e))),
        errorInfo,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;

    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    // In a real application, this would send the error to a bug reporting service
    const bugReport = {
      error: error.toObject(),
      errorInfo: errorInfo
        ? {
            componentStack: errorInfo.componentStack,
          }
        : null,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString(),
    };

    logger.info('Bug Report:', bugReport);

    // TODO: Integrate with bug reporting service
    alert('Fehler wurde zur Analyse übermittelt. Vielen Dank für Ihr Feedback!');
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';
      const showDetails = this.props.showDetails || isDevelopment;

      return (
        <Box
          className="gradient-background"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Box
            sx={{
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <ErrorOutline
              sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 2,
              }}
            />

            {/* Error Title */}
            <Typography variant="h4" color="error.main" gutterBottom>
              {error?.severity === ErrorSeverity.CRITICAL
                ? 'Kritischer Fehler'
                : 'Ein Fehler ist aufgetreten'}
            </Typography>

            {/* User-friendly Error Message */}
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {error?.userMessage || 'Es ist ein unerwarteter Fehler aufgetreten.'}
            </Typography>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
                mb: 3,
              }}
            >
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= (this.props.maxRetries || 3)}
              >
                Erneut versuchen
                {this.state.retryCount > 0 &&
                  ` (${this.state.retryCount}/${this.props.maxRetries || 3})`}
              </Button>

              <Button variant="outlined" startIcon={<Home />} onClick={this.handleGoHome}>
                Zur Startseite
              </Button>

              <Button variant="outlined" startIcon={<BugReport />} onClick={this.handleReportBug}>
                Fehler melden
              </Button>
            </Box>

            {/* Error Details (Development Mode) */}
            {showDetails && error && (
              <Box sx={{ mt: 3 }}>
                <Button variant="text" onClick={this.toggleDetails} sx={{ mb: 2 }}>
                  {this.state.showDetails ? 'Details ausblenden' : 'Details anzeigen'}
                </Button>

                <Collapse in={this.state.showDetails}>
                  <Alert severity="error" sx={{ textAlign: 'left' }}>
                    <AlertTitle>Technische Details</AlertTitle>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Fehlercode:</strong> {error.code}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Schweregrad:</strong> {error.severity}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Technische Nachricht:</strong> {error.technicalMessage}
                    </Typography>

                    {error.context &&
                      typeof error.context === 'object' &&
                      'component' in error.context && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Komponente:</strong> {String(error.context.component)}
                        </Typography>
                      )}

                    {error.context &&
                      typeof error.context === 'object' &&
                      'route' in error.context && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Route:</strong> {String(error.context.route)}
                        </Typography>
                      )}

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Zeitstempel:</strong>{' '}
                      {error.context?.timestamp != null
                        ? error.context.timestamp.toLocaleString()
                        : '—'}
                    </Typography>

                    {error.stack && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Aufrufstack:</strong>
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            fontSize: '0.75rem',
                            backgroundColor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 200,
                          }}
                        >
                          {error.stack}
                        </Box>
                      </Box>
                    )}
                  </Alert>
                </Collapse>
              </Box>
            )}

            {/* Help Text */}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Falls das Problem weiterhin besteht, kontaktieren Sie bitte den Support.
            </Typography>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for using error boundary functionality in functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<AppError | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error | AppError) => {
    const appError = error instanceof AppError ? error : createAppError(error);
    setError(appError);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    error,
    resetError,
    captureError,
  };
}
