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
    companyName: 'Schichtklar',
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
    <AppBar position="static" className="glass" component="header" sx={{ zIndex: 1000 }}>
      <Toolbar sx={{ position: 'relative', minHeight: { xs: 56, sm: 64 } }}>
        {brandingData?.showLogo !== false && (
          <Box
            component={Link}
            href={homeHref}
            sx={{
              // Mobil links im Fluss, ab md optisch zentriert
              position: { xs: 'static', md: 'absolute' },
              left: { md: '50%' },
              transform: { md: 'translateX(-50%)' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              width: 88,
              height: 48,
              flexShrink: 0,
              mr: { xs: 1, md: 0 },
            }}
            aria-label="Zur Startseite"
          >
            <AppLogo
              branding={brandingData}
              showLogo
              width={88}
              height={48}
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
                display: { xs: 'none', sm: 'inline-flex' },
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
              minWidth: { xs: 44, sm: 64 },
              px: { xs: 1.5, sm: 2.5 },
              '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: { xs: 0, sm: -0.5 } },
              '&:hover': {
                borderColor: 'text.secondary',
                backgroundColor: 'action.hover',
              },
            }}
            disabled={loggingOut}
            data-testid="logout-button"
            aria-label="Abmelden"
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {loggingOut ? 'Abmelden…' : 'Abmelden'}
            </Box>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
