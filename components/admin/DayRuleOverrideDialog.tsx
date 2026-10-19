'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { DAY_RULE_MIN_REASON_LENGTH, DayRuleConflictError, isValidOverrideReason } from '@/lib/domain/dayRule';
import { cloudFunctions } from '@/lib/services/cloudFunctions';

interface DayRuleOverrideDialogProps {
  open: boolean;
  personName?: string;
  message: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Fragt beim Admin eine Begründung ab, um die Regel „1 Einsatz pro Tag"
 * bewusst zu übersteuern (z. B. geteilter Dienst). Die Begründung wird am
 * Einsatz und im Audit-Log gespeichert.
 */
export function DayRuleOverrideDialog({ open, personName, message, onCancel, onConfirm }: DayRuleOverrideDialogProps) {
  const [reason, setReason] = useState('');
  const valid = isValidOverrideReason(reason);

  const close = () => {
    setReason('');
    onCancel();
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle variant="h4" component="h2" sx={{ pb: 2 }}>
        Zweiter Einsatz am selben Tag
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {personName ? <strong>{personName}: </strong> : null}
          {message}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Grundsätzlich gilt ein Einsatz pro Tag. Wenn es trotzdem passt (z. B. geteilter Dienst, mit der
          Einrichtung abgestimmt), begründen Sie das bitte. Die Begründung wird dokumentiert.
        </Typography>
        <TextField
          fullWidth
          autoFocus
          multiline
          minRows={2}
          label="Begründung"
          value={reason}
          onChange={e => setReason(e.target.value)}
          helperText={valid ? ' ' : `Mindestens ${DAY_RULE_MIN_REASON_LENGTH} Zeichen`}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button variant="text" onClick={close}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          disabled={!valid}
          onClick={() => {
            const r = reason.trim();
            setReason('');
            onConfirm(r);
          }}
        >
          Trotzdem zuweisen
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Fehler, wenn der Admin die Übersteuerung abbricht – wird nicht als Fehler-Toast angezeigt. */
export class DayRuleOverrideCancelledError extends Error {
  constructor() {
    super('Zuweisung abgebrochen');
    this.name = 'DayRuleOverrideCancelledError';
  }
}

/**
 * Promise-basierter Dialog: `await requestReason(...)` liefert die Begründung
 * oder wirft DayRuleOverrideCancelledError. `dialog` muss gerendert werden.
 */
export function useDayRuleOverridePrompt() {
  const [state, setState] = useState<{ open: boolean; message: string; personName?: string }>({
    open: false,
    message: '',
  });
  const resolver = useRef<{ resolve: (r: string) => void; reject: (e: Error) => void } | null>(null);

  const requestReason = useCallback((message: string, personName?: string) => {
    setState({ open: true, message, personName });
    return new Promise<string>((resolve, reject) => {
      resolver.current = { resolve, reject };
    });
  }, []);

  const dialog = (
    <DayRuleOverrideDialog
      open={state.open}
      message={state.message}
      personName={state.personName}
      onCancel={() => {
        setState(s => ({ ...s, open: false }));
        resolver.current?.reject(new DayRuleOverrideCancelledError());
        resolver.current = null;
      }}
      onConfirm={reason => {
        setState(s => ({ ...s, open: false }));
        resolver.current?.resolve(reason);
        resolver.current = null;
      }}
    />
  );

  return { requestReason, dialog };
}

export default DayRuleOverrideDialog;

/** Kein automatisches Wiederholen bei Tagesregel-Konflikten oder Abbruch durch den Admin. */
export function shouldRetryAssignment(failureCount: number, error: unknown): boolean {
  if (error instanceof DayRuleOverrideCancelledError || error instanceof DayRuleConflictError) return false;
  return failureCount < 2;
}

/**
 * Weist zu; bei Tagesregel-Konflikt fragt der Dialog nach einer Begründung und
 * wiederholt die Zuweisung mit dokumentierter Übersteuerung.
 */
export async function assignWithDayRulePrompt(
  shiftId: string,
  user: { id: string; displayName?: string | null },
  requestReason: (message: string, personName?: string) => Promise<string>
) {
  try {
    return await cloudFunctions.assignShiftToUser(shiftId, user.id, false, true);
  } catch (error) {
    if (!(error instanceof DayRuleConflictError)) throw error;
    const reason = await requestReason(error.message, user.displayName ?? undefined);
    return await cloudFunctions.assignShiftToUser(shiftId, user.id, false, true, reason);
  }
}
