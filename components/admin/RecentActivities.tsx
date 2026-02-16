'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { AccessTime, Assignment as AssignmentIcon, Description } from '@mui/icons-material';
import { Avatar, Box, Chip, Typography } from '@mui/material';
import { format } from 'date-fns';

interface RecentActivitiesProps {
  activities: Array<{
    type: string;
    message: string;
    timestamp: Date;
    status: string;
  }>;
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'timesheet':
        return <AccessTime />;
      case 'assignment':
        return <AssignmentIcon />;
      case 'document':
        return <Description />;
      default:
        return <AccessTime />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Eingereicht';
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      case 'pending':
        return 'Ausstehend';
      case 'accepted':
        return 'Angenommen';
      case 'declined':
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  if (activities.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine Aktivitäten
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keine neuen Aktivitäten in den letzten 7 Tagen
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  // #region agent log
  const slice = activities.slice(0, 5);
  const keys = slice.map((a, i) => `${format(a.timestamp, 'yyyy-MM-dd-HH-mm')}-${i}`);
  fetch('http://127.0.0.1:7243/ingest/772533d7-e058-439e-a00a-1be099111014', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'RecentActivities.tsx',
      message: 'RecentActivities list keys',
      data: { count: slice.length, keys, firstTs: slice[0]?.timestamp?.toString() },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      hypothesisId: 'H3',
    }),
  }).catch(() => {});
  // #endregion
  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Letzte Aktivitäten
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activities.slice(0, 5).map((activity, index) => (
            <Box
              key={`${format(activity.timestamp, 'yyyy-MM-dd-HH-mm')}-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(0, 95, 115, 0.04)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #005f73 0%, #0a9396 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0, 95, 115, 0.3)',
                }}
              >
                {getActivityIcon(activity.type)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {activity.message}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(activity.timestamp, 'dd.MM.yyyy HH:mm')}
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(activity.status)}
                color={getStatusColor(activity.status)}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '12px',
                  height: 28,
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </GlassCard>
  );
}
