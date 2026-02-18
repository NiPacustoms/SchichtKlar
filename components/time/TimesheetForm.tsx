'use client';

import { logger } from '@/lib/logging';

import { GlassCard } from '@/components/ui/GlassCard';
import { TimesheetForm as TimesheetFormType } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import WarningAmber from '@mui/icons-material/WarningAmber';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { getRequiredBreakMinutes } from '@/lib/utils/time';
import { facilityService } from '@/lib/services/facilities';
import { Facility } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { spacingScale } from '@/lib/design-tokens';
import { useWeeklyLimit } from '@/lib/hooks/useWeeklyLimit';
import { LimitWarningBanner } from '@/components/timesheets/LimitWarningBanner';
import { LimitRequestModal } from '@/components/timesheets/LimitRequestModal';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timesheetSchema = z.object({
  date: z
    .string()
    .min(1, 'Datum ist erforderlich')
    .refine(value => !Number.isNaN(new Date(value).getTime()), 'Ungültiges Datum'),
  startTime: z
    .string()
    .min(1, 'Startzeit ist erforderlich')
    .regex(timeRegex, 'Zeitformat HH:MM erforderlich'),
  endTime: z
    .string()
    .min(1, 'Endzeit ist erforderlich')
    .regex(timeRegex, 'Zeitformat HH:MM erforderlich'),
  notes: z.string().max(500, 'Notizen dürfen maximal 500 Zeichen haben').optional(),
  facilityId: z.string().min(1, 'Einrichtung ist erforderlich'),
  station: z.string().optional(),
});

type TimesheetFormData = z.infer<typeof timesheetSchema>;

