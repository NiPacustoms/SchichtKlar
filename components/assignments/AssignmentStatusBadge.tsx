'use client';

import { Chip } from '@mui/material';

const STATUS_COLORS: Record<
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
  secured: 'Angenommen', // API-Fallback: nicht „Besichert“ anzeigen
  besichert: 'Angenommen',
};

interface AssignmentStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export function AssignmentStatusBadge({ status, size = 'small' }: AssignmentStatusBadgeProps) {
  const color = STATUS_COLORS[status?.toLowerCase()] ?? STATUS_COLORS[status] ?? 'default';
  const label =
    STATUS_LABELS[status?.toLowerCase()] ??
    STATUS_LABELS[status] ??
    (status && status !== 'Besichert' ? status : 'Unbekannt');
  // „Besichert“ nie anzeigen, stattdessen „Angenommen“
  const displayLabel = label === 'Besichert' || label === 'besichert' ? 'Angenommen' : label;
  return <Chip label={displayLabel} color={color} size={size} />;
}
