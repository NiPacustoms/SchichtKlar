'use client';

import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DeleteOutline, EditOutlined, MoreHoriz, ToggleOffOutlined, ToggleOnOutlined } from '@mui/icons-material';
import { useState } from 'react';
import type { User } from '@/lib/types';

export interface StaffTableActions {
  onEdit: (member: User) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onToggleAll: (ids: string[], select: boolean) => void;
  busy?: boolean;
}

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');
}

const STATUS_LABEL: Record<string, string> = {
  'on-leave': 'Urlaub',
  sick: 'Krank',
  inactive: 'Inaktiv',
};

function StatusCell({ member }: { member: User }) {
  if (!member.active) return <Chip size="small" label="Deaktiviert" variant="outlined" />;
  const special = member.currentStatus && STATUS_LABEL[member.currentStatus];
  if (special) return <Chip size="small" label={special} color="warning" variant="outlined" />;
  return <Chip size="small" label="Aktiv" color="success" variant="outlined" />;
}

function Qualifications({ list }: { list: string[] }) {
  if (!list?.length) return <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {list.slice(0, 2).map(q => (
        <Chip key={q} size="small" label={q} sx={{ bgcolor: 'action.hover', fontWeight: 500 }} />
      ))}
      {list.length > 2 && (
        <Tooltip title={list.slice(2).join(', ')}>
          <Chip size="small" label={`+${list.length - 2}`} variant="outlined" />
        </Tooltip>
      )}
    </Box>
  );
}

function RowMenu({ member, actions }: { member: User; actions: StaffTableActions }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const name = member.displayName || member.email || 'Mitarbeiter';
  const close = () => setAnchor(null);
  return (
    <>
      <IconButton size="small" aria-label={`Aktionen für ${name}`} onClick={e => setAnchor(e.currentTarget)}>
        <MoreHoriz fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            close();
            actions.onEdit(member);
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          Bearbeiten
        </MenuItem>
        <MenuItem
          disabled={actions.busy}
          onClick={() => {
            close();
            actions.onToggleActive(member.id);
          }}
        >
          <ListItemIcon>
            {member.active ? <ToggleOffOutlined fontSize="small" /> : <ToggleOnOutlined fontSize="small" />}
          </ListItemIcon>
          {member.active ? 'Deaktivieren' : 'Aktivieren'}
        </MenuItem>
        <MenuItem
          disabled={actions.busy}
          onClick={() => {
            close();
            actions.onDelete(member.id);
          }}
          sx={{ color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" />
          </ListItemIcon>
          Löschen
        </MenuItem>
      </Menu>
    </>
  );
}

function NameCell({ member }: { member: User }) {
  const name = member.displayName || member.email || 'Unbekannt';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: 13,
          fontWeight: 600,
          bgcolor: member.active ? 'primary.main' : 'grey.400',
          color: 'primary.contrastText',
        }}
      >
        {initials(name) || '?'}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
          {name}
          {member.role === 'admin' && (
            <Chip size="small" label="Admin" sx={{ ml: 1, height: 20, fontSize: 11.5 }} variant="outlined" />
          )}
        </Typography>
        <Typography noWrap sx={{ fontSize: 13, color: 'text.secondary' }}>
          {member.email}
        </Typography>
      </Box>
    </Box>
  );
}

/** Mitarbeiterliste: Tabelle am Desktop, kompakte Liste mobil. Texte werden von React escaped. */
export function StaffTable({
  members,
  selectedIds,
  actions,
}: {
  members: User[];
  selectedIds: string[];
  actions: StaffTableActions;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const ids = members.map(m => m.id);
  const allSelected = ids.length > 0 && ids.every(id => selectedIds.includes(id));
  const someSelected = ids.some(id => selectedIds.includes(id));

  const frame = { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' };

  if (!isDesktop) {
    return (
      <Box component="ul" sx={{ ...frame, listStyle: 'none', m: 0, p: 0 }}>
        {members.map((m, i) => (
          <Box
            component="li"
            key={m.id}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25, borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <NameCell member={m} />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1, pl: 5.5, flexWrap: 'wrap' }}>
                <StatusCell member={m} />
                {m.qualifications?.[0] && (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{m.qualifications.join(', ')}</Typography>
                )}
              </Box>
            </Box>
            <RowMenu member={m} actions={actions} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={frame}>
      <Table size="small" sx={{ '& td, & th': { borderColor: 'divider' } }}>
        <TableHead>
          <TableRow
            sx={{
              '& th': {
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: 0,
                color: 'text.secondary',
                bgcolor: 'action.hover',
                py: 1,
              },
            }}
          >
            <TableCell padding="checkbox">
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onChange={() => actions.onToggleAll(ids, !allSelected)}
                inputProps={{ 'aria-label': 'Alle auf dieser Seite auswählen' }}
              />
            </TableCell>
            <TableCell>Name</TableCell>
            <TableCell sx={{ width: 160 }}>Telefon</TableCell>
            <TableCell>Qualifikationen</TableCell>
            <TableCell sx={{ width: 110 }}>Wochenstunden</TableCell>
            <TableCell sx={{ width: 120 }}>Status</TableCell>
            <TableCell sx={{ width: 56 }} aria-label="Aktionen" />
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map(m => {
            const selected = selectedIds.includes(m.id);
            return (
              <TableRow key={m.id} hover selected={selected} sx={{ '& td': { py: 1, fontSize: 14 } }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selected}
                    onChange={() => actions.onToggleSelected(m.id)}
                    inputProps={{ 'aria-label': `${m.displayName || m.email} auswählen` }}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 320 }}>
                  <NameCell member={m} />
                </TableCell>
                <TableCell className="tabular-nums" sx={{ whiteSpace: 'nowrap', color: m.phone ? 'text.primary' : 'text.disabled' }}>
                  {m.phone || '—'}
                </TableCell>
                <TableCell>
                  <Qualifications list={m.qualifications} />
                </TableCell>
                <TableCell className="tabular-nums" sx={{ color: m.workingHoursPerWeek ? 'text.primary' : 'text.disabled' }}>
                  {m.workingHoursPerWeek ? `${m.workingHoursPerWeek.toLocaleString('de-DE')} h` : '—'}
                </TableCell>
                <TableCell>
                  <StatusCell member={m} />
                </TableCell>
                <TableCell align="right">
                  <RowMenu member={m} actions={actions} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

export default StaffTable;
