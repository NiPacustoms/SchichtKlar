'use client';

import { Box } from '@mui/material';
import { GlobalHeader } from './GlobalHeader';
import { PageTransition } from './PageTransition';
import { AppSidebar, SIDEBAR_BREAKPOINT, SIDEBAR_WIDTH } from './AppSidebar';
import { AppShellContext } from './AppShellContext';

const SHELL_CONTEXT = { inShell: true };

interface AppLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  /** Admin-Bereich: feste Seitenleiste am Desktop statt Handy-Navigation. */
  withSidebar?: boolean;
  /**
   * Handy-Navigation. Wird bewusst außerhalb von PageTransition gerendert:
   * deren transform würde position: fixed brechen (Leiste schwebte mitten im Bild).
   */
  bottomNav?: React.ReactNode;
}

export function AppLayout({ children, hideHeader = false, withSidebar = false, bottomNav }: AppLayoutProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflowX: 'hidden',
        minHeight: '100dvh',
        backgroundColor: 'var(--color-grouped, #f2f2f7)',
      }}
    >
      {withSidebar && <AppSidebar />}
      <Box sx={withSidebar ? { pl: { [SIDEBAR_BREAKPOINT]: `${SIDEBAR_WIDTH}px` } } : undefined}>
        {!hideHeader && <GlobalHeader withSidebar={withSidebar} />}
        <Box
          component="main"
          sx={{
            // globals.css zentriert <main> per Flexbox (Marketing-Seiten) – in der App nicht
            display: 'block',
            pt: { xs: 2, sm: 3 },
            pb: withSidebar
              ? { xs: 'calc(env(safe-area-inset-bottom) + 84px)', [SIDEBAR_BREAKPOINT]: 6 }
              : 'calc(env(safe-area-inset-bottom) + 84px)',
            px: { xs: 2, sm: 3, [SIDEBAR_BREAKPOINT]: withSidebar ? 5 : 3 },
            // Desktop-Admin: linksbündig, breiter Arbeitsbereich für Tabellen
            maxWidth: withSidebar ? { xs: '1180px', [SIDEBAR_BREAKPOINT]: '1360px' } : '1180px',
            margin: withSidebar ? { xs: '0 auto', [SIDEBAR_BREAKPOINT]: 0 } : '0 auto',
            width: '100%',
          }}
        >
          <AppShellContext.Provider value={SHELL_CONTEXT}>
            <PageTransition>{children}</PageTransition>
          </AppShellContext.Provider>
        </Box>
      </Box>
      {bottomNav}
    </Box>
  );
}
