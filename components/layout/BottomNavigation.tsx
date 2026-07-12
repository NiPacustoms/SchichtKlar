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
import { bottomNavHeightPx, minTouchTargetPx } from '@/lib/design-tokens';

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
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderTopColor: 'divider',
          boxShadow: '0 -1px 2px rgba(28,25,23,0.05)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={showMoreButton && isMoreActive ? mainTabs.length : Math.max(0, currentIndex)}
          showLabels
          sx={{
            minHeight: bottomNavHeightPx,
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(15,23,42,0.6)',
              minWidth: minTouchTargetPx,
              minHeight: minTouchTargetPx,
              paddingTop: 'env(safe-area-inset-top)',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: 600,
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(15, 118, 110, 0.04)',
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'inherit',
                transition: 'font-weight 200ms cubic-bezier(0.4, 0, 0.2, 1)',
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
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  color: 'primary.main',
                  '& .MuiSvgIcon-root': {
                    color: 'primary.main',
                    transform: 'scale(1.1)',
                  },
                },
                '& .MuiSvgIcon-root': {
                  transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
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
                color: isMoreActive ? 'primary.main' : 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                  '& .MuiSvgIcon-root': {
                    color: 'primary.main',
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
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(28,25,23,0.07)',
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
              color: 'rgba(15,23,42,0.95)',
              borderRadius: 2,
              margin: '4px 8px',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'rgba(15, 118, 110, 0.06)',
                transform: 'translateX(4px)',
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
