'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Assignment } from '@/lib/types';
import { Cancel, CheckCircle } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface UpcomingAssignmentsProps {
  assignments: Assignment[];
  onAccept: (assignmentId: string) => void;
  onDecline: (assignmentId: string) => void;
  isLoading?: boolean;
}

export function UpcomingAssignments({
  assignments,
  onAccept,
  onDecline,
  isLoading = false,
}: UpcomingAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine anstehenden Dienste
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Alle deine Dienste sind bereits bestätigt
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Nächste Dienste
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {assignments.map(assignment => (
            <Box
              key={assignment.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {assignment.shiftId ? `Schicht ${assignment.shiftId}` : 'Schicht'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zugewiesen am{' '}
                  {format(
                    assignment.assignedAt instanceof Date
                      ? assignment.assignedAt
                      : new Date(assignment.assignedAt),
                    'dd.MM.yyyy HH:mm',
                    { locale: de }
                  )}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={() => onAccept(assignment.id)}
                  disabled={isLoading}
                >
                  Annehmen
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Cancel />}
                  onClick={() => onDecline(assignment.id)}
                  disabled={isLoading}
                >
                  Ablehnen
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </GlassCard>
  );
}
