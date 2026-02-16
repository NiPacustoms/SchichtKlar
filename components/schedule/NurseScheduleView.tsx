'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from '@/lib/logging';

import { useNurseSchedule } from '@/lib/hooks/useNurseSchedule';
import { CalendarMonth, Schedule } from '@mui/icons-material';
import { Alert, Box, Card, CircularProgress, Grid, Typography } from '@mui/material';
import { useState } from 'react';
import { AcceptShiftDialog } from './AcceptShiftDialog';
import { MyAssignmentCard } from './MyAssignmentCard';

export function NurseScheduleView() {
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string;
    shiftId: string;
    userId: string;
    status: string;
    assignedAt?: Date;
    createdAt?: Date;
  } | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);

  const {
    myAssignments,
    pendingAssignments,
    upcomingAssignments,
    isLoading,
    error,
    acceptAssignment,
    declineAssignment,
    getShiftTypeColor,
    getStatusColor,
    getStatusLabel,
    formatTime,
    getTimeUntilShift,
    checkBreakRule,
  } = useNurseSchedule('week');

  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      await acceptAssignment(assignmentId);
      setAcceptDialogOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      logger.error('Error accepting assignment:', error);
    }
  };

  const handleDeclineAssignment = async (assignmentId: string, reason?: string) => {
    try {
      await declineAssignment(assignmentId, reason);
    } catch (error) {
      logger.error('Error declining assignment:', error);
    }
  };

  const handleOpenAcceptDialog = (assignment: {
    id: string;
    shiftId: string;
    userId: string;
    status: string;
    assignedAt?: Date;
    createdAt?: Date;
  }) => {
    setSelectedAssignment(assignment);
    setAcceptDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Fehler beim Laden der Daten
          </Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="min-height-viewport" sx={{ backgroundColor: 'background.default', pb: 10 }}>
      {/* Page Title */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography
          variant="h4"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CalendarMonth sx={{ color: 'primary.main' }} />
          Mein Dienstplan
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Meine Dienste
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Übersicht deiner geplanten und ausstehenden Schichten
          </Typography>
        </Box>

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Schedule color="warning" />
              Ausstehende Entscheidungen ({pendingAssignments.length})
            </Typography>
            <Grid container spacing={2}>
              {pendingAssignments.map(assignment => (
                <Grid key={assignment.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <MyAssignmentCard
                    assignment={assignment}
                    onAccept={() => handleOpenAcceptDialog(assignment)}
                    onDecline={reason => handleDeclineAssignment(assignment.id, reason)}
                    getShiftTypeColor={getShiftTypeColor as (type?: string) => string}
                    getStatusColor={getStatusColor as (status: string) => string}
                    getStatusLabel={getStatusLabel as (status: string) => string}
                    formatTime={formatTime}
                    getTimeUntilShift={(shift: { date: string | Date; startTime: string }) => {
                      const dateObj =
                        typeof shift.date === 'string' ? new Date(shift.date) : shift.date;
                      return getTimeUntilShift({ ...(shift as any), date: dateObj } as any);
                    }}
                    checkBreakRule={checkBreakRule}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Upcoming Assignments */}
        {upcomingAssignments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Schedule color="primary" />
              Anstehende Dienste ({upcomingAssignments.length})
            </Typography>
            <Grid container spacing={2}>
              {upcomingAssignments.map(assignment => (
                <Grid key={assignment.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <MyAssignmentCard
                    assignment={assignment}
                    onAccept={() => handleOpenAcceptDialog(assignment)}
                    onDecline={reason => handleDeclineAssignment(assignment.id, reason)}
                    getShiftTypeColor={getShiftTypeColor as (type?: string) => string}
                    getStatusColor={getStatusColor as (status: string) => string}
                    getStatusLabel={getStatusLabel as (status: string) => string}
                    formatTime={formatTime}
                    getTimeUntilShift={(shift: { date: string | Date; startTime: string }) => {
                      const dateObj =
                        typeof shift.date === 'string' ? new Date(shift.date) : shift.date;
                      return getTimeUntilShift({ ...(shift as any), date: dateObj } as any);
                    }}
                    checkBreakRule={checkBreakRule}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* All Assignments */}
        {myAssignments.length === 0 && (
          <Card className="glass" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Keine Dienste geplant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Du hast aktuell keine geplanten Schichten.
            </Typography>
          </Card>
        )}
      </Box>

      {/* Accept Dialog */}
      {selectedAssignment && (
        <AcceptShiftDialog
          open={acceptDialogOpen}
          onClose={() => {
            setAcceptDialogOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment as any}
          onAccept={() => handleAcceptAssignment(selectedAssignment.id)}
          getShiftTypeColor={getShiftTypeColor as (type?: string) => string}
          checkBreakRule={checkBreakRule}
        />
      )}
    </Box>
  );
}
