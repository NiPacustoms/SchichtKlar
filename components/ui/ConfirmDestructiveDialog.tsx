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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '20px', pb: 2 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, fontSize: '15px', lineHeight: 1.6 }}
        >
          {description}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, fontSize: '14px' }}>
          Zum Bestätigen tippen Sie bitte <strong>{confirmWord}</strong> ein.
        </Typography>
        <TextField
          fullWidth
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={confirmWord}
          inputProps={{ 'aria-label': 'Bestätigungswort' }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
          error={input.length > 0 && !isMatch}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={!isMatch}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDestructiveDialog;
