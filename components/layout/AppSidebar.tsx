'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/lib/hooks/useFeatureFlags';
import {
  AccessTime,
  Assessment,
  Assignment as AssignmentIcon,
  Business,
  CalendarMonth,
  Dashboard,
  Description,
  FactCheck,
  History,
  Home,
  InsertDriveFile,
  People,
  Person,
  Schedule,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  useTheme,
  alpha,
  Divider,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getThemeConstants, type ThemeMode } from '@/lib/theme';
import { ROUTES } from '@/lib/constants/routes';

const SIDEBAR_WIDTH = 280;

type FeatureFlagCheck =
  | 'canAccessAssignments'
  | 'canAccessAdminReports'
  | 'canAccessAuditLogs'
  | 'canAccessEmployeeDocuments'
  | 'canAccessEmployeeAssignments'
  | 'canAccessEmployeeFacilities'
  | 'canAccessEmployeeNotifications';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  feature?: FeatureFlagCheck;
}

const nurseMainItems: NavItem[] = [
  { href: ROUTES.EMPLOYEE.DASHBOARD, icon: <Home />, label: 'Arbeitsplatz' },
  { href: ROUTES.EMPLOYEE.DIENSTPLAN, icon: <CalendarMonth />, label: 'Dienstplan' },
  { href: ROUTES.EMPLOYEE.ZEITERFASSUNG, icon: <AccessTime />, label: 'Zeit' },
  { href: ROUTES.EMPLOYEE.PROFIL, icon: <Person />, label: 'Profil' },
];

const nurseMoreItems: NavItem[] = [
  { href: ROUTES.EMPLOYEE.ASSIGNMENTS, icon: <AssignmentIcon />, label: 'Meine Einsätze' },
  {
    href: ROUTES.EMPLOYEE.DOKUMENTE,
    icon: <Description />,
    label: 'Nachweise',
    feature: 'canAccessEmployeeDocuments',
  },
];

const adminMainItems: NavItem[] = [
  { href: ROUTES.ADMIN.UEBERSICHT, icon: <Dashboard />, label: 'Übersicht' },
  { href: ROUTES.ADMIN.SHIFTS, icon: <CalendarMonth />, label: 'Schichten' },
  { href: ROUTES.ADMIN.MITARBEITER, icon: <People />, label: 'Personal' },
  { href: ROUTES.ADMIN.EINRICHTUNGEN, icon: <Business />, label: 'Standorte' },
];

const adminMoreItems: NavItem[] = [
  {
    href: ROUTES.ADMIN.EINSAETZE,
    icon: <AssignmentIcon />,
    label: 'Einsätze',
    feature: 'canAccessAssignments',
  },
  { href: ROUTES.ADMIN.STUNDEN, icon: <Schedule />, label: 'Stundenübersicht' },
  {
    href: ROUTES.ADMIN.BERICHTE,
    icon: <Assessment />,
    label: 'Berichte',
    feature: 'canAccessAdminReports',
  },
  {
    href: ROUTES.ADMIN.PRÜFPROTOKOLLE,
    icon: <FactCheck />,
    label: 'Prüfprotokolle',
    feature: 'canAccessAuditLogs',
  },
  { href: ROUTES.ADMIN.AKTIVITAETEN, icon: <History />, label: 'Aktivitäten' },
  {
    href: ROUTES.ADMIN.DOCUMENTE_VORLAGEN,
    icon: <InsertDriveFile />,
    label: 'Dokumente & Vorlagen',
  },
  { href: ROUTES.ADMIN.PERSONAL_KOMPAKT, icon: <ViewList />, label: 'Personal-Kompakt' },
  { href: ROUTES.ADMIN.STAFF_SIMPLE, icon: <ViewModule />, label: 'Staff-Simple' },
  { href: ROUTES.ADMIN.EINSTELLUNGEN, icon: <Person />, label: 'Einstellungen' },
];

function filterByFeatureFlags<T extends { feature?: FeatureFlagCheck }>(
  items: T[],
  flags: Record<string, boolean>
): T[] {
  return items.filter((item): item is T => {
    if (!item.feature) return true;
    return flags[item.feature] === true;
  });
}

export function AppSidebar() {
  const pathname = usePathname();
  const theme = useTheme();
  const themeConstants = getThemeConstants((theme.palette.mode || 'light') as ThemeMode);
  const { user } = useAuth();
  const featureFlags = useFeatureFlags();

  const isNurse = user?.role === 'nurse';
  const _isAdmin = user?.role === 'admin';

  const mainItems = isNurse ? nurseMainItems : adminMainItems;
  const moreItems = filterByFeatureFlags(
    isNurse ? nurseMoreItems : adminMoreItems,
    featureFlags as unknown as Record<string, boolean>
  );
  const allItems = [...mainItems, ...moreItems];

  const content = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.paper,
        borderRight: `1px solid ${themeConstants.CARD_BORDER_LIGHT}`,
        boxShadow: themeConstants.SHADOW_SOFT,
      }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
          {isNurse ? 'Navigation' : 'Admin'}
        </Typography>
      </Box>
      <Divider />
      <List component="nav" sx={{ flex: 1, py: 1 }}>
        {allItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && (pathname ?? '').startsWith(item.href + '/'));
          return (
            <ListItem key={item.href} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.18),
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', lg: 'block' },
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          top: 0,
          left: 0,
          border: 'none',
          background: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      {content}
    </Drawer>
  );
}

export const SIDEBAR_WIDTH_PX = SIDEBAR_WIDTH;
