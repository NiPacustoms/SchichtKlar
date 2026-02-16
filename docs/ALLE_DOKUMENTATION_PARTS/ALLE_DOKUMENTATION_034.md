# JobFlow – Dokumentation Teil 34

*Zeichen 655702–675587 von 2862906*

---

        <FormControl> // Status Filter
        <Button> // Clear Filters Button
    <Box> // Facilities Grid
      <FacilityCard> // Facility Cards
    <Box> // Actions Section
      <Button> // Add Facility Button
```

#### Root-Container
- **Element:** `<Box>`
- **Props:**
  - `sx={{ py: 4 }}`

#### Main-Container
- **Element:** `<Container>`
- **Props:**
  - `maxWidth="xl"`
  - `sx={{ maxWidth: '1280px' }}`

#### Header-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Page-Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="h4"`
  - `sx={{ fontWeight: 600, mb: 1 }}`
- **Text:** "Einrichtungen"

#### Page-Subtitle
- **Element:** `<Typography>`
- **Props:**
  - `variant="body1"`
  - `color="text.secondary"`
- **Text:** "Verwalten Sie alle Einrichtungen und deren Stationen"

#### Statistics-Cards-Grid
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}`

#### Statistics-Cards (4 Stück)

##### 1. Gesamteinrichtungen
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Gesamteinrichtungen"`
  - `value={facilityStats.total}`
  - `icon={<Business />}`
  - `color="#2196f3"`

##### 2. Aktive Einrichtungen
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Aktive Einrichtungen"`
  - `value={facilityStats.active}`
  - `icon={<CheckCircle />}`
  - `color="#4caf50"`

##### 3. Stationen
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Stationen"`
  - `value={facilityStats.stations}`
  - `icon={<MeetingRoom />}`
  - `color="#ff9800"`

##### 4. Mitarbeiter
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Mitarbeiter"`
  - `value={facilityStats.staff}`
  - `icon={<People />}`
  - `color="#9c27b0"`

#### Filters-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Filter-Container
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}`

#### Search-Input
- **Element:** `<TextField>`
- **Props:**
  - `placeholder="Einrichtungen suchen..."`
  - `value={filters.search}`
  - `onChange={(e) => setFilters({ ...filters, search: e.target.value })}`
  - `sx={{ minWidth: 200 }}`

#### Status-Filter
- **Element:** `<FormControl>`
- **Props:**
  - `sx={{ minWidth: 150 }}`
- **Content:**
  ```typescript
  <InputLabel>Status</InputLabel>
  <Select
    value={filters.status || ''}
    label="Status"
    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
  >
    <MenuItem value="">Alle</MenuItem>
    <MenuItem value="active">Aktiv</MenuItem>
    <MenuItem value="inactive">Inaktiv</MenuItem>
  </Select>
  ```

#### Clear-Filters-Button
- **Element:** `<Button>`
- **Props:**
  - `variant="outlined"`
  - `onClick={() => setFilters({ search: '', status: '' })}`
- **Text:** "Filter zurücksetzen"

#### Facilities-Grid
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}`

#### Facility-Cards
- **Komponente:** `<FacilityCard>`
- **Props:**
  - `facility={facility}`
  - `onEdit={handleEditFacility}`
  - `onDelete={handleDeleteFacility}`

#### Actions-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Add-Facility-Button
- **Element:** `<Button>`
- **Props:**
  - `variant="contained"`
  - `startIcon={<Add />}`
  - `onClick={() => setCreateDialogOpen(true)}`
- **Text:** "Einrichtung hinzufügen"

### Funktions-Analyse

#### State-Management
```typescript
const {
  facilities,
  facilityStats,
  isLoading,
  error,
  createFacility,
  updateFacility,
  deleteFacility,
} = useFacilityManagement();

const [filters, setFilters] = useState({
  search: '',
  status: '',
});

const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [selectedFacility, setSelectedFacility] = useState(null);
```

#### Filter-Logic
```typescript
const filteredFacilities = useMemo(() => {
  let filtered = facilities;

  // Search filter
  if (filters.search) {
    filtered = filtered.filter(facility =>
      facility.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      facility.address.toLowerCase().includes(filters.search.toLowerCase()) ||
      facility.contactPerson.toLowerCase().includes(filters.search.toLowerCase())
    );
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(facility => {
      switch (filters.status) {
        case 'active': return facility.active;
        case 'inactive': return !facility.active;
        default: return true;
      }
    });
  }

  return filtered;
}, [facilities, filters]);
```

