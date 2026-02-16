'use client';

import { Box } from '@mui/material';
import { PAGE_MAX_WIDTH_STANDARD } from '@/lib/constants/layout';

export default function DokumenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        maxWidth: PAGE_MAX_WIDTH_STANDARD,
        mx: 'auto',
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
}
