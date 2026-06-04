'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';

interface SystemSettings {
  systemName: string;
  timezone: string;
  language: string;
  currency: string;
}

interface SettingsEditDialogProps {
  open: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSubmit: (data: Partial<SystemSettings>) => void;
  isUpdating: boolean;
}

export function SettingsEditDialog({
  open,
  onClose,
  settings,
  onSubmit,
  isUpdating,
}: SettingsEditDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Einstellungen bearbeiten</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="System-Name" defaultValue={settings.systemName} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Zeitzone</InputLabel>
              <Select label="Zeitzone" defaultValue={settings.timezone}>
                <MenuItem value="Europe/Berlin">Europa/Berlin</MenuItem>
                <MenuItem value="Europe/London">Europa/London</MenuItem>
                <MenuItem value="America/New_York">Amerika/New_York</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Sprache</InputLabel>
              <Select label="Sprache" defaultValue={settings.language}>
                <MenuItem value="de">Deutsch</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Währung</InputLabel>
              <Select label="Währung" defaultValue={settings.currency}>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={() => onSubmit({})} variant="contained" disabled={isUpdating}>
          {isUpdating ? 'Speichere...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
