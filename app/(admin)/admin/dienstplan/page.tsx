'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { AdminListView } from '@/components/schedule/AdminListView';
import AdminCalendarView from '@/components/schedule/AdminCalendarView';
import { AssignShiftDialog } from '@/components/admin/AssignShiftDialog';
import { PageContainer } from '@/components/layout/PageContainer';
import { ShiftCreateDialog } from '@/components/admin/ShiftCreateDialog';
import ShiftEditDialog from '@/components/admin/ShiftEditDialog';
import { toast } from '@/lib/utils/toast';
import { shiftService } from '@/lib/services';
import { Shift as ServiceShift } from '@/lib/services/shifts';
import type { Shift as UiShift } from '@/lib/types';
import { Add, Refresh } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { StatStrip } from '@/components/ui/StatStrip';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { PerformanceMonitor, UserActionTracker } from '@/lib/logging';
import { MenuItem, Select } from '@mui/material';
import { facilityService } from '@/lib/services/facilities';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { getShiftDisplayStatus } from '@/lib/utils/shiftStatus';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AdminDienstplanPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  // Standard: aktuelle Woche – der Dienstplan beginnt dort, wo gerade gearbeitet wird
  const [dateFrom, setDateFrom] = useState<Date | null>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dateTo, setDateTo] = useState<Date | null>(() => endOfWeek(new Date(), { weekStartsOn: 1 }));
  const [statusFilter, setStatusFilter] = useState<ServiceShift['status'] | 'ended' | ''>('');
  const [facilityFilter, setFacilityFilter] = useState<string>('');
  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities', user?.companyId],
    queryFn: () => facilityService.getAll(user?.companyId),
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
    staleTime: 5 * 60 * 1000,
  });

  const FILTERS_VERSION = 'v1';
  const storageKey = useMemo(
    () => `admin_shift_filters_${FILTERS_VERSION}_${user?.id || 'anon'}`,
    [user?.id]
  );

  const {
    data: shifts = [],
    isLoading,
    refetch,
  } = useQuery<ServiceShift[]>({
    queryKey: [
      'adminShifts',
      user?.companyId,
      dateFrom?.toISOString() || null,
      dateTo?.toISOString() || null,
      statusFilter || null,
      facilityFilter || null,
    ],
    queryFn: () =>
      shiftService.getAll({
        companyId: user?.companyId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: statusFilter === 'ended' ? undefined : (statusFilter || undefined),
        facilityId: facilityFilter || undefined,
      }),
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
  });

  // Realtime-Updates: invalidiere Query bei Änderungen
  const queryClient = useQueryClient();
  const companyId = user?.companyId;
  useEffect(() => {
    // Ohne companyId kein Abo: unscoped Queries würden von den Rules abgelehnt
    if (!companyId) return;
    const unsubscribe = shiftService.subscribeAll(
      {
        companyId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: statusFilter === 'ended' ? undefined : (statusFilter || undefined),
        facilityId: facilityFilter || undefined,
      },
      newShifts => {
        queryClient.setQueryData<ServiceShift[]>(
          [
            'adminShifts',
            dateFrom?.toISOString() || null,
            dateTo?.toISOString() || null,
            statusFilter || null,
            facilityFilter || null,
          ],
          newShifts
        );
      },
      () => {
        /* optional: Fehler ignorieren */
      }
    );
    return () => unsubscribe();
  }, [queryClient, companyId, dateFrom, dateTo, statusFilter, facilityFilter]);

  // Load filters from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed) {
          if (parsed.dateFrom) setDateFrom(new Date(parsed.dateFrom));
          if (parsed.dateTo) setDateTo(new Date(parsed.dateTo));
          if (parsed.statusFilter != null) setStatusFilter(parsed.statusFilter);
          if (parsed.facilityFilter != null) setFacilityFilter(parsed.facilityFilter);
        }
      }
    } catch (_e) {
      // ignore malformed storage
    }
  }, [storageKey]);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
            dateTo: dateTo ? dateTo.toISOString() : undefined,
            statusFilter: statusFilter || undefined,
            facilityFilter: facilityFilter || undefined,
          })
        );
      }
    } catch (_e) {
      // ignore quota errors
    }
  }, [storageKey, dateFrom, dateTo, statusFilter, facilityFilter]);

  // Dialog/Action State
  const [assignOpen, setAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCreateDate, setSelectedCreateDate] = useState<Date | null>(null);
  const [selectedShift, setSelectedShift] = useState<ServiceShift | null>(null);
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('manage_shifts');
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [sendingReminders, setSendingReminders] = useState(false);

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      const res = await fetch('/api/forms/reminders', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Senden');
      toast.success(`Erinnerungen versendet: ${data.sent}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Senden');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleOpenAssign = (shift: ServiceShift) => {
    if (process.env.NODE_ENV === 'development') {
      PerformanceMonitor.startTimer('dialog.assign.open');
      UserActionTracker.trackAction('open_assign_dialog', { shiftId: shift.id });
    }
    setSelectedShift(shift);
    setAssignOpen(true);
  };

  const handleDelete = async (shift: ServiceShift) => {
    try {
      await shiftService.delete(shift.id);
      toast.success('Schicht gelöscht');
      refetch();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Löschen fehlgeschlagen';
      toast.error(message);
    }
  };

  const handleEdit = (shift: ServiceShift) => {
    if (process.env.NODE_ENV === 'development') {
      PerformanceMonitor.startTimer('dialog.edit.open');
      UserActionTracker.trackAction('open_edit_dialog', { shiftId: shift.id });
    }
    setSelectedShift(shift);
    setEditOpen(true);
  };

  const rangeShifts = useMemo(() => {
    const dayStart = dateFrom
      ? new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate(), 0, 0, 0, 0)
      : null;
    const dayEnd = dateTo
      ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999)
      : null;

    const list = shifts.filter(s => {
      const date = s?.date ? new Date(s.date) : null;
      if (dayStart && date && date < dayStart) return false;
      if (dayEnd && date && date > dayEnd) return false;
      return true;
    });
    return list;
  }, [shifts, dateFrom, dateTo]);

  const filteredShifts = useMemo(() => {
    let list = rangeShifts;
    // Nach Anzeige-Status: Beendete Schichten nicht unter "Besetzt"
    if (statusFilter === 'filled') list = list.filter(s => getShiftDisplayStatus(s) === 'filled');
    else if (statusFilter === 'open') list = list.filter(s => getShiftDisplayStatus(s) === 'open');
    else if (statusFilter === 'ended') list = list.filter(s => getShiftDisplayStatus(s) === 'ended');
    else if (statusFilter === 'cancelled') list = list.filter(s => s.status === 'cancelled');

    return list;
  }, [rangeShifts, statusFilter]);

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bitte melden Sie sich an, um den Dienstplan zu sehen.</Alert>
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Dienstplan"
        subtitle="Schichten nach Zeitraum, Status und Einrichtung – als Liste oder Kalender"
        actions={
          <>
          <IconButton onClick={() => refetch()} aria-label="Aktualisieren">
            <Refresh />
          </IconButton>
          <Button
            variant="text"
            onClick={handleSendReminders}
            disabled={sendingReminders || !canManage}
          >
            {sendingReminders ? 'Sende…' : 'Erinnerungen senden'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              if (!canManage) {
                toast.error('Keine Berechtigung, Schichten zu erstellen');
                return;
              }
              if (process.env.NODE_ENV === 'development') {
                PerformanceMonitor.startTimer('dialog.create.open');
                UserActionTracker.trackAction('open_create_dialog');
              }
              setCreateOpen(true);
            }}
            disabled={!canManage}
          >
            Neue Schicht
          </Button>
          </>
        }
      />

      {(() => {
        const now = new Date();
        const presets = {
          today: [startOfDay(now), endOfDay(now)],
          week: [startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })],
          month: [startOfMonth(now), endOfMonth(now)],
        } as const;
        const same = (a: Date | null, b: Date) => !!a && a.getTime() === b.getTime();
        const preset = !dateFrom && !dateTo
          ? 'all'
          : (Object.keys(presets) as (keyof typeof presets)[]).find(
              k => same(dateFrom, presets[k][0]) && same(dateTo, presets[k][1])
            ) ?? 'custom';
        const filtersActive = !!(dateFrom || dateTo || statusFilter || facilityFilter);
        const counts = {
          open: rangeShifts.filter(s => getShiftDisplayStatus(s) === 'open').length,
          filled: rangeShifts.filter(s => getShiftDisplayStatus(s) === 'filled').length,
          ended: rangeShifts.filter(s => getShiftDisplayStatus(s) === 'ended').length,
        };
        return (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
                mb: 2,
              }}
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={activeTab}
                onChange={(_, v) => v !== null && setActiveTab(v)}
                aria-label="Ansicht"
              >
                <ToggleButton value={0}>Liste</ToggleButton>
                <ToggleButton value={1}>Kalender</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={preset}
                aria-label="Zeitraum"
                onChange={(_, v) => {
                  if (!v || v === 'custom') return;
                  if (v === 'all') {
                    setDateFrom(null);
                    setDateTo(null);
                    return;
                  }
                  const [f, t] = presets[v as keyof typeof presets];
                  setDateFrom(f);
                  setDateTo(t);
                }}
              >
                <ToggleButton value="today">Heute</ToggleButton>
                <ToggleButton value="week">Woche</ToggleButton>
                <ToggleButton value="month">Monat</ToggleButton>
                <ToggleButton value="all">Alle</ToggleButton>
              </ToggleButtonGroup>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                <DatePicker
                  label="Von"
                  value={dateFrom}
                  onChange={d => setDateFrom(d)}
                  slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
                />
                <DatePicker
                  label="Bis"
                  value={dateTo}
                  onChange={d => setDateTo(d)}
                  slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
                />
              </LocalizationProvider>
              <Select
                size="small"
                displayEmpty
                value={facilityFilter}
                onChange={e => setFacilityFilter((e.target.value as string) || '')}
                inputProps={{ 'aria-label': 'Einrichtung' }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Alle Einrichtungen</MenuItem>
                {facilities.map(f => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name}
                  </MenuItem>
                ))}
              </Select>
              {filtersActive && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setDateFrom(null);
                    setDateTo(null);
                    setStatusFilter('');
                    setFacilityFilter('');
                    try {
                      if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey);
                    } catch (_e) {
                      /* noop */
                    }
                  }}
                >
                  Filter zurücksetzen
                </Button>
              )}
            </Box>
            {activeTab === 0 && (
              <StatStrip
                aria-label="Schichten nach Status"
                items={[
                  { label: 'Alle', value: rangeShifts.length, selected: !statusFilter, onClick: () => setStatusFilter('') },
                  {
                    label: 'Offen',
                    value: counts.open,
                    tone: counts.open > 0 ? 'attention' : 'default',
                    selected: statusFilter === 'open',
                    onClick: () => setStatusFilter(statusFilter === 'open' ? '' : 'open'),
                  },
                  { label: 'Besetzt', value: counts.filled, selected: statusFilter === 'filled', onClick: () => setStatusFilter(statusFilter === 'filled' ? '' : 'filled') },
                  { label: 'Beendet', value: counts.ended, tone: 'muted', selected: statusFilter === 'ended', onClick: () => setStatusFilter(statusFilter === 'ended' ? '' : 'ended') },
                ]}
              />
            )}
          </>
        );
      })()}

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '40vh',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {activeTab === 0 && (
            <Grid size={{ xs: 12 }}>
              <AdminListView
                shifts={filteredShifts as unknown as UiShift[]}
                onShiftClick={(s: UiShift) => setSelectedShift(s as unknown as ServiceShift)}
                onEdit={(s: UiShift) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung zum Bearbeiten');
                    return;
                  }
                  handleEdit(s as unknown as ServiceShift);
                }}
                onAssign={(s: UiShift) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung zum Zuweisen');
                    return;
                  }
                  handleOpenAssign(s as unknown as ServiceShift);
                }}
                onDelete={(s: UiShift) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung zum Löschen');
                    return;
                  }
                  handleDelete(s as unknown as ServiceShift);
                }}
              />
            </Grid>
          )}
          {activeTab === 1 && (
            <Grid size={{ xs: 12 }}>
              <AdminCalendarView
                shifts={filteredShifts as unknown as UiShift[]}
                onShiftClick={(s: UiShift) => setSelectedShift(s as unknown as ServiceShift)}
                onEdit={(s: UiShift) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung zum Bearbeiten');
                    return;
                  }
                  handleEdit(s as unknown as ServiceShift);
                }}
                onAssign={(s: UiShift) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung zum Zuweisen');
                    return;
                  }
                  handleOpenAssign(s as unknown as ServiceShift);
                }}
                onDelete={(s: UiShift) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung zum Löschen');
                    return;
                  }
                  handleDelete(s as unknown as ServiceShift);
                }}
                onDayClick={(d: Date) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung, Schichten zu erstellen');
                    return;
                  }
                  setSelectedCreateDate(d);
                  setCreateOpen(true);
                }}
                onDayLongPress={(d: Date) => {
                  if (!canManage) {
                    toast.error('Keine Berechtigung');
                    return;
                  }
                  setSelectedCreateDate(d);
                  setCreateOpen(true);
                }}
              />
            </Grid>
          )}
        </Grid>
      )}

      {/* Dialoge */}
      {selectedShift &&
        (() => {
          const selectedShiftUi = selectedShift as unknown as UiShift;
          return (
            <AssignShiftDialog
              open={assignOpen}
              onClose={() => setAssignOpen(false)}
              shift={selectedShiftUi}
            />
          );
        })()}
      <ShiftEditDialog
        open={editOpen}
        shift={selectedShift}
        onClose={() => setEditOpen(false)}
        onUpdated={() => refetch()}
      />
      <ShiftCreateDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setSelectedCreateDate(null);
        }}
        initialDate={selectedCreateDate}
      />
      {/* Kein FAB/Speeddial auf Mobil gemäß Anforderung */}
    </PageContainer>
  );
}
