'use client';

import { Box } from '@mui/material';
import { GlobalHeader } from './GlobalHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export function AppLayout({ children, hideHeader = false }: AppLayoutProps) {
  return (
    <Box
      className="gradient-background"
      sx={{
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {!hideHeader && <GlobalHeader />}
      <Box
        sx={{
          pt: { xs: 2, sm: 3 },
          pb: 'calc(env(safe-area-inset-bottom) + 72px)',
          px: { xs: 2, sm: 3 },
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
