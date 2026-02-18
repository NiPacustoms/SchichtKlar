'use client';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { RecentActivities } from '@/components/admin/RecentActivities';
import { TopPerformers } from '@/components/admin/TopPerformers';
import { AssignmentCard } from '@/components/dashboard/AssignmentCard';
import { KPICard } from '@/components/dashboard/KPICard';
import { UpcomingAssignments } from '@/components/dashboard/UpcomingAssignments';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAdminDashboard } from '@/lib/hooks/useAdminDashboard';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { assignmentService, timesheetService } from '@/lib/services';
import type { Assignment as AssignmentType } from '@/lib/types/assignment';
import {
  AccessTime,
  Assignment,
  Business,
  CalendarMonth,
  CheckCircle,
  Description,
  People,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';



// NurseDashboard Komponente mit perfektem Dark/Light Theme
function NurseDashboard() {
  const { mode } = useTheme();
  const isDark = false;

  const kpiData = [
    { title: 'Heute', value: '4.5h', icon: <AccessTime />, color: '#0288D1' },
    { title: 'Diese Woche', value: '32h', icon: <CalendarMonth />, color: '#2E7D32' },
    { title: 'Dieser Monat', value: '128h', icon: <Description />, color: '#7B1FA2' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Dashboard Employee
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
        >
          Hier ist dein Überblick für heute
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {kpiData.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <GlassCard>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)', mb: 1 }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="h4" sx={{ color: item.color, fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: item.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <GlassCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Aktueller Dienst
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)', mb: 0.5 }}
              >
                Krankenhaus München - Station 3
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
              >
                06:00 - 14:00
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<CheckCircle />}
                label="Im Dienst"
                color="success"
                size="small"
                sx={{ backgroundColor: 'rgba(46, 125, 50, 0.2)' }}
              />
            </Box>
          </Box>
        </CardContent>
      </GlassCard>
    </Box>
  );
}

