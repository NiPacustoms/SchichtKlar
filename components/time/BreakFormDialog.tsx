'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Box,
} from '@mui/material';
import { Pause, CheckCircle } from '@mui/icons-material';
import { InlineSpinner } from '@/components/ui/LoadingSpinner';

interface BreakFormData {
  reason: string;
  duration: number;
}

interface BreakFormDialogProps {
  open: boolean;
  onClose: () => void;
  formData: BreakFormData;
  onChange: (data: BreakFormData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function BreakFormDialog({ open, onClose, formData, onChange, onSubmit, isSubmitting }: BreakFormDialogProps) {
  const handleClose = () => {
    onClose();
    onChange({ reason: '', duration: 30 });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Pause />
          Pause hinzufügen
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Grund"
              placeholder="z.B. Mittagspause, Kaffeepause..."
              value={formData.reason}
              onChange={e => onChange({ ...formData, reason: e.target.value })}
              required
              error={!formData.reason.trim()}
              helperText={!formData.reason.trim() ? 'Bitte geben Sie einen Grund an' : ''}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Dauer (Minuten)"
              type="number"
              placeholder="30"
              value={formData.duration}
              onChange={e => onChange({ ...formData, duration: parseInt(e.target.value) || 30 })}
              inputProps={{ min: 1, max: 480 }}
              helperText="Empfohlene Pausen: 15 min (kurz), 30 min (Mittag), 45 min (längere Pause)"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={!formData.reason.trim() || isSubmitting}
          startIcon={isSubmitting ? <InlineSpinner size={20} /> : <CheckCircle />}
        >
          Pause hinzufügen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
