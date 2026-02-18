'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useShiftEnrichment } from '@/lib/hooks/useShiftEnrichment';
import type { Shift as DomainShift } from '@/lib/types';
import type { Shift as ServiceShift } from '@/lib/services/shifts';
import { format, parseISO, isValid, startOfWeek, endOfWeek, startOfDay, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@mui/icons-material';
import { Box, Typography, Paper } from '@mui/material';
import Link from 'next/link';

function toDomainShift(s: ServiceShift): DomainShift {
  const raw = s.date as string | Date;
  const date = typeof raw === 'string' ? parseISO(raw) : (raw as Date);
  return {
    id: s.id,
    facilityId: s.facilityId,
    stationId: s.stationId ?? '',
    companyId: s.companyId ?? '',
    date: isValid(date) ? date : new Date(),
    startTime: s.startTime,
    endTime: s.endTime,
    type: (s.type as DomainShift['type']) || 'Frühdienst',
    requiredQualifications: s.requiredQualifications ?? [],
    maxStaff: s.maxStaff ?? s.capacity ?? 1,
    status: s.status ?? 'open',
    createdAt: s.createdAt ?? new Date(),
    updatedAt: s.updatedAt ?? new Date(),
    capacity: s.capacity ?? 1,
    assignedCount: s.assignedCount ?? 0,
    tz: s.timezone ?? 'Europe/Berlin',
    notes: s.notes,
    createdBy: s.createdBy ?? 'system',
  };
}

export interface UpcomingShiftsCardsProps {
  shifts: ServiceShift[];
  maxItems?: number;
}

export function UpcomingShiftsCards({ shifts, maxItems = 20 }: UpcomingShiftsCardsProps) {
  const router = useRouter();
  const { user } = useAuth();

  const shiftsThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const todayStart = startOfDay(now);
    const domain = shifts.map(toDomainShift);
    return domain
      .filter((s) => {
        const d = s.date instanceof Date ? s.date : new Date(s.date);
        const inWeek = isValid(d) && isWithinInterval(d, { start: weekStart, end: weekEnd });
        const notPast = d >= todayStart;
        return inWeek && notPast;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, maxItems);
  }, [shifts, maxItems]);

  const { enrichment, isLoading } = useShiftEnrichment(shiftsThisWeek, user?.companyId);

  const weekLabel = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return `${format(start, 'd. MMM', { locale: de })} – ${format(end, 'd. MMM yyyy', { locale: de })}`;
  }, []);

  if (shiftsThisWeek.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Schichten diese Woche
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {weekLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Keine Schichten in dieser Woche.{' '}
          <Link href="/admin/schichten" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Schichten verwalten →
          </Link>
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Schichten diese Woche
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        {weekLabel}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {shiftsThisWeek.map((shift) => {
          const en = enrichment[shift.id];
          const where = isLoading
            ? '…'
            : (en?.facilityName ?? (shift.facilityId ? 'Einrichtung' : '–'));
          const who =
            en?.assigneeNames?.length ?
              en.assigneeNames.join(', ')
            : isLoading ? '…'
            : 'Noch nicht zugewiesen';
          const time =
            shift.startTime && shift.endTime
              ? `${shift.startTime}–${shift.endTime}`
              : 'Zeit wird festgelegt';
          const whenLabel = format(shift.date instanceof Date ? shift.date : new Date(shift.date), 'EEEE, d. MMM', { locale: de });

          return (
            <Box
              key={shift.id}
              onClick={() => router.push('/admin/schichten')}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Event fontSize="small" sx={{ color: 'primary.main', mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {whenLabel} · {time}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {where}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {who}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Typography
        component={Link}
        href="/admin/schichten"
        variant="body2"
        color="primary"
        sx={{ display: 'block', mt: 2, textDecoration: 'underline', '&:hover': { textDecoration: 'none' } }}
      >
        Alle Schichten anzeigen →
      </Typography>
    </Paper>
  );
}
