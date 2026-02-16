'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Description as DocumentIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { GlassCard } from '@/components/ui/GlassCard';

export interface DashboardAlert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  type: 'document-expiry' | 'open-shift' | 'time-conflict' | 'unverified-timesheet' | string;
  title: string;
  message: string;
  actionUrl: string;
  createdAt?: Date | string;
}

interface AlertsPanelProps {
  alerts: DashboardAlert[];
  onAlertClick?: (alert: DashboardAlert) => void;
}

function getTypeIcon(type: DashboardAlert['type']) {
  switch (type) {
    case 'document-expiry':
      return <DocumentIcon />;
    case 'open-shift':
      return <ScheduleIcon />;
    case 'time-conflict':
      return <WarningIcon />;
    case 'unverified-timesheet':
      return <CheckIcon />;
    case 'arbzg-violation':
      return <ErrorIcon />;
    default:
      return <InfoIcon />;
  }
}

export function AlertsPanel({ alerts, onAlertClick }: AlertsPanelProps) {
  const criticalAlerts = alerts.filter(a => a.severity === 'error');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  if (alerts.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckIcon sx={{ fontSize: 32, color: 'success.main' }} />
          </Box>
          <Typography variant="h6" color="success.main" sx={{ mb: 1, fontWeight: 600 }}>
            Alles in Ordnung
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
            Keine kritischen Warnungen oder ToDos
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
            Warnungen & ToDos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {criticalAlerts.length > 0 && (
              <Chip
                icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                label={`${criticalAlerts.length} kritisch`}
                color="error"
                size="small"
              />
            )}
            {warningAlerts.length > 0 && (
              <Chip
                icon={<WarningIcon sx={{ fontSize: 16 }} />}
                label={`${warningAlerts.length} Warnung`}
                color="warning"
                size="small"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {criticalAlerts.length > 0 && (
            <Fragment key="alerts-critical">
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'error.main',
                }}
              >
                <AlertTitle sx={{ fontWeight: 700, fontSize: '15px' }}>
                  Kritische Probleme ({criticalAlerts.length})
                </AlertTitle>
                <List dense>
                  {criticalAlerts.slice(0, 3).map(alert => (
                    <ListItem key={alert.id} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={alert.actionUrl}
                        onClick={() => onAlertClick?.(alert)}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>{getTypeIcon(alert.type)}</ListItemIcon>
                        <ListItemText primary={alert.title} secondary={alert.message} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Alert>
            </Fragment>
          )}

          {warningAlerts.length > 0 && (
            <Fragment key="alerts-warning">
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Warnungen ({warningAlerts.length})</AlertTitle>
                <List dense>
                  {warningAlerts.slice(0, 3).map(alert => (
                    <ListItem key={alert.id} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={alert.actionUrl}
                        onClick={() => onAlertClick?.(alert)}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>{getTypeIcon(alert.type)}</ListItemIcon>
                        <ListItemText primary={alert.title} secondary={alert.message} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Alert>
            </Fragment>
          )}

          {infoAlerts.length > 0 && (
            <Fragment key="alerts-info">
              <Alert severity="info">
                <AlertTitle>Informationen ({infoAlerts.length})</AlertTitle>
                <List dense>
                  {infoAlerts.slice(0, 2).map(alert => (
                    <ListItem key={alert.id} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={alert.actionUrl}
                        onClick={() => onAlertClick?.(alert)}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>{getTypeIcon(alert.type)}</ListItemIcon>
                        <ListItemText primary={alert.title} secondary={alert.message} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Alert>
            </Fragment>
          )}
        </Box>
      </Box>
    </GlassCard>
  );
}
