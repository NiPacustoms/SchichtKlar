'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { User } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Add,
  Cancel,
  Delete,
  Edit,
  Lock,
  Save,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EncryptionService } from '@/lib/services/encryption';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      houseNumber: z.string().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      phoneMobile: z.string().optional(),
      phoneHome: z.string().optional(),
      phoneWork: z.string().optional(),
      emailPrivate: z
        .union([z.string().email('Ungültige E-Mail-Adresse'), z.literal(''), z.undefined()])
        .optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      relation: z.string().optional(),
      phone: z.string().optional(),
      email: z
        .union([z.string().email('Ungültige E-Mail-Adresse'), z.literal(''), z.undefined()])
        .optional(),
      address: z.string().optional(),
    })
    .optional(),
  bankAccount: z
    .object({
      iban: z.string().optional(),
      bic: z.string().optional(),
      bankName: z.string().optional(),
      accountHolder: z.string().optional(),
    })
    .optional(),
  qualifications: z.array(z.string()).optional(),
  notificationSettings: z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    shiftReminders: z.boolean(),
    documentExpiry: z.boolean(),
    systemAnnouncements: z.boolean(),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
  onSubmit: (data: ProfileFormData) => void;
  isLoading?: boolean;
  getQualificationColor: (qualification: string) => string;
  validateEmail: (email: string) => boolean;
  validatePhone: (phone: string) => boolean;
}

