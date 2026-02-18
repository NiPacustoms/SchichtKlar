'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Shift } from '@/lib/types';
import { Add, Schedule } from '@mui/icons-material';
import { Box, Button, Chip, Typography } from '@mui/material';
import { format } from 'date-fns';
import {
  getShiftDisplayStatus,
  getShiftStatusLabel,
  type ShiftDisplayStatus,
} from '@/lib/utils/shiftStatus';

interface ShiftListProps {
  shifts: Shift[];
  onRequestShift?: (shiftId: string) => void;
  showRequestButton?: boolean;
}

export function ShiftList({ shifts, onRequestShift, showRequestButton = true }: ShiftListProps) {
  const getShiftTypeColor = (type: Shift['type']) => {
    switch (type) {
      case 'Frühdienst':
        return '#0288D1';
      case 'Spätdienst':
        return '#2E7D32';
      case 'Nachtdienst':
        return '#7B1FA2';
      case 'On-call':
        return '#ED6C02';
      default:
        return '#666';
    }
  };

  const getStatusColor = (displayStatus: ShiftDisplayStatus) => {
    switch (displayStatus) {
      case 'open':
        return 'info';
      case 'filled':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'ended':
        return 'default';
      default:
        return 'default';
    }
  };

  if (shifts.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine verfügbaren Schichten
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Schau später wieder vorbei
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {shifts.map(shift => {
        const shiftDate = shift.date instanceof Date ? shift.date : new Date(shift.date);
        const shiftLabel = shift.facilityId
          ? `Einrichtung ${shift.facilityId}${shift.stationId ? ` · Station ${shift.stationId}` : ''}`
          : 'Schicht';
        return (
          <GlassCard key={shift.id}>
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {shiftLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {Number.isNaN(shiftDate.getTime())
                      ? 'Datum unbekannt'
                      : `${format(shiftDate, 'dd.MM.yyyy')} • ${shift.startTime} - ${shift.endTime}`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Schedule sx={{ fontSize: 16, color: getShiftTypeColor(shift.type) }} />
                    <Typography variant="body2" sx={{ color: getShiftTypeColor(shift.type) }}>
                      Schicht
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Max. {shift.maxStaff} Mitarbeiter • {shift.requiredQualifications.length}{' '}
                    Qualifikationen erforderlich
                  </Typography>
                </Box>
                <Chip
                  label={getShiftStatusLabel(getShiftDisplayStatus(shift))}
                  color={getStatusColor(getShiftDisplayStatus(shift))}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '12px',
                    height: 28,
                  }}
                />
              </Box>

              {showRequestButton && getShiftDisplayStatus(shift) === 'open' && onRequestShift && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => onRequestShift(shift.id)}
                  sx={{
                    width: '100%',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    borderWidth: 1.5,
                  }}
                >
                  Schicht anfragen
                </Button>
              )}
            </Box>
          </GlassCard>
        );
      })}
    </Box>
  );
}
