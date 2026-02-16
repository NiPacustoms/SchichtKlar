'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { AppError, createAppError, ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logging';

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  component: string;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number;
  showDetails?: boolean;
}

/**
 * Component-Level Error Boundary
 *
 * Catches errors within specific components and provides graceful degradation
 * without affecting the parent component or route.
 */
export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return {
      hasError: true,
      error: createAppError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = createAppError(error, ErrorCode.UNKNOWN_ERROR);

    this.setState({
      error: appError,
      errorInfo,
    });

    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }

    // Log error
    logger.error(
      `Component Error Boundary caught an error in ${this.props.component}:`,
      appError.toObject()
    );
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 1;

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
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            backgroundColor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'error.main',
          }}
        >
          {/* Error Icon */}
          <ErrorOutline
            sx={{
              fontSize: 40,
              color: 'error.main',
              mb: 1,
            }}
          />

          {/* Error Title */}
          <Typography variant="h6" color="error.main" gutterBottom>
            Komponentenfehler
          </Typography>

          {/* User-friendly Error Message */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            {error?.userMessage || 'Ein Fehler ist in dieser Komponente aufgetreten.'}
          </Typography>

          {/* Action Button */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={this.handleRetry}
            disabled={this.state.retryCount >= (this.props.maxRetries || 1)}
          >
            Erneut versuchen
            {this.state.retryCount > 0 &&
              ` (${this.state.retryCount}/${this.props.maxRetries || 1})`}
          </Button>

          {/* Development Error Details */}
          {showDetails && error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              <Typography variant="body2">
                <strong>Komponente:</strong> {this.props.component}
              </Typography>
              <Typography variant="body2">
                <strong>Fehlercode:</strong> {error.code}
              </Typography>
              <Typography variant="body2">
                <strong>Nachricht:</strong> {error.technicalMessage}
              </Typography>
            </Alert>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-Order Component for wrapping components with error boundaries
 */
export function withComponentErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  component: string,
  options?: {
    fallback?: ReactNode;
    onError?: (error: AppError, errorInfo: ErrorInfo) => void;
    onRetry?: () => void;
    maxRetries?: number;
    showDetails?: boolean;
  }
) {
  const WithComponentErrorBoundary = (props: P) => (
    <ComponentErrorBoundary
      component={component}
      fallback={options?.fallback}
      onError={options?.onError}
      onRetry={options?.onRetry}
      maxRetries={options?.maxRetries}
      showDetails={options?.showDetails}
    >
      <WrappedComponent {...props} />
    </ComponentErrorBoundary>
  );

  WithComponentErrorBoundary.displayName = `withComponentErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithComponentErrorBoundary;
}

/**
 * Hook for component-level error handling
 */
export function useComponentErrorBoundary(_component: string) {
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
