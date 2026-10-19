'use client';

import {
  Box,
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
import {
  Cancel,
  CheckCircle,
  DeleteOutline,
  DrawOutlined,
  MoreHoriz,
  PersonAdd,
  PictureAsPdf,
} from '@mui/icons-material';
import { useState, type ReactNode } from 'react';
import { assignmentStatusColor, assignmentStatusLabel } from '@/lib/domain/assignmentStatus';

export interface AssignmentRow {
  id: string;
  status: string;
  date: Date | null;
  timeRange: string | null;
  facilityName: string;
  facilityColor?: string;
  personName: string | null;
  declineReason?: string;
  pdfUrl?: string;
  canGeneratePdf?: boolean;
  shiftId?: string;
}

export interface AssignmentRowActions {
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onSignDecline: (id: string) => void;
  onGeneratePdf: (id: string) => void;
  onReassign: (row: AssignmentRow) => void;
  busyId?: string | null;
}

const dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });

function formatDate(d: Date | null) {
  return d ? dateFmt.format(d) : '—';
}

/** Aktionen je Status – dieselben wie zuvor auf den Karten, jetzt in einem Menü. */
function actionsFor(row: AssignmentRow, a: AssignmentRowActions) {
  const items: Array<{ label: string; icon: ReactNode; onClick: () => void; danger?: boolean }> = [];
  if (row.status === 'pending') {
    items.push({ label: 'Annehmen', icon: <CheckCircle fontSize="small" />, onClick: () => a.onAccept(row.id) });
    items.push({ label: 'Ablehnen', icon: <Cancel fontSize="small" />, onClick: () => a.onDecline(row.id), danger: true });
  }
  if (row.status === 'pending-signature') {
    items.push({ label: 'Ablehnung unterschreiben', icon: <DrawOutlined fontSize="small" />, onClick: () => a.onSignDecline(row.id) });
  }
  if (row.pdfUrl) {
    items.push({
      label: 'Einsatzmitteilung öffnen',
      icon: <PictureAsPdf fontSize="small" />,
      onClick: () => window.open(row.pdfUrl, '_blank', 'noopener'),
    });
  } else if (row.canGeneratePdf) {
    items.push({ label: 'PDF erstellen', icon: <PictureAsPdf fontSize="small" />, onClick: () => a.onGeneratePdf(row.id) });
  }
  if (row.status === 'declined') {
    items.push({ label: 'Neu zuweisen', icon: <PersonAdd fontSize="small" />, onClick: () => a.onReassign(row) });
  }
  if (row.status === 'accepted') {
    items.push({ label: 'Stornieren', icon: <Cancel fontSize="small" />, onClick: () => a.onCancel(row.id), danger: true });
  }
  if (row.status === 'declined' || row.status === 'completed') {
    items.push({ label: 'Löschen', icon: <DeleteOutline fontSize="small" />, onClick: () => a.onDelete(row.id), danger: true });
  }
  return items;
}

function RowMenu({ row, actions }: { row: AssignmentRow; actions: AssignmentRowActions }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const items = actionsFor(row, actions);
  if (items.length === 0) return null;
  return (
    <>
      <Tooltip title="Aktionen">
        <IconButton
          size="small"
          aria-label={`Aktionen für Einsatz ${row.facilityName}`}
          onClick={e => setAnchor(e.currentTarget)}
          disabled={actions.busyId === row.id}
        >
          <MoreHoriz fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {items.map(it => (
          <MenuItem
            key={it.label}
            onClick={() => {
              setAnchor(null);
              it.onClick();
            }}
            sx={it.danger ? { color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } } : undefined}
          >
            <ListItemIcon>{it.icon}</ListItemIcon>
            {it.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function FacilityCell({ row }: { row: AssignmentRow }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Box
        aria-hidden
        sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: row.facilityColor || 'grey.400' }}
      />
      <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
        {row.facilityName}
      </Typography>
    </Box>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      label={assignmentStatusLabel(status)}
      color={assignmentStatusColor(status)}
      variant={status === 'accepted' || status === 'pending-signature' || status === 'declined' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 500 }}
    />
  );
}

/**
 * Einsatzliste: am Desktop eine dichte Tabelle, mobil eine kompakte Liste.
 * Zeigt Einrichtung und Person mit Namen (nicht mit internen IDs) und die
 * tatsächliche Dienstzeit.
 */
export function AssignmentTable({ rows, actions }: { rows: AssignmentRow[]; actions: AssignmentRowActions }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (!isDesktop) {
    return (
      <Box
        component="ul"
        sx={{ listStyle: 'none', m: 0, p: 0, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}
      >
        {rows.map((row, i) => (
          <Box
            component="li"
            key={row.id}
            sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', px: 2, py: 1.5, borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <FacilityCell row={row} />
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }} className="tabular-nums">
                {formatDate(row.date)}
                {row.timeRange ? ` · ${row.timeRange}` : ''}
              </Typography>
              <Typography sx={{ fontSize: 13, mt: 0.25, color: row.personName ? 'text.primary' : 'text.secondary' }} noWrap>
                {row.personName ?? 'Noch niemand zugewiesen'}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <StatusChip status={row.status} />
              </Box>
            </Box>
            <RowMenu row={row} actions={actions} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
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
                borderRight: 'none',
                py: 1.25,
              },
            }}
          >
            <TableCell sx={{ width: 150 }}>Datum</TableCell>
            <TableCell sx={{ width: 130 }}>Zeit</TableCell>
            <TableCell>Einrichtung</TableCell>
            <TableCell>Mitarbeiter/in</TableCell>
            <TableCell sx={{ width: 170 }}>Status</TableCell>
            <TableCell sx={{ width: 56 }} aria-label="Aktionen" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id} hover sx={{ '& td': { py: 1.1, fontSize: 14 } }}>
              <TableCell className="tabular-nums" sx={{ whiteSpace: 'nowrap' }}>
                {formatDate(row.date)}
              </TableCell>
              <TableCell
                className="tabular-nums"
                sx={{ whiteSpace: 'nowrap', color: row.timeRange ? 'text.primary' : 'text.secondary' }}
              >
                {row.timeRange ?? '—'}
              </TableCell>
              <TableCell sx={{ maxWidth: 280 }}>
                <FacilityCell row={row} />
              </TableCell>
              <TableCell sx={{ color: row.personName ? 'text.primary' : 'text.secondary' }}>
                {row.personName ?? 'Noch niemand'}
                {row.status === 'declined' && row.declineReason && (
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }} noWrap title={row.declineReason}>
                    Grund: {row.declineReason}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <StatusChip status={row.status} />
              </TableCell>
              <TableCell align="right">
                <RowMenu row={row} actions={actions} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default AssignmentTable;
