'use client';

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
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Keine Aktivitäten in den letzten 7 Tagen
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {activities.slice(0, 5).map((activity, index) => (
        <Box
          key={`${format(activity.timestamp, 'yyyy-MM-dd-HH-mm')}-${index}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1,
            px: 1.25,
            borderRadius: 1.5,
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'action.selected',
              color: 'text.secondary',
              fontSize: '0.875rem',
            }}
          >
            {getActivityIcon(activity.type)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {activity.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(activity.timestamp, 'dd.MM. HH:mm')}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(activity.status)}
            color={getStatusColor(activity.status)}
            size="small"
            sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 500 }}
          />
        </Box>
      ))}
    </Box>
  );
}
