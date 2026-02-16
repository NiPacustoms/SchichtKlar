'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from '@/lib/logging';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Autocomplete,
  IconButton,
  Alert,
} from '@mui/material';
import { Grid } from '@mui/material';
import { Edit, Close } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  staffUpdateSchema,
  type StaffUpdateInput,
  roleOptions,
  roleLabelMap,
} from '@/lib/validations/staff';
import { categoriesService } from '@/lib/services/categories';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/lib/types';

interface StaffEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (staffData: StaffUpdateInput) => void;
  staff?:
    | (Partial<User> & {
        id: string;
        displayName: string;
        email: string;
        phone: string;
        role: 'nurse' | 'dispatcher' | 'admin';
        qualifications: string[];
        active: boolean;
        createdAt: Date;
      })
    | null;
  user?: unknown;
}

// These can later be sourced from CategoryManager state
const DEFAULT_QUALIFICATION_OPTIONS = [
  'Krankenpfleger',
  'Intensivpflege',
  'OP-Pflege',
  'Geriatrie',
];
const DEFAULT_GROUP_OPTIONS = ['Intensivstation', 'Operationssaal', 'Geriatrie', 'Pädiatrie'];
const DEFAULT_JOB_TITLE_OPTIONS = [
  'Pflegefachkraft',
  'Stationsleitung',
  'Praxisanleiter',
  'Disponent',
  'Pflegeassistenz',
];

const normalizeEmptyStrings = <T,>(value: T): T => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return (trimmed === '' ? undefined : trimmed) as T;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => normalizeEmptyStrings(item))
      .filter(item => item !== undefined && item !== null) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).reduce<
      Record<string, unknown>
    >((acc, [key, val]) => {
      const normalized = normalizeEmptyStrings(val);
      const isArray = Array.isArray(normalized);
      const isPlainObject =
        typeof normalized === 'object' &&
        normalized !== null &&
        !isArray &&
        !(normalized instanceof Date);

      if (
        normalized !== undefined &&
        normalized !== null &&
        !(isPlainObject && Object.keys(normalized as Record<string, unknown>).length === 0)
      ) {
        acc[key] = normalized;
      }
      return acc;
    }, {});

    return entries as T;
  }

  return value;
};

