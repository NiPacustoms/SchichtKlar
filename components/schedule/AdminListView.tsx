'use client';

import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DeleteOutline, EditOutlined, EventBusyOutlined, MoreHoriz, PersonAddAlt1Outlined } from '@mui/icons-material';
import { format, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Fragment, useMemo, useState } from 'react';
import type { Shift } from '@/lib/types';
import { useShiftEnrichment } from '@/lib/hooks/useShiftEnrichment';
import { getShiftDisplayStatus, getShiftStatusLabel, type ShiftDisplayStatus } from '@/lib/utils/shiftStatus';

interface AdminListViewProps {
  shifts: Shift[];
  onShiftClick: (shift: Shift) => void;
  onEdit: (shift: Shift) => void;
  onAssign: (shift: Shift) => void;
  onDelete: (shift: Shift) => void;
  /** Optional: companyId für die Namensauflösung (sonst aus dem Login) */
  companyId?: string;
}

const PAGE = 150;

const STATUS_CHIP: Record<ShiftDisplayStatus, 'warning' | 'success' | 'error' | 'default'> = {
  open: 'warning',
  filled: 'success',
  cancelled: 'error',
  ended: 'default',
};

function dayLabel(d: Date) {
  const base = format(d, 'EEEE, d. MMMM', { locale: de });
  if (isToday(d)) return `Heute · ${base}`;
  if (isTomorrow(d)) return `Morgen · ${base}`;
  return base;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');
}

function toDate(v: unknown): Date {
  return v instanceof Date ? v : new Date(v as string);
}

/**
 * Schichtliste nach Tagen gruppiert. Einrichtungs-, Stations- und Personennamen
 * kommen gesammelt aus useShiftEnrichment (keine Abfrage je Zeile).
 */
