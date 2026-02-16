'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Timesheet } from '@/lib/types';
import { Edit, Visibility } from '@mui/icons-material';
import { Box, Button, Chip, Typography } from '@mui/material';
import { format } from 'date-fns';

interface TimesheetHistoryProps {
  timesheets: Timesheet[];
  onEdit?: (timesheet: Timesheet) => void;
  onView?: (timesheet: Timesheet) => void;
}

export function TimesheetHistory({ timesheets, onEdit, onView }: TimesheetHistoryProps) {
  const getStatusColor = (status: Timesheet['status']) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: Timesheet['status']) => {
    switch (status) {
      case 'draft':
        return 'Entwurf';
      case 'submitted':
        return 'Eingereicht';
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return 'Unbekannt';
    }
  };

  if (timesheets.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine Zeiterfassungen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Erstelle deine erste Zeiterfassung
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Letzte Einträge
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {timesheets.map(timesheet => (
            <Box
              key={timesheet.id}
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
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {format(timesheet.date, 'dd.MM.yyyy')}
                  </Typography>
                  <Chip
                    label={getStatusLabel(timesheet.status)}
                    color={getStatusColor(timesheet.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {timesheet.startTime} - {timesheet.endTime} • {timesheet.totalHours}h
                  {timesheet.breakMinutes > 0 && ` • ${timesheet.breakMinutes}min Pause`}
                </Typography>
                {timesheet.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {timesheet.notes}
                  </Typography>
                )}
                {timesheet.rejectionReason && (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    Grund: {timesheet.rejectionReason}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {onView && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => onView(timesheet)}
                  >
                    Ansehen
                  </Button>
                )}
                {onEdit && timesheet.status === 'draft' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => onEdit(timesheet)}
                  >
                    Bearbeiten
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </GlassCard>
  );
}
