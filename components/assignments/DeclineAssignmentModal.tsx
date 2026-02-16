'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { SignatureDialog } from '@/components/ui/SignatureDialog';

export const DECLINE_REASONS: Record<string, string> = {
  not_available: 'Nicht verfügbar',
  other_assignment: 'Anderer Einsatz',
  too_far: 'Zu weit',
};

interface DeclineAssignmentModalProps {
  open: boolean;
  assignmentId: string;
  onClose: () => void;
  onConfirm: (assignmentId: string, reason: string, signatureDataUrl: string) => Promise<void>;
}

export function DeclineAssignmentModal({
  open,
  assignmentId,
  onClose,
  onConfirm,
}: DeclineAssignmentModalProps) {
  const [reason, setReason] = useState<string>('');
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDeclineClick = () => {
    if (!reason) return;
    setSignatureOpen(true);
  };

  const handleSignatureSave = async (dataUrl: string) => {
    setSubmitting(true);
    try {
      await onConfirm(assignmentId, reason, dataUrl);
      setReason('');
      setSignatureOpen(false);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
      setSignatureOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Ablehnung bestätigen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bitte wähle einen Grund und bestätige mit deiner Unterschrift.
          </Typography>
          <FormControl fullWidth required sx={{ mt: 1 }}>
            <InputLabel>Grund</InputLabel>
            <Select value={reason} onChange={e => setReason(e.target.value)} label="Grund">
              {Object.entries(DECLINE_REASONS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeclineClick}
            disabled={!reason || submitting}
          >
            Weiter zur Unterschrift
          </Button>
        </DialogActions>
      </Dialog>

      <SignatureDialog
        open={signatureOpen}
        title="Unterschrift zur Ablehnung"
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        requireName={false}
      />
    </>
  );
}
