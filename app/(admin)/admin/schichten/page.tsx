'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ShiftManagementCard } from '@/components/admin/ShiftManagementCard';
import { ShiftCreateDialog } from '@/components/admin/ShiftCreateDialog';
import ShiftEditDialog from '@/components/admin/ShiftEditDialog';
import { AssignShiftDialog } from '@/components/admin/AssignShiftDialog';
import AdminCalendarView from '@/components/schedule/AdminCalendarView';
import { AdminListView } from '@/components/schedule/AdminListView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { PageContainer } from '@/components/layout/PageContainer';
import { useShifts } from '@/lib/hooks/useShifts';
import type { Shift as ShiftEntity } from '@/lib/services/shifts';
import type { Shift as DomainShift } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import {
  Add,
  CalendarMonth,
  FilterList,
  List,
  Refresh,
  Search,
  ViewModule,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getShiftDisplayStatus } from '@/lib/utils/shiftStatus';

const convertToDomainShift = (shift: ShiftEntity): DomainShift => {
  const parsedDate =
    typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as unknown as Date);
  const safeDate =
    parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();

  return {
    id: shift.id,
    facilityId: shift.facilityId,
    stationId: shift.stationId ?? '',
    companyId: (shift as ShiftEntity & { companyId?: string }).companyId || '', // companyId wird vom Service hinzugefügt
    date: safeDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    type: (shift.type as DomainShift['type']) || 'Frühdienst',
    requiredQualifications: shift.requiredQualifications || [],
    maxStaff: shift.maxStaff || shift.capacity || 1,
    status: shift.status || 'open',
    createdAt: shift.createdAt ?? new Date(),
    updatedAt: shift.updatedAt ?? new Date(),
    capacity: shift.capacity || shift.maxStaff || 1,
    assignedCount: shift.assignedCount || 0,
    tz: shift.timezone || 'Europe/Berlin',
    notes: shift.notes,
    createdBy: shift.createdBy || 'system',
  };
};

