'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AppLogo } from '@/components/ui/AppLogo';
import Link from 'next/link';
import { AppBar, Box, Toolbar, Typography, Button, IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { BackButton } from '@/components/layout/BackButton';
import { useThemeMode } from '@/contexts/ThemeModeContext';
import { usePermissions } from '@/contexts/PermissionsContext';

export function GlobalHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { branding } = useBrandingSettings();
  const { mode, toggleMode } = useThemeMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  const brandingData = branding ?? {
    companyName: 'JobFlow',
    companyLogo: undefined,
    showLogo: true,
  };

  const { canAccessAdminArea } = usePermissions();
  const homeHref = user
    ? canAccessAdminArea
      ? '/admin/uebersicht'
      : user.role === 'nurse'
        ? '/employee/arbeitsplatz'
        : '/'
    : '/';

  const isOnDashboard = pathname === '/admin/uebersicht' || pathname === '/employee/arbeitsplatz';

  if (!mounted) return null;

  return (
    <AppBar
      position="static"
      className="glass"
      component="header"
      sx={{
        zIndex: 1000,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Toolbar sx={{ position: 'relative' }}>
        {brandingData?.showLogo !== false && (
          <Box
            component={Link}
            href={homeHref}
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              px: 2,
              py: 0.75,
              width: 128,
              height: 85,
              maxWidth: 128,
              maxHeight: 85,
              flexShrink: 0,
            }}
            aria-label="Zur Startseite"
          >
            <AppLogo
              branding={brandingData}
              showLogo
              width={128}
              height={85}
              sx={{ width: '100%', height: '100%', borderRadius: 0 }}
              showSkeleton={false}
              fallbackBgColor="transparent"
              priority
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          {user && !isOnDashboard && (
            <BackButton iconOnly size="small" variant="outlined" />
          )}
          {user && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {user.displayName ?? user.email}
            </Typography>
          )}
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={toggleMode}
            color="inherit"
            sx={{ color: 'text.secondary' }}
            aria-label={mode === 'dark' ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {user && <NotificationBell />}

          {user && !isOnDashboard && (
            <Button
              component={Link}
              href={homeHref}
              startIcon={<DashboardIcon />}
              variant="outlined"
              color="primary"
              sx={{
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              Start
            </Button>
          )}

          <Button
            onClick={async () => {
              if (loggingOut) return;
              setLoggingOut(true);
              try {
                await signOut();
                router.replace('/anmelden');
              } catch {
                // ignore
              } finally {
                setLoggingOut(false);
              }
            }}
            startIcon={<LogoutIcon />}
            variant="outlined"
            sx={{
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'text.secondary',
                backgroundColor: 'action.hover',
              },
            }}
            disabled={loggingOut}
            data-testid="logout-button"
            aria-label="Abmelden"
          >
            {loggingOut ? 'Abmelden…' : 'Abmelden'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
