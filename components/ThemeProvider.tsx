'use client';

import { createAppTheme } from '@/lib/theme';
import { CssBaseline, ThemeProvider as MUIThemeProvider } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { useMemo, useEffect, useState } from 'react';
import { useThemeMode } from '@/contexts/ThemeModeContext';

function ClientOnlyCssBaseline() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return <CssBaseline />;
}

export function MUIThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <StyledEngineProvider injectFirst>
      <MUIThemeProvider theme={theme}>
        <ClientOnlyCssBaseline />
        {children}
      </MUIThemeProvider>
    </StyledEngineProvider>
  );
}
