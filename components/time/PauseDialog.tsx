'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';

interface PauseDialogProps {
  open: boolean;
  onClose: () => void;
  onAddPause: (minutes: number) => void;
}

export function PauseDialog({ open, onClose, onAddPause }: PauseDialogProps) {
  const handleAddPause = (minutes: number) => {
    onAddPause(minutes);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pause hinzufügen</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Wähle die Pausenzeit aus, die du hinzufügen möchtest:
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Button variant="outlined" fullWidth onClick={() => handleAddPause(15)} sx={{ py: 2 }}>
              15 Min
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Button variant="outlined" fullWidth onClick={() => handleAddPause(30)} sx={{ py: 2 }}>
              30 Min
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Button variant="outlined" fullWidth onClick={() => handleAddPause(45)} sx={{ py: 2 }}>
              45 Min
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Button variant="outlined" fullWidth onClick={() => handleAddPause(60)} sx={{ py: 2 }}>
              1 Stunde
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Button variant="outlined" fullWidth onClick={() => handleAddPause(90)} sx={{ py: 2 }}>
              1,5 Stunden
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Button variant="outlined" fullWidth onClick={() => handleAddPause(120)} sx={{ py: 2 }}>
              2 Stunden
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
      </DialogActions>
    </Dialog>
  );
}
