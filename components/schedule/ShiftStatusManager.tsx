'use client';

import { logger } from '@/lib/logging';

import { Shift, ShiftStatusChange } from '@/lib/types';
import { Cancel, CheckCircle, Edit, Schedule } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { getShiftDisplayStatus, getShiftStatusLabel, type ShiftDisplayStatus } from '@/lib/utils/shiftStatus';

const getStatusColor = (displayStatus: ShiftDisplayStatus) => {
  switch (displayStatus) {
    case 'open':
      return 'warning';
    case 'filled':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'ended':
      return 'default';
    default:
      return 'default';
  }
};

interface ShiftStatusManagerProps {
  shift: Shift;
  onStatusChange: (statusChange: ShiftStatusChange) => void;
  disabled?: boolean;
  showDetails?: boolean;
}

export function ShiftStatusManager({
  shift,
  onStatusChange,
  disabled = false,
  showDetails = false,
}: ShiftStatusManagerProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Shift['status']>(shift.status);
  const [reason, setReason] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const getStatusIcon = (displayStatus: ShiftDisplayStatus) => {
    switch (displayStatus) {
      case 'open':
        return <Schedule color="warning" />;
      case 'filled':
        return <CheckCircle color="success" />;
      case 'cancelled':
        return <Cancel color="error" />;
      case 'ended':
        return <CheckCircle color="action" />;
      default:
        return <Schedule />;
    }
  };

  const displayStatus = getShiftDisplayStatus(shift);

  const getAvailableStatuses = (currentStatus: Shift['status']): Shift['status'][] => {
    switch (currentStatus) {
      case 'open':
        return ['filled', 'cancelled'];
      case 'filled':
        return ['cancelled'];
      case 'cancelled':
        return ['open']; // Can reopen cancelled shifts
      default:
        return ['open', 'filled', 'cancelled'];
    }
  };

  const getStatusChangeDescription = (from: Shift['status'], to: Shift['status']) => {
    const changes = {
      'open-assigned': 'Schicht als besetzt markieren',
      'open-cancelled': 'Schicht absagen',
      'assigned-done': 'Schicht als abgeschlossen markieren',
      'assigned-cancelled': 'Besetzte Schicht absagen',
      'cancelled-open': 'Abgesagte Schicht wieder öffnen',
    };

    return changes[`${from}-${to}` as keyof typeof changes] || 'Status ändern';
  };

  const handleStatusChange = async () => {
    if (newStatus === shift.status) {
      setStatusDialogOpen(false);
      return;
    }

    setIsChanging(true);

    try {
      const statusChange: ShiftStatusChange = {
        shiftId: shift.id,
        oldStatus: shift.status,
        newStatus,
        reason: reason || undefined,
        changedBy: 'current-user', // Would come from auth context
        changedAt: new Date(),
      };

      await onStatusChange(statusChange);
      setStatusDialogOpen(false);
      setReason('');
    } catch (error) {
      logger.error('Error changing status:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const requiresConfirmation = (newStatus: Shift['status']) => {
    return newStatus === 'cancelled';
  };

  const getConfirmationMessage = (newStatus: Shift['status']) => {
    switch (newStatus) {
      case 'cancelled':
        return 'Möchten Sie diese Schicht wirklich absagen? Alle Zuweisungen werden entfernt.';
      default:
        return '';
    }
  };

  const availableStatuses = getAvailableStatuses(shift.status);

  return (
    <Box>
      {/* Current Status Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          icon={getStatusIcon(displayStatus)}
          label={getShiftStatusLabel(getShiftDisplayStatus(shift))}
          color={
            getStatusColor(displayStatus) as
              | 'default'
              | 'primary'
              | 'secondary'
              | 'error'
              | 'info'
              | 'success'
              | 'warning'
          }
          size="small"
        />

        {!disabled && availableStatuses.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setStatusDialogOpen(true)}
            disabled={isChanging}
          >
            Ändern
          </Button>
        )}
      </Box>

      {/* Status Details */}
      {showDetails && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Besetzung: {shift.assignedCount || 0}/{shift.capacity || 1}
          </Typography>
          {shift.notes && (
            <Typography variant="caption" color="text.secondary" display="block">
              Notizen: {shift.notes}
            </Typography>
          )}
        </Box>
      )}

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schicht-Status ändern</DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Aktueller Status:
            </Typography>
            <Chip
              icon={getStatusIcon(displayStatus)}
              label={getShiftStatusLabel(getShiftDisplayStatus(shift))}
              color={
                getStatusColor(displayStatus) as
                  | 'default'
                  | 'primary'
                  | 'secondary'
                  | 'error'
                  | 'info'
                  | 'success'
                  | 'warning'
              }
            />
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Neuer Status</InputLabel>
            <Select
              value={newStatus}
              label="Neuer Status"
              onChange={e => setNewStatus(e.target.value as Shift['status'])}
            >
              {availableStatuses.map(status => (
                <MenuItem key={status} value={status}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(status as ShiftDisplayStatus)}
                    {getShiftStatusLabel(status as ShiftDisplayStatus)}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {getStatusChangeDescription(shift.status, newStatus)}
          </Typography>

          {requiresConfirmation(newStatus) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">{getConfirmationMessage(newStatus)}</Typography>
            </Alert>
          )}

          <TextField
            fullWidth
            label="Grund (optional)"
            multiline
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Grund für die Statusänderung..."
            helperText="Wird im Audit-Log gespeichert"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={isChanging || newStatus === shift.status}
            color={requiresConfirmation(newStatus) ? 'warning' : 'primary'}
          >
            {isChanging ? 'Ändere...' : 'Status ändern'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Bulk status manager for multiple shifts
interface BulkShiftStatusManagerProps {
  shifts: Shift[];
  onBulkStatusChange: (shiftIds: string[], status: Shift['status'], reason?: string) => void;
  disabled?: boolean;
}

export function BulkShiftStatusManager({
  shifts,
  onBulkStatusChange,
  disabled = false,
}: BulkShiftStatusManagerProps) {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<Shift['status']>('filled');
  const [reason, setReason] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleBulkStatusChange = async () => {
    if (selectedShifts.length === 0) return;

    setIsChanging(true);

    try {
      await onBulkStatusChange(selectedShifts, newStatus, reason);
      setBulkDialogOpen(false);
      setSelectedShifts([]);
      setReason('');
    } catch (error) {
      logger.error('Error changing bulk status:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={() => setBulkDialogOpen(true)}
        disabled={disabled || shifts.length === 0}
        startIcon={<Edit />}
      >
        Mehrere Schichten verwalten
      </Button>

      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Mehrere Schichten verwalten</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {shifts.length} Schichten verfügbar
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Neuer Status</InputLabel>
            <Select
              value={newStatus}
              label="Neuer Status"
              onChange={e => setNewStatus(e.target.value as Shift['status'])}
            >
              <MenuItem value="done">Abgeschlossen</MenuItem>
              <MenuItem value="cancelled">Abgesagt</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Grund (optional)"
            multiline
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Grund für die Statusänderung..."
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleBulkStatusChange}
            variant="contained"
            disabled={isChanging}
            color="warning"
          >
            {isChanging
              ? 'Ändere...'
              : `${shifts.length} Schichten ${getShiftStatusLabel(newStatus as ShiftDisplayStatus).toLowerCase()}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
