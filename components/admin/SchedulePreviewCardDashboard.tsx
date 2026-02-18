'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import type { StaffingDayOverview } from '@/lib/admin/dashboardTypes';
import { spacingScale } from '@/lib/design-tokens';
import { Box, Chip, Typography } from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';

export interface SchedulePreviewCardDashboardProps {
  days: StaffingDayOverview[];
  loading?: boolean;
  onDayClick?: (day: StaffingDayOverview) => void;
}

export function SchedulePreviewCardDashboard({
  days,
  loading,
  onDayClick,
}: SchedulePreviewCardDashboardProps) {
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Heute';
    if (isTomorrow(date)) return 'Morgen';
    if (isThisWeek(date)) return format(date, 'EEEE', { locale: de });
    return format(date, 'dd.MM');
  };

  const getStatusColor = (status: StaffingDayOverview['status']) => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'understaffed':
        return 'warning';
      case 'overstaffed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: StaffingDayOverview['status']) => {
    switch (status) {
      case 'ok':
        return 'In Ordnung';
      case 'understaffed':
        return 'Unterbesetzt';
      case 'overstaffed':
        return 'Überbesetzt';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: StaffingDayOverview['status']) => {
    switch (status) {
      case 'ok':
        return <OkIcon fontSize="small" />;
      case 'understaffed':
      case 'overstaffed':
        return <WarningIcon fontSize="small" />;
      default:
        return <CalendarIcon fontSize="small" />;
    }
  };

  if (loading && days.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3 }}>
          <Box className="shimmer-skeleton" sx={{ height: 24, width: 160, mb: 3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacingScale.sm }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Box
                key={i}
                className="shimmer-skeleton"
                sx={{ height: 72, borderRadius: 1 }}
              />
            ))}
          </Box>
        </Box>
      </GlassCard>
    );
  }

  if (days.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine Planungsdaten
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keine Schichtdaten für die nächsten Tage verfügbar
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  const _criticalDays = days.filter(d => d.status !== 'ok');
  const totalUnfilled = days.reduce((sum, d) => sum + d.unfilledShifts, 0);

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Planungsübersicht
          </Typography>
          {totalUnfilled > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${totalUnfilled} offen`}
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacingScale.sm }}>
          {days.slice(0, 7).map(day => {
            const date = new Date(day.date);
            const isCritical = day.status !== 'ok';

            return (
              <Box
                key={day.date}
                onClick={() => onDayClick?.(day)}
                sx={{
                  border: '1px solid',
                  borderColor: isCritical ? 'warning.main' : 'divider',
                  borderRadius: 1,
                  p: 2,
                  cursor: onDayClick ? 'pointer' : 'default',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: isCritical ? 'rgba(237, 108, 2, 0.04)' : 'transparent',
                  '&:hover': onDayClick
                    ? {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(0, 95, 115, 0.04)',
                        transform: 'translateX(4px)',
                      }
                    : {},
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {getDateLabel(day.date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(date, 'dd.MM.yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    icon={getStatusIcon(day.status)}
                    label={getStatusLabel(day.status)}
                    color={getStatusColor(day.status)}
                    size="small"
                    variant={day.status === 'ok' ? 'outlined' : 'filled'}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {day.totalShifts} Schichten
                  </Typography>
                  {day.unfilledShifts > 0 && (
                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                      {day.unfilledShifts} unbesetzt
                    </Typography>
                  )}
                  {day.criticalStations.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {day.criticalStations.length} kritische Stationen
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link href="/admin/schichten">
            <Typography
              variant="body2"
              color="primary"
              sx={{
                textDecoration: 'underline',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'none' },
              }}
            >
              Vollständigen Dienstplan anzeigen →
            </Typography>
          </Link>
        </Box>
      </Box>
    </GlassCard>
  );
}
