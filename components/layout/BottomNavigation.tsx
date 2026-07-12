'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import {
  AccessTime,
  AccessTimeOutlined,
  Business,
  BusinessOutlined,
  CalendarMonth,
  CalendarMonthOutlined,
  Description,
  DescriptionOutlined,
  Home,
  HomeOutlined,
  People,
  PeopleOutlined,
  Person,
  PersonOutlined,
} from '@mui/icons-material';
import { Box, Paper } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { bottomNavHeightPx } from '@/lib/design-tokens';

interface NavigationTab {
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
}

// Mitarbeiter-Navigation – genau 5 Reiter (Line-Icon inaktiv, Fill-Icon aktiv)
const employeeTabs: NavigationTab[] = [
  { href: '/employee/arbeitsplatz', icon: <HomeOutlined />, activeIcon: <Home />, label: 'Arbeitsplatz' },
  { href: '/employee/dienstplan', icon: <CalendarMonthOutlined />, activeIcon: <CalendarMonth />, label: 'Dienstplan' },
  { href: '/employee/einsaetze', icon: <DescriptionOutlined />, activeIcon: <Description />, label: 'Einsätze' },
  { href: '/employee/zeiterfassung', icon: <AccessTimeOutlined />, activeIcon: <AccessTime />, label: 'Zeit' },
  { href: '/employee/profil', icon: <PersonOutlined />, activeIcon: <Person />, label: 'Profil' },
];

// Admin-Navigation – genau 5 Reiter
const adminTabs: NavigationTab[] = [
  { href: '/admin/einrichtungen', icon: <BusinessOutlined />, activeIcon: <Business />, label: 'Einrichtungen' },
  { href: '/admin/mitarbeiter', icon: <PeopleOutlined />, activeIcon: <People />, label: 'Personal' },
  { href: '/admin/schichten', icon: <CalendarMonthOutlined />, activeIcon: <CalendarMonth />, label: 'Schichten' },
  { href: '/admin/stunden', icon: <AccessTimeOutlined />, activeIcon: <AccessTime />, label: 'Zeiterfassung' },
  { href: '/admin/dokumente/vorlagen', icon: <DescriptionOutlined />, activeIcon: <Description />, label: 'Dokumente' },
];

/**
 * iOS-Tab-Bar: milchig-transluzenter Hintergrund mit Blur, Top-Haarlinie,
 * gefülltes Icon + Teal für den aktiven Reiter, dezentes Grau sonst,
 * Home-Indicator am unteren Rand.
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: _user } = useAuth();
  const { canAccessAdminArea } = usePermissions();
  const isAdmin = canAccessAdminArea;

  const tabs = isAdmin ? adminTabs : employeeTabs;
  const currentIndex = tabs.findIndex(
    (tab) => pathname === tab.href || (pathname?.startsWith(`${tab.href}/`) ?? false)
  );

  return (
    <Paper
      component="nav"
      aria-label={isAdmin ? 'Admin-Navigation' : 'Mitarbeiter-Navigation'}
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(249,249,249,0.94)',
        backgroundImage: 'none',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '1px solid #d9d9de',
        borderRadius: 0,
        boxShadow: 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          minHeight: bottomNavHeightPx,
          px: 0.5,
        }}
      >
        {tabs.map((tab, index) => {
          const active = index === currentIndex;
          return (
            <Box
              key={tab.href}
              role="button"
              tabIndex={0}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => router.push(tab.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(tab.href);
                }
              }}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                pt: 1,
                pb: 0.75,
                cursor: 'pointer',
                userSelect: 'none',
                color: active ? 'primary.main' : '#8e8e93',
                transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: -2,
                  borderRadius: 2,
                },
                '& .MuiSvgIcon-root': { fontSize: 26 },
              }}
            >
              {active ? tab.activeIcon : tab.icon}
              <Box
                component="span"
                sx={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box aria-hidden className="ios-home-indicator" sx={{ mb: 0.5 }} />
    </Paper>
  );
}

export default BottomNav;
