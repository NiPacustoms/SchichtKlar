'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createAssignmentWithMatchingAction } from './actions';
import { facilityService } from '@/lib/services/facilities';
import { categoriesService } from '@/lib/services/categories';
import { userService } from '@/lib/services/users';
import type { User } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { de } from 'date-fns/locale';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowBack } from '@mui/icons-material';

const schema = z
  .object({
    facilityId: z.string().min(1, 'Einrichtung ist erforderlich'),
    startDate: z.coerce.date(),
    startTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'z.B. 08:00'),
    endTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'z.B. 16:00'),
    qualification: z.string().optional(),
    hours: z.number().min(0).optional(),
    selectedUserIds: z.array(z.string()).min(1, 'Bitte mindestens eine Pflegekraft auswählen'),
  })
  .refine(d => d.startTime !== d.endTime, {
    message: 'Endzeit muss ungleich Startzeit sein',
    path: ['endTime'],
  });

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
  facilityId: '',
  startDate: new Date(),
  startTime: '08:00',
  endTime: '16:00',
  qualification: '',
  hours: undefined,
  selectedUserIds: [],
};

export function NewAssignmentForm() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: facilities = [], isLoading: loadingFacilities } = useQuery({
    queryKey: ['facilities', user?.companyId],
    queryFn: () => facilityService.getAll(user?.companyId),
    enabled: !!user?.companyId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.get(),
  });

  const { data: staffList = [], isLoading: loadingStaff } = useQuery<User[]>({
    queryKey: ['staff-nurses', user?.companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 200, { companyId: user?.companyId, role: 'nurse' });
      return Array.isArray(res) ? res : res.data;
    },
    enabled: !!user?.companyId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  const startDate = watch('startDate');
  const selectedUserIdsRaw = watch('selectedUserIds');
  const selectedUserIdsW = useMemo(() => selectedUserIdsRaw ?? [], [selectedUserIdsRaw]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user?.companyId) throw new Error('Keine Firma zugeordnet');
      const token = await firebaseUser?.getIdToken();
      if (!token) throw new Error('Nicht angemeldet');
      const startDateStr = format(
        data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
        'yyyy-MM-dd'
      );
      const result = await createAssignmentWithMatchingAction(
        {
          facilityId: data.facilityId,
          companyId: user.companyId,
          startDate: startDateStr,
          startTime: data.startTime,
          endTime: data.endTime,
          qualification: data.qualification || undefined,
          hours: data.hours,
          selectedUserIds: data.selectedUserIds,
        },
        token
      );
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: result => {
      toast.success(`Einsatz ausgeschrieben – ${result.candidateCount} Pflegekraft/-kräfte benachrichtigt.`);
      router.push('/admin/einsaetze');
    },
    onError: err => {
      setSubmitError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    },
  });

  const onSubmit = (data: FormData) => {
    setSubmitError(null);
    createMutation.mutate(data);
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bitte anmelden, um einen Einsatz zu erstellen.</Alert>
      </Box>
    );
  }

  if (!user.companyId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Ihrem Konto ist keine Firma zugeordnet. Einsätze können deshalb nicht angelegt werden.
        </Alert>
      </Box>
    );
  }

  if (loadingFacilities) {
    return <LoadingSpinner message="Einrichtungen werden geladen…" />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <PageContainer maxWidth="form">
        <PageHeader
          title="Neuer Einsatz"
          subtitle="Einsatz anlegen und an ausgewählte Pflegekräfte ausschreiben"
          actions={
            <Button
              component={Link}
              href="/admin/einsaetze"
              startIcon={<ArrowBack />}
              variant="outlined"
              size="medium"
            >
              Zurück
            </Button>
          }
        />

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth error={!!errors.facilityId} required>
                    <InputLabel id="na-facility-label">Einrichtung</InputLabel>
                    <Select
                      labelId="na-facility-label"
                      {...register('facilityId')}
                      value={watch('facilityId')}
                      onChange={e => setValue('facilityId', e.target.value)}
                      label="Einrichtung"
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
                  <DatePicker
                    label="Datum"
                    value={startDate}
                    onChange={d => setValue('startDate', d ?? new Date())}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    {...register('startTime')}
                    label="Startzeit"
                    placeholder="08:00"
                    fullWidth
                    error={!!errors.startTime}
                    helperText={errors.startTime?.message}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    {...register('endTime')}
                    label="Endzeit"
                    placeholder="16:00"
                    fullWidth
                    error={!!errors.endTime}
                    helperText={errors.endTime?.message}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={!!errors.qualification}>
                    <InputLabel id="na-qual-label">Qualifikation (optional)</InputLabel>
                    <Select
                      labelId="na-qual-label"
                      {...register('qualification')}
                      value={watch('qualification') || ''}
                      onChange={e => setValue('qualification', e.target.value)}
                      label="Qualifikation (optional)"
                    >
                      <MenuItem value="">Keine Einschränkung</MenuItem>
                      {(categories?.qualifications ?? []).map(q => (
                        <MenuItem key={q} value={q}>
                          {q}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    {...register('hours', { setValueAs: v => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v)) })}
                    label="Zu arbeitende Stunden (optional)"
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, step: 0.5 }}
                    error={!!errors.hours}
                    helperText={errors.hours?.message ?? 'z.B. 8 für einen Acht-Stunden-Tag'}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    multiple
                    options={staffList}
                    value={staffList.filter(u => selectedUserIdsW.includes(u.id))}
                    onChange={(_e, newValue) =>
                      setValue(
                        'selectedUserIds',
                        newValue.map(u => u.id)
                      )
                    }
                    getOptionLabel={u => u.displayName || u.email || u.id}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    loading={loadingStaff}
                    noOptionsText="Keine Pflegekräfte angelegt"
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Pflegekräfte auswählen"
                        required
                        error={!!errors.selectedUserIds}
                        placeholder="Mitarbeiter suchen…"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingStaff ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                  <FormHelperText sx={{ mt: 0.5 }} error={!!errors.selectedUserIds}>
                    {errors.selectedUserIds?.message ??
                      'Wer an dem Tag schon einen Einsatz hat, wird beim Ausschreiben gemeldet.'}
                  </FormHelperText>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedUserIdsW.length > 0
                      ? `${selectedUserIdsW.length} ausgewählt – diese werden benachrichtigt; wer zuerst annimmt, bekommt den Einsatz.`
                      : 'Wählen Sie aus, wem der Einsatz angeboten wird.'}
                  </Typography>
                  <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Wird erstellt…' : 'Einsatz erstellen'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </LocalizationProvider>
  );
}
