'use client';

import { useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { facilityService } from '@/lib/services';
import type { Facility } from '@/lib/types';
import { COLOR_PRESETS, DEFAULT_PRESET_COLOR } from '@/lib/constants/colorPresets';
import {
  type FacilityFormData,
  createInitialFacilityFormData,
  validateFacilityForm,
} from '@/lib/utils/facilityFormUtils';
import { logger } from '@/lib/logging';
import { toast } from '@/lib/utils/toast';
import { AccountBalance, Business, Receipt } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FacilityCreateDialogProps {
  open: boolean;
  onClose: () => void;
  /** Wird mit der neuen Einrichtungs-ID aufgerufen, falls gewünscht (z. B. zum sofortigen Auswählen). */
  onCreated?: (facilityId: string) => void;
}

export function FacilityCreateDialog({ open, onClose, onCreated }: FacilityCreateDialogProps) {
  const [formData, setFormData] = useState<FacilityFormData>(
    createInitialFacilityFormData(DEFAULT_PRESET_COLOR)
  );
  const [errors, setErrors] = useState<Partial<FacilityFormData>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const closeRef = useRef<() => void>(() => {});

  const handleClose = () => {
    setSaveError(null);
    setFormData(createInitialFacilityFormData(DEFAULT_PRESET_COLOR));
    setErrors({});
    onClose();
  };
  closeRef.current = handleClose;

  const createFacilityMutation = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      if (!user?.companyId) {
        throw new Error('Keine Firmen-ID verfügbar. Bitte erneut anmelden.');
      }
      const payload = {
        companyId: user.companyId,
        name: data.name,
        address: data.address,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        debtorNumber: data.debtorNumber,
        billingName: data.billingName,
        billingAddress: data.billingAddress,
        billingZip: data.billingZip,
        billingCity: data.billingCity,
        billingEmail: data.billingEmail,
        billingPhone: data.billingPhone,
        paymentTerms: data.paymentTerms,
        taxId: data.taxId,
        vatId: data.vatId,
        colorCode: data.colorCode,
        stations: [],
      } as Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>;
      return facilityService.create(payload);
    },
    onSuccess: (newId: string) => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success('Einrichtung erfolgreich erstellt!');
      onCreated?.(newId);
      closeRef.current();
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setSaveError(msg);
      toast.error('Fehler beim Erstellen: ' + msg);
    },
  });

  const handleSubmit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSaveError(null);
    const { valid, errors: nextErrors } = validateFacilityForm(formData);
    setErrors(nextErrors);
    if (!valid) {
      toast.error('Bitte prüfen Sie die markierten Felder.');
      return;
    }
    logger.info('Facility create submit', { name: formData.name, companyId: user?.companyId });
    createFacilityMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof FacilityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Business sx={{ mr: 2, fontSize: 24 }} />
          Neue Einrichtung erstellen
        </Box>
      </DialogTitle>
      <DialogContent>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}
        {createFacilityMutation.isPending && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Einrichtung wird erstellt… Bitte warten.
          </Alert>
        )}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Business sx={{ mr: 1, fontSize: 20 }} />
              Grunddaten
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Name der Einrichtung *"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Debitornummer *"
              value={formData.debtorNumber}
              onChange={e => handleInputChange('debtorNumber', e.target.value)}
              error={!!errors.debtorNumber}
              helperText={errors.debtorNumber}
              InputProps={{
                startAdornment: <Receipt sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Adresse *"
              value={formData.address}
              onChange={e => handleInputChange('address', e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              multiline
              rows={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Ansprechpartner *"
              value={formData.contactPerson}
              onChange={e => handleInputChange('contactPerson', e.target.value)}
              error={!!errors.contactPerson}
              helperText={errors.contactPerson}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Telefon *"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="E-Mail *"
              type="email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Farbe</InputLabel>
              <Select
                value={formData.colorCode}
                onChange={e => handleInputChange('colorCode', e.target.value)}
                label="Farbe"
                renderValue={v => {
                  const preset = COLOR_PRESETS.find(c => c.value === v);
                  return preset ? preset.label : v;
                }}
              >
                {COLOR_PRESETS.map(preset => (
                  <MenuItem key={preset.value} value={preset.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: preset.value,
                          borderRadius: '50%',
                          border: '1px solid rgba(0,0,0,0.2)',
                        }}
                      />
                      {preset.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <AccountBalance sx={{ mr: 1, fontSize: 20 }} />
              Abrechnungsdaten
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Abrechnungs-Name (Firma/Ansprechpartner)"
              value={formData.billingName}
              onChange={e => handleInputChange('billingName', e.target.value)}
              helperText="Falls abweichend von der Einrichtung"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Abrechnungsadresse (Straße, Hausnr.)"
              value={formData.billingAddress}
              onChange={e => handleInputChange('billingAddress', e.target.value)}
              helperText="Falls abweichend von der Hauptadresse"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="PLZ"
              value={formData.billingZip}
              onChange={e => handleInputChange('billingZip', e.target.value)}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Stadt"
              value={formData.billingCity}
              onChange={e => handleInputChange('billingCity', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Abrechnungs-E-Mail"
              value={formData.billingEmail}
              onChange={e => handleInputChange('billingEmail', e.target.value)}
              error={!!errors.billingEmail}
              helperText={errors.billingEmail || 'Falls abweichend von der Haupt-E-Mail'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Abrechnungs-Telefon"
              value={formData.billingPhone}
              onChange={e => handleInputChange('billingPhone', e.target.value)}
              helperText="Falls abweichend von der Haupt-Telefonnummer"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Zahlungsbedingungen"
              value={formData.paymentTerms}
              onChange={e => handleInputChange('paymentTerms', e.target.value)}
              helperText="z.B. '30 Tage netto'"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Steuernummer"
              value={formData.taxId}
              onChange={e => handleInputChange('taxId', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Umsatzsteuer-ID"
              value={formData.vatId}
              onChange={e => handleInputChange('vatId', e.target.value)}
              helperText="Falls vorhanden"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={createFacilityMutation.isPending}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          variant="contained"
          disabled={createFacilityMutation.isPending}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
          }}
        >
          {createFacilityMutation.isPending ? 'Erstellen...' : 'Erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