export function StaffEditDialog({ open, onClose, onSave, staff }: StaffEditDialogProps) {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ['config', 'categories'],
    queryFn: () => categoriesService.get(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const availableGroups = categories?.groups || DEFAULT_GROUP_OPTIONS;
  const availableQualifications = categories?.qualifications || DEFAULT_QUALIFICATION_OPTIONS;
  const availableJobTitles = categories?.jobTitles || DEFAULT_JOB_TITLE_OPTIONS;

  const [jobTitleInput, setJobTitleInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addQualificationToCategories = useMutation({
    mutationFn: async (value: string) => {
      const next = Array.from(new Set([...(availableQualifications || []), value]));
      await categoriesService.update({ qualifications: next });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'categories'] });
    },
  });

  const addJobTitleToCategories = useMutation({
    mutationFn: async (value: string) => {
      const next = Array.from(new Set([...(availableJobTitles || []), value]));
      await categoriesService.update({ jobTitles: next });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'categories'] });
    },
  });

  const addGroupToCategories = useMutation({
    mutationFn: async (value: string) => {
      const next = Array.from(new Set([...(availableGroups || []), value]));
      await categoriesService.update({ groups: next });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'categories'] });
    },
  });

  const roleItems = useMemo(
    () =>
      (categories?.roles || roleOptions).map(r => ({
        value: r as (typeof roleOptions)[number],
        label: roleLabelMap[r as (typeof roleOptions)[number]] || String(r),
      })),
    [categories]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
    setValue,
    watch,
  } = useForm<StaffUpdateInput>({
    resolver: zodResolver(staffUpdateSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      role: 'nurse',
      jobTitle: '',
      qualifications: [],
      workingHoursPerWeek: undefined,
      group: '',
      active: true,
      address: {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        state: '',
        country: '',
      },
      contact: {
        phoneMobile: '',
        phoneHome: '',
        phoneWork: '',
        emailPrivate: '',
      },
      emergencyContact: {
        name: '',
        relation: '',
        phone: '',
        email: '',
        address: '',
      },
      bankAccount: {
        iban: '',
        bic: '',
        bankName: '',
        accountHolder: '',
      },
      education: {
        highestDegree: '',
        institution: '',
        graduationYear: undefined,
      },
      driversLicense: {
        hasLicense: false,
        classes: [],
        ownCar: false,
        notes: '',
      },
    },
  });

  // Load staff data when dialog opens
  useEffect(() => {
    if (staff && open) {
      const fallbackJobTitle =
        (staff.jobTitle && staff.jobTitle.trim().length > 0
          ? staff.jobTitle
          : availableJobTitles[0]) || '';
      const fallbackGroup = staff.group || '';
      reset({
        displayName: staff.displayName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        jobTitle: fallbackJobTitle,
        qualifications: staff.qualifications || [],
        workingHoursPerWeek: staff.workingHoursPerWeek || undefined,
        group: fallbackGroup,
        active: staff.active,
        address: {
          street: staff.address?.street || '',
          houseNumber: staff.address?.houseNumber || '',
          postalCode: staff.address?.postalCode || '',
          city: staff.address?.city || '',
          state: staff.address?.state || '',
          country: staff.address?.country || '',
        },
        contact: {
          phoneMobile: staff.contact?.phoneMobile || '',
          phoneHome: staff.contact?.phoneHome || '',
          phoneWork: staff.contact?.phoneWork || '',
          emailPrivate: staff.contact?.emailPrivate || '',
        },
        emergencyContact: {
          name: staff.emergencyContact?.name || '',
          relation: staff.emergencyContact?.relation || '',
          phone: staff.emergencyContact?.phone || '',
          email: staff.emergencyContact?.email || '',
          address: staff.emergencyContact?.address || '',
        },
        bankAccount: {
          iban: staff.bankAccount?.iban || '',
          bic: staff.bankAccount?.bic || '',
          bankName: staff.bankAccount?.bankName || '',
          accountHolder: staff.bankAccount?.accountHolder || '',
        },
        education: {
          highestDegree: staff.education?.highestDegree || '',
          institution: staff.education?.institution || '',
          graduationYear: staff.education?.graduationYear || undefined,
        },
        driversLicense: {
          hasLicense: staff.driversLicense?.hasLicense || false,
          classes: staff.driversLicense?.classes || [],
          ownCar: staff.driversLicense?.ownCar || false,
          notes: staff.driversLicense?.notes || '',
        },
      });
      setJobTitleInput(fallbackJobTitle);
      setGroupInput(fallbackGroup);
    }
  }, [staff, open, reset, availableJobTitles]);

  const qualifications = watch('qualifications');
  const jobTitleValue = watch('jobTitle');
  const groupValue = watch('group');
  const _workingHoursPerWeek = watch('workingHoursPerWeek');

  useEffect(() => {
    setJobTitleInput(jobTitleValue || '');
  }, [jobTitleValue]);

  useEffect(() => {
    setGroupInput(groupValue || '');
  }, [groupValue]);

  const handleClose = () => {
    reset();
    setJobTitleInput('');
    setGroupInput('');
    setValidationErrors([]);
    onClose();
  };

  const handleAddQualification = (qualification: string) => {
    const value = (qualification || '').trim();
    if (!value) return;
    const next = Array.from(new Set([...(qualifications || []), value]));
    setValue('qualifications', next, { shouldValidate: true });
    if (!availableQualifications.includes(value)) {
      addQualificationToCategories.mutate(value);
    }
  };

  const handleRemoveQualification = (qualification: string) => {
    setValue(
      'qualifications',
      (qualifications || []).filter(q => q !== qualification),
      { shouldValidate: true }
    );
  };

  const handleCommitJobTitle = (value: string) => {
    const trimmed = value.trim();
    setJobTitleInput(trimmed);
    setValue('jobTitle', trimmed, { shouldValidate: true });
    if (trimmed && !availableJobTitles.includes(trimmed)) {
      addJobTitleToCategories.mutate(trimmed);
    }
  };

  const handleCommitGroup = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setGroupInput('');
      setValue('group', '', { shouldValidate: true });
      return;
    }
    setGroupInput(trimmed);
    setValue('group', trimmed, { shouldValidate: true });
    if (!availableGroups.includes(trimmed)) {
      addGroupToCategories.mutate(trimmed);
    }
  };

  if (!staff) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '20px', py: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '20px' }}>
            Mitarbeiter bearbeiten: {staff.displayName}
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {validationErrors.length > 0 && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'error.main',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Bitte korrigieren Sie folgende Fehler:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Grundinformationen
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="displayName"
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Name"
                  required
                  error={!!errors.displayName}
                  helperText={errors.displayName?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="E-Mail"
                  type="email"
                  required
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Telefonnummer"
                  type="tel"
                  required
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <FormControl fullWidth required>
                  <InputLabel>Rolle</InputLabel>
                  <Select {...field} label="Rolle">
                    {roleItems.map(r => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="jobTitle"
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  options={availableJobTitles}
                  value={field.value || ''}
                  inputValue={jobTitleInput}
                  onInputChange={(_event, newInputValue) => setJobTitleInput(newInputValue)}
                  onChange={(_event, newValue) => {
                    if (typeof newValue === 'string') {
                      handleCommitJobTitle(newValue);
                    }
                  }}
                  onBlur={() => handleCommitJobTitle(jobTitleInput)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Jobtitel"
                      placeholder="z. B. Pflegefachkraft, Stationsleitung..."
                      required
                      error={!!errors.jobTitle}
                      helperText={
                        errors.jobTitle?.message ||
                        'Freie Eingabe möglich – wird für künftige Auswahl gespeichert'
                      }
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="group"
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  options={availableGroups}
                  value={field.value || ''}
                  inputValue={groupInput}
                  onInputChange={(_event, newInputValue) => setGroupInput(newInputValue)}
                  onChange={(_event, newValue) => {
                    if (typeof newValue === 'string') {
                      handleCommitGroup(newValue);
                    } else if (newValue === null) {
                      setGroupInput('');
                      setValue('group', '', { shouldValidate: true });
                    }
                  }}
                  onBlur={() => handleCommitGroup(groupInput)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Gruppe/Abteilung"
                      placeholder="Gruppe eingeben oder aus Liste wählen"
                      helperText={
                        errors.group?.message ||
                        'Leer lassen, falls keine Zuordnung erforderlich ist'
                      }
                      error={!!errors.group}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Qualifications */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Qualifikationen
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Autocomplete
              freeSolo
              options={availableQualifications}
              value=""
              onChange={(event, newValue) => {
                if (newValue && typeof newValue === 'string') {
                  handleAddQualification(newValue);
                }
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Qualifikation hinzufügen"
                  placeholder="Qualifikation eingeben oder aus Liste wählen"
                  helperText={
                    errors.qualifications?.message ||
                    'Geben Sie eine neue Qualifikation ein oder wählen Sie aus der Liste'
                  }
                  error={!!errors.qualifications}
                />
              )}
            />
          </Grid>

          {qualifications && qualifications.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {qualifications.map((qualification, index) => (
                  <Chip
                    key={index}
                    label={qualification}
                    onDelete={() => handleRemoveQualification(qualification)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          )}

          {errors.qualifications && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="error" sx={{ mt: 1 }}>
                {Array.isArray(errors.qualifications)
                  ? (errors.qualifications as (typeof errors.qualifications)[number][])
                      .map(e => e?.message)
                      .filter(Boolean)
                      .join(', ')
                  : errors.qualifications.message}
              </Alert>
            </Grid>
          )}

          {/* Arbeitsstunden */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Arbeitsstunden
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="workingHoursPerWeek"
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Arbeitsstunden pro Woche"
                  type="number"
                  inputProps={{ min: 1, max: 80, step: 0.5 }}
                  value={field.value ?? ''}
                  onChange={e => {
                    const value =
                      e.target.value === '' ? undefined : Number.parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  helperText={
                    errors.workingHoursPerWeek?.message ||
                    'Vertraglich vereinbarte Arbeitsstunden pro Woche (Standard: 40h = Vollzeit)'
                  }
                  error={!!errors.workingHoursPerWeek}
                />
              )}
            />
          </Grid>

          {/* Status */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Status
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={field.value ? 'active' : 'inactive'}
                    onChange={e => field.onChange(e.target.value === 'active')}
                    label="Status"
                  >
                    <MenuItem value="active">Aktiv</MenuItem>
                    <MenuItem value="inactive">Inaktiv</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          {/* Adresse */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Adresse
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="address.street"
              render={({ field }) => <TextField {...field} fullWidth label="Straße" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="address.houseNumber"
              render={({ field }) => <TextField {...field} fullWidth label="Hausnummer" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="address.postalCode"
              render={({ field }) => <TextField {...field} fullWidth label="PLZ" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Controller
              control={control}
              name="address.city"
              render={({ field }) => <TextField {...field} fullWidth label="Ort" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="address.state"
              render={({ field }) => <TextField {...field} fullWidth label="Bundesland" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="address.country"
              render={({ field }) => <TextField {...field} fullWidth label="Land" />}
            />
          </Grid>

          {/* Kontakt */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Kontakt
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="contact.phoneMobile"
              render={({ field }) => <TextField {...field} fullWidth label="Mobil" type="tel" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="contact.phoneHome"
              render={({ field }) => <TextField {...field} fullWidth label="Festnetz" type="tel" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="contact.phoneWork"
              render={({ field }) => (
                <TextField {...field} fullWidth label="Diensttelefon" type="tel" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="contact.emailPrivate"
              render={({ field }) => <TextField {...field} fullWidth label="Private E-Mail" />}
            />
          </Grid>

          {/* Notfallkontakt */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Notfallkontakt
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="emergencyContact.name"
              render={({ field }) => <TextField {...field} fullWidth label="Name" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="emergencyContact.relation"
              render={({ field }) => <TextField {...field} fullWidth label="Beziehung" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="emergencyContact.phone"
              render={({ field }) => <TextField {...field} fullWidth label="Telefon" type="tel" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="emergencyContact.email"
              render={({ field }) => <TextField {...field} fullWidth label="E-Mail" />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="emergencyContact.address"
              render={({ field }) => <TextField {...field} fullWidth label="Adresse" />}
            />
          </Grid>

          {/* Kontodaten */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Kontodaten
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="bankAccount.iban"
              render={({ field }) => <TextField {...field} fullWidth label="IBAN" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="bankAccount.bic"
              render={({ field }) => <TextField {...field} fullWidth label="BIC" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="bankAccount.bankName"
              render={({ field }) => <TextField {...field} fullWidth label="Bank" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="bankAccount.accountHolder"
              render={({ field }) => <TextField {...field} fullWidth label="Kontoinhaber" />}
            />
          </Grid>

          {/* Ausbildung */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Ausbildung & Lehrgänge
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="education.highestDegree"
              render={({ field }) => <TextField {...field} fullWidth label="Höchster Abschluss" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="education.institution"
              render={({ field }) => <TextField {...field} fullWidth label="Institution" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="education.graduationYear"
              render={({ field }) => (
                <TextField {...field} fullWidth label="Abschlussjahr" type="number" />
              )}
            />
          </Grid>

          {/* Führerschein */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Führerschein
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="driversLicense.hasLicense"
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Führerschein vorhanden</InputLabel>
                  <Select
                    value={field.value ? 'yes' : 'no'}
                    onChange={e => field.onChange(e.target.value === 'yes')}
                    label="Führerschein vorhanden"
                  >
                    <MenuItem value="yes">Ja</MenuItem>
                    <MenuItem value="no">Nein</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="driversLicense.classes"
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Klassen (z.B. B, BE)"
                  value={(field.value || []).join(', ')}
                  onChange={e =>
                    field.onChange(
                      e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="driversLicense.ownCar"
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Eigenes Auto</InputLabel>
                  <Select
                    value={field.value ? 'yes' : 'no'}
                    onChange={e => field.onChange(e.target.value === 'yes')}
                    label="Eigenes Auto"
                  >
                    <MenuItem value="yes">Ja</MenuItem>
                    <MenuItem value="no">Nein</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="driversLicense.notes"
              render={({ field }) => (
                <TextField {...field} fullWidth label="Notizen" multiline minRows={2} />
              )}
            />
          </Grid>

          {/* Additional Info */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Zusätzliche Informationen
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Erstellt am"
              value={staff.createdAt.toLocaleDateString('de-DE')}
              disabled
              helperText="Datum der Erstellung des Mitarbeiterprofils"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Zuletzt aktiv"
              value={staff.lastActive ? staff.lastActive.toLocaleDateString('de-DE') : 'Nie'}
              disabled
              helperText="Letzte Aktivität des Mitarbeiters"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Abbrechen
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(
            data => {
              setValidationErrors([]);
              const normalizedData = normalizeEmptyStrings(data);
              onSave?.(normalizedData);
            },
            validationErrors => {
              // Validierungsfehler sammeln und anzeigen
              logger.error('Validierungsfehler:', validationErrors);
              const errorMessages: string[] = [];

              const collectErrors = (errors: Record<string, unknown>, prefix = '') => {
                Object.entries(errors).forEach(([key, value]) => {
                  const fieldName = prefix ? `${prefix}.${key}` : key;
                  if (value && typeof value === 'object') {
                    if ('message' in value && typeof value.message === 'string') {
                      errorMessages.push(`${fieldName}: ${value.message}`);
                    } else {
                      collectErrors(value as Record<string, unknown>, fieldName);
                    }
                  }
                });
              };

              collectErrors(validationErrors as Record<string, unknown>);
              setValidationErrors(errorMessages);

              // Scroll zum ersten Fehler
              const firstErrorField = Object.keys(validationErrors)[0];
              if (firstErrorField) {
                const element = document.querySelector(`[name="${firstErrorField}"]`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
          )}
          disabled={isSubmitting}
          startIcon={<Edit />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {isSubmitting ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
