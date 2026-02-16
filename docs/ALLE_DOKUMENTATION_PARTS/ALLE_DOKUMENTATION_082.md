# JobFlow – Dokumentation Teil 82

*Zeichen 1609377–1629222 von 2862906*

---

      Neuen Mitarbeiter erstellen
    </Typography>
    <IconButton onClick={handleClose} size="small">
      <Close />
    </IconButton>
  </Box>
  ```

#### Dialog-Content
- **Element:** `<DialogContent>`
- **Props:**
  - `sx={{ mt: 1 }}`

#### Form-Grid
- **Element:** `<Grid container spacing={3}>`

#### Grundinformationen-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
    Grundinformationen
  </Typography>
  ```

#### Name-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Name"`
  - `value={formData.displayName}`
  - `onChange={(e) => handleInputChange('displayName', e.target.value)}`
  - `error={!!errors.displayName}`
  - `helperText={errors.displayName}`
  - `required`

#### Email-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="E-Mail"`
  - `type="email"`
  - `value={formData.email}`
  - `onChange={(e) => handleInputChange('email', e.target.value)}`
  - `error={!!errors.email}`
  - `helperText={errors.email}`
  - `required`

#### Phone-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Telefonnummer"`
  - `value={formData.phone}`
  - `onChange={(e) => handleInputChange('phone', e.target.value)}`
  - `error={!!errors.phone}`
  - `helperText={errors.phone}`
  - `required`

#### Role-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `required`
- **Content:**
  ```typescript
  <InputLabel>Berufsbezeichnung</InputLabel>
  <Select
    value={formData.role}
    onChange={(e) => handleInputChange('role', e.target.value)}
    label="Berufsbezeichnung"
  >
    {availableRoles.map((role) => (
      <MenuItem key={role} value={role}>
        {role}
      </MenuItem>
    ))}
  </Select>
  ```

#### Group-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
- **Content:**
  ```typescript
  <InputLabel>Gruppe/Abteilung</InputLabel>
  <Select
    value={formData.group}
    onChange={(e) => handleInputChange('group', e.target.value)}
    label="Gruppe/Abteilung"
  >
    <MenuItem value="">Keine Gruppe</MenuItem>
    {availableGroups.map((group) => (
      <MenuItem key={group} value={group}>
        {group}
      </MenuItem>
    ))}
  </Select>
  ```

#### Qualifikationen-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
    Qualifikationen
  </Typography>
  ```

#### Qualification-Autocomplete
- **Element:** `<Autocomplete>`
- **Props:**
  - `freeSolo`
  - `options={availableQualifications}`
  - `value=""`
  - `onChange={(event, newValue) => { if (newValue && typeof newValue === 'string') { handleAddQualification(newValue); } }}`
- **Content:**
  ```typescript
  renderInput={(params) => (
    <TextField
      {...params}
      label="Qualifikation hinzufügen"
      placeholder="Qualifikation eingeben oder aus Liste wählen"
      helperText="Geben Sie eine neue Qualifikation ein oder wählen Sie aus der Liste"
    />
  )}
  ```

#### Qualification-Chips
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}`
- **Conditional Rendering:** `{formData.qualifications.length > 0 && <Box>...}`
- **Content:**
  ```typescript
  {formData.qualifications.map((qualification, index) => (
    <Chip
      key={index}
      label={qualification}
      onDelete={() => handleRemoveQualification(qualification)}
      color="primary"
      variant="outlined"
    />
  ))}
  ```

#### Qualification-Error-Alert
- **Element:** `<Alert>`
- **Props:**
  - `severity="error"`
  - `sx={{ mt: 1 }}`
- **Conditional Rendering:** `{errors.qualifications && <Alert>...}`
- **Content:** `{errors.qualifications}`

#### Status-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
    Status
  </Typography>
  ```

#### Status-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
- **Content:**
  ```typescript
  <InputLabel>Status</InputLabel>
  <Select
    value={formData.active ? 'active' : 'inactive'}
    onChange={(e) => handleInputChange('active', e.target.value === 'active')}
    label="Status"
  >
    <MenuItem value="active">Aktiv</MenuItem>
    <MenuItem value="inactive">Inaktiv</MenuItem>
  </Select>
  ```

#### Dialog-Actions
- **Element:** `<DialogActions>`
- **Props:**
  - `sx={{ p: 3, pt: 0 }}`

#### Cancel-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleClose}`
  - `disabled={loading}`
