'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material';

interface ConfirmDestructiveDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmWord?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDestructiveDialog({
  open,
  title = 'Aktion bestätigen',
  description = 'Diese Aktion ist irreversibel. Bitte bestätigen Sie, um fortzufahren.',
  confirmWord = 'LÖSCHEN',
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  onClose,
  onConfirm,
}: ConfirmDestructiveDialogProps) {
  const [input, setInput] = useState('');
  const isMatch = input.trim().toUpperCase() === confirmWord.toUpperCase();

  useEffect(() => {
    if (!open) setInput('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle variant="h4" component="h2" sx={{ pb: 2 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
          Zum Bestätigen tippen Sie bitte <strong>{confirmWord}</strong> ein.
        </Typography>
        <TextField
          fullWidth
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={confirmWord}
          inputProps={{ 'aria-label': 'Bestätigungswort' }}
          error={input.length > 0 && !isMatch}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button variant="text" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={!isMatch}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDestructiveDialog;
