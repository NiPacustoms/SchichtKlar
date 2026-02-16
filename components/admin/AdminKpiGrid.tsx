'use client';

import { Grid, Skeleton, useTheme } from '@mui/material';
import { GlassCard } from '@/components/ui/GlassCard';
import { AdminKPICard } from './AdminKPICard';
import type { DashboardKpi } from '@/lib/admin/dashboardTypes';

export interface AdminKpiGridProps {
  items: DashboardKpi[];
  loading?: boolean;
  onKpiClick?: (kpi: DashboardKpi) => void;
}

export function AdminKpiGrid({ items, loading, onKpiClick }: AdminKpiGridProps) {
  const theme = useTheme();

  if (loading && !items.length) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <GlassCard>
              <Skeleton variant="rectangular" height={96} />
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {items.map(kpi => {
        const color =
          kpi.status === 'critical'
            ? theme.palette.error.main
            : kpi.status === 'warning'
              ? theme.palette.warning.main
              : theme.palette.primary.main;

        const displayValue =
          typeof kpi.value === 'number' && kpi.unit
            ? `${kpi.value.toLocaleString('de-DE')} ${kpi.unit}`
            : kpi.value;

        const trend =
          typeof kpi.trendPercent === 'number'
            ? { value: kpi.trendPercent, isPositive: kpi.trendDirection !== 'down' }
            : undefined;

        return (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={kpi.id}>
            <AdminKPICard
              title={kpi.label}
              value={displayValue}
              subtitle={kpi.unit && !String(displayValue).includes(kpi.unit) ? kpi.unit : undefined}
              icon={kpi.icon}
              color={color}
              trend={trend}
              onClick={onKpiClick ? () => onKpiClick(kpi) : undefined}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
