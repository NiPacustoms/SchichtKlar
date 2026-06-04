'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { shiftService, userService } from '@/lib/services';
import { Shift } from '@/lib/types';
import {
  getShiftDisplayStatus,
  getShiftStatusLabel,
  type ShiftDisplayStatus,
} from '@/lib/utils/shiftStatus';
import {
  Delete,
  Edit,
  Info,
  LocationOn,
  MoreVert,
  PersonAdd,
  Schedule,
  School,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';

interface ShiftManagementCardProps {
  shift: Shift;
  onEdit?: (shift: Shift) => void;
  onAssign?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

export function ShiftManagementCard({
  shift,
  onEdit,
  onAssign,
  onDelete,
}: ShiftManagementCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Zugewiesene Mitarbeiter laden
  const { data: assignedUsers = [] } = useQuery({
    queryKey: ['assignedUsers', shift.id],
    queryFn: async () => {
      const userIds = await shiftService.getAssignedUsers(shift.id);
      if (userIds.length === 0) return [];

      const users = await Promise.all(userIds.map(userId => userService.getById(userId)));

      return users.filter(user => user !== null);
    },
  });

  // Verfügbare Plätze berechnen
  const availableSlots = shift.capacity - shift.assignedCount;
  const isFullyAssigned = availableSlots === 0;
  const isOverAssigned = availableSlots < 0;

  // Besetzungsgrad für Progress Bar
  const occupancyRate = (shift.assignedCount / shift.capacity) * 100;

  const getStatusColor = (displayStatus: ShiftDisplayStatus) => {
    switch (displayStatus) {
      case 'open':
        return 'info';
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

  const displayStatus = getShiftDisplayStatus(shift);
  const statusLabel = getShiftStatusLabel(displayStatus);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit?.(shift);
    handleMenuClose();
  };

  const handleAssign = () => {
    onAssign?.(shift);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    onDelete?.(shift);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <GlassCard>
        <CardContent>
          {/* Header mit Status und Actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Schicht
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Schedule sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {format(shift.date, 'dd.MM.yyyy', { locale: de })} • {shift.startTime} -{' '}
                  {shift.endTime}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Station {shift.stationId}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={statusLabel}
                color={getStatusColor(displayStatus) as 'default' | 'info' | 'success' | 'error'}
                size="small"
              />

              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>

          {/* Besetzungsgrad */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Besetzung: {shift.assignedCount}/{shift.capacity}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {availableSlots > 0
                  ? `${availableSlots} frei`
                  : isFullyAssigned
                    ? 'Voll'
                    : 'Überbelegt'}
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={Math.min(occupancyRate, 100)}
              color={isOverAssigned ? 'error' : isFullyAssigned ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Qualifikationen */}
          {shift.requiredQualifications.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Erforderliche Qualifikationen:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {shift.requiredQualifications.map(qualification => (
                  <Chip
                    key={qualification}
                    label={qualification}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Zugewiesene Mitarbeiter */}
          {assignedUsers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Zugewiesene Mitarbeiter:
              </Typography>
              <AvatarGroup max={4}>
                {assignedUsers.map(user => (
                  <Tooltip key={user.id} title={user.displayName}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          )}

          {/* Notizen */}
          {shift.notes && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Info sx={{ fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {shift.notes}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Warnungen */}
          {isOverAssigned && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Überbelegung:</strong> Mehr Mitarbeiter zugewiesen als Kapazität erlaubt.
              </Typography>
            </Alert>
          )}

          {availableSlots > 0 && !isFullyAssigned && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Noch {availableSlots} Plätze frei</strong>
              </Typography>
            </Alert>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              startIcon={<Edit />}
              onClick={handleEdit}
              disabled={shift.status === 'cancelled' || displayStatus === 'ended'}
            >
              Bearbeiten
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={handleAssign}
              disabled={isFullyAssigned}
            >
              {isFullyAssigned ? 'Voll' : 'Zuweisen'}
            </Button>
          </Box>
        </CardContent>
      </GlassCard>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Bearbeiten
        </MenuItem>
        <MenuItem onClick={handleAssign} disabled={isFullyAssigned}>
          <PersonAdd sx={{ mr: 1 }} />
          Zuweisen
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Löschen
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Schicht löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie diese Schicht wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
            werden.
          </Typography>
          {assignedUsers.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Achtung:</strong> Diese Schicht hat {assignedUsers.length} zugewiesene
                Mitarbeiter. Diese Zuweisungen werden ebenfalls entfernt.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
