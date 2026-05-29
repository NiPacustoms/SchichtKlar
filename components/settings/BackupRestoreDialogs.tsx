'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
} from '@mui/material';

interface BackupDialogProps {
  open: boolean;
  onClose: () => void;
  onBackup: () => void;
  isBackingUp: boolean;
}

export function BackupDialog({ open, onClose, onBackup, isBackingUp }: BackupDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Backup erstellen</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Das Backup wird alle Systemdaten, Benutzer, Schichten und Dokumente enthalten.
        </Alert>
        <List>
          <ListItem>
            <ListItemText primary="Backup-Typ" secondary="Vollständig" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Geschätzte Größe" secondary="Ca. 50-100 MB" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Geschätzte Zeit" secondary="Ca. 2-5 Minuten" />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={onBackup} variant="contained" disabled={isBackingUp}>
          {isBackingUp ? 'Backup wird erstellt...' : 'Backup erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface RestoreDialogProps {
  open: boolean;
  onClose: () => void;
  onRestore: (file: File) => void;
  isRestoring: boolean;
}

export function RestoreDialog({ open, onClose, onRestore, isRestoring }: RestoreDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Daten wiederherstellen</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Achtung: Alle aktuellen Daten werden überschrieben!
        </Alert>
        <TextField
          fullWidth
          type="file"
          inputProps={{ accept: '.json' }}
          label="Backup-Datei auswählen"
          sx={{ mb: 3 }}
        />
        <List>
          <ListItem>
            <ListItemText primary="Wiederherstellungs-Typ" secondary="Vollständig" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Geschätzte Zeit" secondary="Ca. 5-10 Minuten" />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          onClick={() => onRestore(new File([], 'backup.json'))}
          variant="contained"
          disabled={isRestoring}
        >
          {isRestoring ? 'Wiederherstellung läuft...' : 'Wiederherstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