- **Text:** "Abbrechen"

#### Save-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleSave}`
  - `variant="contained"`
  - `disabled={loading}`
  - `startIcon={<Add />}`
- **Text:** `{loading ? 'Erstelle...' : 'Mitarbeiter erstellen'}`

### Funktions-Analyse

#### State-Management
```typescript
const [formData, setFormData] = useState({
  displayName: '',
  email: '',
  phone: '',
  role: 'Krankenschwester',
  qualifications: [] as string[],
  group: '',
  active: true
});

const [errors, setErrors] = useState<Record<string, string>>({});
const [loading, setLoading] = useState(false);
const [availableRoles, setAvailableRoles] = useState(DEFAULT_ROLE_OPTIONS);
const [availableGroups, setAvailableGroups] = useState(DEFAULT_GROUP_OPTIONS);
const [availableQualifications, setAvailableQualifications] = useState(DEFAULT_QUALIFICATION_OPTIONS);
```

#### Default-Constants
```typescript
const DEFAULT_QUALIFICATION_OPTIONS = [
  'Krankenpfleger',
  'Intensivpflege',
  'OP-Pflege',
  'Geriatrie'
];

const DEFAULT_GROUP_OPTIONS = [
  'Intensivstation',
  'Operationssaal',
  'Geriatrie',
  'Pädiatrie'
];

const DEFAULT_ROLE_OPTIONS = [
  'Krankenschwester',
  'Disponent',
  'Administrator'
];
```

#### Input-Change-Handler
```typescript
const handleInputChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error when user starts typing
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }
};
```

#### Form-Validation
```typescript
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
  } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
    newErrors.phone = 'Ungültige Telefonnummer';
  }

  if (formData.qualifications.length === 0) {
    newErrors.qualifications = 'Mindestens eine Qualifikation ist erforderlich';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### Save-Handler
```typescript
const handleSave = async () => {
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  try {
    await onSave(formData);
    handleClose();
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false);
  }
};
```

#### Close-Handler
```typescript
const handleClose = () => {
  setFormData({
    displayName: '',
    email: '',
    phone: '',
    role: 'nurse',
    qualifications: [],
    group: '',
    active: true
  });
  setErrors({});
  onClose();
};
```

#### Qualification-Handlers
```typescript
const handleAddQualification = (qualification: string) => {
  if (qualification && !formData.qualifications.includes(qualification)) {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, qualification]
    }));
  }
};

const handleRemoveQualification = (qualification: string) => {
  setFormData(prev => ({
    ...prev,
    qualifications: prev.qualifications.filter(q => q !== qualification)
  }));
};
```

---

## 3. StaffEditDialog-Komponente

### Datei: `components/admin/StaffEditDialog.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
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
  onSave?: (staffData: any) => void;
  staff?: StaffMember | null;
  user?: any;
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
- **Content:**
  ```typescript
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      Mitarbeiter bearbeiten: {staff.displayName}
    </Typography>
    <IconButton onClick={handleClose} size="small">
      <Close />
    </IconButton>
  </Box>
  ```

#### Dialog-Content
- **Element:** `<DialogContent>`
- **Props:**
  - `sx={{ mt: 1 }}`

#### Form-Grid
- **Element:** `<Grid container spacing={3}>`

#### Grundinformationen-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
    Grundinformationen
  </Typography>
  ```

#### Name-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Name"`
  - `value={formData.displayName}`
  - `onChange={(e) => handleInputChange('displayName', e.target.value)}`
  - `error={!!errors.displayName}`
  - `helperText={errors.displayName}`
  - `required`

#### Email-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="E-Mail"`
  - `type="email"`
  - `value={formData.email}`
  - `onChange={(e) => handleInputChange('email', e.target.value)}`
  - `error={!!errors.email}`
  - `helperText={errors.email}`
  - `required`

#### Phone-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Telefonnummer"`
  - `value={formData.phone}`
  - `onChange={(e) => handleInputChange('phone', e.target.value)}`
  - `error={!!errors.phone}`
  - `helperText={errors.phone}`
  - `required`

