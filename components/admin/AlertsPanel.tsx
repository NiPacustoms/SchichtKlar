'use client';

import Link from 'next/link';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  ChevronRight as ChevronRightIcon,
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
      return <DocumentIcon fontSize="small" />;
    case 'open-shift':
      return <ScheduleIcon fontSize="small" />;
    case 'time-conflict':
      return <WarningIcon fontSize="small" />;
    case 'unverified-timesheet':
      return <CheckIcon fontSize="small" />;
    case 'arbzg-violation':
      return <ErrorIcon fontSize="small" />;
    default:
      return <InfoIcon fontSize="small" />;
  }
}

/** Eine Zeile pro Warnung: getöntes Icon links, Titel + Meldung, Chevron rechts */
function AlertRow({
  alert,
  onAlertClick,
}: {
  alert: DashboardAlert;
  onAlertClick?: (alert: DashboardAlert) => void;
}) {
  const theme = useTheme();
  const semantic = theme.palette[alert.severity];
  const isDark = theme.palette.mode === 'dark';

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={alert.actionUrl}
        onClick={() => onAlertClick?.(alert)}
        sx={{
          borderRadius: 1,
          px: 1.5,
          py: 1,
          minHeight: 56,
        }}
      >
        <ListItemAvatar sx={{ minWidth: 48 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: alpha(semantic.main, isDark ? 0.24 : 0.1),
              color: isDark ? semantic.light : semantic.main,
            }}
          >
            {getTypeIcon(alert.type)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={alert.title}
          secondary={alert.message}
          primaryTypographyProps={{ variant: 'subtitle2', noWrap: true }}
          secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }}
        />
        <ChevronRightIcon sx={{ color: 'text.disabled', ml: 1 }} fontSize="small" />
      </ListItemButton>
    </ListItem>
  );
}

export function AlertsPanel({ alerts, onAlertClick }: AlertsPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const criticalAlerts = alerts.filter(a => a.severity === 'error');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  if (alerts.length === 0) {
    return (
      <GlassCard hover={false}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              backgroundColor: alpha(theme.palette.success.main, isDark ? 0.24 : 0.1),
              color: isDark ? 'success.light' : 'success.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckIcon />
          </Avatar>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Alles in Ordnung
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keine kritischen Warnungen oder ToDos
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  const sections: { key: string; label: string; items: DashboardAlert[]; max: number }[] = [
    { key: 'critical', label: 'Kritisch', items: criticalAlerts, max: 3 },
    { key: 'warning', label: 'Warnungen', items: warningAlerts, max: 3 },
    { key: 'info', label: 'Informationen', items: infoAlerts, max: 2 },
  ];

  return (
    <GlassCard hover={false}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h5" component="h2">
            Warnungen &amp; ToDos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {criticalAlerts.length > 0 && (
              <Chip label={`${criticalAlerts.length} kritisch`} color="error" size="small" />
            )}
            {warningAlerts.length > 0 && (
              <Chip label={`${warningAlerts.length} Warnung`} color="warning" size="small" />
            )}
          </Box>
        </Box>

        {sections
          .filter(section => section.items.length > 0)
          .map(section => (
            <Box key={section.key} sx={{ '& + &': { mt: 2 } }}>
              <Typography
                variant="overline"
                component="h3"
                sx={{ color: 'text.secondary', display: 'block', px: 1.5, mb: 0.5 }}
              >
                {section.label} ({section.items.length})
              </Typography>
              <List disablePadding>
                {section.items.slice(0, section.max).map(alert => (
                  <AlertRow key={alert.id} alert={alert} onAlertClick={onAlertClick} />
                ))}
              </List>
            </Box>
          ))}
      </Box>
    </GlassCard>
  );
}
