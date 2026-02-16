'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export default function NewAssignmentLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
      }}
      aria-label="Seite wird geladen"
    >
      <CircularProgress size={48} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Neuer Einsatz – wird geladen…
      </Typography>
    </Box>
  );
}
