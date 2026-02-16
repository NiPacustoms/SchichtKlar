'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { activityService, type Activity } from '@/lib/services/activities';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const TYPE_LABELS: Record<string, string> = {
  user: 'Benutzer',
  shift: 'Schicht',
  assignment: 'Einsatz',
  timesheet: 'Zeiterfassung',
  document: 'Dokument',
  facility: 'Einrichtung',
  system: 'System',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Erstellt',
  updated: 'Geändert',
  deleted: 'Gelöscht',
  verified: 'Verifiziert',
  rejected: 'Abgelehnt',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  completed: 'Abgeschlossen',
  login: 'Anmeldung',
  logout: 'Abmeldung',
};

function exportToCsv(activities: Activity[]) {
  const header = ['Zeit', 'Benutzer', 'Rolle', 'Typ', 'Aktion', 'Entity', 'Beschreibung'];
  const rows = activities.map(a => [
    format(a.timestamp, 'dd.MM.yyyy HH:mm', { locale: de }),
    a.userName,
    a.userRole,
    TYPE_LABELS[a.type] ?? a.type,
    ACTION_LABELS[a.action] ?? a.action,
    a.entityName,
    a.description,
  ]);
  const csv = [
    header,
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aktivitaeten-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAktivitaetenPage() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  const {
    data: activities = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'activities', 'list', user?.companyId],
    queryFn: () => activityService.getAll({ companyId: user?.companyId, limit: 500 }),
    enabled: !!user?.companyId,
  });

  const filtered = useMemo(() => {
    let list = activities;
    if (filterType) list = list.filter(a => a.type === filterType);
    if (filterAction) list = list.filter(a => a.action === filterAction);
    return list;
  }, [activities, filterType, filterAction]);

  if (!user) {
    return (
      <PageContainer maxWidth="wide">
        <PageHeader title="Aktivitäten" />
        <Typography color="text.secondary">Bitte anmelden.</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Aktivitäten & Login-Protokolle"
        subtitle="Benutzeraktivitäten und An-/Abmeldungen"
        actions={
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportToCsv(filtered)}
            disabled={filtered.length === 0}
          >
            CSV exportieren
          </Button>
        }
      />

      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Typ</InputLabel>
          <Select value={filterType} label="Typ" onChange={e => setFilterType(e.target.value)}>
            <MenuItem value="">Alle</MenuItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Aktion</InputLabel>
          <Select
            value={filterAction}
            label="Aktion"
            onChange={e => setFilterAction(e.target.value)}
          >
            <MenuItem value="">Alle</MenuItem>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorDisplay error={error instanceof Error ? error : new Error(String(error))} />}

      {!isLoading && !error && (
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Zeit</TableCell>
                <TableCell>Benutzer</TableCell>
                <TableCell>Rolle</TableCell>
                <TableCell>Typ</TableCell>
                <TableCell>Aktion</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Beschreibung</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Keine Einträge</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {format(a.timestamp, 'dd.MM.yy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>{a.userName}</TableCell>
                    <TableCell>{a.userRole}</TableCell>
                    <TableCell>{TYPE_LABELS[a.type] ?? a.type}</TableCell>
                    <TableCell>{ACTION_LABELS[a.action] ?? a.action}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={a.entityName}
                    >
                      {a.entityName}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={a.description}
                    >
                      {a.description}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageContainer>
  );
}
