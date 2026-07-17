'use client';

import { Box } from '@mui/material';
import { GlobalHeader } from './GlobalHeader';
import { PageTransition } from './PageTransition';

interface AppLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export function AppLayout({ children, hideHeader = false }: AppLayoutProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflowX: 'hidden',
        minHeight: '100dvh',
        backgroundColor: 'var(--color-grouped, #f2f2f7)',
      }}
    >
      {!hideHeader && <GlobalHeader />}
      <Box
        sx={{
          pt: { xs: 2, sm: 3 },
          pb: 'calc(env(safe-area-inset-bottom) + 84px)',
          px: { xs: 2, sm: 3 },
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <PageTransition>{children}</PageTransition>
      </Box>
    </Box>
  );
}
