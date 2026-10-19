'use client';

import {
  Box,
  Dialog,
  InputBase,
  ListSubheader,
  MenuItem,
  MenuList,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AccessTimeOutlined,
  EventBusyOutlined,
  ReceiptLongOutlined,
  AssignmentOutlined,
  BusinessOutlined,
  CalendarMonthOutlined,
  DashboardOutlined,
  PersonOutline,
  Search as SearchIcon,
  SettingsOutlined,
  ViewWeekOutlined,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { facilityService } from '@/lib/services/facilities';
import { userService } from '@/lib/services/users';

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  group: 'Seiten' | 'Mitarbeiter' | 'Einrichtungen';
  label: string;
  hint?: string;
  icon: ReactNode;
  href: string;
  keywords?: string;
}

const ADMIN_PAGES: Command[] = [
  { id: 'p-uebersicht', group: 'Seiten', label: 'Übersicht', icon: <DashboardOutlined />, href: '/admin/uebersicht' },
  { id: 'p-dienstplan', group: 'Seiten', label: 'Dienstplan', icon: <ViewWeekOutlined />, href: '/admin/dienstplan' },
  { id: 'p-schichten', group: 'Seiten', label: 'Schichten', icon: <CalendarMonthOutlined />, href: '/admin/schichten', keywords: 'dienste' },
  { id: 'p-einsaetze', group: 'Seiten', label: 'Einsätze', icon: <AssignmentOutlined />, href: '/admin/einsaetze' },
  { id: 'p-mitarbeiter', group: 'Seiten', label: 'Mitarbeiter', icon: <PersonOutline />, href: '/admin/mitarbeiter', keywords: 'personal' },
  { id: 'p-zeitnachweise', group: 'Seiten', label: 'Zeitnachweise', icon: <AccessTimeOutlined />, href: '/admin/zeitnachweise', keywords: 'freigeben prüfen stundenzettel zeiterfassung ablehnen' },
  { id: 'p-abwesenheiten', group: 'Seiten', label: 'Abwesenheiten', icon: <EventBusyOutlined />, href: '/admin/abwesenheiten', keywords: 'urlaub krank krankmeldung urlaubsantrag genehmigen au' },
  { id: 'p-stundennachweise', group: 'Seiten', label: 'Stundennachweise', icon: <ReceiptLongOutlined />, href: '/admin/stundennachweise', keywords: 'stundenzettel stundennachweis arbeitszeiterfassung monat unterschrift anerkennen lohnbüro pdf' },
  { id: 'p-stunden', group: 'Seiten', label: 'Stunden', icon: <AccessTimeOutlined />, href: '/admin/stunden', keywords: 'zeiterfassung soll ist' },
  { id: 'p-einrichtungen', group: 'Seiten', label: 'Einrichtungen', icon: <BusinessOutlined />, href: '/admin/einrichtungen', keywords: 'kunden' },
  { id: 'p-einstellungen', group: 'Seiten', label: 'Einstellungen', icon: <SettingsOutlined />, href: '/admin/einstellungen' },
];

const EMPLOYEE_PAGES: Command[] = [
  { id: 'e-arbeitsplatz', group: 'Seiten', label: 'Arbeitsplatz', icon: <DashboardOutlined />, href: '/employee/arbeitsplatz' },
  { id: 'e-dienstplan', group: 'Seiten', label: 'Mein Dienstplan', icon: <CalendarMonthOutlined />, href: '/employee/dienstplan' },
  { id: 'e-zeit', group: 'Seiten', label: 'Zeiterfassung', icon: <AccessTimeOutlined />, href: '/employee/zeiterfassung' },
  { id: 'e-einsaetze', group: 'Seiten', label: 'Meine Einsätze', icon: <AssignmentOutlined />, href: '/employee/einsaetze' },
  { id: 'e-profil', group: 'Seiten', label: 'Profil', icon: <PersonOutline />, href: '/employee/profil' },
];

