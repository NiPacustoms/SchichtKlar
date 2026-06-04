'use client';
import Link from 'next/link';
import { TimesheetForm } from '@/components/time/TimesheetForm';
import { TimesheetHistory } from '@/components/time/TimesheetHistory';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useTimesheet } from '@/lib/hooks/useTimesheet';
import { TimesheetForm as TimesheetFormType, Timesheet } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { Alert, Box, Grid, Typography, Button, Card, CardContent, Stack } from '@mui/material';
import { DailySignatureDialog } from '@/components/admin/DailySignatureDialog';
import { RelievingPersonnelSignatureDialog } from '@/components/assignments/RelievingPersonnelSignatureDialog';
import { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logging';
import { Pause, Stop, PlayArrow } from '@mui/icons-material';
import { getTodayAssignment, listAssignmentsForUser } from '@/src/composition';
import { shiftService } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';
import { isSignatureRequiredToday } from '@/lib/utils/signatureSchedule';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AccessTime, LocationOn, Person, Phone, Email } from '@mui/icons-material';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { offlineQueueService } from '@/lib/services/offlineQueue';

/** Zeit "HH:MM" in Minuten seit Mitternacht (0–1439) */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Minuten seit Mitternacht in "HH:MM" */
function minutesToTime(minutes: number): string {
  const m = ((minutes % 60) + 60) % 60;
  const h = Math.floor((minutes / 60 + 24) % 24);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Früheste erlaubte Startzeit = 15 Min vor Schichtbeginn */
function earliestStartMinutes(shiftStartHHMM: string): number {
  return Math.max(0, timeToMinutes(shiftStartHHMM) - 15);
}

/** Für Abrechnung: Startzeit ist mindestens Schichtbeginn (gezählt wird ab Schichtbeginn) */
function effectiveStartTime(enteredStart: string, shiftStart: string): string {
  return timeToMinutes(enteredStart) < timeToMinutes(shiftStart) ? shiftStart : enteredStart;
}

export default function TimePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { timesheet, recentTimesheets, isLoading, error, createTimesheet, updateTimesheet } =
    useTimesheet();

  // Prüfe ob Benutzer ein akzeptiertes Assignment für heute hat
  const { data: todayAssignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['todayAssignment', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getTodayAssignment.execute(user.id);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Prüfe ob das Assignment akzeptiert wurde
  const hasAcceptedAssignment =
    todayAssignment?.status === 'accepted' || todayAssignment?.status === 'assigned';

  // Lade Shift und Facility Details für das Assignment
  const { data: assignmentDetails } = useQuery({
    queryKey: ['assignmentDetails', todayAssignment?.id, todayAssignment?.shiftId],
    queryFn: async () => {
      if (!todayAssignment?.shiftId) return null;
      try {
        const shift = await shiftService.getById(todayAssignment.shiftId);
        if (!shift) return null;

        const facility = shift.facilityId ? await facilityService.getById(shift.facilityId) : null;
        const station = facility?.stations?.find(s => s.id === shift.stationId);

        return {
          shift,
          facility,
          station,
        };
      } catch (error) {
        logger.error(
          'Error loading assignment details',
          error instanceof Error ? error : new Error(String(error))
        );
        return null;
      }
    },
    enabled: !!todayAssignment?.shiftId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetFormType | null>(null);
  const [openDailySignature, setOpenDailySignature] = useState<{
    open: boolean;
    tsId?: string;
    date?: Date;
  }>(() => ({ open: false }));
  const [openRelievingSignature, setOpenRelievingSignature] = useState<{
    open: boolean;
    assignmentId?: string;
    timesheetId?: string;
    date?: Date;
  }>(() => ({ open: false }));

  const handleSubmitTimesheet = async (data: TimesheetFormType) => {
    try {
      // Prüfe ob ein akzeptiertes Assignment vorhanden ist
      if (!hasAcceptedAssignment) {
        toast.error(
          'Sie können nur Zeiten erfassen, wenn Ihnen ein Einsatz zugewiesen und von Ihnen akzeptiert wurde.'
        );
        return;
      }

      const dataDate = data.date instanceof Date ? data.date : new Date(data.date);
      const shift = assignmentDetails?.shift;
      const shiftDate = shift?.date ? new Date(shift.date) : null;
      const isSameDay = shiftDate && dataDate && shiftDate.toDateString() === dataDate.toDateString();

      // Regel: Zeiterfassung erst ab 15 Min vor Schichtbeginn
      if (shift?.startTime && isSameDay) {
        const earliestMin = earliestStartMinutes(shift.startTime);
        const startMin = timeToMinutes(data.startTime);
        if (startMin < earliestMin) {
          const earliestStr = minutesToTime(earliestMin);
          toast.error(
            `Zeiterfassung kann frühestens 15 Minuten vor Schichtbeginn gestartet werden (heute ab ${earliestStr}).`
          );
          return;
        }
      }

      // Gezählt wird erst ab Schichtbeginn: effektive Startzeit für Speicherung
      const startTimeForStorage =
        shift?.startTime && isSameDay
          ? effectiveStartTime(data.startTime, shift.startTime)
          : data.startTime;

      const timesheetData = {
        ...data,
        startTime: startTimeForStorage,
      };

      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

      if (editingTimesheet && timesheet) {
        if (isOnline) {
          await updateTimesheet.mutateAsync({
            id: timesheet.id,
            data: timesheetData,
          });
          toast.success('Zeiterfassung aktualisiert!');
        } else {
          // Offline: Queue the update
          await offlineQueueService.addToQueue('timesheet', 'update', {
            id: timesheet.id,
            ...timesheetData,
          });
          toast.info('Zeiterfassung lokal gespeichert. Wird synchronisiert wenn Sie online sind.');
        }
        setEditingTimesheet(null);
        // Prüfe ob Signatur-Dialog geöffnet werden soll
        if (timesheetData.endTime) {
          setOpenDailySignature({ open: true, tsId: timesheet.id, date: data.date });
        }
      } else {
        let timesheetId: string;

        if (isOnline) {
          timesheetId = await createTimesheet.mutateAsync(timesheetData);
          toast.success('Zeiterfassung erstellt!');
        } else {
          // Offline: Queue the creation
          timesheetId = await offlineQueueService.addToQueue('timesheet', 'create', timesheetData);
          toast.info(`Zeiterfassung lokal gespeichert. Wird synchronisiert wenn Sie online sind.`);
        }

        setEditingTimesheet(null);

        // Prüfe ob Signatur-Dialoge geöffnet werden sollen
        if (timesheetData.endTime && timesheetId && user?.id) {
          // Nur bei Online-Erstellung: Signatur-Dialog öffnen
          // Bei Offline: Signatur wird nach Sync möglich
          if (isOnline) {
            // Prüfe auf aktives Assignment für heute
            try {
              const today = new Date(data.date);
              today.setHours(0, 0, 0, 0);

              // Finde aktives Assignment für diesen User
              const assignments = await listAssignmentsForUser.execute({ userId: user.id });

              // Prüfe jedes Assignment synchron
              let activeAssignment = null;
              for (const assignment of assignments) {
                if (assignment.status !== 'accepted' && assignment.status !== 'assigned') {
                  continue;
                }

                const shift = await shiftService.getById(assignment.shiftId);
                if (shift) {
                  const shiftDate = new Date(shift.date);
                  shiftDate.setHours(0, 0, 0, 0);

                  if (shiftDate.getTime() === today.getTime()) {
                    activeAssignment = assignment;
                    break;
                  }
                }
              }

              if (activeAssignment) {
                // Prüfe ob Relieving-Signatur erforderlich ist
                const shift = await shiftService.getById(activeAssignment.shiftId);
                if (shift) {
                  // Berechne Assignment-Zeitraum (vereinfacht: nur Shift-Datum)
                  const assignmentStart = new Date(shift.date);
                  const assignmentEnd = new Date(shift.date); // Für jetzt: nur ein Tag

                  const collectedDates = activeAssignment.signatureSchedule?.collectedDates || [];
                  const signatureRequired = isSignatureRequiredToday(
                    assignmentStart,
                    assignmentEnd,
                    collectedDates
                  );

                  if (signatureRequired) {
                    // Öffne Relieving Signature Dialog
                    setOpenRelievingSignature({
                      open: true,
                      assignmentId: activeAssignment.id,
                      timesheetId: timesheetId,
                      date: data.date,
                    });
                  } else {
                    // Öffne normale Daily Signature Dialog
                    setOpenDailySignature({ open: true, tsId: timesheetId, date: data.date });
                  }
                } else {
                  setOpenDailySignature({ open: true, tsId: timesheetId, date: data.date });
                }
              } else {
                // Kein Assignment gefunden, normale Signatur
                setOpenDailySignature({ open: true, tsId: timesheetId, date: data.date });
              }
            } catch (error) {
              logger.error(
                'Error checking assignment',
                error instanceof Error ? error : new Error(String(error))
              );
              // Fallback: Normale Signatur
              setOpenDailySignature({ open: true, tsId: timesheetId, date: data.date });
            }
          }
        }
      }
    } catch (error: unknown) {
      toast.error('Fehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  // Vorausgefüllte Daten aus dem heutigen Einsatz (nur wenn noch keine Erfassung)
  const assignmentInitialData = useMemo(() => {
    if (!assignmentDetails?.shift || timesheet) return undefined;
    const shiftDate = assignmentDetails.shift.date
      ? new Date(assignmentDetails.shift.date)
      : new Date();
    return {
      date: shiftDate,
      startTime: assignmentDetails.shift.startTime || '',
      endTime: '',
      breakMinutes: 0,
      facilityId: assignmentDetails.shift.facilityId || '',
      station: assignmentDetails.station?.name || '',
      notes: '',
    };
  }, [assignmentDetails, timesheet]);

  const handleStartShiftNow = async () => {
    const now = new Date();
    const startTime = now.toTimeString().slice(0, 5);
    await handleSubmitTimesheet({
      date: now,
      startTime,
      endTime: startTime,
      breakMinutes: 0,
      facilityId: assignmentDetails?.shift?.facilityId || '',
      station: assignmentDetails?.station?.name || '',
      notes: '',
    });
  };

  const handleEditTimesheet = (timesheet: Timesheet) => {
    setEditingTimesheet({
      date: timesheet.date,
      startTime: timesheet.startTime,
      endTime: timesheet.endTime,
      breakMinutes: timesheet.breakMinutes,
      notes: timesheet.notes || '',
      facilityId: timesheet.facilityId || '',
      station: timesheet.station || '',
    });
  };

  if (authLoading || isLoading || loadingAssignment) {
    return <LoadingSpinner message="Zeiterfassung wird geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
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

  // Prüfe ob ein akzeptiertes Assignment vorhanden ist
  if (!hasAcceptedAssignment && !timesheet) {
    return (
      <PageContainer maxWidth="standard">
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Arbeitszeit erfassen
          </Typography>
        </Box>

        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => router.push('/employee/dienstplan')}
            >
              Zum Dienstplan
            </Button>
          }
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Kein akzeptierter Einsatz vorhanden
          </Typography>
          <Typography variant="body2">
            Sie können nur Zeiten erfassen, wenn Ihnen ein Einsatz zugewiesen und von Ihnen
            akzeptiert wurde. Bitte prüfen Sie Ihren Dienstplan und akzeptieren Sie einen Einsatz,
            bevor Sie mit der Zeiterfassung beginnen.
          </Typography>
        </Alert>

        {/* Zeige vorhandene Zeiterfassungen an */}
        {recentTimesheets && recentTimesheets.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Vergangene Zeiterfassungen
            </Typography>
            <TimesheetHistory timesheets={recentTimesheets} onEdit={handleEditTimesheet} />
          </Box>
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="standard">
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Arbeitszeit erfassen
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Erfasse deine Arbeitszeiten manuell
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            component={Link}
            href="/employee/zeiten"
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Zeitkonto &amp; Überstunden
          </Button>
          <SyncStatusIndicator />
        </Box>
      </Box>

      {/* Einsatz-Informationen */}
      {hasAcceptedAssignment && assignmentDetails && (
        <Card sx={{ mb: 3, bgcolor: 'background.paper', borderRadius: 2 }} elevation={0}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Einsatz-Informationen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Die Arbeitszeiterfassung ist an Datum und Uhrzeiten dieses Einsatzes gekoppelt. Das Formular wird mit den Einsatzzeiten vorausgefüllt.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.5}>
                  {/* Einrichtung und Station */}
                  {assignmentDetails.facility && (
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <LocationOn sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Einrichtung
                        </Typography>
                        <Typography variant="body1">
                          {assignmentDetails.facility.name}
                          {assignmentDetails.station && ` - ${assignmentDetails.station.name}`}
                        </Typography>
                        {assignmentDetails.facility.address && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {assignmentDetails.facility.address}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  )}

                  {/* Arbeitszeiten */}
                  {assignmentDetails.shift && (
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <AccessTime sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Arbeitszeiten
                        </Typography>
                        <Typography variant="body1">
                          {assignmentDetails.shift.startTime} - {assignmentDetails.shift.endTime}
                        </Typography>
                        {assignmentDetails.shift.date && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {new Date(assignmentDetails.shift.date).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.5}>
                  {/* Ansprechpartner */}
                  {assignmentDetails.facility?.contactPerson && (
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Person sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Ansprechpartner
                        </Typography>
                        <Typography variant="body1">
                          {assignmentDetails.facility.contactPerson}
                        </Typography>
                        {assignmentDetails.facility.phone && (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {assignmentDetails.facility.phone}
                            </Typography>
                          </Stack>
                        )}
                        {assignmentDetails.facility.email && (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {assignmentDetails.facility.email}
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Schnell-Erfassung */}
      {hasAcceptedAssignment && (
        <Card sx={{ mb: 3, bgcolor: 'background.paper', borderRadius: 2 }} elevation={0}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Schnell-Erfassung
            </Typography>
            {timesheet && timesheet.status === 'draft' && (!timesheet.endTime || timesheet.endTime === timesheet.startTime) ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Gestartet um {timesheet.startTime} – Schicht läuft
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Pause />}
                    size="medium"
                    sx={{ textTransform: 'none' }}
                    data-testid="pause-button"
                    aria-label="Pause erfassen (in zukünftiger Version)"
                    onClick={() => toast.info('Pause wird in einer zukünftigen Version unterstützt. Bitte erfassen Sie Pausen im Formular unten.')}
                  >
                    II Pause
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    size="medium"
                    sx={{ textTransform: 'none' }}
                    data-testid="end-shift-button"
                    aria-label="Schicht beenden"
                    disabled={updateTimesheet.isPending}
                    onClick={async () => {
                      const now = new Date();
                      const endTime = now.toTimeString().slice(0, 5);
                      try {
                        await updateTimesheet.mutateAsync({
                          id: timesheet.id,
                          data: {
                            date: timesheet.date,
                            startTime: timesheet.startTime,
                            endTime,
                            breakMinutes: timesheet.breakMinutes ?? 0,
                            notes: timesheet.notes,
                          },
                        });
                        toast.success('Schicht beendet.');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Fehler beim Beenden');
                      }
                    }}
                  >
                    Schicht beenden
                  </Button>
                </Stack>
              </>
            ) : !timesheet ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {assignmentDetails?.shift
                    ? `Einsatz: ${assignmentDetails.shift.startTime} – ${assignmentDetails.shift.endTime}`
                    : 'Schicht heute starten'}
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  size="medium"
                  sx={{ textTransform: 'none' }}
                  data-testid="start-shift-button"
                  aria-label="Schicht jetzt starten"
                  disabled={createTimesheet.isPending}
                  onClick={handleStartShiftNow}
                >
                  Schicht jetzt starten
                </Button>
              </>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Zeiten bereits erfasst. Bearbeitung über das Formular unten möglich.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Zeiten manuell eintragen */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Zeiten manuell eintragen
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {!hasAcceptedAssignment && timesheet && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Sie bearbeiten eine bestehende Zeiterfassung. Für neue Zeiterfassungen benötigen Sie
              ein akzeptiertes Assignment.
            </Alert>
          )}
          <TimesheetForm
            initialData={
              editingTimesheet ||
              (timesheet
                ? {
                    date: timesheet.date,
                    startTime: timesheet.startTime,
                    endTime: timesheet.endTime,
                    breakMinutes: timesheet.breakMinutes,
                    notes: timesheet.notes,
                    facilityId: timesheet.facilityId || '',
                    station: timesheet.station || '',
                  }
                : assignmentInitialData)
            }
            onSubmit={handleSubmitTimesheet}
            isLoading={createTimesheet.isPending || updateTimesheet.isPending}
            isEdit={!!editingTimesheet || !!timesheet}
            disabled={!hasAcceptedAssignment && !timesheet}
          />
        </Grid>

        {/* Heutige Einträge */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TimesheetHistory timesheets={recentTimesheets} onEdit={handleEditTimesheet} />
        </Grid>
      </Grid>
      {/* Tages-Signatur durch Einrichtung auf Mitarbeitergerät */}
      {openDailySignature.tsId && (
        <DailySignatureDialog
          open={openDailySignature.open}
          onClose={() => setOpenDailySignature({ open: false })}
          timesheetId={openDailySignature.tsId}
          date={openDailySignature.date || new Date()}
        />
      )}

      {/* Relieving Personnel Signature Dialog */}
      {openRelievingSignature.assignmentId && (
        <RelievingPersonnelSignatureDialog
          open={openRelievingSignature.open}
          onClose={() => setOpenRelievingSignature({ open: false })}
          assignmentId={openRelievingSignature.assignmentId}
          timesheetId={openRelievingSignature.timesheetId}
          date={openRelievingSignature.date || new Date()}
          onSuccess={() => {
            // Nach erfolgreicher Signatur: Prüfe ob noch weitere Signaturen erforderlich sind
            // oder ob PDF generiert werden soll
            toast.success('Signatur durch ablösendes Personal erfolgreich gespeichert');
          }}
        />
      )}
    </PageContainer>
  );
}
