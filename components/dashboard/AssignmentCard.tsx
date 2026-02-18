'use client';

import { logger } from '@/lib/logging';

import { GlassCard } from '@/components/ui/GlassCard';
import { PauseDialog } from '@/components/time/PauseDialog';
import { Assignment, Timesheet } from '@/lib/types';
import { Pause, PlayArrow, Stop, AccessTime, LocationOn, Person } from '@mui/icons-material';
import { Box, Button, Chip, Typography, Stack, Divider } from '@mui/material';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { shiftService } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';

interface AssignmentCardProps {
  assignment?: Assignment | null;
  timesheet?: Timesheet | null;
  onStartWork: () => void;
  onPauseWork: (duration: number, reason?: string) => void;
  onEndWork: () => void;
  isLoading?: boolean;
}

export function AssignmentCard({
  assignment,
  timesheet,
  onStartWork,
  onPauseWork,
  onEndWork,
  isLoading = false,
}: AssignmentCardProps) {
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [shiftDetails, setShiftDetails] = useState<{
    startTime?: string;
    endTime?: string;
    facilityName?: string;
    stationName?: string;
    contactPerson?: string;
  }>({});

  const isWorking = timesheet?.status === 'draft' || timesheet?.status === 'submitted';
  const isOnBreak = false; // This would need to be tracked separately

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

  const handlePauseClick = () => {
    setShowPauseDialog(true);
  };

  const handleAddPause = (minutes: number) => {
    onPauseWork(minutes, 'Pause');
    setShowPauseDialog(false);
  };

  if (!assignment) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Kein geplanter Dienst heute
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Schau im Dienstplan nach verfügbaren Schichten
          </Typography>
          <Button variant="outlined" component={Link} href="/employee/dienstplan">
            Zum Dienstplan
          </Button>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Heutiger Einsatz
            </Typography>

            {/* Einrichtung und Station */}
            {(shiftDetails.facilityName || shiftDetails.stationName) && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {shiftDetails.facilityName || 'Einrichtung'}
                  {shiftDetails.stationName && ` - ${shiftDetails.stationName}`}
                </Typography>
              </Stack>
            )}

            {/* Geplante Arbeitszeiten */}
            {(shiftDetails.startTime || shiftDetails.endTime) && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {shiftDetails.startTime || '--:--'} - {shiftDetails.endTime || '--:--'}
                </Typography>
              </Stack>
            )}

            {/* Ansprechpartner */}
            {shiftDetails.contactPerson && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Ansprechpartner: {shiftDetails.contactPerson}
                </Typography>
              </Stack>
            )}
          </Box>
          <Chip
            label={isWorking ? (isOnBreak ? 'Pause' : 'Im Dienst') : 'Bereit'}
            color={isWorking ? (isOnBreak ? 'warning' : 'success') : 'default'}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {!isWorking ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={onStartWork}
              disabled={isLoading}
              sx={{ width: '100%' }}
            >
              Dienst starten
            </Button>
          ) : (
            <>
              {!isOnBreak ? (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Pause />}
                  onClick={handlePauseClick}
                  disabled={isLoading}
                  sx={{ width: '100%' }}
                >
                  Pause hinzufügen
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={() => onPauseWork(0, 'Pause beendet')}
                  disabled={isLoading}
                  sx={{ width: '100%' }}
                >
                  Pause beenden
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<Stop />}
                onClick={onEndWork}
                disabled={isLoading}
                sx={{ width: '100%' }}
              >
                Dienst beenden
              </Button>
            </>
          )}
        </Box>
      </Box>

      <PauseDialog
        open={showPauseDialog}
        onClose={() => setShowPauseDialog(false)}
        onAddPause={handleAddPause}
      />
    </GlassCard>
  );
}
