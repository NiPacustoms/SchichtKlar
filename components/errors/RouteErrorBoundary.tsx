'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { AppError, createAppError, ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logging';

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface RouteErrorBoundaryProps {
  children: ReactNode;
  route: string;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number;
}

/**
 * Route-Specific Error Boundary
 * 
 * Catches errors within specific routes and provides partial page recovery
 * without affecting the entire application.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return {
      hasError: true,
      error: createAppError(error)
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = createAppError(error, ErrorCode.UNKNOWN_ERROR);
    
    this.setState({
      error: appError,
      errorInfo
    });
    
    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
    
    // Log error
    logger.error(`Route Error Boundary caught an error in ${this.props.route}:`, appError.toObject());
  }
  
  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 2;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
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
      
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 3,
            backgroundColor: 'background.default'
          }}
        >
          <Box
            sx={{
              maxWidth: 500,
              width: '100%',
              textAlign: 'center'
            }}
          >
            {/* Error Icon */}
            <ErrorOutline 
              sx={{ 
                fontSize: 60, 
                color: 'error.main',
                mb: 2
              }} 
            />
            
            {/* Error Title */}
            <Typography 
              variant="h5" 
              color="error.main"
              gutterBottom
            >
              Fehler in {this.props.route}
            </Typography>
            
            {/* User-friendly Error Message */}
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {error?.userMessage || 'Es ist ein Fehler aufgetreten.'}
            </Typography>
            
            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= (this.props.maxRetries || 2)}
              >
                Seite neu laden
                {this.state.retryCount > 0 && ` (${this.state.retryCount}/${this.props.maxRetries || 2})`}
              </Button>
            </Box>
            
            {/* Development Error Details */}
            {isDevelopment && error && (
              <Alert severity="error" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>Route:</strong> {this.props.route}
                </Typography>
                <Typography variant="body2">
                  <strong>Fehlercode:</strong> {error.code}
                </Typography>
                <Typography variant="body2">
                  <strong>Nachricht:</strong> {error.technicalMessage}
                </Typography>
                {error.stack && (
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.75rem',
                      mt: 1,
                      backgroundColor: 'grey.100',
                      p: 1,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 150
                    }}
                  >
                    {error.stack}
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        </Box>
      );
    }
    
    return this.props.children;
  }
}

/**
 * Higher-Order Component for wrapping routes with error boundaries
 */
export function withRouteErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  route: string,
  options?: {
    fallback?: ReactNode;
    onError?: (error: AppError, errorInfo: ErrorInfo) => void;
    onRetry?: () => void;
    maxRetries?: number;
  }
) {
  const WithRouteErrorBoundary = (props: P) => (
    <RouteErrorBoundary
      route={route}
      fallback={options?.fallback}
      onError={options?.onError}
      onRetry={options?.onRetry}
      maxRetries={options?.maxRetries}
    >
      <WrappedComponent {...props} />
    </RouteErrorBoundary>
  );
  
  WithRouteErrorBoundary.displayName = `withRouteErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithRouteErrorBoundary;
}
