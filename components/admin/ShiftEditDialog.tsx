'use client';

import { Shift } from '@/lib/services/shifts';
import type { Facility, Station } from '@/lib/types';
import { shiftService, facilityService } from '@/lib/services';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete } from '@mui/material';

interface ShiftEditDialogProps {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function ShiftEditDialog({ open, shift, onClose, onUpdated }: ShiftEditDialogProps) {
  const [form, setForm] = useState({
    title: '',
    facilityId: '',
    stationId: '',
    date: '',
    startTime: '',
    endTime: '',
    type: '' as Shift['type'] | '',
    requiredQualifications: [] as string[],
    capacity: 1,
    status: 'open' as Shift['status'],
    notes: '',
    color: '#4CAF50' as string,
    surchargeNight: false,
    surchargeWeekend: false,
    surchargeHoliday: false,
    surchargeOnCall: false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load facilities
  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: () => facilityService.getAll(),
  });

  const selectedFacility = useMemo(
    () => facilities.find(f => f.id === form.facilityId) || null,
    [facilities, form.facilityId]
  );

  useEffect(() => {
    if (open && shift) {
      setForm({
        title: shift.title || '',
        facilityId: (shift as unknown as { facilityId?: string }).facilityId || '',
        stationId: (shift as unknown as { stationId?: string }).stationId || '',
        date: (shift as unknown as { date?: Date | string }).date
          ? typeof (shift as unknown as { date: Date }).date === 'string'
            ? (shift as unknown as { date: string }).date
            : (shift as unknown as { date: Date }).date.toISOString().slice(0, 10)
          : '',
        startTime: (shift as unknown as { startTime?: string }).startTime || '',
        endTime: (shift as unknown as { endTime?: string }).endTime || '',
        type: (shift as unknown as { type?: Shift['type'] }).type || '',
        requiredQualifications:
          (shift as unknown as { requiredQualifications?: string[] }).requiredQualifications || [],
        capacity: (shift as unknown as { capacity?: number }).capacity || 1,
        status: (shift as unknown as { status?: Shift['status'] }).status || 'open',
        notes: (shift as unknown as { notes?: string }).notes || '',
        color: (shift as unknown as { color?: string }).color || '#4CAF50',
        surchargeNight: Boolean((shift as unknown as { surchargeNight?: boolean }).surchargeNight),
        surchargeWeekend: Boolean(
          (shift as unknown as { surchargeWeekend?: boolean }).surchargeWeekend
        ),
        surchargeHoliday: Boolean(
          (shift as unknown as { surchargeHoliday?: boolean }).surchargeHoliday
        ),
        surchargeOnCall: Boolean(
          (shift as unknown as { surchargeOnCall?: boolean }).surchargeOnCall
        ),
      });
    }
  }, [open, shift]);