#### Event-Handler

##### handleEditFacility
```typescript
const handleEditFacility = (facility: any) => {
  setSelectedFacility(facility);
  setEditDialogOpen(true);
};
```

##### handleDeleteFacility
```typescript
const handleDeleteFacility = async (facility: any) => {
  if (window.confirm(`Möchten Sie die Einrichtung "${facility.name}" wirklich löschen?`)) {
    try {
      await deleteFacility(facility.id);
    } catch (error) {
      console.error('Error deleting facility:', error);
    }
  }
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
import { Box, Container, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { FacilityCard } from '@/components/admin/FacilityCard';
import { FacilityCreateDialog } from '@/components/admin/FacilityCreateDialog';
import { FacilityEditDialog } from '@/components/admin/FacilityEditDialog';
import { useFacilityManagement } from '@/lib/hooks/useFacilityManagement';
import { Add, Business, CheckCircle, MeetingRoom, People } from '@mui/icons-material';
```

---

## 2. Admin Assignments-Seite (`/admin/assignments`)

### Datei: `app/(admin)/admin/assignments/page.tsx`
**Status:** ✅ Vollständig implementiert

### UI-Analyse

#### Layout-Struktur
```typescript
<Box> // Root Container
  <Container> // Main Container
    <Box> // Header Section
      <Typography> // Page Title
      <Typography> // Page Subtitle
    <Box> // Statistics Cards Grid
      <AdminKPICard> // 4 Statistics Cards
    <Box> // Filters Section
      <Box> // Filter Container
        <TextField> // Search Input
        <FormControl> // Status Filter
        <FormControl> // Facility Filter
        <FormControl> // Date Range Filter
        <Button> // Clear Filters Button
    <Box> // Tabs Section
      <Tabs> // Assignment Tabs
    <Box> // Content Section
      <AssignmentList> // Assignment Lists
```

#### Root-Container
- **Element:** `<Box>`
- **Props:**
  - `sx={{ py: 4 }}`

#### Main-Container
- **Element:** `<Container>`
- **Props:**
  - `maxWidth="xl"`
  - `sx={{ maxWidth: '1280px' }}`

#### Header-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Page-Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="h4"`
  - `sx={{ fontWeight: 600, mb: 1 }}`
- **Text:** "Einsätze"

#### Page-Subtitle
- **Element:** `<Typography>`
- **Props:**
  - `variant="body1"`
  - `color="text.secondary"`
- **Text:** "Verwalten Sie alle Einsätze und deren Status"

#### Statistics-Cards-Grid
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}`

#### Statistics-Cards (4 Stück)

##### 1. Gesamteinsätze
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Gesamteinsätze"`
  - `value={assignmentStats.total}`
  - `icon={<Assignment />}`
  - `color="#2196f3"`

##### 2. Ausstehende Einsätze
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Ausstehende Einsätze"`
  - `value={assignmentStats.pending}`
  - `icon={<Pending />}`
  - `color="#ff9800"`

##### 3. Bestätigte Einsätze
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Bestätigte Einsätze"`
  - `value={assignmentStats.confirmed}`
  - `icon={<CheckCircle />}`
  - `color="#4caf50"`

##### 4. Abgeschlossene Einsätze
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Abgeschlossene Einsätze"`
  - `value={assignmentStats.completed}`
  - `icon={<Done />}`
  - `color="#9c27b0"`

