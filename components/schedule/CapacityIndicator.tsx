'use client';

import { Shift } from '@/lib/types';
import { CheckCircle, Error, People, Warning } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';

interface CapacityIndicatorProps {
  shift: Shift;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'bar' | 'chip' | 'card';
}

export function CapacityIndicator({
  shift,
  showDetails = false,
  size = 'medium',
  variant = 'bar',
}: CapacityIndicatorProps) {
  const assigned = shift.assignedCount || 0;
  const capacity = shift.capacity || 1;
  const percentage = Math.round((assigned / capacity) * 100);

  const getCapacityColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 100) return 'success';
    if (percentage >= 80) return 'warning';
    return 'error';
  };

  const getCapacityIcon = (percentage: number) => {
    if (percentage >= 100) return <CheckCircle color="success" />;
    if (percentage >= 80) return <Warning color="warning" />;
    return <Error color="error" />;
  };

  const getCapacityLabel = (percentage: number) => {
    if (percentage >= 100) return 'Voll besetzt';
    if (percentage >= 80) return 'Fast voll';
    if (percentage >= 50) return 'Teilweise besetzt';
    return 'Wenig besetzt';
  };

  const getCapacitySeverity = (percentage: number) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 80) return 'warning';
    return 'error';
  };

  const color = getCapacityColor(percentage);
  const icon = getCapacityIcon(percentage);
  const label = getCapacityLabel(percentage);
  const _severity = getCapacitySeverity(percentage);

  if (variant === 'chip') {
    return (
      <Chip
        icon={icon}
        label={`${assigned}/${capacity}`}
        color={color}
        size={size === 'small' ? 'small' : 'medium'}
        variant="outlined"
      />
    );
  }

  if (variant === 'card') {
    return (
      <Card variant="outlined" sx={{ p: 1, minWidth: 120 }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <People sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight="medium">
              {assigned}/{capacity}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={percentage}
            color={color}
            sx={{
              height: 6,
              borderRadius: 3,
              mb: 0.5,
            }}
          />

          <Typography variant="caption" color="text.secondary">
            {percentage}% belegt
          </Typography>

          {showDetails && (
            <Box sx={{ mt: 1 }}>
              <Chip icon={icon} label={label} color={color} size="small" variant="outlined" />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default bar variant
  return (
    <Box sx={{ minWidth: 100 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <People sx={{ fontSize: size === 'small' ? 14 : 16, color: 'text.secondary' }} />
        <Typography variant={size === 'small' ? 'caption' : 'body2'} fontWeight="medium">
          {assigned}/{capacity}
        </Typography>
        {showDetails && (
          <Chip icon={icon} label={label} color={color} size="small" variant="outlined" />
        )}
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{
          height: size === 'small' ? 4 : 6,
          borderRadius: size === 'small' ? 2 : 3,
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {percentage}% belegt
      </Typography>
    </Box>
  );
}

// Bulk capacity indicator for multiple shifts
interface BulkCapacityIndicatorProps {
  shifts: Shift[];
  showSummary?: boolean;
}

export function BulkCapacityIndicator({ shifts, showSummary = true }: BulkCapacityIndicatorProps) {
  const totalCapacity = shifts.reduce((sum, shift) => sum + (shift.capacity || 1), 0);
  const totalAssigned = shifts.reduce((sum, shift) => sum + (shift.assignedCount || 0), 0);
  const percentage = Math.round((totalAssigned / totalCapacity) * 100);

  const getCapacityColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 100) return 'success';
    if (percentage >= 80) return 'warning';
    return 'error';
  };

  const color = getCapacityColor(percentage);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <People sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="body2" fontWeight="medium">
          Gesamt: {totalAssigned}/{totalCapacity}
        </Typography>
        <Chip label={`${percentage}%`} color={color} size="small" variant="outlined" />
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{ height: 8, borderRadius: '999px' }}
      />

      {showSummary && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${shifts.filter(s => (s.assignedCount || 0) >= (s.capacity || 1)).length} voll`}
            color="success"
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${
              shifts.filter(s => {
                const assigned = s.assignedCount || 0;
                const capacity = s.capacity || 1;
                return assigned > 0 && assigned < capacity;
              }).length
            } teilweise`}
            color="warning"
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${shifts.filter(s => (s.assignedCount || 0) === 0).length} leer`}
            color="error"
            size="small"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
}
