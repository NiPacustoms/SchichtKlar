'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/lib/hooks/useFeatureFlags';
import { logger } from '@/lib/logging';
import {
  AccessTime,
  Assignment as AssignmentIcon,
  Business,
  CalendarMonth,
  Dashboard,
  Description,
  Home,
  MoreHoriz,
  People,
  Person,
  Schedule,
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

// Pflegekraft Navigation - Reduziert auf 4 Haupttabs
const nurseTabs = [
  { href: '/employee/arbeitsplatz', icon: <Home />, label: 'Arbeitsplatz' },
  { href: '/employee/dienstplan', icon: <CalendarMonth />, label: 'Dienstplan' },
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

// Pflegekraft Zusatz-Menü (wird dynamisch gefiltert)
const nurseMoreTabsBase: NavigationTab[] = [
  { href: '/employee/einsaetze', icon: <AssignmentIcon />, label: 'Meine Einsätze' },
  {
    href: '/employee/dokumente',
    icon: <Description />,
    label: 'Nachweise',
    feature: 'canAccessEmployeeDocuments',
  },
];

// Admin Navigation - Genau 4 Haupttabs + 1 Mehr-Button = 5 Tabs
const adminTabs: NavigationTab[] = [
  { href: '/admin/uebersicht', icon: <Dashboard />, label: 'Übersicht' },
  { href: '/admin/schichten', icon: <CalendarMonth />, label: 'Schichten' },
  { href: '/admin/mitarbeiter', icon: <People />, label: 'Personal' },
  { href: '/admin/einrichtungen', icon: <Business />, label: 'Standorte' },
];

// Admin Zusatz-Menü (über Mehr-Button, wird dynamisch gefiltert)
const adminMoreTabsBase: NavigationTab[] = [
  {
    href: '/admin/einsaetze',
    icon: <AssignmentIcon />,
    label: 'Einsätze',
    feature: 'canAccessAssignments',
  },
  { href: '/admin/stunden', icon: <Schedule />, label: 'Stundenübersicht' },
  { href: '/admin/einstellungen', icon: <Person />, label: 'Einstellungen' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down('lg'), { noSsr: true });
  const { user } = useAuth();
  const featureFlags = useFeatureFlags();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Get current role from AuthContext (user.role)
  if (process.env.NODE_ENV === 'development' && user) {
    logger.debug('BottomNav user role', {}, { role: user.role, userId: user.id, email: user.email });
  }

  const isNurse = user?.role === 'nurse';
  const isAdmin = user?.role === 'admin' || user?.role === 'dispatcher';

  // Filter tabs based on feature flags with type safety
  const nurseMoreTabs = nurseMoreTabsBase.filter((tab): tab is NavigationTab => {
    if (!tab.feature) return true; // Always show tabs without feature flag
    const featureValue = featureFlags[tab.feature];
    return featureValue === true; // Explicitly check for true
  });

  const adminMoreTabs = adminMoreTabsBase.filter((tab): tab is NavigationTab => {
    if (!tab.feature) return true; // Always show tabs without feature flag
    const featureValue = featureFlags[tab.feature];
    return featureValue === true; // Explicitly check for true
  });

  // Verwende explizite Prüfung: Wenn Admin/Dispatcher, dann adminTabs, sonst nurseTabs
  // Fallback: Wenn keine Rolle erkannt wird, zeige adminTabs (für bessere UX)
  const mainTabs = isNurse ? nurseTabs : isAdmin ? adminTabs : adminTabs;
  const moreTabs = isNurse ? nurseMoreTabs : isAdmin ? adminMoreTabs : adminMoreTabs;

  // Finde den aktuellen Tab Index
  const currentIndex = mainTabs.findIndex(
    tab => pathname === tab.href || (pathname?.startsWith(`${tab.href}/`) ?? false)
  );
  const isMoreActive = moreTabs.some(
    tab => pathname === tab.href || (pathname?.startsWith(`${tab.href}/`) ?? false)
  );

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
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(0,95,115,0.08)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.04), 0 -1px 3px rgba(0,0,0,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={currentIndex}
          showLabels
          sx={{
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(15,23,42,0.6)',
              minWidth: 44,
              minHeight: 44,
              paddingTop: 'env(safe-area-inset-top)',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: '#005f73',
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: 600,
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(0,95,115,0.04)',
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
                  color: '#005f73',
                  '& .MuiSvgIcon-root': {
                    color: '#005f73',
                    transform: 'scale(1.1)',
                  },
                },
                '& .MuiSvgIcon-root': {
                  transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                },
              }}
            />
          ))}

          {/* Mehr-Button */}
          <BottomNavigationAction
            label="Mehr"
            icon={<MoreHoriz />}
            value={4}
            onClick={handleMoreClick}
            sx={{
              color: isMoreActive ? '#005f73' : 'rgba(0,0,0,0.6)',
              '&.Mui-selected': {
                color: '#005f73',
                '& .MuiSvgIcon-root': {
                  color: '#005f73',
                },
              },
            }}
          />
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
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(0,95,115,0.08)',
            borderRadius: 16,
            boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.15)',
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
                backgroundColor: 'rgba(0,95,115,0.06)',
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
