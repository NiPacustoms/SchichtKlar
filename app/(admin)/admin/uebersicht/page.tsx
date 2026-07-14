'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard } from '@/lib/hooks/useAdminDashboard';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { QuickActions } from '@/components/admin/QuickActions';
import { ExportReportDialog } from '@/components/admin/ExportReportDialog';
import { AlertsPanel } from '@/components/admin/AlertsPanel';
import { StatisticsTabs } from '@/components/admin/StatisticsTabs';
import { RecentActivities } from '@/components/admin/RecentActivities';
import { UpcomingShiftsCards } from '@/components/admin/UpcomingShiftsCards';
import { OnboardingChecklist } from '@/components/admin/OnboardingChecklist';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { DashboardSkeleton } from '@/components/admin/DashboardSkeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  People,
  Assignment as AssignmentIcon,
  TrendingUp,
  Business,
  AccessTime,
  Block,
} from '@mui/icons-material';
import { Box, Typography, Chip, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';

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
    allShifts,
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
    openSettings,
  } = useAdminDashboard();

  const [showAlerts] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  if (authLoading) {
    return <LoadingSpinner message="Anmeldung wird geprüft..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageContainer maxWidth="wide" withBottomNav>
      <PageHeader
        key="page-header"
        title="Übersicht"
        subtitle={`Überblick über alle Bereiche und Verwaltung${isConnected ? ' • Echtzeit-Updates aktiv' : ''}`}
        actions={
          <Chip
            label={isConnected ? 'Live' : 'Offline'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />
        }
      />

      {/* Onboarding „Erste Schritte" – blendet sich nach Abschluss selbst aus */}
      <OnboardingChecklist key="onboarding" />

      {/* Quick Actions */}
      <Box key="quick-actions" sx={{ mb: 4 }}>
        <QuickActions
          onCreateShift={createShift}
          onAddStaff={addStaff}
          onExportReport={() => setExportDialogOpen(true)}
          onOpenSettings={openSettings}
        />
      <ExportReportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
      </Box>

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

      {/* KPI Cards – alle auf einen Blick (Grid statt Karussell) */}
      <Grid key="kpi-grid" container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 6, lg: 2.4 }}>
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
        <Grid size={{ xs: 6, sm: 6, lg: 2.4 }}>
          <AdminKPICard
            title="Offene Schichten"
            value={kpis.openShifts}
            subtitle="Diese Woche"
            icon={<AssignmentIcon />}
            color="warning.main"
            trend={kpis.shiftTrend}
            onClick={() => router.push('/admin/schichten?status=open')}
            priority={kpis.openShifts > 0 ? 1 : 2}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 2.4 }}>
          <AdminKPICard
            title="Auslastung"
            value={`${kpis.utilization}%`}
            subtitle="Durchschnitt"
            icon={<TrendingUp />}
            color="primary.main"
            trend={kpis.utilizationTrend}
            onClick={() => router.push('/admin/berichte')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 2.4 }}>
          <AdminKPICard
            title="Einrichtungen"
            value={kpis.facilities}
            subtitle="Aktive Standorte"
            icon={<Business />}
            color="primary.main"
            trend={kpis.facilityTrend}
            onClick={() => router.push('/admin/berichte')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 2.4 }}>
          <AdminKPICard
            title="Wochenlimit"
            value={kpis.weeklyLimitBlocked > 0 ? `${kpis.weeklyLimitBlocked} überschritten` : 'OK'}
            subtitle={
              kpis.weeklyLimitBlocked > 0 || kpis.weeklyLimitWarning > 0
                ? `${kpis.weeklyLimitBlocked} blockiert, ${kpis.weeklyLimitWarning} Warnung`
                : 'ArbZG/MiLoG'
            }
            icon={<Block />}
            color={kpis.weeklyLimitBlocked > 0 ? 'error.main' : kpis.weeklyLimitWarning > 0 ? 'warning.main' : 'success.main'}
            priority={kpis.weeklyLimitBlocked > 0 ? 1 : kpis.weeklyLimitWarning > 0 ? 2 : 3}
            onClick={() => router.push('/admin/mitarbeiter')}
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

      {/* Kommende Schichten + Aktivitäten */}
      <Grid key="recent-grid" container spacing={3}>
        <Grid key="upcoming-shifts" size={{ xs: 12, lg: 6 }}>
          <UpcomingShiftsCards shifts={allShifts} maxItems={5} />
        </Grid>
        <Grid key="recent-activities" size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, color: 'text.secondary' }}>
              Letzte Aktivitäten
            </Typography>
            <RecentActivities activities={recentActivities} />
          </GlassCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
