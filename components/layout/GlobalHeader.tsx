'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AppLogo } from '@/components/ui/AppLogo';
import Link from 'next/link';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { BackButton } from '@/components/layout/BackButton';
import { usePermissions } from '@/contexts/PermissionsContext';
import { SIDEBAR_BREAKPOINT } from './AppSidebar';

function initialsOf(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');
}

interface GlobalHeaderProps {
  /** Mit Seitenleiste: am Desktop schlanke Leiste ohne Logo/Zurück/Start (übernimmt die Seitenleiste). */
  withSidebar?: boolean;
}

export function GlobalHeader({ withSidebar = false }: GlobalHeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const { branding } = useBrandingSettings();

  useEffect(() => {
    setMounted(true);
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  // ⌘K / Strg+K öffnet die Suche von überall
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
  // Elemente, die am Desktop die Seitenleiste übernimmt
  const mobileOnly = withSidebar ? { display: { [SIDEBAR_BREAKPOINT]: 'none' } } : {};
  const desktopOnly = withSidebar
    ? { display: { xs: 'none', [SIDEBAR_BREAKPOINT]: 'flex' } }
    : { display: 'none' };

  const handleSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setMenuAnchor(null);
    try {
      await signOut();
      router.replace('/anmelden');
    } catch {
      // ignore
    } finally {
      setLoggingOut(false);
    }
  };

  if (!mounted) return null;

  const displayName = user?.displayName ?? user?.email ?? '';

  return (
    <AppBar position="static" component="header" sx={{ zIndex: 1000 }}>
      <Toolbar sx={{ position: 'relative', minHeight: { xs: 56, sm: 60 }, gap: 1, px: { [SIDEBAR_BREAKPOINT]: withSidebar ? 5 : 3 } }}>
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
              ...(withSidebar && { display: { xs: 'flex', [SIDEBAR_BREAKPOINT]: 'none' } }),
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0, ...mobileOnly }}>
          {user && !isOnDashboard && <BackButton iconOnly size="small" variant="outlined" />}
          {user && (
            <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              {displayName}
            </Typography>
          )}
        </Box>

        {user && withSidebar && (
          <ButtonBase
            onClick={() => setSearchOpen(true)}
            aria-label="Suchen"
            sx={{
              display: { xs: 'none', [SIDEBAR_BREAKPOINT]: 'flex' },
              alignItems: 'center',
              gap: 1,
              width: 360,
              height: 36,
              px: 1.25,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              color: 'text.secondary',
              fontSize: 14,
              justifyContent: 'flex-start',
              '&:hover': { borderColor: 'text.disabled' },
            }}
          >
            <SearchIcon sx={{ fontSize: 18 }} />
            Suchen
            <Box
              component="kbd"
              sx={{ ml: 'auto', fontFamily: 'inherit', fontSize: 11.5, px: 0.75, py: 0.125, border: '1px solid', borderColor: 'divider', borderRadius: '5px' }}
            >
              {isMac ? '⌘ K' : 'Strg K'}
            </Box>
          </ButtonBase>
        )}

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          {user && (
            <IconButton
              onClick={() => setSearchOpen(true)}
              aria-label="Suchen"
              sx={withSidebar ? { display: { [SIDEBAR_BREAKPOINT]: 'none' } } : undefined}
            >
              <SearchIcon />
            </IconButton>
          )}
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
                ...(withSidebar && { display: { xs: 'none', sm: 'inline-flex', [SIDEBAR_BREAKPOINT]: 'none' } }),
                borderColor: 'primary.main',
                '&:hover': { borderColor: 'primary.dark', backgroundColor: 'action.hover' },
              }}
            >
              Start
            </Button>
          )}

          {/* Desktop mit Seitenleiste: Konto-Menü statt einzelner Buttons */}
          {user && (
            <Box sx={desktopOnly}>
              <ButtonBase
                onClick={e => setMenuAnchor(e.currentTarget)}
                aria-haspopup="menu"
                aria-expanded={menuAnchor ? 'true' : undefined}
                aria-label="Konto-Menü"
                sx={{
                  gap: 1,
                  pl: 0.5,
                  pr: 1,
                  py: 0.5,
                  ml: 0.5,
                  borderRadius: '999px',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Avatar sx={{ width: 30, height: 30, fontSize: 12.5, fontWeight: 600, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  {initialsOf(displayName) || '·'}
                </Avatar>
                <Typography sx={{ fontSize: 14, fontWeight: 500, maxWidth: 180 }} noWrap>
                  {displayName}
                </Typography>
                <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </ButtonBase>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5 } } }}
              >
                <MenuItem component={Link} href="/profil" onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon>
                    <PersonOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  Mein Profil
                </MenuItem>
                {canAccessAdminArea && (
                  <MenuItem component={Link} href="/admin/einstellungen" onClick={() => setMenuAnchor(null)}>
                    <ListItemIcon>
                      <SettingsOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Einstellungen
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleSignOut} disabled={loggingOut} data-testid="logout-menu-item">
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  {loggingOut ? 'Abmelden…' : 'Abmelden'}
                </MenuItem>
              </Menu>
            </Box>
          )}

          <Button
            onClick={handleSignOut}
            startIcon={<LogoutIcon />}
            variant="outlined"
            sx={{
              color: 'text.secondary',
              borderColor: 'divider',
              minWidth: { xs: 44, sm: 64 },
              px: { xs: 1.5, sm: 2.5 },
              '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: { xs: 0, sm: -0.5 } },
              '&:hover': { borderColor: 'text.secondary', backgroundColor: 'action.hover' },
              ...(withSidebar && { display: { [SIDEBAR_BREAKPOINT]: 'none' } }),
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
      {user && <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </AppBar>
  );
}
