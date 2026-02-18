'use client';

import { logger } from '@/lib/logging';

import { GlassCard } from '@/components/ui/GlassCard';
import { assignmentStatusColors } from '@/lib/design-tokens';
import { Assignment } from '@/lib/types';
import { Cancel, CheckCircle, AccessTime, Person } from '@mui/icons-material';
import { Box, Button, Chip, Typography, Stack } from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { shiftService } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';

interface AssignmentCardProps {
  assignment: Assignment;
  onAccept: (assignmentId: string) => void;
  onDecline: (assignmentId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export function AssignmentCard({
  assignment,
  onAccept,
  onDecline,
  isLoading = false,
  showActions = true,
}: AssignmentCardProps) {
  const [shiftDetails, setShiftDetails] = useState<{
    startTime?: string;
    endTime?: string;
    facilityName?: string;
    stationName?: string;
    contactPerson?: string;
    date?: Date;
  }>({});

  useEffect(() => {
    let mounted = true;
    if (assignment?.shiftId) {
      (async () => {
        try {
          const shift = await shiftService.getById(assignment.shiftId);
          if (mounted && shift) {
            const facility = shift.facilityId
              ? await facilityService.getById(shift.facilityId)
              : null;
            const station = facility?.stations?.find(s => s.id === shift.stationId);

            setShiftDetails({
              startTime: shift.startTime,
              endTime: shift.endTime,
              facilityName: facility?.name,
              stationName: station?.name,
              contactPerson: facility?.contactPerson,
              date: typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as Date),
            });
          }
        } catch (error) {
          logger.error('Failed to load shift details:', error);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [assignment?.shiftId]);

  const getStatusLabel = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'accepted':
        return 'Angenommen';
      case 'declined':
        return 'Abgelehnt';
      case 'completed':
        return 'Abgeschlossen';
      default:
        return 'Unbekannt';
    }
  };

  const _getShiftTypeColor = (type: string) => {
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

  const statusHex = assignmentStatusColors[assignment.status] ?? assignmentStatusColors.pending;

  return (
    <GlassCard hover>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            {/* Einrichtung und Station */}
            {(shiftDetails.facilityName || shiftDetails.stationName) && (
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {shiftDetails.facilityName || 'Einrichtung'}
                {shiftDetails.stationName && ` - ${shiftDetails.stationName}`}
              </Typography>
            )}

            {/* Datum und geplante Arbeitszeiten */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {shiftDetails.date
                  ? format(shiftDetails.date, 'dd.MM.yyyy')
                  : format(assignment.assignedAt, 'dd.MM.yyyy')}{' '}
                • {shiftDetails.startTime || '--:--'} - {shiftDetails.endTime || '--:--'}
              </Typography>
            </Stack>

            {/* Ansprechpartner */}
            {shiftDetails.contactPerson && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Ansprechpartner: {shiftDetails.contactPerson}
                </Typography>
              </Stack>
            )}
          </Box>
          <Chip
            label={getStatusLabel(assignment.status)}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              height: 28,
              backgroundColor: statusHex,
              color: '#fff',
            }}
          />
        </Box>

        {assignment.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {assignment.notes}
          </Typography>
        )}

        {showActions && assignment.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => onAccept(assignment.id)}
              disabled={isLoading}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              Annehmen
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Cancel />}
              onClick={() => onDecline(assignment.id)}
              disabled={isLoading}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                borderWidth: 1.5,
              }}
            >
              Ablehnen
            </Button>
          </Box>
        )}

        {assignment.status === 'accepted' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="body2" color="success.main">
              Angenommen am{' '}
              {format(assignment.acceptedAt || assignment.assignedAt, 'dd.MM.yyyy HH:mm')}
            </Typography>
          </Box>
        )}

        {assignment.status === 'declined' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Cancel sx={{ fontSize: 16, color: 'error.main' }} />
            <Typography variant="body2" color="error.main">
              Abgelehnt am{' '}
              {format(assignment.declinedAt || assignment.assignedAt, 'dd.MM.yyyy HH:mm')}
            </Typography>
          </Box>
        )}
      </Box>
    </GlassCard>
  );
}