export function AdminListView({ shifts, onShiftClick, onEdit, onAssign, onDelete, companyId }: AdminListViewProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [visible, setVisible] = useState(PAGE);
  const [menu, setMenu] = useState<{ el: HTMLElement; shift: Shift } | null>(null);
  const { enrichment, isLoading } = useShiftEnrichment(shifts, companyId);

  const groups = useMemo(() => {
    const sorted = [...shifts].sort((a, b) => {
      const d = toDate(a.date).getTime() - toDate(b.date).getTime();
      return d !== 0 ? d : (a.startTime || '').localeCompare(b.startTime || '');
    });
    const out: { key: string; date: Date; items: Shift[] }[] = [];
    for (const s of sorted.slice(0, visible)) {
      const d = toDate(s.date);
      const key = format(d, 'yyyy-MM-dd');
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push(s);
      else out.push({ key, date: d, items: [s] });
    }
    return out;
  }, [shifts, visible]);

  if (shifts.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
        }}
      >
        <EventBusyOutlined sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Keine Schichten im gewählten Zeitraum</Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
          Ändern Sie die Filter oder legen Sie eine neue Schicht an.
        </Typography>
      </Box>
    );
  }

  const cols = '96px minmax(180px, 1.4fr) minmax(160px, 1fr) minmax(110px, 0.6fr) 120px 76px';

  const row = (shift: Shift) => {
    const e = enrichment[shift.id];
    const status = getShiftDisplayStatus(shift);
    const chipColor = STATUS_CHIP[status] ?? 'default';
    const assigned = shift.assignedCount || 0;
    const free = Math.max(0, shift.capacity - assigned);
    const names = e?.assigneeNames ?? [];
    const facility = e?.facilityName;
    const quals = shift.requiredQualifications ?? [];

    const facilityCell = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '2px', flexShrink: 0, bgcolor: e?.facilityColor || 'primary.main' }} />
        <Box sx={{ minWidth: 0 }}>
          {facility ? (
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
              {facility}
            </Typography>
          ) : isLoading ? (
            <Skeleton width={140} />
          ) : (
            <Typography noWrap sx={{ fontSize: 14, color: 'text.secondary' }}>
              Einrichtung unbekannt
            </Typography>
          )}
          {e?.stationName && (
            <Typography noWrap sx={{ fontSize: 13, color: 'text.secondary' }}>
              {e.stationName}
            </Typography>
          )}
        </Box>
      </Box>
    );

    const staffCell =
      names.length > 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 10.5, fontWeight: 600, borderWidth: 1.5 } }}>
            {names.map(n => (
              <Avatar key={n} sx={{ bgcolor: 'primary.main', color: '#ffffff' }}>
                {initials(n)}
              </Avatar>
            ))}
          </AvatarGroup>
          <Typography noWrap sx={{ fontSize: 14 }}>
            {names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`}
          </Typography>
        </Box>
      ) : (
        <Typography sx={{ fontSize: 14, color: status === 'open' ? 'warning.dark' : 'text.disabled' }}>
          {status === 'open' ? `${free} ${free === 1 ? 'Platz' : 'Plätze'} frei` : '—'}
        </Typography>
      );

    const actions = (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }} onClick={ev => ev.stopPropagation()}>
        {free > 0 && status !== 'cancelled' && status !== 'ended' && (
          <Tooltip title="Mitarbeiter zuweisen">
            <IconButton size="small" aria-label="Mitarbeiter zuweisen" onClick={() => onAssign(shift)}>
              <PersonAddAlt1Outlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <IconButton size="small" aria-label="Weitere Aktionen" onClick={ev => setMenu({ el: ev.currentTarget, shift })}>
          <MoreHoriz fontSize="small" />
        </IconButton>
      </Box>
    );

    const time = (
      <Typography className="tabular-nums" sx={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {shift.startTime}–{shift.endTime}
      </Typography>
    );

    if (!isDesktop) {
      return (
        <Box
          key={shift.id}
          role="button"
          tabIndex={0}
          onClick={() => onShiftClick(shift)}
          onKeyDown={ev => ev.key === 'Enter' && onShiftClick(shift)}
          sx={{ display: 'flex', gap: 1.5, px: 1.75, py: 1.5, borderTop: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
        >
          <Box sx={{ width: 76, flexShrink: 0, pt: 0.25 }}>{time}</Box>
          <Box sx={{ flex: 1, minWidth: 0, display: 'grid', gap: 0.75 }}>
            {facilityCell}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              {staffCell}
              <Chip size="small" label={getShiftStatusLabel(status)} color={chipColor} variant="outlined" />
            </Box>
          </Box>
          {actions}
        </Box>
      );
    }

    return (
      <Box
        key={shift.id}
        role="row"
        tabIndex={0}
        onClick={() => onShiftClick(shift)}
        onKeyDown={ev => ev.key === 'Enter' && onShiftClick(shift)}
        sx={{
          display: 'grid',
          gridTemplateColumns: cols,
          alignItems: 'center',
          gap: 2,
          px: 2,
          minHeight: 56,
          borderTop: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
        }}
      >
        {time}
        {facilityCell}
        {staffCell}
        <Box sx={{ display: 'flex', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
          {quals.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>
          ) : (
            <Tooltip title={quals.join(', ')}>
              <Typography noWrap sx={{ fontSize: 13, color: 'text.secondary' }}>
                {quals.join(', ')}
              </Typography>
            </Tooltip>
          )}
        </Box>
        <Box>
          <Chip size="small" label={getShiftStatusLabel(status)} color={chipColor} variant="outlined" />
        </Box>
        {actions}
      </Box>
    );
  };

  return (
    <Box>
      <Box
        role="table"
        aria-label="Schichten"
        sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}
      >
        {isDesktop && (
          <Box
            role="row"
            sx={{
              display: 'grid',
              gridTemplateColumns: cols,
              gap: 2,
              px: 2,
              py: 1,
              bgcolor: 'action.hover',
              '& > span': { fontSize: 13, fontWeight: 600, color: 'text.secondary' },
            }}
          >
            <span role="columnheader">Zeit</span>
            <span role="columnheader">Einrichtung</span>
            <span role="columnheader">Besetzung</span>
            <span role="columnheader">Qualifikation</span>
            <span role="columnheader">Status</span>
            <span />
          </Box>
        )}
        {groups.map(g => {
          const open = g.items.filter(s => getShiftDisplayStatus(s) === 'open').length;
          return (
            <Fragment key={g.key}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 1.5,
                  px: 2,
                  pt: 2,
                  pb: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: isToday(g.date) ? 'rgba(15,118,110,0.04)' : 'transparent',
                }}
              >
                <Typography component="h3" sx={{ fontSize: 14, fontWeight: 650, color: isToday(g.date) ? 'primary.dark' : 'text.primary' }}>
                  {dayLabel(g.date)}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  {g.items.length} {g.items.length === 1 ? 'Schicht' : 'Schichten'}
                  {open > 0 && (
                    <Box component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                      {`, ${open} offen`}
                    </Box>
                  )}
                </Typography>
              </Box>
              {g.items.map(row)}
            </Fragment>
          );
        })}
      </Box>

      {shifts.length > visible && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={() => setVisible(v => v + PAGE)}>
            Weitere {Math.min(PAGE, shifts.length - visible)} Schichten laden
          </Button>
        </Box>
      )}

      <Menu
        anchorEl={menu?.el}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            const s = menu!.shift;
            setMenu(null);
            onEdit(s);
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          Bearbeiten
        </MenuItem>
        <MenuItem
          disabled={menu ? menu.shift.capacity - (menu.shift.assignedCount || 0) <= 0 : false}
          onClick={() => {
            const s = menu!.shift;
            setMenu(null);
            onAssign(s);
          }}
        >
          <ListItemIcon>
            <PersonAddAlt1Outlined fontSize="small" />
          </ListItemIcon>
          Zuweisen
        </MenuItem>
        <MenuItem
          onClick={() => {
            const s = menu!.shift;
            setMenu(null);
            onDelete(s);
          }}
          sx={{ color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" />
          </ListItemIcon>
          Löschen
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default AdminListView;