#### Role-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
  - `required`
- **Content:**
  ```typescript
  <InputLabel>Rolle</InputLabel>
  <Select
    value={formData.role}
    onChange={(e) => handleInputChange('role', e.target.value)}
    label="Rolle"
  >
    <MenuItem value="nurse">Krankenschwester</MenuItem>
    <MenuItem value="dispatcher">Dispatcher</MenuItem>
    <MenuItem value="admin">Administrator</MenuItem>
  </Select>
  ```

#### Group-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
- **Content:**
  ```typescript
  <InputLabel>Gruppe/Abteilung</InputLabel>
  <Select
    value={formData.group}
    onChange={(e) => handleInputChange('group', e.target.value)}
    label="Gruppe/Abteilung"
  >
    <MenuItem value="">Keine Gruppe</MenuItem>
    {['Gruppe A', 'Gruppe B', 'Gruppe C'].map((group: string) => (
      <MenuItem key={group} value={group}>
        {group}
      </MenuItem>
    ))}
  </Select>
  ```

#### Qualifikationen-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
    Qualifikationen
  </Typography>
  ```

#### Qualification-Autocomplete
- **Element:** `<Autocomplete>`
- **Props:**
  - `freeSolo`
  - `options={['Krankenpfleger', 'Intensivpflege', 'OP-Pflege', 'Notfallpflege']}`
  - `value=""`
  - `onChange={(event, newValue) => { if (newValue && typeof newValue === 'string') { handleAddQualification(newValue); } }}`
- **Content:**
  ```typescript
  renderInput={(params) => (
    <TextField
      {...params}
      label="Qualifikation hinzufügen"
      placeholder="Qualifikation eingeben oder aus Liste wählen"
      helperText="Geben Sie eine neue Qualifikation ein oder wählen Sie aus der Liste"
    />
  )}
  ```

#### Qualification-Chips
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}`
- **Conditional Rendering:** `{formData.qualifications.length > 0 && <Box>...}`
- **Content:**
  ```typescript
  {formData.qualifications.map((qualification, index) => (
    <Chip
      key={index}
      label={qualification}
      onDelete={() => handleRemoveQualification(qualification)}
      color="primary"
      variant="outlined"
    />
  ))}
  ```

#### Qualification-Error-Alert
- **Element:** `<Alert>`
- **Props:**
  - `severity="error"`
  - `sx={{ mt: 1 }}`
- **Conditional Rendering:** `{errors.qualifications && <Alert>...}`
- **Content:** `{errors.qualifications}`

#### Status-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
    Status
  </Typography>
  ```

#### Status-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
- **Content:**
  ```typescript
  <InputLabel>Status</InputLabel>
  <Select
    value={formData.active ? 'active' : 'inactive'}
    onChange={(e) => handleInputChange('active', e.target.value === 'active')}
    label="Status"
  >
    <MenuItem value="active">Aktiv</MenuItem>
    <MenuItem value="inactive">Inaktiv</MenuItem>
  </Select>
  ```

#### Zusätzliche-Informationen-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
    Zusätzliche Informationen
  </Typography>
  ```

#### Created-At-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Erstellt am"`
  - `value={staff.createdAt.toLocaleDateString('de-DE')}`
  - `disabled`
  - `helperText="Datum der Erstellung des Mitarbeiterprofils"`

#### Last-Active-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Zuletzt aktiv"`
  - `value={staff.lastActive ? staff.lastActive.toLocaleDateString('de-DE') : 'Nie'}`
  - `disabled`
  - `helperText="Letzte Aktivität des Mitarbeiters"`

#### Dialog-Actions
- **Element:** `<DialogActions>`
- **Props:**
  - `sx={{ p: 3, pt: 0 }}`

#### Cancel-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleClose}`
  - `disabled={loading}`
- **Text:** "Abbrechen"

#### Save-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleSave}`
  - `variant="contained"`
  - `disabled={loading}`
  - `startIcon={<Edit />}`
- **Text:** `{loading ? 'Speichere...' : 'Änderungen speichern'}`

### Funktions-Analyse