function normalize(s: string) {
  return s.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Befehlspalette (⌘K / Strg+K): springt zu Seiten, Mitarbeitenden und
 * Einrichtungen. Ergebnisse filtern beim Tippen, Pfeiltasten wählen, Enter öffnet.
 */
export function GlobalSearchDialog({ open, onClose }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessAdminArea } = usePermissions();
  const companyId = user?.companyId;
  const listRef = useRef<HTMLUListElement>(null);

  const { data: staff = [] } = useQuery({
    queryKey: ['palette-staff', companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 500, { companyId });
      return Array.isArray(res) ? res : res.data;
    },
    enabled: open && canAccessAdminArea && !!companyId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: facilities = [] } = useQuery({
    queryKey: ['palette-facilities', companyId],
    queryFn: () => facilityService.getAll(companyId),
    enabled: open && canAccessAdminArea && !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const results = useMemo(() => {
    const pages = canAccessAdminArea ? ADMIN_PAGES : EMPLOYEE_PAGES;
    const people: Command[] = canAccessAdminArea
      ? staff.map(u => ({
          id: `u-${u.id}`,
          group: 'Mitarbeiter',
          label: u.displayName || u.email,
          hint: u.qualifications?.join(', ') || u.email,
          icon: <PersonOutline />,
          href: `/admin/mitarbeiter/${u.id}`,
          keywords: `${u.email} ${(u.qualifications || []).join(' ')}`,
        }))
      : [];
    const places: Command[] = canAccessAdminArea
      ? facilities.map(f => ({
          id: `f-${f.id}`,
          group: 'Einrichtungen',
          label: f.name,
          hint: f.address,
          icon: <BusinessOutlined />,
          href: `/admin/einrichtungen/${f.id}`,
          keywords: `${f.address} ${f.contactPerson ?? ''}`,
        }))
      : [];
    const q = normalize(query.trim());
    if (!q) return pages;
    const match = (c: Command) => normalize(`${c.label} ${c.keywords ?? ''} ${c.hint ?? ''}`).includes(q);
    return [...pages.filter(match), ...people.filter(match).slice(0, 6), ...places.filter(match).slice(0, 6)];
  }, [query, staff, facilities, canAccessAdminArea]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const go = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    router.push(c.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let lastGroup = '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      PaperProps={{ sx: { mt: isMobile ? 0 : '12vh', alignSelf: 'flex-start', overflow: 'hidden' } }}
      aria-label="Suchen und springen"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, height: 56, borderBottom: '1px solid', borderColor: 'divider' }}>
        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <InputBase
          autoFocus
          fullWidth
          placeholder={canAccessAdminArea ? 'Seite, Mitarbeiter oder Einrichtung suchen' : 'Seite suchen'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          inputProps={{ 'aria-label': 'Suchbegriff', 'aria-activedescendant': results[active]?.id }}
          sx={{ fontSize: 15.5 }}
        />
        <Box
          component="kbd"
          onClick={onClose}
          sx={{ fontFamily: 'inherit', fontSize: 11.5, px: 0.75, py: 0.25, border: '1px solid', borderColor: 'divider', borderRadius: '5px', color: 'text.secondary', cursor: 'pointer' }}
        >
          Esc
        </Box>
      </Box>
      <MenuList ref={listRef} dense sx={{ maxHeight: { xs: 'none', sm: 400 }, overflowY: 'auto', py: 1 }}>
        {results.length === 0 && (
          <Typography sx={{ px: 2.5, py: 3, color: 'text.secondary', fontSize: 14 }}>
            Keine Treffer für „{query}“.
          </Typography>
        )}
        {results.flatMap((c, i) => {
          const items: ReactNode[] = [];
          if (c.group !== lastGroup) {
            lastGroup = c.group;
            items.push(
              <ListSubheader key={`h-${c.group}`} disableSticky sx={{ lineHeight: '28px', fontSize: 12, fontWeight: 600, color: 'text.secondary', bgcolor: 'transparent' }}>
                {c.group}
              </ListSubheader>
            );
          }
          items.push(
            <MenuItem
              key={c.id}
              id={c.id}
              data-index={i}
              selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(c)}
              sx={{ gap: 1.5, py: 1, '& svg': { fontSize: 19, color: 'text.secondary' } }}
            >
              {c.icon}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
                  {c.label}
                </Typography>
                {c.hint && (
                  <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    {c.hint}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          );
          return items;
        })}
      </MenuList>
    </Dialog>
  );
}

export default GlobalSearchDialog;
