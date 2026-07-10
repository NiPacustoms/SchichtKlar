'use client';

import { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logging';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner, InlineSpinner } from '@/components/ui/LoadingSpinner';
import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { useTimes, type TimeEntry } from '@/lib/hooks/useTimes';
import { getMyActiveAssignments } from '@/src/composition';
import { shiftService } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/lib/utils/toast';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  Schedule,
  AccessTime,
  Work,
  Sick,
  Pause,
  PlayArrow,
  Stop,
  Download,
  Print,
  Timer,
  HourglassEmpty,
  Assignment,
  LocationOn,
  Info,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`times-tabpanel-${index}`}
      aria-labelledby={`times-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeeTimesPage() {
  const { user, loading: authLoading } = useAuth();

  const timesHookResult = useTimes();

  // Destructure with safe defaults
  const {
    isLoading,
    error,
    startShift,
    endShift,
    addBreak,
    endBreak,
    reportSick,
    getTimeStats,
    exportTimes,
    isStarting,
    isEnding,
    isAddingBreak,
    isEndingBreak,
  } = timesHookResult;

  // Ensure times is always defined - extract separately to avoid destructuring issues
  const times = useMemo(
    () => (timesHookResult.times || []) as TimeEntry[],
    [timesHookResult.times]
  );

  const [activeTab, setActiveTab] = useState(0);

  const [sickDialogOpen, setSickDialogOpen] = useState(false);
  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [breakFormData, setBreakFormData] = useState({ reason: '', duration: 30 });
  const [sickFormData, setSickFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    doctorNote: '',
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeWorkEntry, setActiveWorkEntry] = useState<TimeEntry | null>(null);
  const [activeBreakEntry, setActiveBreakEntry] = useState<TimeEntry | null>(null);

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find active work and break entries
  useEffect(() => {
    if (times && times.length > 0) {
      const activeWork = times.find(e => e.type === 'work' && e.status === 'active');
      const activeBreak = times.find(e => e.type === 'break' && e.status === 'active');
      setActiveWorkEntry(activeWork || null);
      setActiveBreakEntry(activeBreak || null);
    }
  }, [times]);

  // Calculate live work time (excluding breaks)
  const getLiveWorkTime = () => {
    if (!activeWorkEntry || !activeWorkEntry.startTime)
      return { hours: 0, minutes: 0, totalMinutes: 0, display: '00:00' };

    const startDate = new Date(activeWorkEntry.date);
    const [startHours, startMinutes] = activeWorkEntry.startTime.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const now = currentTime;
    let diffMs = now.getTime() - startDate.getTime();

    // Subtract break time if currently on break
    if (activeBreakEntry && activeBreakEntry.startTime) {
      const breakStartDate = new Date(activeBreakEntry.date);
      const [breakStartHours, breakStartMinutes] = activeBreakEntry.startTime
        .split(':')
        .map(Number);
      breakStartDate.setHours(breakStartHours, breakStartMinutes, 0, 0);
      const breakDuration = now.getTime() - breakStartDate.getTime();
      diffMs -= breakDuration;
    }

    // Also subtract completed breaks from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBreaks =
      times?.filter(
        e =>
          e.type === 'break' &&
          e.status === 'completed' &&
          new Date(e.date).setHours(0, 0, 0, 0) === today.getTime() &&
          e.assignmentId === activeWorkEntry.assignmentId
      ) || [];
    const totalBreakMinutes = todayBreaks.reduce((sum, b) => sum + b.hours * 60, 0);
    diffMs -= totalBreakMinutes * 60 * 1000;

    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      hours,
      minutes,
      totalMinutes,
      display: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    };
  };

  // Calculate break time
  const getBreakTime = () => {
    if (!activeBreakEntry || !activeBreakEntry.startTime) return { minutes: 0, display: '00:00' };

    const startDate = new Date(activeBreakEntry.date);
    const [startHours, startMinutes] = activeBreakEntry.startTime.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const now = currentTime;
    const diffMs = now.getTime() - startDate.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      minutes: totalMinutes,
      display: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    };
  };

  // Quick break actions
  const quickBreakActions = [
    { label: '15 min', duration: 15, reason: 'Kurze Pause' },
    { label: '30 min', duration: 30, reason: 'Mittagspause' },
    { label: '45 min', duration: 45, reason: 'Längere Pause' },
  ];

  const handleQuickBreak = async (duration: number, reason: string) => {
    try {
      await addBreak({ reason, duration });
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  // Fetch active assignments for today
  const { data: activeAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['activeAssignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const assignments = await getMyActiveAssignments.execute(user.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter assignments for today
        const todayAssignments = [];
        for (const assignment of assignments) {
          const shift = await shiftService.getById(assignment.shiftId);
          if (shift) {
            const shiftDate = new Date(shift.date);
            shiftDate.setHours(0, 0, 0, 0);
            if (shiftDate.getTime() === today.getTime()) {
              const facility = shift.facilityId
                ? await facilityService.getById(shift.facilityId)
                : null;
              todayAssignments.push({ assignment, shift, facility });
            }
          }
        }
        return todayAssignments;
      } catch (error) {
        logger.error(
          'Error fetching active assignments',
          error instanceof Error ? error : new Error(String(error))
        );
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleStartShift = async () => {
    // If there's only one assignment, use it directly
    if (activeAssignments.length === 1) {
      try {
        await startShift(activeAssignments[0].assignment.id);
      } catch (_error) {
        // Error handling is done in the mutations
      }
    } else if (activeAssignments.length > 1) {
      // Show dialog to select assignment
      setAssignmentDialogOpen(true);
    } else {
      toast.warning(
        'Kein aktiver Auftrag für heute gefunden. Bitte warte auf eine Zuweisung oder kontaktiere deine Leitung.'
      );
      // No assignments - error will be shown by the service
      try {
        await startShift();
      } catch (_error) {
        // Error handling is done in the mutations
      }
    }
  };

  const handleConfirmStartShift = async () => {
    if (!selectedAssignmentId) return;
    try {
      await startShift(selectedAssignmentId);
      setAssignmentDialogOpen(false);
      setSelectedAssignmentId('');
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleEndShift = async () => {
    try {
      await endShift();
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleAddBreak = async () => {
    if (!breakFormData.reason.trim()) {
      return; // Form validation
    }
    try {
      await addBreak(breakFormData);
      setBreakDialogOpen(false);
      setBreakFormData({ reason: '', duration: 30 });
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleReportSick = async () => {
    if (!sickFormData.reason.trim() || !sickFormData.startDate || !sickFormData.endDate) {
      return; // Form validation
    }
    try {
      await reportSick({
        startDate: new Date(sickFormData.startDate),
        endDate: new Date(sickFormData.endDate),
        reason: sickFormData.reason,
        doctorNote: sickFormData.doctorNote || undefined,
      });
      setSickDialogOpen(false);
      setSickFormData({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        doctorNote: '',
      });
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const getStatusColor = (status: string): ChipProps['color'] => {
    switch (status) {
      case 'working':
        return 'success';
      case 'break':
        return 'warning';
      case 'off':
        return 'default';
      case 'sick':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <PlayArrow color="success" />;
      case 'break':
        return <Pause color="warning" />;
      case 'off':
        return <Stop color="inherit" />;
      case 'sick':
        return <Sick color="error" />;
      default:
        return <Schedule color="inherit" />;
    }
  };

  const stats = getTimeStats();

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Zeiten werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bitte melde dich an, um deine Zeiten zu verwalten.</Alert>
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Zeiten & Zeitkonto
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Verwalten Sie Ihre Arbeitszeiten und Überstunden
        </Typography>
      </Box>

      {/* Live Time Tracking - Hauptanzeige */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card className="glass" sx={{ height: '100%' }}>
            <CardContent>
              {/* Aktuelle Uhrzeit */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Aktuelle Uhrzeit
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    fontFamily: 'monospace',
                  }}
                >
                  {currentTime.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Typography>
              </Box>

              {/* Status und Live-Timer */}
              {stats.currentStatus === 'working' && activeWorkEntry && (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Chip
                    icon={<PlayArrow />}
                    label="Arbeitet"
                    color="success"
                    sx={{ mb: 3, fontSize: '1rem', py: 2.5, px: 1 }}
                  />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Arbeitszeit
                  </Typography>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 700,
                      color: 'success.main',
                      fontFamily: 'monospace',
                      mb: 1,
                    }}
                  >
                    {getLiveWorkTime().display}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gestartet um {activeWorkEntry.startTime}
                  </Typography>
                  {activeAssignments.length > 0 && activeWorkEntry.assignmentId && (
                    <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        <Typography variant="body2">
                          {activeAssignments.find(
                            a => a.assignment.id === activeWorkEntry.assignmentId
                          )?.facility?.name || 'Auftrag'}
                        </Typography>
                      </Box>
                    </Alert>
                  )}
                </Box>
              )}

              {stats.currentStatus === 'break' && activeBreakEntry && (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Chip
                    icon={<Pause />}
                    label="Pause"
                    color="warning"
                    sx={{ mb: 3, fontSize: '1rem', py: 2.5, px: 1 }}
                  />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Pausendauer
                  </Typography>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 700,
                      color: 'warning.main',
                      fontFamily: 'monospace',
                      mb: 1,
                    }}
                  >
                    {getBreakTime().display}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeBreakEntry.reason || 'Pause'}
                  </Typography>
                </Box>
              )}

              {stats.currentStatus === 'off' && (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Chip
                    icon={<Stop />}
                    label="Nicht im Dienst"
                    color="default"
                    sx={{ mb: 3, fontSize: '1rem', py: 2.5, px: 1 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    Starten Sie eine Schicht, um die Zeiterfassung zu beginnen
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                {stats.currentStatus === 'off' && (
                  <>
                    {loadingAssignments ? (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<InlineSpinner size={20} />}
                        disabled
                        sx={{ py: 2 }}
                      >
                        Lade Aufträge...
                      </Button>
                    ) : activeAssignments.length === 0 ? (
                      <Tooltip title="Kein aktiver zugewiesener Auftrag für heute gefunden. Bitte warten Sie auf eine Zuweisung oder kontaktieren Sie Ihren Vorgesetzten.">
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<Warning />}
                          onClick={handleStartShift}
                          disabled={isStarting}
                          color="warning"
                          sx={{ py: 2 }}
                        >
                          {isStarting ? 'Starte...' : 'Schicht starten (ohne Auftrag)'}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrow />}
                        onClick={handleStartShift}
                        disabled={isStarting}
                        sx={{ py: 2 }}
                      >
                        {isStarting
                          ? 'Starte...'
                          : activeAssignments.length === 1
                            ? `Schicht starten (${activeAssignments[0].facility?.name || 'Auftrag'})`
                            : 'Schicht starten'}
                      </Button>
                    )}
                  </>
                )}

                {stats.currentStatus === 'working' && (
                  <>
                    {/* Quick Break Actions */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Schnell-Pausen
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {quickBreakActions.map(action => (
                          <Button
                            key={action.duration}
                            variant="outlined"
                            size="small"
                            onClick={() => handleQuickBreak(action.duration, action.reason)}
                            disabled={isAddingBreak}
                            sx={{ minWidth: 80 }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Box>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Pause />}
                        onClick={() => setBreakDialogOpen(true)}
                        disabled={isAddingBreak}
                        sx={{ py: 1.5 }}
                      >
                        {isAddingBreak ? 'Pause...' : 'Pause hinzufügen'}
                      </Button>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      color="error"
                      startIcon={<Stop />}
                      onClick={handleEndShift}
                      disabled={isEnding}
                      sx={{ py: 1.5 }}
                    >
                      {isEnding ? 'Beende...' : 'Schicht beenden'}
                    </Button>
                  </>
                )}

                {stats.currentStatus === 'break' && activeBreakEntry && (
                  <Button
                    variant="contained"
                    fullWidth
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={async () => {
                      try {
                        await endBreak();
                      } catch (_error) {
                        // Error handling is done in the mutations
                      }
                    }}
                    disabled={isEndingBreak}
                    sx={{ py: 1.5 }}
                  >
                    {isEndingBreak ? 'Beende Pause...' : 'Pause beenden'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiken */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="glass" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Heute
              </Typography>

              {/* Arbeitszeit heute */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Arbeitszeit
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {stats.currentStatus === 'working' && activeWorkEntry
                      ? getLiveWorkTime().display
                      : stats.todayWorkTime}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((stats.todayWorkTimeMinutes / (8 * 60)) * 100, 100)}
                  sx={{ height: 10, borderRadius: 5 }}
                  color={stats.todayWorkTimeMinutes >= 8 * 60 ? 'success' : 'primary'}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  Ziel: 8 Stunden
                </Typography>

                {/* Pausen-Warnung */}
                {stats.currentStatus === 'working' &&
                  activeWorkEntry &&
                  getLiveWorkTime().totalMinutes >= 360 && (
                    <Alert severity="warning" sx={{ mt: 2 }} icon={<Warning />}>
                      <Typography variant="caption">
                        Nach 6 Stunden Arbeit ist eine Pause von mindestens 30 Minuten gesetzlich
                        vorgeschrieben.
                      </Typography>
                    </Alert>
                  )}
              </Box>

              {/* Überstunden */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Überstunden
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: stats.overtimeHours > 0 ? 'success.main' : 'text.secondary',
                    }}
                  >
                    {stats.overtimeHours > 0 ? '+' : ''}
                    {stats.overtimeHours.toFixed(1)}h
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Aktiver Auftrag */}
              {activeAssignments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Zugewiesener Auftrag
                  </Typography>
                  {activeAssignments.map(({ assignment, shift, facility }) => (
                    <Box
                      key={assignment.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {facility?.name || 'Unbekannte Einrichtung'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {shift.startTime} - {shift.endTime}
                      </Typography>
                      <Chip
                        label={assignment.status === 'accepted' ? 'Angenommen' : 'Zugewiesen'}
                        size="small"
                        color={assignment.status === 'accepted' ? 'success' : 'default'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Gesamtstatistik */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Gesamtstunden (Monat)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {stats.totalHours.toFixed(1)}h
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {stats.totalHours}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gesamtstunden
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {stats.overtimeHours}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Überstunden
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {stats.sickDays}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Krankheitstage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<Sick />} onClick={() => setSickDialogOpen(true)}>
          Krankmeldung
        </Button>
        <Button variant="outlined" startIcon={<Download />} onClick={() => exportTimes('pdf')}>
          Export PDF
        </Button>
        <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>
          Drucken
        </Button>
      </Box>

      {/* Tabs */}
      <Paper className="glass" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Zeitkonto" icon={<AccessTime />} iconPosition="start" />
          <Tab label="Arbeitszeiten" icon={<Work />} iconPosition="start" />
          <Tab label="Krankheit" icon={<Sick />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card className="glass">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Timer sx={{ mr: 1 }} />
                  Zeitkonto-Übersicht
                </Typography>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                      height: 8,
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.05)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: 4,
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Datum</TableCell>
                        <TableCell>Typ</TableCell>
                        <TableCell>Stunden</TableCell>
                        <TableCell>Saldo</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.timeEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {format(entry.date, 'dd.MM.yyyy', { locale: de })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getStatusIcon(entry.type)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {entry.type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {entry.hours}h
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={entry.balance >= 0 ? 'success.main' : 'error.main'}
                            >
                              {entry.balance >= 0 ? '+' : ''}
                              {entry.balance}h
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.status}
                              color={getStatusColor(entry.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="glass">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <HourglassEmpty sx={{ mr: 1 }} />
                  Zeitkonto-Statistik
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Arbeitszeit</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {stats.workHours}h
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.workHours / stats.totalHours) * 100}
                    color="primary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Überstunden</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {stats.overtimeHours}h
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.overtimeHours / stats.totalHours) * 100}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {stats.totalBalance}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gesamtsaldo
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Work sx={{ mr: 1 }} />
              Arbeitszeiten-Detail
            </Typography>

            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell>Schicht</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>Ende</TableCell>
                    <TableCell>Pausen</TableCell>
                    <TableCell>Stunden</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.workEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {format(entry.date, 'dd.MM.yyyy', { locale: de })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {entry.shiftType} - {entry.facility}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.startTime}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.endTime}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.breaks}min</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {entry.hours}h
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          color={getStatusColor(entry.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Sick sx={{ mr: 1 }} />
              Krankheitstage-Übersicht
            </Typography>

            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Zeitraum</TableCell>
                    <TableCell>Tage</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Arzt</TableCell>
                    <TableCell>Bemerkung</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.sickEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {format(entry.startDate, 'dd.MM.yyyy', { locale: de })} -{' '}
                          {format(entry.endDate, 'dd.MM.yyyy', { locale: de })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {entry.days}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          color={
                            entry.status === 'approved'
                              ? 'success'
                              : entry.status === 'pending'
                                ? 'warning'
                                : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.doctor}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {entry.remark}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Sick Report Dialog */}
      <Dialog
        open={sickDialogOpen}
        onClose={() => setSickDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sick />
            Krankmeldung
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Bitte melden Sie sich krank, sobald Sie wissen, dass Sie nicht zur Arbeit kommen können.
          </Alert>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Von"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={sickFormData.startDate}
                onChange={e => setSickFormData({ ...sickFormData, startDate: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bis"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={sickFormData.endDate}
                onChange={e => setSickFormData({ ...sickFormData, endDate: e.target.value })}
                required
                error={sickFormData.endDate < sickFormData.startDate}
                helperText={
                  sickFormData.endDate < sickFormData.startDate
                    ? 'Enddatum muss nach Startdatum liegen'
                    : ''
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Grund"
                multiline
                rows={3}
                placeholder="Beschreibung der Krankheit oder Symptome..."
                value={sickFormData.reason}
                onChange={e => setSickFormData({ ...sickFormData, reason: e.target.value })}
                required
                error={!sickFormData.reason.trim()}
                helperText={!sickFormData.reason.trim() ? 'Bitte geben Sie einen Grund an' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Arztbesuch (optional)"
                placeholder="Name des Arztes oder Praxis..."
                value={sickFormData.doctorNote}
                onChange={e => setSickFormData({ ...sickFormData, doctorNote: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSickDialogOpen(false);
              setSickFormData({
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: '',
                doctorNote: '',
              });
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleReportSick}
            variant="contained"
            disabled={
              !sickFormData.reason.trim() ||
              !sickFormData.startDate ||
              !sickFormData.endDate ||
              sickFormData.endDate < sickFormData.startDate
            }
            startIcon={<CheckCircle />}
          >
            Krankmeldung absenden
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Selection Dialog */}
      <Dialog
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            Auftrag auswählen
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bitte wählen Sie den Auftrag aus, für den Sie die Schicht starten möchten:
          </Typography>
          <RadioGroup
            value={selectedAssignmentId}
            onChange={e => setSelectedAssignmentId(e.target.value)}
          >
            {activeAssignments.map(({ assignment, shift, facility }) => (
              <FormControlLabel
                key={assignment.id}
                value={assignment.id}
                control={<Radio />}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {facility?.name || 'Unbekannte Einrichtung'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shift.startTime} - {shift.endTime}
                    </Typography>
                    {shift.notes && (
                      <Typography variant="caption" color="text.secondary">
                        {shift.notes}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleConfirmStartShift}
            variant="contained"
            disabled={!selectedAssignmentId || isStarting}
            startIcon={isStarting ? <InlineSpinner size={20} /> : <CheckCircle />}
          >
            Schicht starten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Break Dialog */}
      <Dialog
        open={breakDialogOpen}
        onClose={() => setBreakDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Pause />
            Pause hinzufügen
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Grund"
                placeholder="z.B. Mittagspause, Kaffeepause..."
                value={breakFormData.reason}
                onChange={e => setBreakFormData({ ...breakFormData, reason: e.target.value })}
                required
                error={!breakFormData.reason.trim()}
                helperText={!breakFormData.reason.trim() ? 'Bitte geben Sie einen Grund an' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dauer (Minuten)"
                type="number"
                placeholder="30"
                value={breakFormData.duration}
                onChange={e =>
                  setBreakFormData({ ...breakFormData, duration: parseInt(e.target.value) || 30 })
                }
                inputProps={{ min: 1, max: 480 }}
                helperText="Empfohlene Pausen: 15 min (kurz), 30 min (Mittag), 45 min (längere Pause)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setBreakDialogOpen(false);
              setBreakFormData({ reason: '', duration: 30 });
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleAddBreak}
            variant="contained"
            disabled={!breakFormData.reason.trim() || isAddingBreak}
            startIcon={isAddingBreak ? <InlineSpinner size={20} /> : <CheckCircle />}
          >
            Pause hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
