'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
} from '@mui/material';
import { Assignment, CheckCircle } from '@mui/icons-material';
import { InlineSpinner } from '@/components/ui/LoadingSpinner';
import type { Facility } from '@/lib/types/facility';

interface ActiveAssignment {
  assignment: { id: string };
  shift: { startTime: string; endTime: string; notes?: string };
  facility: Facility | null;
}

interface AssignmentSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  assignments: ActiveAssignment[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  isStarting: boolean;
}

export function AssignmentSelectionDialog({
  open,
  onClose,
  assignments,
  selectedId,
  onSelect,
  onConfirm,
  isStarting,
}: AssignmentSelectionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment />
          Auftrag auswählen
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bitte wählen Sie den Auftrag aus, für den Sie die Schicht starten möchten:
        </Typography>
        <RadioGroup value={selectedId} onChange={e => onSelect(e.target.value)}>
          {assignments.map(({ assignment, shift, facility }) => (
            <FormControlLabel
              key={assignment.id}
              value={assignment.id}
              control={<Radio />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {facility?.name || 'Unbekannte Einrichtung'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {shift.startTime} - {shift.endTime}
                  </Typography>
                  {shift.notes && (
                    <Typography variant="caption" color="text.secondary">
                      {shift.notes}
                    </Typography>
                  )}
                </Box>
              }
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                mb: 1,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!selectedId || isStarting}
          startIcon={isStarting ? <InlineSpinner size={20} /> : <CheckCircle />}
        >
          Schicht starten
        </Button>
      </DialogActions>
    </Dialog>
  );
}