const toDateInputValue = (value?: Date | string) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value) {
    return value.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

interface TimesheetFormProps {
  initialData?: Partial<TimesheetFormType>;
  onSubmit: (data: TimesheetFormType) => void;
  isLoading?: boolean;
  isEdit?: boolean;
  disabled?: boolean;
}

export function TimesheetForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit: _isEdit = false,
  disabled = false,
}: TimesheetFormProps) {
  const { user } = useAuth();
  const [totalHours, setTotalHours] = useState(0);
  const [calculatedBreakMinutes, setCalculatedBreakMinutes] = useState(0);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const { data: limitData, refetch: refetchLimit } = useWeeklyLimit(user?.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      date: toDateInputValue(initialData?.date),
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      notes: initialData?.notes || '',
      facilityId: initialData?.facilityId || '',
      station: initialData?.station || '',
    },
  });

  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');
  const watchedDate = watch('date');

  // Load facilities
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setFacilitiesLoading(true);
        const allFacilities = await facilityService.getAll(user?.companyId);
        setFacilities(allFacilities);
      } catch (error) {
        logger.error('Failed to load facilities:', error);
      } finally {
        setFacilitiesLoading(false);
      }
    };

    if (user?.companyId) {
      loadFacilities();
    }
  }, [user?.companyId]);

  // Calculate break minutes and total hours when times change
  useEffect(() => {
    if (watchedStartTime && watchedEndTime && watchedDate) {
      const start = new Date(`${watchedDate}T${watchedStartTime}`);
      const end = new Date(`${watchedDate}T${watchedEndTime}`);

      // Handle overnight shifts
      if (end.getTime() <= start.getTime()) {
        end.setDate(end.getDate() + 1);
      }

      const totalMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

      // Calculate required break minutes based on work time
      const requiredBreakMinutes = getRequiredBreakMinutes(totalMinutes);
      setCalculatedBreakMinutes(requiredBreakMinutes);

      // Calculate total hours (work time minus break)
      const totalHours = (totalMinutes - requiredBreakMinutes) / 60;
      const roundedHours = Math.round(totalHours * 100) / 100;
      setTotalHours(roundedHours);
    }
  }, [watchedStartTime, watchedEndTime, watchedDate]);

  const handleFormSubmit = (data: TimesheetFormData) => {
    const parsedDate = new Date(data.date);

    // Calculate break minutes based on work time
    const start = new Date(`${data.date}T${data.startTime}`);
    const end = new Date(`${data.date}T${data.endTime}`);

    // Handle overnight shifts
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    const totalMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const breakMinutes = getRequiredBreakMinutes(totalMinutes);

    onSubmit({
      date: parsedDate,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: breakMinutes,
      notes: data.notes,
      facilityId: data.facilityId,
      station: data.station,
    });
  };

  const setCurrentTime = (field: 'startTime' | 'endTime') => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    setValue(field, timeString);
  };

  const requiredFields = ['date', 'startTime', 'endTime', 'facilityId'] as const;
  const filled = requiredFields.filter(
    f => watch(f) && String(watch(f)).trim().length > 0
  ).length;
  const progressPercent = Math.round((filled / requiredFields.length) * 100);

  return (
    <GlassCard>
      <CardContent sx={{ pt: spacingScale.md }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Zeiterfassung bearbeiten
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Fortschritt
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {progressPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              },
            }}
            aria-label={`Formularfortschritt ${progressPercent} Prozent`}
          />
        </Box>

        {(limitData?.status === 'blocked' || limitData?.status === 'warning') && (
          <Box sx={{ mb: 3 }}>
            <LimitWarningBanner
              limit={limitData}
              onRequestIncrease={() => setLimitModalOpen(true)}
              variant={limitData.status === 'blocked' ? 'blocked' : 'warning'}
            />
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('date')}
                label="Startdatum"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date?.message}
                disabled={disabled}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Enddatum"
                type="date"
                fullWidth
                value={watch('date')}
                InputLabelProps={{ shrink: true }}
                disabled
                sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  {...register('startTime')}
                  label="Startzeit"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.startTime}
                  helperText={errors.startTime?.message}
                  disabled={disabled}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setCurrentTime('startTime')}
                  sx={{ minWidth: 70, textTransform: 'none' }}
                  disabled={disabled}
                >
                  Jetzt
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  {...register('endTime')}
                  label="Endzeit"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.endTime}
                  helperText={errors.endTime?.message}
                  disabled={disabled}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setCurrentTime('endTime')}
                  sx={{ minWidth: 70, textTransform: 'none' }}
                  disabled={disabled}
                >
                  Jetzt
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!errors.facilityId} required>
                <InputLabel>Einrichtung **</InputLabel>
                <Controller
                  name="facilityId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      value={field.value || ''}
                      label="Einrichtung **"
                      disabled={disabled || facilitiesLoading}
                    >
                      {facilitiesLoading ? (
                        <MenuItem value="">
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Lade Einrichtungen...
                        </MenuItem>
                      ) : facilities.length === 0 ? (
                        <MenuItem value="" disabled>
                          Keine Einrichtungen verfügbar
                        </MenuItem>
                      ) : (
                        facilities.map(facility => (
                          <MenuItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  )}
                />
                {errors.facilityId && <FormHelperText>{errors.facilityId.message}</FormHelperText>}
              </FormControl>
            </Grid>

            {watchedStartTime && watchedEndTime && calculatedBreakMinutes > 0 && (
              <Grid size={{ xs: 12 }}>
                <Alert
                  severity="warning"
                  icon={<WarningAmber fontSize="small" />}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'warning.main',
                  }}
                  aria-label="Hinweis Arbeitszeitgesetz Pausenregel"
                >
                  <Typography variant="body2" fontWeight={600}>
                    Gemäß ArbZG ist eine Pause von mind. {calculatedBreakMinutes} Minuten erforderlich.
                  </Typography>
                </Alert>
              </Grid>
            )}
            {watchedStartTime && watchedEndTime && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Pausenzeit (automatisch berechnet)"
                  value={`${calculatedBreakMinutes} Minuten`}
                  fullWidth
                  disabled
                  helperText={
                    calculatedBreakMinutes === 0
                      ? 'Keine gesetzliche Pause erforderlich'
                      : calculatedBreakMinutes === 30
                        ? 'Gesetzliche Mindestpause bei mehr als 6 Stunden'
                        : 'Gesetzliche Mindestpause bei mehr als 9 Stunden'
                  }
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('station')}
                label="Station (optional)"
                fullWidth
                placeholder="z.B. Intensivstation, Notaufnahme"
                error={!!errors.station}
                helperText={errors.station?.message}
                disabled={disabled}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                {...register('notes')}
                label="Notizen (optional)"
                multiline
                rows={3}
                fullWidth
                placeholder="Zusätzliche Informationen..."
                error={!!errors.notes}
                helperText={errors.notes?.message}
                disabled={disabled}
              />
            </Grid>

            {/* Total Hours Display */}
            {totalHours > 0 && (
              <Grid size={{ xs: 12 }}>
                <Card sx={{ bgcolor: 'background.paper', p: 2 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Gesamtzeit: {totalHours} Stunden
                    </Typography>
                    {calculatedBreakMinutes > 0 && (
                      <Alert
                        severity="info"
                        sx={{
                          flex: 1,
                          ml: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'info.main',
                        }}
                      >
                        Automatisch berechnete Pausenzeit: {calculatedBreakMinutes} Minuten (gemäß
                        Arbeitszeitgesetz)
                      </Alert>
                    )}
                  </Box>
                </Card>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={disabled || isLoading || limitData?.status === 'blocked'}
                  data-testid="timesheet-submit"
                  aria-label={_isEdit ? 'Zeiterfassung aktualisieren' : 'Zeiterfassung speichern'}
                  sx={{
                    minWidth: 140,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    bgcolor: 'primary.main',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {isLoading
                    ? _isEdit
                      ? 'Aktualisieren...'
                      : 'Speichern...'
                    : _isEdit
                      ? 'Aktualisieren'
                      : 'Speichern'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
      <LimitRequestModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        limit={limitData ?? null}
        mitarbeiterId={user?.id ?? ''}
        onSuccess={() => refetchLimit()}
      />
    </GlassCard>
  );
}
