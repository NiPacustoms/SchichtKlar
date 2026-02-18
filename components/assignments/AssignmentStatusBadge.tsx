'use client';

import React from 'react';
import { Chip } from '@mui/material';
import {
  Schedule,
  CheckCircle,
  Person,
  Cancel,
  Done,
  Block,
  Edit,
  HelpOutline,
} from '@mui/icons-material';

const STATUS_MUI_COLORS: Record<
  string,
  'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
> = {
  pending: 'warning',
  published: 'warning',
  accepted: 'success',
  assigned: 'success',
  declined: 'error',
  completed: 'info',
  done: 'info',
  cancelled: 'default',
  'pending-signature': 'default',
  requested: 'warning',
  secured: 'success',
  besichert: 'success',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ausstehend',
  published: 'Ausstehend',
  accepted: 'Angenommen',
  assigned: 'Zugewiesen',
  declined: 'Abgelehnt',
  completed: 'Abgeschlossen',
  done: 'Erledigt',
  cancelled: 'Storniert',
  'pending-signature': 'Unterschrift ausstehend',
  requested: 'Angefragt',
  secured: 'Besetzt',
  besichert: 'Besetzt',
};

const STATUS_ICONS: Record<string, React.ReactElement> = {
  pending: <Schedule fontSize="small" />,
  published: <Schedule fontSize="small" />,
  requested: <Schedule fontSize="small" />,
  accepted: <CheckCircle fontSize="small" />,
  secured: <CheckCircle fontSize="small" />,
  besichert: <CheckCircle fontSize="small" />,
  assigned: <Person fontSize="small" />,
  declined: <Cancel fontSize="small" />,
  completed: <Done fontSize="small" />,
  done: <Done fontSize="small" />,
  cancelled: <Block fontSize="small" />,
  'pending-signature': <Edit fontSize="small" />,
};

interface AssignmentStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export function AssignmentStatusBadge({ status, size = 'small' }: AssignmentStatusBadgeProps) {
  const normalized = status?.toLowerCase() ?? '';
  const muiColor = STATUS_MUI_COLORS[normalized] ?? STATUS_MUI_COLORS[status] ?? 'default';
  const displayLabel =
    STATUS_LABELS[normalized] ??
    STATUS_LABELS[status] ??
    (status && String(status).trim() ? status : 'Unbekannt');
  const iconNode = STATUS_ICONS[normalized] ?? STATUS_ICONS[status] ?? <HelpOutline fontSize="small" />;
  const icon = React.isValidElement(iconNode) ? iconNode : <HelpOutline fontSize="small" />;
  return (
    <Chip
      icon={icon}
      label={displayLabel}
      color={muiColor}
      size={size}
      aria-label={`Status: ${displayLabel}`}
      sx={{
        fontWeight: 500,
        fontSize: '11px',
        lineHeight: '14px',
      }}
    />
  );
}
