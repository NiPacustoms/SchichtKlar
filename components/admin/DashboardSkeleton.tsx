'use client';

import { Box, Grid, Paper, Skeleton } from '@mui/material';
import { PageContainer } from '@/components/layout/PageContainer';

/**
 * Skeleton-Layout für die Admin-Übersicht (Elite UX).
 * Entspricht der echten Seitenstruktur: Header, Quick Actions, KPI-Grid, Stats, Recent + Audit.
 */
export function DashboardSkeleton() {
  return (
    <PageContainer maxWidth="wide">
      {/* PageHeader-Skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={180} height={36} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={320} height={22} />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Skeleton variant="rounded" width={64} height={24} />
          <Skeleton variant="rounded" width={120} height={24} />
        </Box>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ mb: 4, p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={140} height={40} />
          ))}
        </Box>
      </Paper>

      {/* KPI Cards – Shimmer (Petrol→Mustard) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Box className="shimmer-skeleton" sx={{ height: 140, borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>

      {/* Statistics Tabs – Shimmer */}
      <Box sx={{ mb: 4 }}>
        <Box className="shimmer-skeleton" sx={{ width: 120, height: 32, mb: 2 }} />
        <Box className="shimmer-skeleton" sx={{ height: 280, borderRadius: 2 }} />
      </Box>

      {/* Recent Activities + Audit */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width={160} height={28} sx={{ mb: 3 }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width={140} height={28} sx={{ mb: 3 }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="text" width="100%" height={20} sx={{ mb: 1 }} />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
