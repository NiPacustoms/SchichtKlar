'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress, Typography } from '@mui/material';

const NewAssignmentForm = dynamic(
  () => import('./NewAssignmentForm').then(m => ({ default: m.NewAssignmentForm })),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          minHeight: 200,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Formular wird geladen…
        </Typography>
      </Box>
    ),
  }
);

export default function NewAssignmentPage() {
  return <NewAssignmentForm />;
}