#### State-Management
```typescript
const [formData, setFormData] = useState({
  displayName: '',
  email: '',
  phone: '',
  role: 'Krankenschwester',
  qualifications: [] as string[],
  group: '',
  active: true
});

const [errors, setErrors] = useState<Record<string, string>>({});
const [loading, setLoading] = useState(false);
const [availableRoles, setAvailableRoles] = useState(DEFAULT_ROLE_OPTIONS);
const [availableGroups, setAvailableGroups] = useState(DEFAULT_GROUP_OPTIONS);
const [availableQualifications, setAvailableQualifications] = useState(DEFAULT_QUALIFICATION_OPTIONS);
```

#### useEffect für Data-Loading
```typescript
useEffect(() => {
  if (staff && open) {
    setFormData({
      displayName: staff.displayName,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      qualifications: staff.qualifications || [],
      group: staff.group || '',
      active: staff.active
    });
    setErrors({});
  }
}, [staff, open]);
```

#### Input-Change-Handler
```typescript
const handleInputChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error when user starts typing
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }
};
```

#### Form-Validation
```typescript
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
  } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
    newErrors.phone = 'Ungültige Telefonnummer';
  }

  if (formData.qualifications.length === 0) {
    newErrors.qualifications = 'Mindestens eine Qualifikation ist erforderlich';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### Save-Handler
```typescript
const handleSave = async () => {
  if (!staff) return;

  if (!validateForm()) {
    return;
  }

  setLoading(true);
  try {
    await onSave?.(formData);
    handleClose();
  } catch (error) {
    console.error('Error updating staff:', error);
  } finally {
    setLoading(false);
  }
};
```

#### Close-Handler
```typescript
const handleClose = () => {
  setFormData({
    displayName: '',
    email: '',
    phone: '',
    role: 'nurse',
    qualifications: [],
    group: '',
    active: true
  });
  setErrors({});
  onClose();
};
```

#### Qualification-Handlers
```typescript
const handleAddQualification = (qualification: string) => {
  if (qualification && !formData.qualifications.includes(qualification)) {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, qualification]
    }));
  }
};

const handleRemoveQualification = (qualification: string) => {
  setFormData(prev => ({
    ...prev,
    qualifications: prev.qualifications.filter(q => q !== qualification)
  }));
};
```

---

## 4. CategoryManager-Komponente

### Datei: `components/admin/CategoryManager.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  onSave: (categories: {
    roles: string[];
    groups: string[];
    qualifications: string[];
  }) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
```

### UI-Analyse

#### Dialog-Container
- **Element:** `<Dialog>`
- **Props:**
  - `open={open}`
  - `onClose={handleClose}`
  - `maxWidth="lg"`
  - `fullWidth`

#### Dialog-Title
- **Element:** `<DialogTitle>`
- **Content:**
  ```typescript
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      Kategorien verwalten
    </Typography>
    <IconButton onClick={handleClose} size="small">
      <Close />
    </IconButton>
  </Box>
  ```

#### Dialog-Content
- **Element:** `<DialogContent>`
- **Props:**
  - `sx={{ p: 0 }}`

#### Tabs-Container
- **Element:** `<Box>`
- **Props:**
  - `sx={{ borderBottom: 1, borderColor: 'divider' }}`

#### Tabs
- **Element:** `<Tabs>`
- **Props:**
  - `value={activeTab}`
  - `onChange={(e, newValue) => setActiveTab(newValue)}`
- **Content:**
  ```typescript
  <Tab label="Berufsbezeichnungen" />
  <Tab label="Gruppen/Abteilungen" />
  <Tab label="Qualifikationen" />
  ```

#### Tab-Panels (3 Stück)

##### Tab-Panel-0 (Berufsbezeichnungen)
- **Element:** `<TabPanel>`
- **Props:**
  - `value={activeTab}`
  - `index={0}`

###### Add-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 3 }}`
- **Content:**
  ```typescript
  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
    Neue Berufsbezeichnung hinzufügen
  </Typography>
  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
    <TextField
      fullWidth
      label="Berufsbezeichnung"
      value={newItem}
      onChange={(e) => setNewItem(e.target.value)}
      onKeyPress={handleKeyPress}
