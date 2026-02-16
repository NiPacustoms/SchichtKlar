'use client';

// #region agent log – patch console.error at module load so we capture key warning before first paint
if (typeof window !== 'undefined') {
  const orig = console.error;
  console.error = function (...args: unknown[]) {
    const msg = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ');
    if (msg.includes('key') && (msg.includes('list') || msg.includes('unique'))) {
      const arg1 = args.length > 1 ? String(args[1]) : '';
      const arg2 = args.length > 2 ? String(args[2]) : '';
      fetch('http://127.0.0.1:7243/ingest/772533d7-e058-439e-a00a-1be099111014', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'uebersicht:keyWarningCapture',
          message: 'React key warning captured',
          data: { fullMessage: msg, argsLength: args.length, arg1, arg2 },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'H_capture',
        }),
      }).catch(() => {});
    }
    return orig.apply(console, args);
  };
}
// #endregion

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useAdminDashboard } from '@/lib/hooks/useAdminDashboard';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { timesheetService } from '@/lib/services/timesheets';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { QuickActions } from '@/components/admin/QuickActions';
import { AlertsPanel } from '@/components/admin/AlertsPanel';
import { StatisticsTabs } from '@/components/admin/StatisticsTabs';
import { RecentActivities } from '@/components/admin/RecentActivities';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import {
  People,
  Assignment as AssignmentIcon,
  TrendingUp,
  Warning,
  CheckCircle,
  Business,
  AccessTime,
} from '@mui/icons-material';
import { Box, Typography, Paper, Chip, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AdminDashboardPage() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hideStats = searchParams?.get('noStats') === '1';

  // Enable realtime updates
  const { isConnected } = useRealtimeUpdates();

  const {
    kpis,
    alerts,
    recentActivities,
    staff,
    weeklyHours,
    monthlyHours,
    shiftCompletion,
    staffActivity,
    pendingWorkTimesheets,
    isLoading,
    error,
    createShift,
    addStaff,
    exportReport,
    openSettings,
  } = useAdminDashboard();

  const [showAlerts] = useState(true);

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Admin Dashboard wird geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/772533d7-e058-439e-a00a-1be099111014', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'uebersicht/page.tsx:return',
      message: 'UebersichtPage render',
      data: { hasAlerts: alerts.length, hasActivities: recentActivities.length, hideStats },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      hypothesisId: 'H5',
    }),
  }).catch(() => {});
  // #endregion
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        key="page-header"
        title="Admin Dashboard"
        subtitle={`Überblick über alle Bereiche und Verwaltung${isConnected ? ' • Echtzeit-Updates aktiv' : ''}`}
        actions={
          <Chip
            label={isConnected ? 'Live' : 'Offline'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            icon={isConnected ? <CheckCircle /> : <Warning />}
          />
        }
      >
        <Button
          size="small"
          variant="text"
          onClick={() => openSettings()}
          sx={{ color: 'text.secondary', textDecoration: 'underline', textTransform: 'none' }}
        >
          Backup herunterladen
        </Button>
      </PageHeader>

      {/* Quick Actions */}
      <Paper key="quick-actions" sx={{ mb: 4 }}>
        <QuickActions
          onCreateShift={createShift}
          onAddStaff={addStaff}
          onExportReport={exportReport}
          onOpenSettings={openSettings}
        />
      </Paper>

      {/* Offene Zeiterfassungen */}
      {pendingWorkTimesheets.length > 0 && (
        <Stack
          key="pending-chips"
          direction="row"
          spacing={1}
          sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
        >
          <Chip
            component={Link}
            href="/admin/stunden"
            icon={<AccessTime />}
            label={`Offene Zeiterfassungen (${pendingWorkTimesheets.length})`}
            color="warning"
            variant="outlined"
            clickable
            sx={{ textDecoration: 'none' }}
          />
        </Stack>
      )}

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Box key="alerts-section" sx={{ mb: 4 }}>
          <AlertsPanel alerts={alerts} />
        </Box>
      )}

      {/* KPI Cards */}
      <Grid key="kpi-grid" container spacing={3} sx={{ mb: 4 }}>
        <Grid key="kpi-active-staff" size={{ xs: 12, sm: 6, md: 3 }}>
          <AdminKPICard
            title="Aktive Mitarbeiter"
            value={kpis.activeStaff}
            subtitle={`von ${kpis.totalStaff} insgesamt`}
            icon={<People />}
            color="info.main"
            trend={kpis.staffGrowth}
            onClick={() => router.push('/admin/mitarbeiter')}
          />
        </Grid>
        <Grid key="kpi-open-shifts" size={{ xs: 12, sm: 6, md: 3 }}>
          <AdminKPICard
            title="Offene Schichten"
            value={kpis.openShifts}
            subtitle="Diese Woche"
            icon={<AssignmentIcon />}
            color="success.main"
            trend={kpis.shiftTrend}
            onClick={() => router.push('/admin/schichten?status=open')}
          />
        </Grid>
        <Grid key="kpi-utilization" size={{ xs: 12, sm: 6, md: 3 }}>
          <AdminKPICard
            title="Auslastung"
            value={`${kpis.utilization}%`}
            subtitle="Durchschnitt"
            icon={<TrendingUp />}
            color="warning.main"
            trend={kpis.utilizationTrend}
            onClick={() => router.push('/admin/berichte')}
          />
        </Grid>
        <Grid key="kpi-facilities" size={{ xs: 12, sm: 6, md: 3 }}>
          <AdminKPICard
            title="Einrichtungen"
            value={kpis.facilities}
            subtitle="Aktive Standorte"
            icon={<Business />}
            color="secondary.main"
            trend={kpis.facilityTrend}
            onClick={() => router.push('/admin/berichte')}
          />
        </Grid>
      </Grid>

      {/* Statistics with Tabs – ?noStats=1 hides to isolate key warning */}
      <Box key="statistics-tabs" sx={{ mb: 4 }}>
        {hideStats ? (
          <Typography color="text.secondary">Statistik ausgeblendet (noStats=1)</Typography>
        ) : (
          <StatisticsTabs
            weeklyHours={weeklyHours}
            monthlyHours={monthlyHours}
            shiftCompletion={shiftCompletion}
            staffActivity={staffActivity}
            staff={staff}
          />
        )}
      </Box>

      {/* Recent Activities */}
      <Grid key="recent-grid" container spacing={3}>
        <Grid key="recent-activities" size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Letzte Aktivitäten
            </Typography>
            <RecentActivities activities={recentActivities} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
