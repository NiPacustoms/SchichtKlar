'use client';

import { ErrorOutline } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

interface ErrorDisplayProps {
  error: Error;
  retry?: () => void;
}

export function ErrorDisplay({ error, retry }: ErrorDisplayProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <ErrorOutline sx={{ fontSize: 32, color: 'error.main' }} />
      </Box>
      <Typography variant="h6" color="error" sx={{ fontWeight: 700, mb: 1 }}>
        Fehler beim Laden
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: '15px', lineHeight: 1.6, mb: 2 }}
      >
        {error.message}
      </Typography>
      {retry && (
        <Button
          variant="contained"
          onClick={retry}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          Erneut versuchen
        </Button>
      )}
    </Box>
  );
}
