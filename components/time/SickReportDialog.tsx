'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Alert,
  Box,
} from '@mui/material';
import { Sick, CheckCircle } from '@mui/icons-material';

interface SickFormData {
  startDate: string;
  endDate: string;
  reason: string;
  doctorNote: string;
}

interface SickReportDialogProps {
  open: boolean;
  onClose: () => void;
  formData: SickFormData;
  onChange: (data: SickFormData) => void;
  onSubmit: () => void;
}

export function SickReportDialog({ open, onClose, formData, onChange, onSubmit }: SickReportDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const isEndBeforeStart = formData.endDate < formData.startDate;
  const isSubmitDisabled = !formData.reason.trim() || !formData.startDate || !formData.endDate || isEndBeforeStart;

  const handleClose = () => {
    onClose();
    onChange({ startDate: today, endDate: today, reason: '', doctorNote: '' });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sick />
          Krankmeldung
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Bitte melden Sie sich krank, sobald Sie wissen, dass Sie nicht zur Arbeit kommen können.
        </Alert>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Von"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={e => onChange({ ...formData, startDate: e.target.value })}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Bis"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={e => onChange({ ...formData, endDate: e.target.value })}
              required
              error={isEndBeforeStart}
              helperText={isEndBeforeStart ? 'Enddatum muss nach Startdatum liegen' : ''}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Grund"
              multiline
              rows={3}
              placeholder="Beschreibung der Krankheit oder Symptome..."
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
              label="Arztbesuch (optional)"
              placeholder="Name des Arztes oder Praxis..."
              value={formData.doctorNote}
              onChange={e => onChange({ ...formData, doctorNote: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={isSubmitDisabled}
          startIcon={<CheckCircle />}
        >
          Krankmeldung absenden
        </Button>
      </DialogActions>
    </Dialog>
  );
}