#### Filters-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Filter-Container
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}`

#### Search-Input
- **Element:** `<TextField>`
- **Props:**
  - `placeholder="Einsätze suchen..."`
  - `value={filters.search}`
  - `onChange={(e) => setFilters({ ...filters, search: e.target.value })}`
  - `sx={{ minWidth: 200 }}`

#### Status-Filter
- **Element:** `<FormControl>`
- **Props:**
  - `sx={{ minWidth: 150 }}`
- **Content:**
  ```typescript
  <InputLabel>Status</InputLabel>
  <Select
    value={filters.status || ''}
    label="Status"
    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
  >
    <MenuItem value="">Alle</MenuItem>
    <MenuItem value="pending">Ausstehend</MenuItem>
    <MenuItem value="confirmed">Bestätigt</MenuItem>
    <MenuItem value="completed">Abgeschlossen</MenuItem>
    <MenuItem value="cancelled">Storniert</MenuItem>
  </Select>
  ```

#### Facility-Filter
- **Element:** `<FormControl>`
- **Props:**
  - `sx={{ minWidth: 150 }}`
- **Content:**
  ```typescript
  <InputLabel>Einrichtung</InputLabel>
  <Select
    value={filters.facilityId || ''}
    label="Einrichtung"
    onChange={(e) => setFilters({ ...filters, facilityId: e.target.value })}
  >
    <MenuItem value="">Alle</MenuItem>
    {facilities.map(facility => (
      <MenuItem key={facility.id} value={facility.id}>
        {facility.name}
      </MenuItem>
    ))}
  </Select>
  ```

#### Date-Range-Filter
- **Element:** `<FormControl>`
- **Props:**
  - `sx={{ minWidth: 150 }}`
- **Content:**
  ```typescript
  <InputLabel>Zeitraum</InputLabel>
  <Select
    value={filters.dateRange || ''}
    label="Zeitraum"
    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
  >
    <MenuItem value="">Alle</MenuItem>
    <MenuItem value="today">Heute</MenuItem>
    <MenuItem value="week">Diese Woche</MenuItem>
    <MenuItem value="month">Dieser Monat</MenuItem>
    <MenuItem value="custom">Benutzerdefiniert</MenuItem>
  </Select>
  ```

#### Clear-Filters-Button
- **Element:** `<Button>`
- **Props:**
  - `variant="outlined"`
  - `onClick={() => setFilters({ search: '', status: '', facilityId: '', dateRange: '' })}`
- **Text:** "Filter zurücksetzen"

#### Tabs-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Assignment-Tabs
- **Element:** `<Tabs>`
- **Props:**
  - `value={activeTab}`
  - `onChange={(e, newValue) => setActiveTab(newValue)}`
  - `variant="fullWidth"`
- **Content:**
  ```typescript
  <Tab label={`Ausstehend (${assignmentStats.pending})`} value="pending" />
  <Tab label={`Bestätigt (${assignmentStats.confirmed})`} value="confirmed" />
  <Tab label={`Abgeschlossen (${assignmentStats.completed})`} value="completed" />
  <Tab label={`Storniert (${assignmentStats.cancelled})`} value="cancelled" />
  ```

#### Content-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Assignment-List
- **Komponente:** `<AssignmentList>`
- **Props:**
  - `assignments={filteredAssignments}`
  - `onEdit={handleEditAssignment}`
  - `onDelete={handleDeleteAssignment}`
  - `onStatusChange={handleStatusChange}`

### Funktions-Analyse

#### State-Management
```typescript
const {
  assignments,
  assignmentStats,
  facilities,
  isLoading,
  error,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
} = useAssignmentManagement();

const [filters, setFilters] = useState({
  search: '',
  status: '',
  facilityId: '',
  dateRange: '',
});