  const handleChange = (field: keyof typeof form, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const v: Record<string, string> = {};
    if (!form.title.trim()) v.title = 'Titel erforderlich';
    if (!form.facilityId) v.facilityId = 'Einrichtung auswählen';
    if (!form.stationId) v.stationId = 'Station auswählen';
    if (!form.date) v.date = 'Datum erforderlich';
    if (!form.startTime) v.startTime = 'Startzeit erforderlich';
    if (!form.endTime) v.endTime = 'Endzeit erforderlich';
    if (!form.type) v.type = 'Schichttyp auswählen';

    // Zeitfenster validieren
    if (form.startTime && form.endTime) {
      const [sh, sm] = form.startTime.split(':').map(Number);
      const [eh, em] = form.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      if (end <= start) v.endTime = 'Endzeit muss nach Startzeit liegen';
    }

    // Kapazität >= bereits zugewiesen
    const assigned = (shift as unknown as { assignedCount?: number })?.assignedCount || 0;
    if (form.capacity < assigned)
      v.capacity = `Kapazität darf zugewiesene (${assigned}) nicht unterschreiten`;

    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const handleSave = async () => {
    if (!shift) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await shiftService.update(shift.id, {
        title: form.title,
        facilityId: form.facilityId,
        stationId: form.stationId,
        date: form.date, // als ISO-String; Service übernimmt Konvertierung
        startTime: form.startTime,
        endTime: form.endTime,
        type: form.type,
        requiredQualifications: form.requiredQualifications,
        capacity: form.capacity,
        status: form.status,
        notes: form.notes,
        color: form.color,
      } as Partial<Shift>);
      onUpdated?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const disabled =
    !form.title ||
    !form.facilityId ||
    !form.stationId ||
    !form.date ||
    !form.startTime ||
    !form.endTime ||
    !form.type;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schicht bearbeiten</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!errors.facilityId}>
                <InputLabel>Einrichtung</InputLabel>
                <Select
                  label="Einrichtung"
                  value={form.facilityId}
                  onChange={e => handleChange('facilityId', e.target.value)}
                >
                  {facilities.map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!errors.stationId} disabled={!selectedFacility}>
                <InputLabel>Station</InputLabel>
                <Select
                  label="Station"
                  value={form.stationId}
                  onChange={e => handleChange('stationId', e.target.value)}
                >
                  {(selectedFacility?.stations || []).map((s: Station) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Schichttyp</InputLabel>
                <Select
                  label="Schichttyp"
                  value={form.type}
                  onChange={e => handleChange('type', e.target.value)}
                >
                  <MenuItem value="Frühdienst">Frühdienst</MenuItem>
                  <MenuItem value="Spätdienst">Spätdienst</MenuItem>
                  <MenuItem value="Nachtdienst">Nachtdienst</MenuItem>
                  <MenuItem value="On-call">On-call</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                multiple
                freeSolo
                options={
                  (selectedFacility?.stations?.find((s: Station) => s.id === form.stationId)
                    ?.requiredQualifications || []) as string[]
                }
                value={form.requiredQualifications}
                onChange={(_, newValue) =>
                  handleChange('requiredQualifications', newValue as string[])
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Erforderliche Qualifikationen"
                    placeholder="Qualifikation hinzufügen"
                  />
                )}
                renderTags={(value: readonly string[], getTagProps) =>
                  value.map((option: string, index: number) => {
                    const tagProps = getTagProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...tagProps}
                        key={tagProps.key || index}
                      />
                    );
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Zuschläge
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.surchargeNight}
                      onChange={e => handleChange('surchargeNight', e.target.checked)}
                    />
                  }
                  label="Nacht"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.surchargeWeekend}
                      onChange={e => handleChange('surchargeWeekend', e.target.checked)}
                    />
                  }
                  label="Wochenende"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.surchargeHoliday}
                      onChange={e => handleChange('surchargeHoliday', e.target.checked)}
                    />
                  }
                  label="Feiertag"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.surchargeOnCall}
                      onChange={e => handleChange('surchargeOnCall', e.target.checked)}
                    />
                  }
                  label="Rufbereitschaft"
                />
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Titel"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Datum"
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Start"
                type="time"
                value={form.startTime}
                onChange={e => handleChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.startTime}
                helperText={errors.startTime}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Ende"
                type="time"
                value={form.endTime}
                onChange={e => handleChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.endTime}
                helperText={errors.endTime}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Kapazität"
                type="number"
                inputProps={{ min: 1 }}
                value={form.capacity}
                onChange={e => handleChange('capacity', Math.max(1, Number(e.target.value || 1)))}
                error={!!errors.capacity}
                helperText={errors.capacity}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value as Shift['status'])}
                >
                  <MenuItem value="open">Offen</MenuItem>
                  <MenuItem value="filled">Besetzt</MenuItem>
                  <MenuItem value="cancelled">Abgesagt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Farbe"
                type="color"
                value={form.color}
                onChange={e => handleChange('color', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Farbe für die Schicht im Kalender"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notizen"
                multiline
                minRows={2}
                value={form.notes || ''}
                onChange={e => handleChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleSave} disabled={disabled || saving}>
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
