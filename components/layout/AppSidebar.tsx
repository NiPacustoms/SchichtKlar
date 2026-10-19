'use client';

import { useFeatureFlags } from '@/lib/hooks/useFeatureFlags';
import {
  AccessTimeOutlined,
  AssessmentOutlined,
  AssignmentOutlined,
  BusinessOutlined,
  CalendarMonthOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  FactCheckOutlined,
  HistoryOutlined,
  PeopleOutlined,
  SettingsOutlined,
  ViewWeekOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { AppLogo } from '@/components/ui/AppLogo';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { colors } from '@/lib/design-tokens';

export const SIDEBAR_WIDTH = 240;
/** Ab dieser Breite (MUI-Breakpoint) wird die Seitenleiste gezeigt; darunter Handy-Navigation. */
export const SIDEBAR_BREAKPOINT = 'lg' as const; // MUI-Standard: 1200 px

type FeatureFlagCheck = 'canAccessAssignments' | 'canAccessAdminReports' | 'canAccessAuditLogs';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  feature?: FeatureFlagCheck;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Navigation nach Arbeitsbereichen der Disposition – Reihenfolge = Häufigkeit im Alltag. */
const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Planung',
    items: [
      { href: ROUTES.ADMIN.UEBERSICHT, icon: <DashboardOutlined />, label: 'Übersicht' },
      { href: ROUTES.ADMIN.DIENSTPLAN, icon: <ViewWeekOutlined />, label: 'Dienstplan' },
      { href: ROUTES.ADMIN.SHIFTS, icon: <CalendarMonthOutlined />, label: 'Schichten' },
      { href: ROUTES.ADMIN.EINSAETZE, icon: <AssignmentOutlined />, label: 'Einsätze', feature: 'canAccessAssignments' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { href: ROUTES.ADMIN.MITARBEITER, icon: <PeopleOutlined />, label: 'Mitarbeiter' },
      { href: ROUTES.ADMIN.STUNDEN, icon: <AccessTimeOutlined />, label: 'Stunden' },
    ],
  },
  {
    label: 'Kunden',
    items: [{ href: ROUTES.ADMIN.EINRICHTUNGEN, icon: <BusinessOutlined />, label: 'Einrichtungen' }],
  },
  {
    label: 'Auswertung',
    items: [
      { href: ROUTES.ADMIN.BERICHTE, icon: <AssessmentOutlined />, label: 'Berichte', feature: 'canAccessAdminReports' },
      { href: ROUTES.ADMIN.AKTIVITAETEN, icon: <HistoryOutlined />, label: 'Aktivitäten' },
      { href: ROUTES.ADMIN.PRÜFPROTOKOLLE, icon: <FactCheckOutlined />, label: 'Prüfprotokolle', feature: 'canAccessAuditLogs' },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { href: ROUTES.ADMIN.DOCUMENTE_VORLAGEN, icon: <DescriptionOutlined />, label: 'Vorlagen' },
      { href: ROUTES.ADMIN.EINSTELLUNGEN, icon: <SettingsOutlined />, label: 'Einstellungen' },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Feste Seitenleiste für den Admin-Bereich am Desktop.
 * Unterhalb von SIDEBAR_BREAKPOINT übernimmt die Handy-Navigation (BottomNav).
 */
export function AppSidebar() {
  const pathname = usePathname() ?? '';
  const featureFlags = useFeatureFlags() as unknown as Record<string, boolean>;
  const { branding } = useBrandingSettings();
  const brandingData = branding ?? { companyName: 'Schichtklar', companyLogo: undefined, showLogo: true };

  const groups = ADMIN_NAV.map(g => ({
    ...g,
    items: g.items.filter(i => !i.feature || featureFlags[i.feature] === true),
  })).filter(g => g.items.length > 0);

  return (
    <Box
      component="aside"
      aria-label="Hauptnavigation"
      sx={{
        display: { xs: 'none', [SIDEBAR_BREAKPOINT]: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        inset: '0 auto 0 0',
        width: SIDEBAR_WIDTH,
        zIndex: 1100,
        bgcolor: '#fbfcfc',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        component={Link}
        href={ROUTES.ADMIN.UEBERSICHT}
        aria-label="Zur Übersicht"
        sx={{ display: 'flex', alignItems: 'center', height: 60, px: 2.5, textDecoration: 'none', flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <AppLogo
          branding={brandingData}
          showLogo
          width={120}
          height={32}
          sx={{ width: 120, height: 32, borderRadius: 0 }}
          showSkeleton={false}
          fallbackBgColor="transparent"
          priority
        />
      </Box>

      <Box component="nav" sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 3 }}>
        {groups.map(group => (
          <Box key={group.label} sx={{ mt: 2.5 }}>
            <Typography
              component="h2"
              sx={{ px: 1.25, mb: 0.5, fontSize: 12, fontWeight: 550, color: 'text.disabled' }}
            >
              {group.label}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {group.items.map(item => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Box component="li" key={item.href}>
                    <ButtonBase
                      component={Link}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        gap: 1.25,
                        height: 34,
                        px: 1.25,
                        borderRadius: '7px',
                        fontSize: 14,
                        letterSpacing: '-0.005em',
                        fontWeight: active ? 600 : 500,
                        color: active ? 'primary.dark' : 'text.primary',
                        bgcolor: active ? '#ffffff' : 'transparent',
                        boxShadow: active ? `inset 0 0 0 1px ${alpha(colors.brand, 0.18)}, 0 1px 2px rgba(16,37,35,0.05)` : 'none',
                        transition: 'background-color 120ms ease',
                        '&:hover': { bgcolor: active ? '#ffffff' : 'rgba(16,37,35,0.045)' },
                        '& svg': { fontSize: 20, color: active ? 'primary.main' : 'text.secondary' },
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </ButtonBase>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default AppSidebar;
