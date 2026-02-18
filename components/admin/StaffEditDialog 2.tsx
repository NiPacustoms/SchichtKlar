'use client';

import { logger } from '@/lib/logging';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
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
import { Edit, Close } from '@mui/icons-material';
import { useState, useEffect } from 'react';

interface StaffMember {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: 'nurse' | 'dispatcher' | 'admin';
  qualifications: string[];
  active: boolean;
  group?: string;
  createdAt: Date;
  lastActive?: Date;
}

interface StaffEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (staffData: StaffMember) => void;
  staff: StaffMember | null;
}

// These will be loaded from the category manager
const DEFAULT_QUALIFICATION_OPTIONS = [
  'Krankenpfleger',
  'Intensivpflege',
  'OP-Pflege',
  'Geriatrie',
];

const DEFAULT_GROUP_OPTIONS = ['Intensivstation', 'Operationssaal', 'Geriatrie', 'Pädiatrie'];

// const DEFAULT_ROLE_OPTIONS = ['Krankenschwester','Disponent','Administrator'];

export function StaffEditDialog({ open, onClose, onSave, staff }: StaffEditDialogProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    role: 'Krankenschwester',
    qualifications: [] as string[],
    group: '',
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [availableGroups] = useState(DEFAULT_GROUP_OPTIONS);
  const [availableQualifications] = useState(DEFAULT_QUALIFICATION_OPTIONS);

  // Load staff data when dialog opens
  useEffect(() => {
    if (staff && open) {
      setFormData({
        displayName: staff.displayName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        qualifications: staff.qualifications || [],
        group: staff.group || '',
        active: staff.active,
      });
      setErrors({});
    }
  }, [staff, open]);

  const handleInputChange = (field: keyof StaffMember | string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name ist erforderlich';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonnummer ist erforderlich';
    } else if (!/^\+?[0-9\s\-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Ungültige Telefonnummer';
    }

    if (formData.qualifications.length === 0) {
      newErrors.qualifications = 'Mindestens eine Qualifikation ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!staff) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        id: staff.id,
        createdAt: staff.createdAt,
        role: formData.role as 'nurse' | 'dispatcher' | 'admin',
      });
      handleClose();
    } catch (error) {
      logger.error('Error updating staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      displayName: '',
      email: '',
      phone: '',
      role: 'nurse',
      qualifications: [],
      group: '',
      active: true,
    });
    setErrors({});
    onClose();
  };

  const handleAddQualification = (qualification: string) => {
    if (qualification && !formData.qualifications.includes(qualification)) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualification],
      }));
    }
  };

  const handleRemoveQualification = (qualification: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(q => q !== qualification),
    }));
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Mitarbeiter bearbeiten: {staff.displayName}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Grundinformationen
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.displayName}
              onChange={e => handleInputChange('displayName', e.target.value)}
              error={!!errors.displayName}
              helperText={errors.displayName}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="E-Mail"
              type="email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Telefonnummer"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Rolle</InputLabel>
              <Select
                value={formData.role}
                onChange={e => handleInputChange('role', e.target.value)}
                label="Rolle"
              >
                <MenuItem value="nurse">Krankenschwester</MenuItem>
                <MenuItem value="dispatcher">Disponent</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Gruppe/Abteilung</InputLabel>
              <Select
                value={formData.group}
                onChange={e => handleInputChange('group', e.target.value)}
                label="Gruppe/Abteilung"
              >
                <MenuItem value="">Keine Gruppe</MenuItem>
                {availableGroups.map((group: string) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                  helperText="Geben Sie eine neue Qualifikation ein oder wählen Sie aus der Liste"
                />
              )}
            />
          </Grid>

          {formData.qualifications.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {formData.qualifications.map((qualification, index) => (
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
                {errors.qualifications}
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
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.active ? 'active' : 'inactive'}
                onChange={e => handleInputChange('active', e.target.value === 'active')}
                label="Status"
              >
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="inactive">Inaktiv</MenuItem>
              </Select>
            </FormControl>
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

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading} startIcon={<Edit />}>
          {loading ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
