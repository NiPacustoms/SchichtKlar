'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard } from '@/lib/hooks/useAdminDashboard';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
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
  Add,
  FileDownloadOutlined,
  PersonAddAlt1Outlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Typography, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatStrip } from '@/components/ui/StatStrip';

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
        subtitle={isConnected ? 'Was heute ansteht – Daten werden live aktualisiert' : 'Was heute ansteht – Verbindung getrennt, Daten evtl. nicht aktuell'}
        actions={
          <>
            <Button variant="text" startIcon={<FileDownloadOutlined />} onClick={() => setExportDialogOpen(true)}>
              Bericht exportieren
            </Button>
            <Button variant="outlined" startIcon={<PersonAddAlt1Outlined />} onClick={addStaff}>
              Mitarbeiter hinzufügen
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={createShift}>
              Dienst anlegen
            </Button>
          </>
        }
      />
      <ExportReportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />

      {/* Onboarding „Erste Schritte" – blendet sich nach Abschluss selbst aus */}
      <OnboardingChecklist key="onboarding" />

      <StatStrip
        aria-label="Kennzahlen"
        items={[
          {
            label: 'Aktive Mitarbeiter',
            value: kpis.activeStaff,
            hint: `von ${kpis.totalStaff} insgesamt`,
            onClick: () => router.push('/admin/mitarbeiter'),
          },
          {
            label: 'Offene Schichten',
            value: kpis.openShifts,
            hint: 'diese Woche',
            tone: kpis.openShifts > 0 ? 'attention' : 'default',
            onClick: () => router.push('/admin/schichten?status=open'),
          },
          { label: 'Auslastung', value: `${kpis.utilization} %`, hint: 'Durchschnitt', onClick: () => router.push('/admin/berichte') },
          { label: 'Einrichtungen', value: kpis.facilities, hint: 'aktiv', onClick: () => router.push('/admin/einrichtungen') },
          {
            label: 'Wochenlimit',
            value: kpis.weeklyLimitBlocked > 0 ? `${kpis.weeklyLimitBlocked} überschritten` : 'Im Rahmen',
            hint:
              kpis.weeklyLimitWarning > 0 ? `${kpis.weeklyLimitWarning} nahe am Limit` : 'ArbZG/MiLoG',
            tone: kpis.weeklyLimitBlocked > 0 ? 'attention' : 'default',
            onClick: () => router.push('/admin/mitarbeiter'),
          },
        ]}
      />

      {/* Offene Zeiterfassungen */}
      {pendingWorkTimesheets.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button component={Link} href="/admin/stunden" color="inherit" size="small">
              Prüfen
            </Button>
          }
        >
          {pendingWorkTimesheets.length === 1
            ? '1 Zeiterfassung wartet auf Freigabe.'
            : `${pendingWorkTimesheets.length} Zeiterfassungen warten auf Freigabe.`}
        </Alert>
      )}

      <Grid key="main-grid" container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          {showAlerts && <AlertsPanel alerts={alerts} />}
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <UpcomingShiftsCards shifts={allShifts} maxItems={5} />
            <GlassCard sx={{ p: 2.5 }} hover={false}>
              <Typography component="h2" sx={{ fontSize: 17, fontWeight: 650, mb: 1.5 }}>
                Letzte Aktivitäten
              </Typography>
              <RecentActivities activities={recentActivities} />
            </GlassCard>
          </Stack>
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

    </PageContainer>
  );
}
