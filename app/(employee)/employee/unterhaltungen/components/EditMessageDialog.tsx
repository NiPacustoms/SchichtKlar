'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';

interface EditMessageDialogProps {
  open: boolean;
  initialContent: string;
  onClose: () => void;
  onSave: (newContent: string) => void;
  isLoading?: boolean;
}

export default function EditMessageDialog({
  open,
  initialContent,
  onClose,
  onSave,
  isLoading = false,
}: EditMessageDialogProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
      }}
    >
      <DialogTitle>Nachricht bearbeiten</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nachricht bearbeiten..."
          variant="outlined"
          sx={{
            mt: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.8)',
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isLoading} color="inherit">
          Abbrechen
        </Button>
        <Button
          onClick={handleSave}
          disabled={!content.trim() || isLoading}
          variant="contained"
          sx={{
            bgcolor: '#005f73',
            '&:hover': {
              bgcolor: '#004d5a',
            },
          }}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