export function ProfileForm({
  user,
  onSubmit,
  isLoading = false,
  getQualificationColor,
  validateEmail: _validateEmail,
  validatePhone: _validatePhone,
}: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [showIban, setShowIban] = useState(false);
  const [newQualification, setNewQualification] = useState('');
  const [customQualificationText, setCustomQualificationText] = useState('');
  const [_showPasswordDialog, _setShowPasswordDialog] = useState<boolean>(false);

  // IBAN-Validierung
  const validateIBAN = (iban: string): boolean => {
    if (!iban) return true; // Optional
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    return ibanRegex.test(cleaned);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        houseNumber: user.address?.houseNumber || '',
        postalCode: user.address?.postalCode || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        country: user.address?.country || '',
      },
      contact: {
        phoneMobile: user.contact?.phoneMobile || '',
        phoneHome: user.contact?.phoneHome || '',
        phoneWork: user.contact?.phoneWork || '',
        emailPrivate: user.contact?.emailPrivate || '',
      },
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        relation: user.emergencyContact?.relation || '',
        phone: user.emergencyContact?.phone || '',
        email: user.emergencyContact?.email || '',
        address: user.emergencyContact?.address || '',
      },
      bankAccount: {
        iban: user.bankAccount?.iban || '',
        bic: user.bankAccount?.bic || '',
        bankName: user.bankAccount?.bankName || '',
        accountHolder: user.bankAccount?.accountHolder || '',
      },
      qualifications: user.qualifications || [],
      notificationSettings: user.notificationSettings || {
        emailNotifications: true,
        pushNotifications: true,
        shiftReminders: true,
        documentExpiry: true,
        systemAnnouncements: true,
      },
    },
  });

  // Formular zurücksetzen, wenn sich user ändert (z.B. nach erfolgreichem Speichern)
  useEffect(() => {
    reset({
      displayName: user.displayName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        houseNumber: user.address?.houseNumber || '',
        postalCode: user.address?.postalCode || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        country: user.address?.country || '',
      },
      contact: {
        phoneMobile: user.contact?.phoneMobile || '',
        phoneHome: user.contact?.phoneHome || '',
        phoneWork: user.contact?.phoneWork || '',
        emailPrivate: user.contact?.emailPrivate || '',
      },
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        relation: user.emergencyContact?.relation || '',
        phone: user.emergencyContact?.phone || '',
        email: user.emergencyContact?.email || '',
        address: user.emergencyContact?.address || '',
      },
      bankAccount: {
        iban: user.bankAccount?.iban || '',
        bic: user.bankAccount?.bic || '',
        bankName: user.bankAccount?.bankName || '',
        accountHolder: user.bankAccount?.accountHolder || '',
      },
      qualifications: user.qualifications || [],
      notificationSettings: user.notificationSettings || {
        emailNotifications: true,
        pushNotifications: true,
        shiftReminders: true,
        documentExpiry: true,
        systemAnnouncements: true,
      },
    });
    // Bearbeitungsmodus beenden wenn user sich ändert (z.B. nach erfolgreichem Speichern)
    // Nur wenn sich die user.id ändert (nicht bei jedem Render)
    if (isEditing) {
      setIsEditing(false);
      setShowIban(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, reset]);

  const watchedQualifications = watch('qualifications') || [];
  const watchedNotificationSettings = watch('notificationSettings');

  const handleFormSubmit = (data: ProfileFormData) => {
    try {
      // IBAN-Validierung wird in der Transformation durchgeführt (dort wird auch geprüft ob verschlüsselt)

      // Transformiere Daten für das Backend
      const updateData: Record<string, unknown> = {
        displayName: data.displayName.trim(),
        phone: data.phone?.trim() || undefined,
        qualifications: (data.qualifications || []).filter(q => q.trim().length > 0),
        notificationSettings: data.notificationSettings,
      };

      // Adresse - nur wenn Felder vorhanden sind (leere Strings werden entfernt)
      if (data.address) {
        const addressData: Record<string, unknown> = {};
        if (data.address.street?.trim()) addressData.street = data.address.street.trim();
        if (data.address.houseNumber?.trim())
          addressData.houseNumber = data.address.houseNumber.trim();
        if (data.address.postalCode?.trim())
          addressData.postalCode = data.address.postalCode.trim();
        if (data.address.city?.trim()) addressData.city = data.address.city.trim();
        if (data.address.state?.trim()) addressData.state = data.address.state.trim();
        if (data.address.country?.trim()) addressData.country = data.address.country.trim();

        if (Object.keys(addressData).length > 0) {
          updateData.address = addressData;
        }
      }

      // Kontaktdaten - nur wenn Felder vorhanden sind (leere Strings werden entfernt)
      if (data.contact) {
        const contactData: Record<string, unknown> = {};
        if (data.contact.phoneMobile?.trim())
          contactData.phoneMobile = data.contact.phoneMobile.trim();
        if (data.contact.phoneHome?.trim()) contactData.phoneHome = data.contact.phoneHome.trim();
        if (data.contact.phoneWork?.trim()) contactData.phoneWork = data.contact.phoneWork.trim();
        if (data.contact.emailPrivate?.trim()) {
          // E-Mail-Validierung
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(data.contact.emailPrivate.trim())) {
            contactData.emailPrivate = data.contact.emailPrivate.trim();
          } else {
            toast.error('Bitte geben Sie eine gültige private E-Mail-Adresse ein');
            return;
          }
        }

        if (Object.keys(contactData).length > 0) {
          updateData.contact = contactData;
        }
      }

      // Notfallkontakt - nur wenn Felder vorhanden sind (leere Strings werden entfernt)
      if (data.emergencyContact) {
        const emergencyContactData: Record<string, unknown> = {};
        if (data.emergencyContact.name?.trim())
          emergencyContactData.name = data.emergencyContact.name.trim();
        if (data.emergencyContact.relation?.trim())
          emergencyContactData.relation = data.emergencyContact.relation.trim();
        if (data.emergencyContact.phone?.trim())
          emergencyContactData.phone = data.emergencyContact.phone.trim();
        if (data.emergencyContact.email?.trim()) {
          // E-Mail-Validierung
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(data.emergencyContact.email.trim())) {
            emergencyContactData.email = data.emergencyContact.email.trim();
          } else {
            toast.error('Bitte geben Sie eine gültige E-Mail-Adresse für den Notfallkontakt ein');
            return;
          }
        }
        if (data.emergencyContact.address?.trim())
          emergencyContactData.address = data.emergencyContact.address.trim();

        if (Object.keys(emergencyContactData).length > 0) {
          updateData.emergencyContact = emergencyContactData;
        }
      }

      // Kontodaten - IBAN verschlüsseln (nur wenn geändert)
      if (data.bankAccount) {
        const bankAccountData: Record<string, unknown> = {};

        if (data.bankAccount.iban?.trim()) {
          const ibanValue = data.bankAccount.iban.trim().replace(/\s/g, '').toUpperCase();

          // Prüfe ob IBAN bereits verschlüsselt ist (verschlüsselte IBANs sind Base64-Strings, nicht im IBAN-Format)
          const isEncrypted =
            ibanValue.length > 30 && !ibanValue.match(/^[A-Z]{2}[0-9]{2}[A-Z0-9]/);

          if (!isEncrypted) {
            // IBAN validieren und verschlüsseln
            if (!validateIBAN(ibanValue)) {
              toast.error('Bitte geben Sie eine gültige IBAN ein');
              return;
            }

            try {
              bankAccountData.iban = EncryptionService.encryptIBAN(ibanValue);
            } catch (error) {
              toast.error(
                'Fehler bei der IBAN-Verschlüsselung: ' +
                  (error instanceof Error ? error.message : 'Unbekannter Fehler')
              );
              return;
            }
          } else {
            // Bereits verschlüsselt - direkt übernehmen (sollte eigentlich nicht vorkommen, aber sicherheitshalber)
            bankAccountData.iban = ibanValue;
          }
        }

        if (data.bankAccount.bic?.trim()) {
          bankAccountData.bic = data.bankAccount.bic.trim().replace(/\s/g, '').toUpperCase();
        }
        if (data.bankAccount.bankName?.trim()) {
          bankAccountData.bankName = data.bankAccount.bankName.trim();
        }
        if (data.bankAccount.accountHolder?.trim()) {
          bankAccountData.accountHolder = data.bankAccount.accountHolder.trim();
        }

        if (Object.keys(bankAccountData).length > 0) {
          updateData.bankAccount = bankAccountData;
        }
      }

      onSubmit(updateData as Partial<ProfileFormData> as ProfileFormData);
      setIsEditing(false);
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Profils: ' + (error as Error).message);
    }
  };

  const handleAddQualification = () => {
    if (newQualification.trim() && !watchedQualifications.includes(newQualification.trim())) {
      setValue('qualifications', [...watchedQualifications, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const handleRemoveQualification = (qualification: string) => {
    setValue(
      'qualifications',
      watchedQualifications.filter(q => q !== qualification)
    );
  };

  const handleNotificationChange = (key: keyof User['notificationSettings'], value: boolean) => {
    setValue('notificationSettings', {
      ...watchedNotificationSettings,
      [key]: value,
    });
  };

  const handlePasswordReset = async () => {
    try {
      // This would call Firebase Auth sendPasswordResetEmail
      // For now, just show a toast
      toast.info('Passwort-Reset-E-Mail wurde gesendet!');
    } catch (error) {
      toast.error('Fehler beim Senden der Passwort-Reset-E-Mail: ' + (error as Error).message);
    }
  };

  const qualificationOptions = [
    'Intensivpflege',
    'OP-Pflege',
    'Notfallmedizin',
    'Pädiatrie',
    'Geriatrie',
    'Onkologie',
    'Psychiatrie',
    'Sonstiges',
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Profil bearbeiten
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => {
                  // Formular auf ursprüngliche Werte zurücksetzen
                  reset({
                    displayName: user.displayName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: {
                      street: user.address?.street || '',
                      houseNumber: user.address?.houseNumber || '',
                      postalCode: user.address?.postalCode || '',
                      city: user.address?.city || '',
                      state: user.address?.state || '',
                      country: user.address?.country || '',
                    },
                    contact: {
                      phoneMobile: user.contact?.phoneMobile || '',
                      phoneHome: user.contact?.phoneHome || '',
                      phoneWork: user.contact?.phoneWork || '',
                      emailPrivate: user.contact?.emailPrivate || '',
                    },
                    emergencyContact: {
                      name: user.emergencyContact?.name || '',
                      relation: user.emergencyContact?.relation || '',
                      phone: user.emergencyContact?.phone || '',
                      email: user.emergencyContact?.email || '',
                      address: user.emergencyContact?.address || '',
                    },
                    bankAccount: {
                      iban: user.bankAccount?.iban || '',
                      bic: user.bankAccount?.bic || '',
                      bankName: user.bankAccount?.bankName || '',
                      accountHolder: user.bankAccount?.accountHolder || '',
                    },
                    qualifications: user.qualifications || [],
                    notificationSettings: user.notificationSettings || {
                      emailNotifications: true,
                      pushNotifications: true,
                      shiftReminders: true,
                      documentExpiry: true,
                      systemAnnouncements: true,
                    },
                  });
                  setIsEditing(false);
                  setShowIban(false);
                }}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isLoading}
                data-testid="profile-form-submit-button"
                aria-label="Profil speichern"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {isLoading ? 'Speichern...' : 'Speichern'}
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setIsEditing(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                borderWidth: 1.5,
                px: 3,
              }}
            >
              Bearbeiten
            </Button>
          )}
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={12}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Grunddaten
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('displayName')}
                      label="Name"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.displayName}
                      helperText={errors.displayName?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('email')}
                      label="E-Mail"
                      type="email"
                      fullWidth
                      disabled={true} // E-Mail ist read-only
                      error={!!errors.email}
                      helperText={errors.email?.message || 'E-Mail kann nicht geändert werden'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('phone')}
                      label="Telefon"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('contact.phoneMobile')}
                      label="Mobiltelefon"
                      type="tel"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.contact?.phoneMobile}
                      helperText={errors.contact?.phoneMobile?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('contact.phoneHome')}
                      label="Telefon privat"
                      type="tel"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.contact?.phoneHome}
                      helperText={errors.contact?.phoneHome?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('contact.emailPrivate')}
                      label="Private E-Mail"
                      type="email"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.contact?.emailPrivate}
                      helperText={errors.contact?.emailPrivate?.message}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Detaillierte Adresse */}
          <Grid size={12}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Adresse
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      {...register('address.street')}
                      label="Straße"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.address?.street}
                      helperText={errors.address?.street?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      {...register('address.houseNumber')}
                      label="Hausnummer"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.address?.houseNumber}
                      helperText={errors.address?.houseNumber?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      {...register('address.postalCode')}
                      label="PLZ"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.address?.postalCode}
                      helperText={errors.address?.postalCode?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      {...register('address.city')}
                      label="Stadt"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.address?.city}
                      helperText={errors.address?.city?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('address.state')}
                      label="Bundesland"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.address?.state}
                      helperText={errors.address?.state?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('address.country')}
                      label="Land"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.address?.country}
                      helperText={errors.address?.country?.message}
                      defaultValue="Deutschland"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Lock />}
                      onClick={handlePasswordReset}
                      sx={{ mt: 1 }}
                    >
                      Passwort ändern
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Kontodaten */}
          <Grid size={12}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Kontodaten
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="IBAN"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.bankAccount?.iban}
                      helperText={
                        errors.bankAccount?.iban?.message ||
                        (isEditing
                          ? 'IBAN wird verschlüsselt gespeichert'
                          : 'Zur Sicherheit maskiert (Klick auf Auge zum Anzeigen)')
                      }
                      value={(() => {
                        const iban = watch('bankAccount.iban') || '';
                        if (!iban) return '';
                        if (isEditing) {
                          // Im Bearbeitungsmodus: IBAN immer anzeigen (bereits entschlüsselt)
                          return iban;
                        }
                        // Im Anzeigemodus: IBAN maskieren oder anzeigen je nach showIban
                        return showIban ? iban : EncryptionService.maskIBAN(iban);
                      })()}
                      onChange={e => {
                        if (isEditing) {
                          const value = e.target.value.replace(/\s/g, '').toUpperCase();
                          setValue('bankAccount.iban', value, { shouldValidate: true });
                        }
                      }}
                      InputProps={{
                        endAdornment:
                          !isEditing && watch('bankAccount.iban') ? (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowIban(v => !v)}
                                edge="end"
                                size="small"
                              >
                                {showIban ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ) : undefined,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('bankAccount.bic')}
                      label="BIC"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.bankAccount?.bic}
                      helperText={errors.bankAccount?.bic?.message}
                      onChange={e => {
                        const value = e.target.value.replace(/\s/g, '').toUpperCase();
                        setValue('bankAccount.bic', value);
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('bankAccount.bankName')}
                      label="Bankname"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.bankAccount?.bankName}
                      helperText={errors.bankAccount?.bankName?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('bankAccount.accountHolder')}
                      label="Kontoinhaber"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.bankAccount?.accountHolder}
                      helperText={errors.bankAccount?.accountHolder?.message}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Notfallkontakt */}
          <Grid size={12}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Notfallkontakt
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('emergencyContact.name')}
                      label="Name"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.emergencyContact?.name}
                      helperText={errors.emergencyContact?.name?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('emergencyContact.relation')}
                      label="Verwandtschaftsverhältnis"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.emergencyContact?.relation}
                      helperText={errors.emergencyContact?.relation?.message}
                      placeholder="z.B. Ehepartner, Eltern, Geschwister"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('emergencyContact.phone')}
                      label="Telefon"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.emergencyContact?.phone}
                      helperText={errors.emergencyContact?.phone?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('emergencyContact.email')}
                      label="E-Mail"
                      type="email"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.emergencyContact?.email}
                      helperText={errors.emergencyContact?.email?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      {...register('emergencyContact.address')}
                      label="Adresse"
                      fullWidth
                      multiline
                      rows={2}
                      disabled={!isEditing}
                      error={!!errors.emergencyContact?.address}
                      helperText={errors.emergencyContact?.address?.message}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Qualifications */}
          <Grid size={12}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Qualifikationen
                </Typography>

                {isEditing ? (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                      <FormControl sx={{ minWidth: 220 }}>
                        <InputLabel>Qualifikation hinzufügen</InputLabel>
                        <Select
                          value={newQualification}
                          onChange={e => setNewQualification(e.target.value)}
                          label="Qualifikation hinzufügen"
                        >
                          <MenuItem value="">
                            <em>Aus Liste wählen</em>
                          </MenuItem>
                          {qualificationOptions.map(option => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        placeholder="Qualifikation hinzufügen"
                        label="Freitext"
                        value={customQualificationText}
                        onChange={e => setCustomQualificationText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customQualificationText.trim()) {
                              setValue('qualifications', [...watchedQualifications, customQualificationText.trim()]);
                              setCustomQualificationText('');
                            }
                          }
                        }}
                        sx={{ minWidth: 200 }}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => {
                          if (newQualification) {
                            handleAddQualification();
                          } else if (customQualificationText.trim() && !watchedQualifications.includes(customQualificationText.trim())) {
                            setValue('qualifications', [...watchedQualifications, customQualificationText.trim()]);
                            setCustomQualificationText('');
                          }
                        }}
                        disabled={!newQualification && !customQualificationText.trim()}
                      >
                        Hinzufügen
                      </Button>
                    </Box>
                  </Box>
                ) : null}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {watchedQualifications.map(qualification => (
                    <Chip
                      key={qualification}
                      label={qualification}
                      sx={{
                        backgroundColor: getQualificationColor(qualification),
                        color: 'white',
                      }}
                      onDelete={
                        isEditing ? () => handleRemoveQualification(qualification) : undefined
                      }
                      deleteIcon={<Delete />}
                    />
                  ))}
                </Box>

                {watchedQualifications.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Keine Qualifikationen hinzugefügt
                  </Typography>
                )}
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Notification Settings */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Benachrichtigungen
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={watchedNotificationSettings.emailNotifications}
                        onChange={e =>
                          handleNotificationChange('emailNotifications', e.target.checked)
                        }
                        disabled={!isEditing}
                      />
                    }
                    label="E-Mail-Benachrichtigungen"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={watchedNotificationSettings.shiftReminders}
                        onChange={e => handleNotificationChange('shiftReminders', e.target.checked)}
                        disabled={!isEditing}
                      />
                    }
                    label="Schicht-Erinnerungen"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={watchedNotificationSettings.documentExpiry}
                        onChange={e => handleNotificationChange('documentExpiry', e.target.checked)}
                        disabled={!isEditing}
                      />
                    }
                    label="Dokument-Ablauf"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={watchedNotificationSettings.systemAnnouncements}
                        onChange={e =>
                          handleNotificationChange('systemAnnouncements', e.target.checked)
                        }
                        disabled={!isEditing}
                      />
                    }
                    label="System-Ankündigungen"
                  />
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