function AdminShiftsPageContent() {
  const { user, loading: authLoading } = useAuth();
  // useSearchParams must be used inside Suspense boundary
  const searchParams = useSearchParams();

  // State management
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'grid'>('calendar');
  // const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<ShiftEntity | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCreateDate, setSelectedCreateDate] = useState<Date | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');

  // Filter object for useShifts (bei "Beendet" keinen Status mitschicken – alle laden, clientseitig filtern)
  const filters = useMemo(
    () => ({
      status:
        statusFilter === 'all' || statusFilter === 'ended'
          ? undefined
          : (statusFilter as ShiftEntity['status']),
      type: typeFilter === 'all' ? undefined : typeFilter,
      facilityId: facilityFilter === 'all' ? undefined : facilityFilter,
    }),
    [statusFilter, typeFilter, facilityFilter]
  );

  const {
    shifts,
    isLoading,
    error,
    updateShift: _updateShift,
    deleteShift,
    assignShift: _assignShift,
    unassignShift: _unassignShift,
    getShiftStats: _getShiftStats,
    refetch,
  } = useShifts(filters);

  const shiftEntities = useMemo(
    () => (Array.isArray(shifts) ? (shifts as ShiftEntity[]) : []),
    [shifts]
  );

  // Apply client-side search filter
  const afterSearch = useMemo(() => {
    if (!searchTerm) return shiftEntities;
    const searchLower = searchTerm.toLowerCase();
    return shiftEntities.filter(
      shift =>
        shift.title?.toLowerCase().includes(searchLower) ||
        shift.notes?.toLowerCase().includes(searchLower) ||
        shift.facilityId?.toLowerCase().includes(searchLower) ||
        shift.stationId?.toLowerCase().includes(searchLower)
    );
  }, [shiftEntities, searchTerm]);

  // Nach Anzeige-Status filtern: Beendete Schichten nicht unter "Besetzt", nur unter "Beendet"
  const filteredShiftEntities = useMemo(() => {
    if (statusFilter === 'all') return afterSearch;
    if (statusFilter === 'ended') return afterSearch.filter(s => getShiftDisplayStatus(s) === 'ended');
    if (statusFilter === 'filled') return afterSearch.filter(s => getShiftDisplayStatus(s) === 'filled');
    if (statusFilter === 'open') return afterSearch.filter(s => getShiftDisplayStatus(s) === 'open');
    if (statusFilter === 'cancelled') return afterSearch.filter(s => s.status === 'cancelled');
    return afterSearch;
  }, [afterSearch, statusFilter]);

  // Calculate stats from filtered shifts (Beendet = Datum+Endzeit vergangen)
  const stats = useMemo(() => {
    const shiftsArray = filteredShiftEntities;
    return {
      total: shiftsArray.length,
      open: shiftsArray.filter(s => getShiftDisplayStatus(s) === 'open').length,
      filled: shiftsArray.filter(s => getShiftDisplayStatus(s) === 'filled').length,
      ended: shiftsArray.filter(s => getShiftDisplayStatus(s) === 'ended').length,
      cancelled: shiftsArray.filter(s => s.status === 'cancelled').length,
      assignedCount: shiftsArray.reduce((sum, s) => sum + (s.assignedCount || 0), 0),
      totalCapacity: shiftsArray.reduce((sum, s) => sum + (s.capacity || 1), 0),
    };
  }, [filteredShiftEntities]);

  const domainShifts = useMemo(
    () => filteredShiftEntities.map(convertToDomainShift),
    [filteredShiftEntities]
  );

  const getShiftEntityById = useCallback(
    (shiftId: string) => shiftEntities.find(item => item.id === shiftId),
    [shiftEntities]
  );

  // Check for create query parameter – URL-Cleanup erst im nächsten Tick,
  // damit React den Dialog fertig mounten kann (vermeidet removeChild-Fehler).
  useEffect(() => {
    if (searchParams && searchParams.get('create') === 'true') {
      setCreateDialogOpen(true);
      if (typeof window !== 'undefined') {
        const timeoutId = window.setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('create');
          window.history.replaceState({}, '', url.toString());
        }, 0);
        return () => window.clearTimeout(timeoutId);
      }
    }
  }, [searchParams]);

  const handleCreateShift = () => {
    setSelectedCreateDate(null);
    setCreateDialogOpen(true);
  };

  const handleEditShift = (shift: { id: string }) => {
    const entity = getShiftEntityById(shift.id);
    if (!entity) return;
    setSelectedShift(entity);
    setEditDialogOpen(true);
  };

  const handleAssignShift = (shift: { id: string }) => {
    const entity = getShiftEntityById(shift.id);
    if (!entity) return;
    setSelectedShift(entity);
    setAssignDialogOpen(true);
  };

  const handleDeleteShift = async (shift: { id: string }) => {
    if (confirm('Schicht wirklich löschen?')) {
      try {
        await deleteShift(shift.id);
        toast.success('Schicht erfolgreich gelöscht');
      } catch (_error) {
        toast.error('Fehler beim Löschen der Schicht');
      }
    }
  };

  const handleShiftClick = (shift: { id: string }) => {
    const entity = getShiftEntityById(shift.id);
    if (!entity) return;
    setSelectedShift(entity);
    setEditDialogOpen(true);
  };

  // const handleDateSelect = (date: Date) => {
  //   setSelectedDate(date);
  // };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setFacilityFilter('all');
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner variant="skeleton" message="Schichtverwaltung wird geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bitte melde dich an, um Schichten zu verwalten.</Alert>
      </Box>
    );
  }

  if (!user.companyId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Keine Unternehmens-ID gefunden. Bitte kontaktiere den Administrator, um dein Konto einem
          Unternehmen zuzuordnen.
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <PageContainer maxWidth="wide">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" component="h1" sx={{ color: 'text.primary', mb: 1 }}>
            Schichtverwaltung
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Verwalten Sie alle Schichten und deren Zuweisungen
          </Typography>
        </Box>

        {/* Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" className="tabular-nums" sx={{ color: 'text.primary' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gesamt Schichten
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" className="tabular-nums" sx={{ color: 'text.primary' }}>
                  {stats.open}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Offene Schichten
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" className="tabular-nums" sx={{ color: 'text.primary' }}>
                  {stats.filled}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Besetzte Schichten
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" className="tabular-nums" sx={{ color: 'text.primary' }}>
                  {stats.assignedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zugewiesene Mitarbeiter
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" className="tabular-nums" sx={{ color: 'text.secondary' }}>
                  {stats.ended}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Beendet
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions and Filters */}
        <Paper className="glass" sx={{ p: 3, mb: 3 }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', lg: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Schichten {domainShifts.length}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateShift}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Neue Schicht
              </Button>
              <IconButton
                onClick={() => refetch()}
                aria-label="Aktualisieren"
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              >
                <Refresh />
              </IconButton>
            </Stack>
          </Stack>

          {/* Filters */}
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Schichten suchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Alle</MenuItem>
                  <MenuItem value="open">Offen</MenuItem>
                  <MenuItem value="filled">Besetzt</MenuItem>
                  <MenuItem value="ended">Beendet</MenuItem>
                  <MenuItem value="cancelled">Abgesagt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Schichttyp</InputLabel>
                <Select
                  value={typeFilter}
                  label="Schichttyp"
                  onChange={e => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">Alle</MenuItem>
                  <MenuItem value="Frühdienst">Frühdienst</MenuItem>
                  <MenuItem value="Spätdienst">Spätdienst</MenuItem>
                  <MenuItem value="Nachtdienst">Nachtdienst</MenuItem>
                  <MenuItem value="On-call">On-call</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
                fullWidth
                size="small"
              >
                Filter zurücksetzen
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* View Mode Toggle */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            aria-label="view mode"
          >
            <ToggleButton value="calendar" aria-label="calendar">
              <CalendarMonth />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list">
              <List />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid">
              <ViewModule />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Content based on view mode */}
        {viewMode === 'calendar' && (
          <AdminCalendarView
            shifts={domainShifts}
            companyId={user?.companyId}
            onShiftClick={handleShiftClick}
            onEdit={handleEditShift}
            onAssign={handleAssignShift}
            onDelete={handleDeleteShift}
            onDayClick={(d: Date) => {
              setSelectedCreateDate(d);
              setCreateDialogOpen(true);
            }}
          />
        )}

        {viewMode === 'list' && (
          <AdminListView
            shifts={domainShifts}
            onShiftClick={handleShiftClick}
            onEdit={handleEditShift}
            onAssign={handleAssignShift}
            onDelete={handleDeleteShift}
          />
        )}

        {viewMode === 'grid' && (
          <Grid container spacing={3} alignItems="flex-start">
            {domainShifts.map(shift => (
              <Grid key={shift.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ShiftManagementCard
                  shift={shift}
                  onEdit={handleEditShift}
                  onAssign={handleAssignShift}
                  onDelete={handleDeleteShift}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {domainShifts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Keine Schichten gefunden
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm ||
              statusFilter !== 'all' ||
              typeFilter !== 'all' ||
              facilityFilter !== 'all'
                ? 'Versuchen Sie andere Filterkriterien'
                : 'Erstellen Sie die erste Schicht'}
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleCreateShift}>
              Schicht erstellen
            </Button>
          </Box>
        )}
      </PageContainer>

      {/* Dialogs – key erzwingt Remount bei open-Wechsel, verhindert removeChild-Fehler */}
      <ShiftCreateDialog
        key={createDialogOpen ? 'create-open' : 'create-closed'}
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedCreateDate(null);
        }}
        initialDate={selectedCreateDate}
      />

      {selectedShift && (
        <ShiftEditDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedShift(null);
          }}
          onUpdated={() => refetch()}
          shift={
            {
              ...selectedShift,
              tz: selectedShift.timezone || 'Europe/Berlin',
              stationId: selectedShift.stationId || '',
            } as ShiftEntity & { tz: string; stationId: string }
          }
        />
      )}

      {selectedShift && (
        <AssignShiftDialog
          open={assignDialogOpen}
          onClose={() => {
            setAssignDialogOpen(false);
            setSelectedShift(null);
          }}
          shift={convertToDomainShift(selectedShift)}
        />
      )}
    </>
  );
}

function AdminShiftsPage() {
  // Ensure this only renders on client side
  if (typeof window === 'undefined') {
    return <LoadingSpinner variant="skeleton" message="Schichtverwaltung wird geladen..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner variant="skeleton" message="Schichtverwaltung wird geladen..." />}>
      <AdminShiftsPageContent />
    </Suspense>
  );
}

export default AdminShiftsPage;
