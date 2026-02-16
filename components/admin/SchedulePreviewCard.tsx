'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Shift, Facility } from '@/lib/types';
import { Box, Typography, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Assignment as ShiftIcon,
  Warning as WarningIcon,
  CheckCircle as FilledIcon,
} from '@mui/icons-material';
import { format, addDays, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';
import Link from 'next/link';

interface SchedulePreviewCardProps {
  shifts: Shift[];
  facilities: Facility[];
  onShiftClick?: (shift: Shift) => void;
}

export function SchedulePreviewCard({
  shifts,
  facilities,
  onShiftClick,
}: SchedulePreviewCardProps) {
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [viewDays, setViewDays] = useState<number>(7);

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.name || 'Unbekannte Einrichtung';
  };

  const getShiftStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'filled':
        return 'success';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getShiftStatusIcon = (status: Shift['status']) => {
    switch (status) {
      case 'open':
        return <WarningIcon fontSize="small" />;
      case 'filled':
        return <FilledIcon fontSize="small" />;
      default:
        return <ShiftIcon fontSize="small" />;
    }
  };

  const getShiftStatusLabel = (status: Shift['status']) => {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'filled':
        return 'Besetzt';
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Heute';
    if (isTomorrow(date)) return 'Morgen';
    if (isThisWeek(date)) return format(date, 'EEEE', { locale: de });
    return format(date, 'dd.MM');
  };

  const filteredShifts = shifts
    .filter(shift => {
      if (facilityFilter === 'all') return true;
      return shift.facilityId === facilityFilter;
    })
    .filter(shift => {
      const shiftDate = new Date(shift.date);
      const endDate = addDays(new Date(), viewDays);
      return shiftDate <= endDate;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const shiftsByDate = filteredShifts.reduce(
    (acc, shift) => {
      const dateKey = format(new Date(shift.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(shift);
      return acc;
    },
    {} as Record<string, Shift[]>
  );

  const openShiftsCount = filteredShifts.filter(s => s.status === 'open').length;
  const filledShiftsCount = filteredShifts.filter(s => s.status === 'filled').length;

  if (shifts.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine Schichten
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keine Schichtdaten für die nächsten {viewDays} Tage
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Dienstplan-Vorschau
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Einrichtung</InputLabel>
              <Select
                value={facilityFilter}
                label="Einrichtung"
                onChange={e => setFacilityFilter(e.target.value)}
              >
                <MenuItem value="all">Alle Einrichtungen</MenuItem>
                {facilities.map(facility => (
                  <MenuItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Tage</InputLabel>
              <Select
                value={viewDays}
                label="Tage"
                onChange={e => setViewDays(Number(e.target.value))}
              >
                <MenuItem value={3}>3 Tage</MenuItem>
                <MenuItem value={7}>7 Tage</MenuItem>
                <MenuItem value={14}>14 Tage</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip
            icon={<WarningIcon />}
            label={`${openShiftsCount} offen`}
            color="error"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<FilledIcon />}
            label={`${filledShiftsCount} besetzt`}
            color="success"
            variant="outlined"
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(shiftsByDate)
            .slice(0, 5)
            .map(([dateKey, dayShifts]) => {
              const date = new Date(dateKey);

              return (
                <Box
                  key={dateKey}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
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
                      {getDateLabel(date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(date, 'dd.MM.yyyy')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dayShifts.slice(0, 3).map(shift => (
                      <Box
                        key={shift.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          backgroundColor: 'action.hover',
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'action.selected',
                          },
                        }}
                        onClick={() => onShiftClick?.(shift)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ShiftIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {shift.type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {shift.startTime} - {shift.endTime}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getShiftStatusIcon(shift.status)}
                            label={getShiftStatusLabel(shift.status)}
                            color={getShiftStatusColor(shift.status)}
                            size="small"
                            variant="outlined"
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ minWidth: 120, textAlign: 'right' }}
                          >
                            {getFacilityName(shift.facilityId)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}

                    {dayShifts.length > 3 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', mt: 1 }}
                      >
                        ... und {dayShifts.length - 3} weitere Schichten
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
