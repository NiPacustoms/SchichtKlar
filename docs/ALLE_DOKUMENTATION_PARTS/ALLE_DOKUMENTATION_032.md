# JobFlow – Dokumentation Teil 32

*Zeichen 615951–635828 von 2862906*

---

  setSelectedShift(shift);
  setEditDialogOpen(true);
};
```

##### handleDeleteShift
```typescript
const handleDeleteShift = async (shift: any) => {
  if (window.confirm(`Möchten Sie die Schicht "${shift.title}" wirklich löschen?`)) {
    try {
      await deleteShift(shift.id);
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  }
};
```

##### handleAssignShift
```typescript
const handleAssignShift = (shift: any) => {
  setSelectedShift(shift);
  setAssignDialogOpen(true);
};
```

#### Loading-States
```typescript
if (isLoading) {
  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl" sx={{ maxWidth: '1280px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    </Box>
  );
}
```

#### Imports
```typescript
import { Box, Container, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Button, ToggleButtonGroup, ToggleButton, CircularProgress } from '@mui/material';
import { ScheduleList } from '@/components/schedule/ScheduleList';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { ShiftCreateDialog } from '@/components/admin/ShiftCreateDialog';
import { ShiftEditDialog } from '@/components/admin/ShiftEditDialog';
import { AssignShiftDialog } from '@/components/admin/AssignShiftDialog';
import { useScheduleManagement } from '@/lib/hooks/useScheduleManagement';
import { ViewList, CalendarMonth } from '@mui/icons-material';
```

---

## 2. ShiftCreateDialog-Komponente

### Datei: `components/admin/ShiftCreateDialog.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
interface ShiftCreateDialogProps {
  open: boolean;
  onClose: () => void;
}
```

### UI-Analyse

#### Dialog-Container
- **Element:** `<Dialog>`
- **Props:**
  - `open={open}`
  - `onClose={handleClose}`
  - `maxWidth="md"`
  - `fullWidth`

#### Dialog-Title
- **Element:** `<DialogTitle>`
- **Content:** "Neue Schicht erstellen"

#### Form-Element
- **Element:** `<form>`
- **Props:**
  - `onSubmit={handleSubmit(onSubmit)}`

#### Dialog-Content
- **Element:** `<DialogContent>`

#### Form-Grid
- **Element:** `<Grid container spacing={3}>`

#### Einrichtung-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `error={!!errors.facilityId}`
- **Content:**
  ```typescript
  <InputLabel>Einrichtung</InputLabel>
  <Select
    value={watch('facilityId') || ''}
    label="Einrichtung"
    onChange={e => handleFacilityChange(e.target.value)}
  >
    {facilities.map(facility => (
      <MenuItem key={facility.id} value={facility.id}>
        {facility.name}
      </MenuItem>
    ))}
  </Select>
  {errors.facilityId && (
    <FormHelperText>{errors.facilityId.message}</FormHelperText>
  )}
  ```

#### Station-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `error={!!errors.stationId}`
- **Content:**
  ```typescript
  <InputLabel>Station</InputLabel>
  <Select
    value={watch('stationId') || ''}
    label="Station"
    onChange={e => setValue('stationId', e.target.value)}
    disabled={!selectedFacility}
  >
    {selectedFacility?.stations.map(station => (
      <MenuItem key={station.id} value={station.id}>
        {station.name}
      </MenuItem>
    ))}
  </Select>
  {errors.stationId && <FormHelperText>{errors.stationId.message}</FormHelperText>}
  ```

#### Date-Picker
- **Element:** `<DatePicker>`
- **Props:**
  - `label="Datum"`
  - `value={watch('date')}`
  - `onChange={date => setValue('date', date || new Date())}`
  - `slotProps={{ textField: { fullWidth: true, error: !!errors.date, helperText: errors.date?.message } }}`

#### Schichttyp-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `error={!!errors.type}`
- **Content:**
  ```typescript
  <InputLabel>Schichttyp</InputLabel>
  <Select
    value={watch('type')}
    label="Schichttyp"
    onChange={e => setValue('type', e.target.value as any)}
  >
    <MenuItem value="Frühdienst">Frühdienst</MenuItem>
    <MenuItem value="Spätdienst">Spätdienst</MenuItem>
    <MenuItem value="Nachtdienst">Nachtdienst</MenuItem>
    <MenuItem value="On-call">On-call</MenuItem>
  </Select>
  {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
  ```

#### Startzeit-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Startzeit"`
  - `type="time"`
  - `value={watch('startTime')}`
  - `onChange={e => handleTimeChange('startTime', e.target.value)}`
  - `error={!!errors.startTime}`
  - `helperText={errors.startTime?.message}`
  - `InputLabelProps={{ shrink: true }}`

#### Endzeit-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Endzeit"`
  - `type="time"`
  - `value={watch('endTime')}`
  - `onChange={e => handleTimeChange('endTime', e.target.value)}`
  - `error={!!errors.endTime}`
  - `helperText={errors.endTime?.message}`
  - `InputLabelProps={{ shrink: true }}`

#### Overnight-Alert (Conditional)
- **Element:** `<Alert>`
- **Props:**
  - `severity="info"`
- **Conditional Rendering:** `{isOvernight && <Alert>...}`
- **Content:**
  ```typescript
  <Typography variant="body2">
    <strong>Overnight-Schicht erkannt:</strong> Die Endzeit liegt vor der
    Startzeit. Die Schicht geht über Mitternacht und wird automatisch korrekt
    berechnet.
  </Typography>
  ```

#### Kapazität-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Kapazität"`
  - `type="number"`
  - `value={watch('capacity')}`
  - `onChange={e => setValue('capacity', parseInt(e.target.value) || 1)}`
  - `error={!!errors.capacity}`
  - `helperText={errors.capacity?.message || 'Anzahl der benötigten Mitarbeiter'}`
  - `inputProps={{ min: 1 }}`

#### Qualifikationen-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle2" gutterBottom>
    Erforderliche Qualifikationen
  </Typography>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
    {selectedFacility?.stations
      .find(s => s.id === watch('stationId'))
      ?.requiredQualifications.map(qualification => (
        <Chip
          key={qualification}
          label={qualification}
          onClick={() => {
            const current = watch('requiredQualifications');
            const updated = current.includes(qualification)
              ? current.filter(q => q !== qualification)
              : [...current, qualification];
            setValue('requiredQualifications', updated);
          }}
          color={
            watch('requiredQualifications').includes(qualification)
              ? 'primary'
              : 'default'
          }
          variant={
            watch('requiredQualifications').includes(qualification)
              ? 'filled'
              : 'outlined'
          }
        />
      ))}
  </Box>
  {errors.requiredQualifications && (
    <FormHelperText error>{errors.requiredQualifications.message}</FormHelperText>
  )}
  ```

#### Notizen-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Notizen (optional)"`
  - `multiline`
  - `rows={3}`
  - `value={watch('notes')}`
  - `onChange={e => setValue('notes', e.target.value)}`
  - `error={!!errors.notes}`
  - `helperText={errors.notes?.message}`

#### Error-Alert (Conditional)
- **Element:** `<Alert>`
- **Props:**
  - `severity="error"`
  - `sx={{ mt: 2 }}`
- **Conditional Rendering:** `{createShiftMutation.error && <Alert>...}`
- **Content:** `{createShiftMutation.error.message}`

#### Dialog-Actions
- **Element:** `<DialogActions>`

#### Cancel-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleClose}`
  - `disabled={createShiftMutation.isPending}`
- **Text:** "Abbrechen"

#### Submit-Button
- **Element:** `<Button>`
- **Props:**
  - `type="submit"`
  - `variant="contained"`
  - `disabled={createShiftMutation.isPending}`
- **Text:** `{createShiftMutation.isPending ? 'Erstelle...' : 'Schicht erstellen'}`

### Funktions-Analyse

#### State-Management
```typescript
const { user } = useAuth();
const queryClient = useQueryClient();
const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
const [isOvernight, setIsOvernight] = useState(false);
```

#### Form-Hook
```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  setValue,
  watch,
  reset,
} = useForm<ShiftCreateFormData>({
  resolver: zodResolver(shiftCreateSchema),
  defaultValues: {
    capacity: 1,
    requiredQualifications: [],
    type: 'Frühdienst',
  },
});
```

#### Validation-Schema
```typescript
const shiftCreateSchema = z.object({
  facilityId: z.string().min(1, 'Einrichtung ist erforderlich'),
  stationId: z.string().min(1, 'Station ist erforderlich'),
  date: z.date(),
  startTime: z.string().min(1, 'Startzeit ist erforderlich'),
  endTime: z.string().min(1, 'Endzeit ist erforderlich'),
  type: z.enum(['Frühdienst', 'Spätdienst', 'Nachtdienst', 'On-call']),
  capacity: z.number().min(1, 'Kapazität muss mindestens 1 sein'),
  requiredQualifications: z.array(z.string()),
  notes: z.string().optional(),
});
```

#### Data-Queries
```typescript
// Facilities laden
const { data: facilities = [] } = useQuery({
  queryKey: ['facilities'],
  queryFn: () => facilityService.getAll(),
});

// Schicht erstellen
const createShiftMutation = useMutation({
  mutationFn: async (data: ShiftCreateFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    return await shiftService.createWithCapacity({
      ...data,
      createdBy: user.id,
      tz: 'Europe/Berlin',
    } as any);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
    toast.success('Schicht erfolgreich erstellt!');
    onClose();
    reset();
  },
  onError: (error) => {
    toast.error('Fehler beim Erstellen der Schicht: ' + error.message);
  },
});
```

#### Event-Handler

##### handleFacilityChange
```typescript
const handleFacilityChange = (facilityId: string) => {
  const facility = facilities.find(f => f.id === facilityId);
  setSelectedFacility(facility || null);
  setValue('stationId', ''); // Station zurücksetzen
};
```

##### handleTimeChange
```typescript
const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
  setValue(field, value);

  // Overnight-Check
  const startTime = field === 'startTime' ? value : watch('startTime');
  const endTime = field === 'endTime' ? value : watch('endTime');

  if (startTime && endTime) {
    const overnight = endTime < startTime;
    setIsOvernight(overnight);
  }
};
```

##### onSubmit
```typescript
const onSubmit = (data: ShiftCreateFormData) => {
  createShiftMutation.mutate(data);
};
```

##### handleClose
```typescript
const handleClose = () => {
  reset();
  setSelectedFacility(null);
  setIsOvernight(false);
  onClose();
};
```

---

## 3. ShiftEditDialog-Komponente

### Datei: `components/admin/ShiftEditDialog.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
interface ShiftEditDialogProps {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
  onUpdated?: () => void;
}
```

### UI-Analyse

#### Dialog-Container
- **Element:** `<Dialog>`
- **Props:**
  - `open={open}`
  - `onClose={onClose}`
  - `maxWidth="sm"`
  - `fullWidth`

#### Dialog-Title
- **Element:** `<DialogTitle>`
- **Content:** "Schicht bearbeiten"

#### Dialog-Content
- **Element:** `<DialogContent>`
- **Props:**
  - `sx={{ pt: 2 }}`

#### Form-Grid
- **Element:** `<Grid container spacing={2}>`

#### Einrichtung-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `error={!!errors.facilityId}`
- **Content:**
  ```typescript
  <InputLabel>Einrichtung</InputLabel>
  <Select
    label="Einrichtung"
    value={form.facilityId}
    onChange={(e) => handleChange('facilityId', e.target.value)}
  >
    {facilities.map((f: any) => (
      <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
    ))}
  </Select>
  ```

#### Station-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `error={!!errors.stationId}`
  - `disabled={!selectedFacility}`
- **Content:**
  ```typescript
  <InputLabel>Station</InputLabel>
  <Select
    label="Station"
    value={form.stationId}
    onChange={(e) => handleChange('stationId', e.target.value)}
  >
    {(selectedFacility?.stations || []).map((s: any) => (
      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
    ))}
  </Select>
  ```

#### Schichttyp-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `error={!!errors.type}`
- **Content:**
  ```typescript
  <InputLabel>Schichttyp</InputLabel>
  <Select
    label="Schichttyp"
    value={form.type}
    onChange={(e) => handleChange('type', e.target.value)}
  >
    <MenuItem value="Frühdienst">Frühdienst</MenuItem>
    <MenuItem value="Spätdienst">Spätdienst</MenuItem>
    <MenuItem value="Nachtdienst">Nachtdienst</MenuItem>
    <MenuItem value="On-call">On-call</MenuItem>
  </Select>
  ```

#### Qualifikationen-Autocomplete
- **Element:** `<Autocomplete>`
- **Props:**
  - `multiple`
  - `freeSolo`
  - `options={(selectedFacility?.stations?.find((s: any) => s.id === form.stationId)?.requiredQualifications || []) as string[]}`
  - `value={form.requiredQualifications}`
  - `onChange={(_, newValue) => handleChange('requiredQualifications', newValue as string[])}`
- **Content:**
  ```typescript
  renderInput={(params) => (
    <TextField
      {...params}
      label="Erforderliche Qualifikationen"
      placeholder="Qualifikation hinzufügen"
    />
  )}
  renderTags={(value: readonly string[], getTagProps) =>
    value.map((option: string, index: number) => (
      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
    ))
  }
  ```

#### Zuschläge-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Divider sx={{ my: 1 }} />
  <Typography variant="subtitle2" sx={{ mb: 1 }}>Zuschläge</Typography>
  <FormGroup row>
    <FormControlLabel
      control={<Checkbox checked={form.surchargeNight} onChange={(e) => handleChange('surchargeNight', e.target.checked)} />}
      label="Nacht"
    />
    <FormControlLabel
      control={<Checkbox checked={form.surchargeWeekend} onChange={(e) => handleChange('surchargeWeekend', e.target.checked)} />}
      label="Wochenende"
    />
    <FormControlLabel
      control={<Checkbox checked={form.surchargeHoliday} onChange={(e) => handleChange('surchargeHoliday', e.target.checked)} />}
      label="Feiertag"
    />
    <FormControlLabel
      control={<Checkbox checked={form.surchargeOnCall} onChange={(e) => handleChange('surchargeOnCall', e.target.checked)} />}
      label="Rufbereitschaft"
    />
  </FormGroup>
  ```

#### Titel-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Titel"`
  - `value={form.title}`
  - `onChange={(e) => handleChange('title', e.target.value)}`
  - `error={!!errors.title}`
  - `helperText={errors.title}`

#### Datum-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Datum"`
  - `type="date"`
  - `value={form.date}`
  - `onChange={(e) => handleChange('date', e.target.value)}`
  - `InputLabelProps={{ shrink: true }}`
  - `error={!!errors.date}`
  - `helperText={errors.date}`

#### Startzeit-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Start"`
  - `type="time"`
  - `value={form.startTime}`
  - `onChange={(e) => handleChange('startTime', e.target.value)}`
  - `InputLabelProps={{ shrink: true }}`
  - `error={!!errors.startTime}`
  - `helperText={errors.startTime}`

#### Endzeit-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Ende"`
  - `type="time"`
  - `value={form.endTime}`
  - `onChange={(e) => handleChange('endTime', e.target.value)}`
  - `InputLabelProps={{ shrink: true }}`
  - `error={!!errors.endTime}`
  - `helperText={errors.endTime}`

#### Kapazität-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Kapazität"`
  - `type="number"`
  - `inputProps={{ min: 1 }}`
  - `value={form.capacity}`
  - `onChange={(e) => handleChange('capacity', Math.max(1, Number(e.target.value || 1)))}`
  - `error={!!errors.capacity}`
  - `helperText={errors.capacity}`

#### Status-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
- **Content:**
  ```typescript
  <InputLabel>Status</InputLabel>
  <Select
    label="Status"
    value={form.status}
    onChange={(e) => handleChange('status', e.target.value as any)}
  >
    <MenuItem value="open">Offen</MenuItem>
    <MenuItem value="filled">Besetzt</MenuItem>
    <MenuItem value="cancelled">Abgesagt</MenuItem>
  </Select>
  ```

#### Notizen-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Notizen"`
  - `multiline`
  - `minRows={2}`
  - `value={form.notes || ''}`
  - `onChange={(e) => handleChange('notes', e.target.value)}`

#### Dialog-Actions
- **Element:** `<DialogActions>`

#### Cancel-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={onClose}`
- **Text:** "Abbrechen"

#### Save-Button
- **Element:** `<Button>`
- **Props:**
  - `variant="contained"`
  - `onClick={handleSave}`
  - `disabled={disabled || saving}`
- **Text:** "Speichern"

### Funktions-Analyse

#### State-Management
```typescript
const [form, setForm] = useState({
  title: '',
  facilityId: '',
  stationId: '',
  date: '',
  startTime: '',
  endTime: '',
  type: '' as any,
  requiredQualifications: [] as string[],
  capacity: 1,
  status: 'open' as Shift['status'],
  notes: '' as string | undefined,
  surchargeNight: false,
  surchargeWeekend: false,
  surchargeHoliday: false,
  surchargeOnCall: false,
});

const [saving, setSaving] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

#### Data-Queries
```typescript
// Load facilities
const { data: facilities = [] } = useQuery({
  queryKey: ['facilities'],
  queryFn: () => facilityService.getAll(),
});

const selectedFacility = useMemo(() => facilities.find((f: any) => f.id === form.facilityId) || null, [facilities, form.facilityId]);
```

#### useEffect für Data-Loading
```typescript
useEffect(() => {
  if (open && shift) {
    setForm({
      title: shift.title || '',
      facilityId: (shift as any).facilityId || '',
      stationId: (shift as any).stationId || '',
      date: (shift as any).date || '',
      startTime: (shift as any).startTime || '',
      endTime: (shift as any).endTime || '',
      type: (shift as any).type || '',
      requiredQualifications: (shift as any).requiredQualifications || [],
      capacity: (shift as any).capacity || 1,
      status: (shift as any).status || 'open',
      notes: (shift as any).notes || '',
      surchargeNight: Boolean((shift as any).surchargeNight),
      surchargeWeekend: Boolean((shift as any).surchargeWeekend),
      surchargeHoliday: Boolean((shift as any).surchargeHoliday),
      surchargeOnCall: Boolean((shift as any).surchargeOnCall),
    });
  }
}, [open, shift]);
```

#### Event-Handler

##### handleChange
```typescript
const handleChange = (field: keyof typeof form, value: any) => {
  setForm(prev => ({ ...prev, [field]: value }));
};
```

##### validate
```typescript
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
