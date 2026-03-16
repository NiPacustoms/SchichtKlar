'use client';

import { useTheme } from '@mui/material/styles';
import AccessTime from '@mui/icons-material/AccessTime';
import { AdminKPICard } from './AdminKPICard';
import { useWeeklyLimit } from '@/lib/hooks/useWeeklyLimit';
import { semanticColors } from '@/lib/design-tokens';

export interface WeeklyLimitKpiProps {
  mitarbeiterId: string;
  mitarbeiterName?: string;
  onClick?: () => void;
}

export function WeeklyLimitKpi({ mitarbeiterId, mitarbeiterName: _mitarbeiterName, onClick }: WeeklyLimitKpiProps) {
  const theme = useTheme();
  const { data: limit, isLoading } = useWeeklyLimit(mitarbeiterId);

  const priority = limit?.status === 'blocked' ? 1 : limit?.status === 'warning' ? 2 : 3;
  const color =
    limit?.status === 'blocked'
      ? theme.palette.error.main
      : limit?.status === 'warning'
        ? theme.palette.warning.main
        : semanticColors.success.main;

  const displayValue = limit
    ? limit.status === 'blocked'
      ? `+${limit.ueberschreitung.toFixed(1)}h über Limit`
      : `${limit.aktuelleWochenstunden.toFixed(1)}h / ${limit.wochenstundenLimit}h`
    : '—';

  const subtitle = limit?.status === 'blocked'
    ? `Limit ${limit.wochenstundenLimit}h überschritten`
    : limit
      ? `${limit.aktuelleWochenstunden.toFixed(1)}h diese Woche`
      : undefined;

  if (isLoading) {
    return (
      <AdminKPICard
        title="Wochenlimit"
        value="…"
        icon={<AccessTime />}
        color={theme.palette.primary.main}
        priority={3}
      />
    );
  }

  return (
    <AdminKPICard
      title="Wochenlimit"
      value={displayValue}
      subtitle={subtitle}
      icon={<AccessTime />}
      color={color}
      priority={priority}
      onClick={onClick}
    />
  );
}