// AdminDashboard Komponente mit perfektem Dark/Light Theme
function AdminDashboard() {
  const { mode } = useTheme();
  const isDark = false;

  const kpiData = [
    { title: 'Einrichtungen', value: '12', icon: <Business />, color: '#0288D1' },
    { title: 'Aktive Einsätze', value: '45', icon: <People />, color: '#2E7D32' },
    { title: 'Offene Dienste', value: '8', icon: <Assignment />, color: '#ED6C02' },
    { title: 'Gearbeitete Stunden', value: '1240h', icon: <AccessTime />, color: '#7B1FA2' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
        >
          Überblick über alle Bereiche
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {kpiData.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <GlassCard>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)', mb: 1 }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="h4" sx={{ color: item.color, fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: item.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

    </Box>
  );
}

// Hauptkomponente
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentRole } = useRole();
  const { mode } = useTheme();
  const isDark = false;
  const { todayAssignment, todayTimesheet, upcomingAssignments, kpis, isLoading } = useDashboard();
 
  const {
    allUsers,
    weeklyTimesheets,
    allAssignments,
    allShifts,
    allFacilities,
    allDocuments,
    kpis: adminKpis,
    getRecentActivities,
    getTopPerformers,
    getTopFacilities,
    isLoading: adminLoading,
  } = useAdminDashboard();
 
  const queryClient = useQueryClient();

  // Timesheet mutations
  const startWorkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      const today = new Date();
      return await timesheetService.create(user.id, {
        date: today,
        startTime: new Date().toTimeString().slice(0, 5),
        endTime: '',
        breakMinutes: 0,
        notes: '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const endWorkMutation = useMutation({
    mutationFn: async () => {
      if (!todayTimesheet?.id) throw new Error('No timesheet to update');
      return await timesheetService.update(todayTimesheet.id, {
        endTime: new Date().toTimeString().slice(0, 5),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Assignment mutations
  const acceptAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await assignmentService.accept(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const declineAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await assignmentService.decline(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Dashboard wird geladen..." />;
  }

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
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

  const isNurse = currentRole === 'nurse';
 
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, pb: 10 }}>
      {/* Ruhiger Header für Mitarbeitende */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            color: 'text.primary',
          }}
        >
          {isNurse ? `Guten Tag, ${user.displayName || 'willkommen'} 👋` : 'Admin Dashboard'}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >
          {isNurse
            ? 'Dein Überblick für heute – Schichten, Zeiten und wichtige Aufgaben auf einen Blick.'
            : 'Überblick über alle Bereiche und Kennzahlen.'}
        </Typography>
      </Box>
 
      {isNurse ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Sehr reduziertes KPI-Row */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <KPICard
                title="Stunden heute"
                value={`${kpis.todayHours}h`}
                icon={<AccessTime />}
                color="#0288D1"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <KPICard
                title="Diese Woche"
                value={`${kpis.weekHours}h`}
                icon={<CalendarMonth />}
                color="#2E7D32"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <KPICard
                title="Dieser Monat"
                value={`${kpis.monthHours}h`}
                icon={<Description />}
                color="#7B1FA2"
              />
            </Grid>
          </Grid>
 
          {/* Aktueller Dienst – im Fokus, in einem Block */}
          <GlassCard>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Aktueller Dienst
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {todayAssignment ? (todayAssignment as AssignmentType & { facilityName?: string }).facilityName || 'Einsatz' : 'Kein geplanter Dienst heute'}
                  </Typography>
                </Box>
              </Box>
              <AssignmentCard
                assignment={todayAssignment}
                timesheet={todayTimesheet}
                onStartWork={() => startWorkMutation.mutate()}
                onPauseWork={() => {}}
                onEndWork={() => endWorkMutation.mutate()}
                isLoading={startWorkMutation.isPending || endWorkMutation.isPending}
              />
            </CardContent>
          </GlassCard>
 
          {/* Kommende Einsätze – eigene, ruhige Sektion */}
          <GlassCard>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
                Nächste Einsätze
              </Typography>
              <UpcomingAssignments
                assignments={upcomingAssignments || []}
                onAccept={id => acceptAssignmentMutation.mutate(id)}
                onDecline={id => declineAssignmentMutation.mutate(id)}
                isLoading={acceptAssignmentMutation.isPending || declineAssignmentMutation.isPending}
              />
            </CardContent>
          </GlassCard>
        </Box>
      ) : (
        // Admin-Zweig bleibt „reicher“, aber verwendet die modernisierten Admin-Komponenten
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Admin KPIs */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Aktive Mitarbeiter"
                value={adminKpis.activeStaff}
                subtitle={`von ${adminKpis.totalStaff} total`}
                icon={<People />}
                color="#4CAF50"
                trend={{ value: 12, isPositive: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Arbeitsstunden (Woche)"
                value={`${adminKpis.totalHours}h`}
                subtitle="Diese Woche"
                icon={<AccessTime />}
                color="#2196F3"
                trend={{ value: 8, isPositive: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Ausstehende Zuweisungen"
                value={adminKpis.pendingAssignments}
                subtitle="Benötigen Aufmerksamkeit"
                icon={<Assignment />}
                color="#FF9800"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Offene Schichten"
                value={adminKpis.openShifts}
                subtitle="Verfügbar"
                icon={<CalendarMonth />}
                color="#9C27B0"
              />
            </Grid>
          </Grid>
 
          {/* Top Performer & Aktivitäten */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TopPerformers performers={getTopPerformers()} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RecentActivities activities={getRecentActivities()} />
            </Grid>
          </Grid>
 
          {/* Weitere Admin-KPIs */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Einrichtungen"
                value={allFacilities.length}
                subtitle="Aktive Standorte"
                icon={<Business />}
                color="#607D8B"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Abgelaufene Nachweise"
                value={adminKpis.expiringDocuments}
                subtitle="Benötigen Erneuerung"
                icon={<Description />}
                color="#F44336"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Zuweisungen (Woche)"
                value={allAssignments.length}
                subtitle="Diese Woche"
                icon={<Assignment />}
                color="#795548"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AdminKPICard
                title="Schichten (Woche)"
                value={allShifts.length}
                subtitle="Geplant"
                icon={<CalendarMonth />}
                color="#3F51B5"
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
