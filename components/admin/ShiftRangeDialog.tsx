'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from '@/contexts/AuthContext';
import { facilityService, shiftService } from '@/lib/services';
import { Facility } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { de } from 'date-fns/locale';
import { eachDayOfInterval } from 'date-fns';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const rangeSchema = z
  .object({
    facilityId: z.string().min(1, 'Einrichtung ist erforderlich'),
    stationId: z.string().min(1, 'Station ist erforderlich'),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    startTime: z.string().min(1, 'Startzeit ist erforderlich'),
    endTime: z.string().min(1, 'Endzeit ist erforderlich'),
    type: z.string().optional(),
    capacity: z.number().min(1),
  })
  .superRefine((val, ctx) => {
    if (val.dateTo < val.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bis-Datum muss nach Von-Datum liegen',
        path: ['dateTo'],
      });
    }
    if (val.startTime === val.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Endzeit muss ungleich Startzeit sein',
        path: ['endTime'],
      });
    }
  });

type RangeFormData = z.infer<typeof rangeSchema>;

interface ShiftRangeDialogProps {
  open: boolean;
  onClose: () => void;
  initialFrom?: Date | null;
  initialTo?: Date | null;
}

export function ShiftRangeDialog({ open, onClose, initialFrom, initialTo }: ShiftRangeDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: () => facilityService.getAll(),
  });

  const {
    register: _register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<RangeFormData>({
    resolver: zodResolver(rangeSchema) as any,
    defaultValues: {
      capacity: 1,
      type: 'Frühdienst',
      dateFrom: (initialFrom || new Date()) as any,
      dateTo: (initialTo || initialFrom || new Date()) as any,
    },
  });

  // Bei Öffnen vorbelegen/aktualisieren
  useEffect(() => {
    if (open) {
      if (initialFrom) setValue('dateFrom', initialFrom);
      if (initialTo || initialFrom) setValue('dateTo', initialTo || initialFrom || new Date());
    }
  }, [open, initialFrom, initialTo, setValue]);

  const createRangeMutation = useMutation({
    mutationFn: async (data: RangeFormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      const days = eachDayOfInterval({ start: data.dateFrom, end: data.dateTo });
      // Generiere eine gemeinsame shiftGroupId für alle Schichten im Zeitraum
      const shiftGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      for (const day of days) {
        await shiftService.createWithCapacity({
          facilityId: data.facilityId,
          stationId: data.stationId,
          date: typeof day === 'string' ? day : day.toISOString().split('T')[0],
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
          capacity: data.capacity,
          requiredQualifications: [],
          shiftGroupId: shiftGroupId,
          createdBy: user.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success('Schichten für Zeitraum erstellt');
      handleClose();
    },
    onError: e => toast.error(e instanceof Error ? e.message : 'Erstellen fehlgeschlagen'),
  });

  const handleFacilityChange = (facilityId: string) => {
    const facility = facilities.find(f => f.id === facilityId);
    setSelectedFacility(facility || null);
    setValue('stationId', '');
    setValue('facilityId', facilityId);
  };

  const onSubmit = (data: RangeFormData) => createRangeMutation.mutate(data);

  const handleClose = () => {
    reset();
    setSelectedFacility(null);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        sx={isMobile ? { '& .MuiDialog-container': { alignItems: 'flex-end' } } : undefined}
        PaperProps={{
          sx: isMobile ? { borderRadius: '16px 16px 0 0' } : {},
          onTouchStart: isMobile
            ? (e: React.TouchEvent<HTMLDivElement>) => {
                (e.currentTarget as unknown as { __touchStartY?: number }).__touchStartY =
                  e.touches[0].clientY;
              }
            : undefined,
          onTouchMove: isMobile
            ? (e: React.TouchEvent<HTMLDivElement>) => {
                (e.currentTarget as unknown as { __touchMoveY?: number }).__touchMoveY =
                  e.touches[0].clientY;
              }
            : undefined,
          onTouchEnd: isMobile
            ? (e: React.TouchEvent<HTMLDivElement>) => {
                const current = e.currentTarget as unknown as {
                  __touchStartY?: number;
                  __touchMoveY?: number;
                };
                const startY = current.__touchStartY || 0;
                const endY = current.__touchMoveY || startY;
                if (endY - startY > 60) handleClose();
              }
            : undefined,
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? 18 : undefined, py: isMobile ? 1.5 : undefined }}>
          Zeitraum-Schichten erstellen
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ py: isMobile ? 1 : undefined }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!errors.facilityId}>
                  <InputLabel>Einrichtung</InputLabel>
                  <Select
                    value={watch('facilityId') || ''}
                    label="Einrichtung"
                    onChange={e => handleFacilityChange(e.target.value)}
                  >
                    {facilities.map(f => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.facilityId && (
                    <FormHelperText>{errors.facilityId.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!errors.stationId}>
                  <InputLabel>Station</InputLabel>
                  <Select
                    value={watch('stationId') || ''}
                    label="Station"
                    onChange={e => setValue('stationId', e.target.value)}
                    disabled={!selectedFacility}
                  >
                    {selectedFacility?.stations.map(s => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.stationId && <FormHelperText>{errors.stationId.message}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Von"
                  value={(watch('dateFrom') || initialFrom || new Date()) as unknown as Date}
                  onChange={d => setValue('dateFrom', d || new Date())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dateFrom,
                      helperText: errors.dateFrom?.message,
                      size: isMobile ? 'medium' : 'small',
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Bis"
                  value={
                    (watch('dateTo') || initialTo || initialFrom || new Date()) as unknown as Date
                  }
                  onChange={d => setValue('dateTo', d || new Date())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dateTo,
                      helperText: errors.dateTo?.message,
                      size: isMobile ? 'medium' : 'small',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Startzeit"
                  type="time"
                  value={watch('startTime') || ''}
                  onChange={e => setValue('startTime', e.target.value)}
                  error={!!errors.startTime}
                  helperText={errors.startTime?.message}
                  InputLabelProps={{ shrink: true }}
                  size={isMobile ? 'medium' : 'small'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Endzeit"
                  type="time"
                  value={watch('endTime') || ''}
                  onChange={e => setValue('endTime', e.target.value)}
                  error={!!errors.endTime}
                  helperText={errors.endTime?.message}
                  InputLabelProps={{ shrink: true }}
                  size={isMobile ? 'medium' : 'small'}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Kapazität"
                  type="number"
                  value={watch('capacity') || 1}
                  onChange={e => setValue('capacity', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>

            {createRangeMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createRangeMutation.error instanceof Error
                  ? createRangeMutation.error.message
                  : 'Fehler'}
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ px: isMobile ? 2 : undefined, pb: isMobile ? 2 : undefined }}>
            <Button
              onClick={handleClose}
              disabled={createRangeMutation.isPending}
              size={isMobile ? 'large' : 'medium'}
              fullWidth={isMobile}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createRangeMutation.isPending}
              size={isMobile ? 'large' : 'medium'}
              fullWidth={isMobile}
            >
              {createRangeMutation.isPending ? 'Erstelle…' : 'Erstellen'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}
