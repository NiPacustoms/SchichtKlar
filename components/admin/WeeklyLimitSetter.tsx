'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useWeeklyLimit } from '@/lib/hooks/useWeeklyLimit';
import { toast } from '@/lib/utils/toast';
import type { User } from '@/lib/types';

const weeklyLimitSchema = z.object({
  limit: z
    .number()
    .min(20, 'Mindestens 20h')
    .max(80, 'Maximal 80h'),
});

type WeeklyLimitFormData = z.infer<typeof weeklyLimitSchema>;

export interface WeeklyLimitSetterProps {
  employee: Pick<User, 'id' | 'displayName' | 'wochenstundenLimit' | 'aktuelleWochenstunden' | 'limitStatus'>;
  /** Kompakt: nur Input + Button, ohne Card (z. B. im Dialog) */
  compact?: boolean;
}

export function WeeklyLimitSetter({ employee, compact = false }: WeeklyLimitSetterProps) {
  const { data, setLimit, isSettingLimit } = useWeeklyLimit(employee.id);

  const currentLimit = data?.wochenstundenLimit ?? employee.wochenstundenLimit ?? 48;
  const currentHours = data?.aktuelleWochenstunden ?? employee.aktuelleWochenstunden ?? 0;
  const status = data?.status ?? employee.limitStatus ?? 'normal';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue: _setValue,
  } = useForm<WeeklyLimitFormData>({
    resolver: zodResolver(weeklyLimitSchema),
    defaultValues: { limit: currentLimit || 48 },
  });

  const onSubmit = async (formData: WeeklyLimitFormData) => {
    try {
      await setLimit({ mitarbeiterId: employee.id, limit: formData.limit });
      toast.success('Wochenstunden-Limit gespeichert.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Limit konnte nicht gespeichert werden.');
    }
  };

  const statusLabel =
    status === 'blocked'
      ? 'Überschritten'
      : status === 'warning'
        ? 'Warnung (≥90 %)'
        : 'Normal';
  const statusColor =
    status === 'blocked' ? 'error.main' : status === 'warning' ? 'warning.main' : 'success.main';

  const content = (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ maxWidth: compact ? undefined : 400 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          {...register('limit', {
            valueAsNumber: true,
          })}
          type="number"
          label="Wochenstunden-Limit (h)"
          inputProps={{ min: 20, max: 80, step: 1 }}
          error={!!errors.limit}
          helperText={errors.limit?.message}
          size="small"
          sx={{ width: compact ? 120 : 160 }}
        />
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={isSettingLimit}
          startIcon={isSettingLimit ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isSettingLimit ? 'Speichern…' : 'Limit setzen'}
        </Button>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: statusColor }}>
        Aktuell: {currentHours.toFixed(1)}h / {currentLimit}h – {statusLabel}
      </Typography>
      {status === 'blocked' && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Wochenlimit überschritten. Bitte Admin kontaktieren oder Limit anpassen.
        </Alert>
      )}
    </Box>
  );

  if (compact) return content;

  return (
    <Card className="glass" sx={{ maxWidth: 480 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Wochenstunden-Limit
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          ArbZG/MiLoG: max. Wochenstunden für diesen Mitarbeiter (20–80h).
        </Typography>
        {content}
      </CardContent>
    </Card>
  );
}
