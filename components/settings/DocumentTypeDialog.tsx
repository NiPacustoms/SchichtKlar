'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import type { DocumentType } from '@/lib/hooks/useAdminSettings';

interface DocumentTypeDialogProps {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  onSubmitCreate: (data: Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSubmitUpdate: (data: Partial<DocumentType>) => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export function DocumentTypeDialog({
  open,
  onClose,
  isEditing,
  onSubmitCreate,
  onSubmitUpdate,
  isCreating,
  isUpdating,
}: DocumentTypeDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Dokumenttyp bearbeiten' : 'Neuen Dokumenttyp erstellen'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Name"
              placeholder="z.B. Führerschein, Gesundheitszeugnis"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select label="Kategorie">
                <MenuItem value="personal">Persönlich</MenuItem>
                <MenuItem value="professional">Beruflich</MenuItem>
                <MenuItem value="legal">Rechtlich</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Gültigkeitsdauer (Tage)"
              type="number"
              placeholder="365"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel control={<Switch />} label="Pflichtdokument" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          onClick={() =>
            isEditing
              ? onSubmitUpdate({ name: 'Updated Document Type', category: 'professional' })
              : onSubmitCreate({
                  name: 'Test Document Type',
                  category: 'professional',
                  validityPeriod: 365,
                  required: false,
                  status: 'active',
                })
          }
          variant="contained"
          disabled={isCreating || isUpdating}
        >
          {isCreating || isUpdating ? 'Speichere...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
