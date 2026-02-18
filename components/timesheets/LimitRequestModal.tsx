'use client';

import { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestLimitIncrease, hasPendingLimitRequest } from '@/lib/services/timesheets/requestLimitIncrease';
import type { WeeklyLimit } from '@/lib/types/weeklyLimit';
import { useEffect } from 'react';

const MIN_HOURS = 20;
const MAX_HOURS = 80;

const schema = z.object({
  requestedLimit: z
    .number({ message: 'Zahl zwischen 20 und 80 eingeben' })
    .min(MIN_HOURS, `Mindestens ${MIN_HOURS}h`)
    .max(MAX_HOURS, `Maximal ${MAX_HOURS}h`),
  reason: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export interface LimitRequestModalProps {
  open: boolean;
  onClose: () => void;
  limit: WeeklyLimit | null;
  mitarbeiterId: string;
  onSuccess?: () => void;
}

export function LimitRequestModal({ open, onClose, limit, mitarbeiterId, onSuccess }: LimitRequestModalProps) {
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { requestedLimit: (limit?.wochenstundenLimit ?? 48) + 4, reason: '' },
  });

  useEffect(() => {
    if (open && limit) {
      reset({ requestedLimit: Math.min(MAX_HOURS, limit.wochenstundenLimit + 4), reason: '' });
    }
  }, [open, limit, reset]);

  useEffect(() => {
    if (!open || !mitarbeiterId) return;
    hasPendingLimitRequest(mitarbeiterId).then(setPending);
  }, [open, mitarbeiterId]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await requestLimitIncrease(mitarbeiterId, data.requestedLimit, data.reason);
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Genehmigung Wochenlimit-Erhöhung</DialogTitle>
      <DialogContent>
        {pending ? (
          <Typography color="text.secondary">
            Sie haben bereits einen offenen Antrag. Bitte warten Sie auf die Bearbeitung durch den Admin.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Aktuelles Limit: {limit?.wochenstundenLimit ?? '—'}h. Gewünschtes neues Limit angeben (20–80h).
            </Typography>
            <Box component="form" id="limit-request-form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                {...register('requestedLimit', { valueAsNumber: true })}
                type="number"
                label="Gewünschtes Limit (Stunden)"
                inputProps={{ min: MIN_HOURS, max: MAX_HOURS, step: 1 }}
                error={!!errors.requestedLimit}
                helperText={errors.requestedLimit?.message}
                fullWidth
              />
              <TextField
                {...register('reason')}
                label="Begründung (optional)"
                multiline
                rows={2}
                fullWidth
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        {!pending && (
          <Button
            type="submit"
            form="limit-request-form"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting ? 'Wird gesendet…' : 'Antrag senden'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
