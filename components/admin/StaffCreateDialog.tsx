'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  Tabs,
  Tab,
} from '@mui/material';
import { Grid } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  staffCreateSchema,
  type StaffCreateInput,
  roleLabelMap,
  roleOptions,
} from '@/lib/validations/staff';
import { categoriesService } from '@/lib/services/categories';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface StaffCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (staffData: StaffCreateInput) => void;
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

export function StaffCreateDialog({ open, onClose, onSave }: StaffCreateDialogProps) {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ['config', 'categories'],
    queryFn: () => categoriesService.get(),
    staleTime: 5 * 60 * 1000,
  });

  const availableGroups = categories?.groups || DEFAULT_GROUP_OPTIONS;
  const availableQualifications = categories?.qualifications || DEFAULT_QUALIFICATION_OPTIONS;
  const availableJobTitles = categories?.jobTitles || DEFAULT_JOB_TITLE_OPTIONS;

  // Input-State für Autocomplete (freeSolo)
  const [qualificationInput, setQualificationInput] = useState('');
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [groupInput, setGroupInput] = useState('');

  // Mutation: neue Qualifikation dauerhaft zu Kategorien hinzufügen
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
  } = useForm<StaffCreateInput>({
    resolver: zodResolver(staffCreateSchema) as any,
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      role: 'nurse',
      jobTitle: '',
      qualifications: [],
      group: '',
      active: true,
      address: {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        state: '',
        country: 'Deutschland',
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
    },
  });

  const qualifications = watch('qualifications');
  const currentJobTitle = watch('jobTitle');
  const currentGroup = watch('group');
  const [activeTab, setActiveTab] = useState(0);

  const handleClose = () => {
    reset();
    setQualificationInput('');
    setJobTitleInput('');
    setGroupInput('');
    setActiveTab(0);
    onClose();
  };

  const handleAddQualification = (qualification: string) => {
    const value = (qualification || '').trim();
    if (!value) return;
    const next = Array.from(new Set([...(qualifications || []), value]));
    setValue('qualifications', next, { shouldValidate: true });
    // Persistiere in Kategorien, wenn neu
    if (!availableQualifications.includes(value)) {
      addQualificationToCategories.mutate(value);
    }
    setQualificationInput('');
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

  useEffect(() => {
    if (open && (!currentJobTitle || currentJobTitle.trim() === '')) {
      const defaultTitle =
        availableJobTitles && availableJobTitles.length > 0 ? availableJobTitles[0] : '';
      setValue('jobTitle', defaultTitle, { shouldDirty: false, shouldValidate: false });
      setJobTitleInput(defaultTitle);
    }
  }, [open, availableJobTitles, setValue, currentJobTitle]);

  useEffect(() => {
    setJobTitleInput(currentJobTitle || '');
  }, [currentJobTitle]);

  useEffect(() => {
    setGroupInput(currentGroup || '');
  }, [currentGroup]);

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
            Neuen Mitarbeiter erstellen
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Grunddaten" />
            <Tab label="Adresse" />
            <Tab label="Kontakt" />
            <Tab label="Notfallkontakt" />
          </Tabs>
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Tab 0: Basic Information */}
          {activeTab === 0 && (
            <>
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
                      <InputLabel>Berufsbezeichnung</InputLabel>
                      <Select {...field} label="Berufsbezeichnung">
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
                  inputValue={qualificationInput}
                  onInputChange={(_e, v) => setQualificationInput(v)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const v = qualificationInput.trim();
                      if (v) handleAddQualification(v);
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
            </>
          )}

          {/* Tab 1: Address */}
          {activeTab === 1 && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Adresse
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <Controller
                  control={control}
                  name="address.street"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Straße"
                      placeholder="z.B. Musterstraße"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  control={control}
                  name="address.houseNumber"
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Hausnummer" placeholder="z.B. 123" />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  control={control}
                  name="address.postalCode"
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Postleitzahl" placeholder="z.B. 12345" />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <Controller
                  control={control}
                  name="address.city"
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Stadt" placeholder="z.B. Berlin" />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="address.state"
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Bundesland" placeholder="z.B. Berlin" />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="address.country"
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Land" placeholder="z.B. Deutschland" />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Tab 2: Contact */}
          {activeTab === 2 && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Kontaktdaten
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="contact.phoneMobile"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Mobiltelefon"
                      placeholder="z.B. +49 123 456789"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="contact.phoneHome"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Telefon privat"
                      placeholder="z.B. +49 30 123456"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="contact.phoneWork"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Telefon geschäftlich"
                      placeholder="z.B. +49 30 987654"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="contact.emailPrivate"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Private E-Mail"
                      type="email"
                      placeholder="z.B. max@example.com"
                      error={!!errors.contact?.emailPrivate}
                      helperText={errors.contact?.emailPrivate?.message}
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Tab 3: Emergency Contact */}
          {activeTab === 3 && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Notfallkontakt
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      placeholder="z.B. Max Mustermann"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="emergencyContact.relation"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Verwandtschaftsverhältnis"
                      placeholder="z.B. Ehepartner, Vater, Mutter"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="emergencyContact.phone"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Telefonnummer"
                      placeholder="z.B. +49 123 456789"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="emergencyContact.email"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="E-Mail"
                      type="email"
                      placeholder="z.B. kontakt@example.com"
                      error={!!errors.emergencyContact?.email}
                      helperText={errors.emergencyContact?.email?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="emergencyContact.address"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Adresse"
                      multiline
                      rows={2}
                      placeholder="Vollständige Adresse des Notfallkontakts"
                    />
                  )}
                />
              </Grid>
            </>
          )}
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
          onClick={handleSubmit(data => onSave(data))}
          variant="contained"
          disabled={isSubmitting}
          startIcon={<Add />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {isSubmitting ? 'Erstelle...' : 'Mitarbeiter erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
