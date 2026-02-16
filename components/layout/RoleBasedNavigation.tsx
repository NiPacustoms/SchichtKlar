'use client';

import { useRole } from '@/contexts/RoleContext';
import {
  AccessTime,
  Assignment as AssignmentIcon,
  CalendarMonth,
  Description,
  DynamicFeed,
  Home,
  People,
  Schedule,
  Settings,
} from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import Link from 'next/link';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: ('nurse' | 'dispatcher' | 'admin')[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Übersicht',
    href: '/admin/uebersicht',
    icon: <Home />,
    roles: ['admin'],
  },
  {
    label: 'Dienstplan',
    href: '/employee/dienstplan',
    icon: <CalendarMonth />,
    roles: ['nurse'],
  },
  {
    label: 'Schichtverwaltung',
    href: '/admin/schichten',
    icon: <AssignmentIcon />,
    roles: ['admin'],
  },
  {
    label: 'Zeiterfassung',
    href: '/employee/zeiterfassung',
    icon: <AccessTime />,
    roles: ['nurse'],
  },
  {
    label: 'Nachweise',
    href: '/employee/dokumente',
    icon: <Description />,
    roles: ['nurse', 'dispatcher'],
  },
  {
    label: 'Mitarbeiter',
    href: '/admin/mitarbeiter',
    icon: <People />,
    roles: ['admin'],
  },
  {
    label: 'Stundenübersicht',
    href: '/admin/stunden',
    icon: <Schedule />,
    roles: ['admin', 'dispatcher'],
  },
  {
    label: 'Admin',
    href: '/admin/uebersicht',
    icon: <Settings />,
    roles: ['admin'],
  },
  {
    label: 'Templates',
    href: '/admin/dokumente/vorlagen',
    icon: <DynamicFeed />,
    roles: ['admin'],
  },
];

export function RoleBasedNavigation() {
  const { currentRole } = useRole();
  const isDark = false;

  const filteredItems = navigationItems.filter(item => item.roles.includes(currentRole));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {filteredItems.map(item => (
        <Button
          key={item.href}
          component={Link}
          href={item.href}
          startIcon={item.icon}
          sx={{
            color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            py: 1,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            },
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
}
