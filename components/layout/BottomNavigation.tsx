'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { logger } from '@/lib/logging';
import {
  AccessTime,
  Business,
  CalendarMonth,
  Description,
  Home,
  MoreHoriz,
  People,
  Person,
} from '@mui/icons-material';
import {
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { alpha } from '@mui/material/styles';
import {
  bottomNavHeightPx,
  minTouchTargetPx,
  glassBlur,
  duration,
  easing,
  light,
  dark,
} from '@/lib/design-tokens';

// Mitarbeiter-Navigation – genau 5 Reiter (wie gewünscht), kein Mehr-Button
const employeeTabs: NavigationTab[] = [
  { href: '/employee/arbeitsplatz', icon: <Home />, label: 'Arbeitsplatz' },
  { href: '/employee/dienstplan', icon: <CalendarMonth />, label: 'Dienstplan' },
  { href: '/employee/einsaetze', icon: <Description />, label: 'Einsatzmitteilungen' },
  { href: '/employee/zeiterfassung', icon: <AccessTime />, label: 'Zeit' },
  { href: '/employee/profil', icon: <Person />, label: 'Profil' },
];

// Type für Navigation-Tabs mit Feature-Flag
type FeatureFlagCheck =
  | 'canAccessAssignments'
  | 'canAccessAuditLogs'
  | 'canAccessTemplates'
  | 'canAccessEmployeeDocuments'
  | 'canAccessEmployeeAssignments'
  | 'canAccessEmployeeFacilities'
  | 'canAccessEmployeeNotifications';

interface NavigationTab {
  href: string;
  icon: React.ReactNode;
  label: string;
  feature?: FeatureFlagCheck;
}

// Admin Navigation – genau 5 Reiter (wie gewünscht), kein Mehr-Button
const adminTabs: NavigationTab[] = [
  { href: '/admin/einrichtungen', icon: <Business />, label: 'Einrichtungen' },
  { href: '/admin/mitarbeiter', icon: <People />, label: 'Personal' },
  { href: '/admin/schichten', icon: <CalendarMonth />, label: 'Schichten' },
  { href: '/admin/stunden', icon: <AccessTime />, label: 'Zeiterfassung' },
  { href: '/admin/dokumente/vorlagen', icon: <Description />, label: 'Dokumente' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down('lg'), { noSsr: true });
  const { user } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Get current role from AuthContext (user.role)
  if (process.env.NODE_ENV === 'development' && user) {
    logger.debug('BottomNav user role', {}, { role: user.role, userId: user.id, email: user.email });
  }

  const _isNurse = user?.role === 'nurse';
  const { canAccessAdminArea } = usePermissions();
  const isAdmin = canAccessAdminArea;

  // Mitarbeiter und Admin haben je 5 Reiter, kein Mehr-Button
  const mainTabs = isAdmin ? adminTabs : employeeTabs;
  const moreTabs: NavigationTab[] = [];

  // Finde den aktuellen Tab Index (nur unter mainTabs, kein separater "Mehr"-Index)
  const currentIndex = mainTabs.findIndex(
    tab => pathname === tab.href || (pathname?.startsWith(`${tab.href}/`) ?? false)
  );
  const isMoreActive =
    moreTabs.length > 0 &&
    moreTabs.some(
      tab => pathname === tab.href || (pathname?.startsWith(`${tab.href}/`) ?? false)
    );
  const showMoreButton = moreTabs.length > 0;

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setAnchorEl(null);
  };

  const isDark = theme.palette.mode === 'dark';
  const surf = isDark ? dark : light;
  // Im Dark Mode ist Petrol zu dunkel für aktive Tabs – helle Brand-Stufe nutzen
  const activeColor = isDark ? theme.palette.primary.light : theme.palette.primary.main;
  const colorTransition = `color ${duration.base}ms ${easing}`;

  // Immer anzeigen (auch auf Desktop)
  // if (!isMobile) {
  //   return null;
  // }

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          minHeight: bottomNavHeightPx,
          background: surf.appBar,
          backdropFilter: glassBlur,
          WebkitBackdropFilter: glassBlur,
          border: 'none',
          borderTop: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          boxShadow: 'none',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={showMoreButton && isMoreActive ? mainTabs.length : Math.max(0, currentIndex)}
          showLabels
          sx={{
            minHeight: bottomNavHeightPx,
            backgroundColor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              color: theme.palette.text.secondary,
              minWidth: minTouchTargetPx,
              minHeight: minTouchTargetPx,
              transition: colorTransition,
              '&.Mui-selected': {
                color: activeColor,
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: 600,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: 12,
                fontWeight: 500,
                color: 'inherit',
              },
            },
          }}
        >
          {mainTabs.map((tab, index) => (
            <BottomNavigationAction
              key={tab.href}
              label={tab.label}
              icon={tab.icon}
              value={index}
              onClick={() => router.push(tab.href)}
              sx={{
                cursor: 'pointer',
                transition: colorTransition,
                '&.Mui-selected': {
                  color: activeColor,
                  '& .MuiSvgIcon-root': {
                    color: activeColor,
                  },
                },
              }}
            />
          ))}

          {/* Mehr-Button nur für Pflegekräfte (Admin hat nur die 5 Reiter) */}
          {showMoreButton && (
            <BottomNavigationAction
              label="Mehr"
              icon={<MoreHoriz />}
              value={mainTabs.length}
              onClick={handleMoreClick}
              sx={{
                color: isMoreActive ? activeColor : theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: activeColor,
                  '& .MuiSvgIcon-root': {
                    color: activeColor,
                  },
                },
              }}
            />
          )}
        </BottomNavigation>
      </Paper>

      {/* Mehr-Menü */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMoreClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPaper-root': {
            background: surf.surface.main,
            backdropFilter: glassBlur,
            WebkitBackdropFilter: glassBlur,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '16px',
            boxShadow: 'var(--shadow-medium)',
            marginTop: 1,
          },
        }}
      >
        {moreTabs.map(tab => (
          <MenuItem
            key={tab.href}
            component={Link}
            href={tab.href}
            onClick={handleMoreClose}
            sx={{
              color: theme.palette.text.primary,
              borderRadius: 1,
              margin: '4px 8px',
              transition: colorTransition,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06),
              },
              '& .MuiSvgIcon-root': {
                marginRight: 1.5,
                fontSize: 20,
              },
            }}
          >
            {tab.icon}
            {tab.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default BottomNav;