const [activeTab, setActiveTab] = useState('pending');
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [selectedAssignment, setSelectedAssignment] = useState(null);
```

#### Filter-Logic
```typescript
const filteredAssignments = useMemo(() => {
  let filtered = assignments;

  // Search filter
  if (filters.search) {
    filtered = filtered.filter(assignment =>
      assignment.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      assignment.facilityName.toLowerCase().includes(filters.search.toLowerCase()) ||
      assignment.staffName.toLowerCase().includes(filters.search.toLowerCase())
    );
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(assignment => assignment.status === filters.status);
  }

  // Facility filter
  if (filters.facilityId) {
    filtered = filtered.filter(assignment => assignment.facilityId === filters.facilityId);
  }

  // Date range filter
  if (filters.dateRange) {
    const now = new Date();
    filtered = filtered.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      switch (filters.dateRange) {
        case 'today': return assignmentDate.toDateString() === now.toDateString();
        case 'week': return assignmentDate >= startOfWeek(now) && assignmentDate <= endOfWeek(now);
        case 'month': return assignmentDate >= startOfMonth(now) && assignmentDate <= endOfMonth(now);
        default: return true;
      }
    });
  }

  // Tab filter
  if (activeTab !== 'all') {
    filtered = filtered.filter(assignment => assignment.status === activeTab);
  }

  return filtered;
}, [assignments, filters, activeTab]);
```

#### Event-Handler

##### handleEditAssignment
```typescript
const handleEditAssignment = (assignment: any) => {
  setSelectedAssignment(assignment);
  setEditDialogOpen(true);
};
```

##### handleDeleteAssignment
```typescript
const handleDeleteAssignment = async (assignment: any) => {
  if (window.confirm(`Möchten Sie den Einsatz "${assignment.title}" wirklich löschen?`)) {
    try {
      await deleteAssignment(assignment.id);
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  }
};
```

##### handleStatusChange
```typescript
const handleStatusChange = async (assignmentId: string, newStatus: string) => {
  try {
    await updateAssignmentStatus(assignmentId, newStatus);
  } catch (error) {
    console.error('Error updating assignment status:', error);
  }
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
import { Box, Container, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Tabs, Tab } from '@mui/material';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { AssignmentList } from '@/components/admin/AssignmentList';
import { AssignmentEditDialog } from '@/components/admin/AssignmentEditDialog';
import { useAssignmentManagement } from '@/lib/hooks/useAssignmentManagement';
import { Assignment, Pending, CheckCircle, Done } from '@mui/icons-material';
```

---

## 3. FacilityCreateDialog-Komponente

### Datei: `components/admin/FacilityCreateDialog.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
interface FacilityCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FacilityFormData {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  debtorNumber: string;
  billingAddress: string;
  billingEmail: string;
  billingPhone: string;
  paymentTerms: string;
  taxId: string;
  vatId: string;
  colorCode: string;
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
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Business sx={{ mr: 2 }} />
    Neue Einrichtung erstellen
  </Box>
  ```

#### Dialog-Content
- **Element:** `<DialogContent>`

#### Form-Grid
- **Element:** `<Grid container spacing={3}>`
- **Props:**
  - `sx={{ mt: 1 }}`

#### Grunddaten-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
    <Business sx={{ mr: 1, fontSize: 20 }} />
    Grunddaten
  </Typography>
  ```

#### Name-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Name der Einrichtung *"`
  - `value={formData.name}`
  - `onChange={(e) => handleInputChange('name', e.target.value)}`
  - `error={!!errors.name}`
  - `helperText={errors.name}`

#### Debitornummer-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Debitornummer *"`
  - `value={formData.debtorNumber}`
  - `onChange={(e) => handleInputChange('debtorNumber', e.target.value)}`
  - `error={!!errors.debtorNumber}`
  - `helperText={errors.debtorNumber}`
  - `InputProps={{ startAdornment: <Receipt sx={{ mr: 1, color: 'text.secondary' }} /> }}`

#### Adresse-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Adresse *"`
  - `value={formData.address}`
  - `onChange={(e) => handleInputChange('address', e.target.value)}`
  - `error={!!errors.address}`
  - `helperText={errors.address}`
  - `multiline`
  - `rows={2}`

#### Ansprechpartner-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Ansprechpartner *"`
  - `value={formData.contactPerson}`
  - `onChange={(e) => handleInputChange('contactPerson', e.target.value)}`
  - `error={!!errors.contactPerson}`
  - `helperText={errors.contactPerson}`

#### Telefon-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Telefon *"`
  - `value={formData.phone}`
  - `onChange={(e) => handleInputChange('phone', e.target.value)}`
  - `error={!!errors.phone}`
  - `helperText={errors.phone}`

#### Email-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="E-Mail *"`
  - `type="email"`
  - `value={formData.email}`
  - `onChange={(e) => handleInputChange('email', e.target.value)}`
  - `error={!!errors.email}`
  - `helperText={errors.email}`

#### Farbe-Select
- **Element:** `<FormControl>`
- **Props:**
  - `fullWidth`
- **Content:**
  ```typescript
  <InputLabel>Farbe</InputLabel>
  <Select
    value={formData.colorCode}
    onChange={(e) => handleInputChange('colorCode', e.target.value)}
    label="Farbe"
  >
    {colorOptions.map((color) => (
      <MenuItem key={color.value} value={color.value}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: color.value,
              mr: 2,
              borderRadius: 1,
              border: '1px solid #ccc'
            }}
          />
          {color.label}
        </Box>
      </MenuItem>
    ))}
  </Select>
  ```

#### Abrechnungsdaten-Section
- **Element:** `<Grid size={{ xs: 12 }}>`
- **Content:**
  ```typescript
  <Divider sx={{ my: 2 }} />
  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
    <AccountBalance sx={{ mr: 1, fontSize: 20 }} />
    Abrechnungsdaten
  </Typography>
  ```

#### Abrechnungsadresse-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
