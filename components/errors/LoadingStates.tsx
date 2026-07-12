'use client';

import React from 'react';
import { Box, Skeleton, LinearProgress, CircularProgress, Typography, useTheme } from '@mui/material';

interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner' | 'progress' | 'text';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  rows?: number;
}

/**
 * Enhanced Loading State Components
 * 
 * Provides various loading states for different scenarios:
 * - Skeleton screens for content loading
 * - Spinners for actions
 * - Progress bars for operations
 * - Text-based loading indicators
 * 
 * Verwendet einheitliches Branding (#0f766e)
 */
export function LoadingState({ 
  variant = 'skeleton', 
  message = 'Lädt...', 
  size = 'medium',
  fullScreen = false,
  rows = 3
}: LoadingStateProps) {
  const theme = useTheme();
  
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24 };
      case 'large':
        return { width: 64, height: 64 };
      default:
        return { width: 40, height: 40 };
    }
  };
  
  const containerSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    p: fullScreen ? 3 : 2
  };
  
  if (variant === 'skeleton') {
    return (
      <Box sx={containerSx}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            width="100%"
            height={60}
            sx={{ mb: 2, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }
  
  if (variant === 'spinner') {
    const sizeValue = getSize().width;
    return (
      <Box sx={containerSx}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress
            size={sizeValue}
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: sizeValue * 0.3,
              height: sizeValue * 0.3,
              borderRadius: '50%',
              background: `${theme.palette.primary.main}`,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
        </Box>
        {message && (
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 2,
              color: theme.palette.primary.main,
              fontWeight: 500,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  }
  
  if (variant === 'progress') {
    return (
      <Box sx={containerSx}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress 
            sx={{
              height: 4,
              borderRadius: 2,
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
              },
            }}
          />
          {message && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                textAlign: 'center',
                color: theme.palette.text.secondary,
              }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }
  
  if (variant === 'text') {
    return (
      <Box sx={containerSx}>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }
  
  return null;
}

/**
 * Skeleton Components for specific content types
 */
export function CardSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: 1 }} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={20} />
    </Box>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="rectangular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={16} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: items }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function ChartSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
    </Box>
  );
}

export function FormSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: 1 }} />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
}

/**
 * Loading States for specific scenarios
 */
export function PageLoadingState() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: 1 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Skeleton variant="rectangular" width="30%" height={150} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="30%" height={150} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="30%" height={150} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
}

export function DataLoadingState({ message = 'Daten werden geladen...' }: { message?: string }) {
  const theme = useTheme();
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 4 
    }}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: `${theme.palette.primary.main}`,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </Box>
      <Typography 
        variant="body2" 
        sx={{ 
          mt: 2,
          color: theme.palette.primary.main,
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

export function ActionLoadingState({ message = 'Aktion wird ausgeführt...' }: { message?: string }) {
  const theme = useTheme();
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2, 
      p: 2 
    }}>
      <CircularProgress
        size={20}
        thickness={4}
        sx={{
          color: theme.palette.primary.main,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      <Typography 
        variant="body2" 
        sx={{
          color: theme.palette.text.secondary,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}
