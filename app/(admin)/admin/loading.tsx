'use client';

import { Box, CircularProgress } from '@mui/material';

/**
 * Wird angezeigt, während die Admin-Seite lädt.
 * Kürzere wahrgenommene Ladezeit durch sofortiges Feedback.
 */
export default function AdminLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
      }}
      aria-label="Seite wird geladen"
    >
      <CircularProgress size={40} />
    </Box>
  );
}
