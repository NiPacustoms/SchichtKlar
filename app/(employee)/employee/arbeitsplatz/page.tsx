'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ComponentErrorBoundary } from '@/components/errors';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { useEmployeeNotifications } from '@/lib/hooks/useEmployeeNotifications';
import { useFeatureFlags } from '@/lib/hooks/useFeatureFlags';
import { useTimesheet } from '@/lib/hooks/useTimesheet';
import {
  AccessTime,
  CalendarMonth,
  Description,
  Place,
  NotificationsActive,
  Person,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  Grid,
} from '@mui/material';

// Hauptkomponente
function DashboardPageContent() {
  const { user, loading: authLoading } = useAuth();
  const {
    kpis,
    isLoading,
    todayAssignment,
    todayTimesheet,
    upcomingAssignmentDetails,
    todayShift,
    todayFacility,
  } = useDashboard();
  const { notifications } = useEmployeeNotifications();
  const { canAccessEmployeeVacation } = useFeatureFlags();
  const { isLoading: timesheetLoading } = useTimesheet();

  // Alle Hooks müssen vor bedingten Returns aufgerufen werden
  const upcomingNotifications = useMemo(() => notifications?.slice(0, 3) || [], [notifications]);

  // Sicherstellen, dass kpis immer definiert ist
  const safeKpis = kpis || {
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    vacationDays: 0,
    usedVacationDays: 0,
  };
  const remainingVacationDays = (safeKpis.vacationDays ?? 0) - (safeKpis.usedVacationDays ?? 0);
  const upcomingAssignmentsPreview = useMemo(
    () => upcomingAssignmentDetails?.slice(0, 4) || [],
    [upcomingAssignmentDetails]
  );

  if (authLoading || isLoading || timesheetLoading) {
    return <LoadingSpinner message="Dashboard wird geladen..." />;
  }

  if (!user) {
    return (
      <Box
        className="min-height-viewport"
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 700, mb: 2 }}>
            JobFlow
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Bitte melde dich an, um fortzufahren
          </Typography>
        </Box>
      </Box>
    );
  }

  const isNurse = user?.role === 'nurse';

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const asDate = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(asDate.getTime())) return '';
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    }).format(asDate);
  };

  const formatAssignmentStatus = (status: string | undefined) => {
    switch (status) {
      case 'accepted':
        return 'Bestätigt';
      case 'declined':
        return 'Abgelehnt';
      case 'completed':
      case 'done':
        return 'Abgeschlossen';
      case 'pending-signature':
        return 'Wartet auf Unterschrift';
      case 'pending':
      case 'requested':
        return 'Ausstehend';
      case 'assigned':
        return 'Zugewiesen';
      default:
        return 'Unbekannt';
    }
  };

  const todaysAssignmentScheduledDate = todayShift?.date
    ? new Date(todayShift.date)
    : todayAssignment?.assignedAt || null;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 700, mb: 1 }}>
          {isNurse ? 'Willkommen zurück!' : 'Dashboard'}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {isNurse ? 'Hier ist dein Überblick für heute' : 'Aktuelle Kennzahlen im Überblick'}
        </Typography>
      </Box>

      {isNurse ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <GlassCard>
            <CardContent>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip icon={<AccessTime />} label={`Heute: ${safeKpis.todayHours.toFixed(1)} h`} />
                <Chip
                  icon={<CalendarMonth />}
                  label={`Woche: ${safeKpis.weekHours.toFixed(1)} h`}
                />
                <Chip icon={<Description />} label={`Monat: ${safeKpis.monthHours.toFixed(1)} h`} />
              </Stack>
            </CardContent>
          </GlassCard>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                <GlassCard>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Aktueller Einsatz</Typography>
                        {todayAssignment?.status && (
                          <Chip
                            size="small"
                            color="primary"
                            label={formatAssignmentStatus(todayAssignment.status)}
                          />
                        )}
                      </Stack>
                      {todayAssignment && todayShift ? (
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {todayShift.title || 'Dienst'}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AccessTime fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {formatDate(todaysAssignmentScheduledDate)} · {todayShift.startTime} –{' '}
                              {todayShift.endTime}
                            </Typography>
                          </Stack>
                          {todayFacility && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Place fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {todayFacility.name}
                                {todayShift.stationId &&
                                  todayFacility.stations?.find(
                                    s => s.id === todayShift.stationId
                                  ) &&
                                  ` - ${todayFacility.stations.find(s => s.id === todayShift.stationId)?.name}`}
                              </Typography>
                            </Stack>
                          )}
                          {todayFacility?.contactPerson && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Person fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Ansprechpartner: {todayFacility.contactPerson}
                              </Typography>
                            </Stack>
                          )}
                          {todayAssignment.notes && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Hinweis: {todayAssignment.notes}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Heute ist kein Einsatz geplant.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </GlassCard>

                <GlassCard>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">Zeiterfassung heute</Typography>
                      {todayTimesheet ? (
                        <Stack spacing={1}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Status:{' '}
                            {todayTimesheet.status === 'submitted'
                              ? 'Übermittelt'
                              : todayTimesheet.status}
                          </Typography>
                          <Typography variant="body2">
                            Start: {todayTimesheet.startTime || '—'} · Ende:{' '}
                            {todayTimesheet.endTime || '—'}
                          </Typography>
                          <Typography variant="body2">
                            Gesamtstunden: {Math.max(todayTimesheet.totalHours ?? 0, 0).toFixed(2)}{' '}
                            h
                          </Typography>
                          <Typography variant="body2">
                            Pausen:{' '}
                            {(todayTimesheet.breakMinutes ?? 0) > 0
                              ? `${todayTimesheet.breakMinutes} min`
                              : '—'}
                          </Typography>
                          {todayTimesheet.notes && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Notiz: {todayTimesheet.notes}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Noch keine Zeiterfassung für heute vorhanden.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </GlassCard>

                <GlassCard>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">Kommende Einsätze</Typography>
                      {upcomingAssignmentDetails.length > 0 ? (
                        <List disablePadding>
                          {upcomingAssignmentsPreview.map(
                            ({ assignment, shift, facility }, index) => (
                              <Box key={assignment.id}>
                                <ListItem disableGutters>
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Event fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={shift?.title || facility?.name || 'Einsatz'}
                                    secondary={[
                                      formatDate(
                                        shift?.date ? new Date(shift.date) : assignment.assignedAt
                                      ),
                                      shift ? `${shift.startTime} – ${shift.endTime}` : null,
                                      facility?.name ? `Einrichtung: ${facility.name}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  />
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={formatAssignmentStatus(assignment.status)}
                                  />
                                </ListItem>
                                {index < upcomingAssignmentsPreview.length - 1 && (
                                  <Divider component="li" sx={{ my: 1 }} />
                                )}
                              </Box>
                            )
                          )}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Keine weiteren Einsätze geplant.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </GlassCard>
              </Stack>
            </Grid>

            {canAccessEmployeeVacation && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={3}>
                  <GlassCard>
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Typography variant="h6">Urlaub &amp; Abwesenheiten</Typography>
                        <Typography variant="body2">
                          Geplante Urlaubstage: {safeKpis.usedVacationDays?.toFixed(1) ?? '0.0'} von{' '}
                          {safeKpis.vacationDays?.toFixed(1) ?? '0.0'} Tagen
                        </Typography>
                        <Typography variant="body2">
                          Verfügbar: <strong>{remainingVacationDays.toFixed(1)} Tage</strong>
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          component={Link}
                          href="/employee/zeiten"
                        >
                          Urlaub beantragen
                        </Button>
                      </Stack>
                    </CardContent>
                  </GlassCard>
                </Stack>
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                <GlassCard>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <NotificationsActive fontSize="small" />
                        <Typography variant="h6">Benachrichtigungen</Typography>
                      </Stack>
                      {upcomingNotifications.length > 0 ? (
                        <List disablePadding>
                          {upcomingNotifications.map((notification, index) => (
                            <Box key={notification.id}>
                              <ListItem disableGutters>
                                <ListItemText
                                  primary={notification.title}
                                  secondary={
                                    notification.message.length > 120
                                      ? `${notification.message.slice(0, 120)}…`
                                      : notification.message
                                  }
                                />
                              </ListItem>
                              {index < upcomingNotifications.length - 1 && (
                                <Divider component="li" sx={{ my: 1 }} />
                              )}
                            </Box>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Keine neuen Benachrichtigungen.
                        </Typography>
                      )}
                      <Button
                        variant="text"
                        size="small"
                        component={Link}
                        href="/employee/benachrichtigungen"
                      >
                        Alle ansehen
                      </Button>
                    </Stack>
                  </CardContent>
                </GlassCard>

                <GlassCard>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Typography variant="h6">Schnellzugriffe</Typography>
                      <Button
                        component={Link}
                        href="/employee/zeiterfassung"
                        variant="contained"
                        size="small"
                      >
                        Zeiterfassung öffnen
                      </Button>
                      <Button
                        component={Link}
                        href="/employee/dienstplan"
                        variant="outlined"
                        size="small"
                      >
                        Dienstplan ansehen
                      </Button>
                      <Button
                        component={Link}
                        href="/employee/dokumente"
                        variant="outlined"
                        size="small"
                      >
                        Dokumente abrufen
                      </Button>
                      <Button
                        component={Link}
                        href="/employee/unterhaltungen"
                        variant="outlined"
                        size="small"
                      >
                        Nachrichten
                      </Button>
                    </Stack>
                  </CardContent>
                </GlassCard>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <GlassCard>
            <CardContent>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Für administrative Rollen befindet sich dieses Dashboard noch im Aufbau.
              </Typography>
            </CardContent>
          </GlassCard>
        </Box>
      )}
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <ComponentErrorBoundary component="DashboardPage">
      <DashboardPageContent />
    </ComponentErrorBoundary>
  );
}
