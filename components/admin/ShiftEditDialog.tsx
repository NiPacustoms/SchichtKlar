'use client';

import { Shift } from '@/lib/services/shifts';
import type { Facility, Station } from '@/lib/types';
import { shiftService, facilityService } from '@/lib/services';
import {
  SHIFT_COLOR_PRESETS,
  DEFAULT_SHIFT_COLOR,
  normalizeShiftColor,
} from '@/lib/constants/colorPresets';
import { ColorPresetSwatches } from '@/components/ui/ColorPresetSwatches';
import { FacilityCreateDialog } from '@/components/admin/FacilityCreateDialog';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Autocomplete } from '@mui/material';
import { toast } from '@/lib/utils/toast';

interface ShiftEditDialogProps {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const validShiftStatuses = ['open', 'filled', 'cancelled'] as const;

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
    color: DEFAULT_SHIFT_COLOR as string,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createFacilityOpen, setCreateFacilityOpen] = useState(false);
  const [addStationOpen, setAddStationOpen] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [addingStation, setAddingStation] = useState(false);

  const queryClient = useQueryClient();

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
      const rawType = (shift as unknown as { type?: string }).type || 'Frühdienst';
      const rawStatus = (shift as unknown as { status?: string }).status || 'open';
      const type = rawType;
      const status =
        rawStatus === 'assigned'
          ? 'filled'
          : validShiftStatuses.includes(rawStatus as (typeof validShiftStatuses)[number])
            ? rawStatus
            : 'open';

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
        type: type as Shift['type'] | '',
        requiredQualifications:
          (shift as unknown as { requiredQualifications?: string[] }).requiredQualifications || [],
        capacity: (shift as unknown as { capacity?: number }).capacity || 1,
        status: status as Shift['status'],
        notes: (shift as unknown as { notes?: string }).notes || '',
        color: normalizeShiftColor((shift as unknown as { color?: string }).color),
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
    // stationId ist optional (Einrichtung kann ohne Station genutzt werden)
    if (!form.date) v.date = 'Datum erforderlich';
    if (!form.startTime) v.startTime = 'Startzeit erforderlich';
    if (!form.endTime) v.endTime = 'Endzeit erforderlich';
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
    !form.date ||
    !form.startTime ||
    !form.endTime;

  const handleAddStation = async () => {
    const name = newStationName.trim();
    if (!name || !form.facilityId) return;
    setAddingStation(true);
    try {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `station-${Date.now()}`;
      await facilityService.addStation(form.facilityId, {
        id,
        name,
        requiredQualifications: [],
        maxStaff: 1,
      });
      await queryClient.invalidateQueries({ queryKey: ['facilities'] });
      handleChange('stationId', id);
      setAddStationOpen(false);
      setNewStationName('');
      toast.success('Station hinzugefügt.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Station konnte nicht hinzugefügt werden.');
    } finally {
      setAddingStation(false);
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schicht bearbeiten</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <FormControl fullWidth error={!!errors.facilityId} sx={{ flex: 1 }}>
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
                <Tooltip title="Neue Einrichtung anlegen">
                  <IconButton
                    onClick={() => setCreateFacilityOpen(true)}
                    color="primary"
                    aria-label="Neue Einrichtung anlegen"
                    sx={{ mt: 1 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <FormControl fullWidth error={!!errors.stationId} disabled={!selectedFacility} sx={{ flex: 1 }}>
                  <InputLabel>Station (optional)</InputLabel>
                  <Select
                    label="Station (optional)"
                    value={form.stationId}
                    onChange={e => handleChange('stationId', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Keine</em>
                    </MenuItem>
                    {(selectedFacility?.stations || []).map((s: Station) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title={selectedFacility ? 'Neue Station anlegen' : 'Zuerst Einrichtung wählen'}>
                  <span>
                    <IconButton
                      onClick={() => setAddStationOpen(true)}
                      color="primary"
                      disabled={!selectedFacility}
                      aria-label="Neue Station anlegen"
                      sx={{ mt: 1 }}
                    >
                      <AddIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
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
              <ColorPresetSwatches
                presets={SHIFT_COLOR_PRESETS}
                value={form.color}
                onChange={c => handleChange('color', c)}
                label="Farbe"
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

    <FacilityCreateDialog
      open={createFacilityOpen}
      onClose={() => setCreateFacilityOpen(false)}
      onCreated={(id) => {
        handleChange('facilityId', id);
        setCreateFacilityOpen(false);
      }}
    />

    <Dialog open={addStationOpen} onClose={() => { setAddStationOpen(false); setNewStationName(''); }} maxWidth="xs" fullWidth>
      <DialogTitle>Neue Station</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Station zur Einrichtung „{selectedFacility?.name}“ hinzufügen.
        </Typography>
        <TextField
          fullWidth
          label="Name der Station"
          value={newStationName}
          onChange={e => setNewStationName(e.target.value)}
          placeholder="z. B. Station Nord"
          onKeyDown={e => e.key === 'Enter' && handleAddStation()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setAddStationOpen(false); setNewStationName(''); }}>Abbrechen</Button>
        <Button variant="contained" onClick={handleAddStation} disabled={!newStationName.trim() || addingStation}>
          {addingStation ? 'Wird hinzugefügt…' : 'Hinzufügen'}
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
}
