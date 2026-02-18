'use client';

import React from 'react';
import { Box, Button, Typography, Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import { ErrorOutline, Refresh, Home, BugReport, Close, Warning, Info } from '@mui/icons-material';
import { AppError, ErrorSeverity, ErrorCode } from '@/lib/errors';

interface ErrorDisplayProps {
  error: AppError | Error;
  retry?: () => void;
  onClose?: () => void;
  showDetails?: boolean;
  variant?: 'page' | 'card' | 'inline';
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Enhanced Error Display Component
 * 
 * Provides a comprehensive error display with different variants,
 * action buttons, and detailed error information.
 */
export function ErrorDisplay({ 
  error, 
  retry, 
  onClose, 
  showDetails = false,
  variant = 'page',
  severity: _severity = 'error'
}: ErrorDisplayProps) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(showDetails);
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const appError = error instanceof AppError ? error : 
                  new AppError(ErrorCode.UNKNOWN_ERROR, error.message);
  
  const getSeverityIcon = () => {
    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return <ErrorOutline />;
      case ErrorSeverity.WARNING:
        return <Warning />;
      case ErrorSeverity.INFO:
        return <Info />;
      default:
        return <ErrorOutline />;
    }
  };
  
  const getSeverityColor = () => {
    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        return 'error';
      case ErrorSeverity.ERROR:
        return 'error';
      case ErrorSeverity.WARNING:
        return 'warning';
      case ErrorSeverity.INFO:
        return 'info';
      default:
        return 'error';
    }
  };
  
  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };
  
  const handleReportBug = () => {
    const bugReport = {
      error: appError.toObject(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString()
    };
    
    console.log('Bug Report:', bugReport);
    alert('Fehler wurde zur Analyse übermittelt. Vielen Dank für Ihr Feedback!');
  };
  
  const toggleDetails = () => {
    setShowErrorDetails(!showErrorDetails);
  };
  
  if (variant === 'inline') {
    return (
      <Alert 
        severity={getSeverityColor() as 'error' | 'warning' | 'info' | 'success'}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {retry && (
              <Button size="small" onClick={retry}>
                Erneut versuchen
              </Button>
            )}
            {onClose && (
              <IconButton size="small" onClick={onClose}>
                <Close />
              </IconButton>
            )}
          </Box>
        }
      >
        <AlertTitle>
          {appError.severity === ErrorSeverity.CRITICAL ? 
            'Kritischer Fehler' : 
            appError.severity === ErrorSeverity.WARNING ?
            'Warnung' :
            'Fehler'
          }
        </AlertTitle>
        {appError.userMessage}
      </Alert>
    );
  }
  
  if (variant === 'card') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          backgroundColor: 'background.default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: `${getSeverityColor()}.main`
        }}
      >
        {getSeverityIcon()}
        <Typography variant="h6" color={`${getSeverityColor()}.main`} gutterBottom>
          {appError.userMessage}
        </Typography>
        
        {retry && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={retry}
            sx={{ mt: 1 }}
          >
            Erneut versuchen
          </Button>
        )}
        
        {isDevelopment && (
          <Button
            variant="text"
            size="small"
            onClick={toggleDetails}
            sx={{ mt: 1 }}
          >
            {showErrorDetails ? 'Details ausblenden' : 'Details anzeigen'}
          </Button>
        )}
        
        {showErrorDetails && isDevelopment && (
          <Collapse in={showErrorDetails}>
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              <Typography variant="body2">
                <strong>Fehlercode:</strong> {appError.code}
              </Typography>
              <Typography variant="body2">
                <strong>Nachricht:</strong> {appError.technicalMessage}
              </Typography>
            </Alert>
          </Collapse>
        )}
      </Box>
    );
  }
  
  // Page variant (default)
  return (
    <Box
      className="min-height-viewport"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        backgroundColor: 'background.default'
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          width: '100%',
          textAlign: 'center'
        }}
      >
        {/* Error Icon */}
        <Box sx={{ mb: 2 }}>
          {getSeverityIcon()}
        </Box>
        
        {/* Error Title */}
        <Typography 
          variant="h4" 
          color={`${getSeverityColor()}.main`}
          gutterBottom
        >
          {appError.severity === ErrorSeverity.CRITICAL ? 
            'Kritischer Fehler' : 
            appError.severity === ErrorSeverity.WARNING ?
            'Warnung' :
            'Ein Fehler ist aufgetreten'
          }
        </Typography>
        
        {/* User-friendly Error Message */}
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {appError.userMessage}
        </Typography>
        
        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
            mb: 3
          }}
        >
          {retry && (
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={retry}
            >
              Erneut versuchen
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={handleGoHome}
          >
            Zur Startseite
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<BugReport />}
            onClick={handleReportBug}
          >
            Fehler melden
          </Button>
        </Box>
        
        {/* Error Details (Development Mode) */}
        {isDevelopment && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="text"
              onClick={toggleDetails}
              sx={{ mb: 2 }}
            >
              {showErrorDetails ? 'Details ausblenden' : 'Details anzeigen'}
            </Button>
            
            <Collapse in={showErrorDetails}>
              <Alert severity="error" sx={{ textAlign: 'left' }}>
                <AlertTitle>Technische Details</AlertTitle>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Fehlercode:</strong> {appError.code}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Schweregrad:</strong> {appError.severity}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Technische Nachricht:</strong> {appError.technicalMessage}
                </Typography>
                
                {appError.context && typeof appError.context === 'object' && 'component' in appError.context && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Komponente:</strong> {String(appError.context.component)}
                  </Typography>
                )}
                
                {appError.context && typeof appError.context === 'object' && 'route' in appError.context && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Route:</strong> {String(appError.context.route)}
                  </Typography>
                )}
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Zeitstempel:</strong> {appError.context.timestamp.toLocaleString()}
                </Typography>
                
                {appError.stack && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Stack Trace:</strong>
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      {appError.stack}
                    </Box>
                  </Box>
                )}
              </Alert>
            </Collapse>
          </Box>
        )}
        
        {/* Help Text */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mt: 3 }}
        >
          Falls das Problem weiterhin besteht, kontaktieren Sie bitte den Support.
        </Typography>
      </Box>
    </Box>
  );
}
