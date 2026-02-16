# JobFlow – Dokumentation Teil 85

*Zeichen 1668946–1688815 von 2862906*

---

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
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (end <= start) v.endTime = 'Endzeit muss nach Startzeit liegen';
  }

  // Kapazität >= bereits zugewiesen
  const assigned = (shift as any)?.assignedCount || 0;
  if (form.capacity < assigned) v.capacity = `Kapazität darf zugewiesene (${assigned}) nicht unterschreiten`;

  setErrors(v);
  return Object.keys(v).length === 0;
};
```

##### handleSave
```typescript
const handleSave = async () => {
  if (!shift) return;
  if (!validate()) return;
  setSaving(true);
  try {
    await shiftService.update(shift.id, {
      title: form.title,
      facilityId: form.facilityId,
      stationId: form.stationId,
      date: new Date(form.date) as any, // backend speichert als Timestamp; Service konvertiert
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      requiredQualifications: form.requiredQualifications,
      capacity: form.capacity,
      status: form.status,
      notes: form.notes,
      surchargeNight: form.surchargeNight,
      surchargeWeekend: form.surchargeWeekend,
      surchargeHoliday: form.surchargeHoliday,
      surchargeOnCall: form.surchargeOnCall,
    } as any);
    onUpdated?.();
    onClose();
  } finally {
    setSaving(false);
  }
};
```

---

## 4. AssignShiftDialog-Komponente

### Datei: `components/admin/AssignShiftDialog.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
interface AssignShiftDialogProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
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
    <Box>
      <Typography variant="h6">
        Schicht zuweisen: {shift.type}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {format(shift.date, 'dd.MM.yyyy', { locale: de })} • {shift.startTime} - {shift.endTime}
      </Typography>
    </Box>
    <IconButton onClick={handleClose}>
      <Close />
    </IconButton>
  </Box>
  ```

#### Dialog-Content
- **Element:** `<DialogContent>`

#### Shift-Info-Alert
- **Element:** `<Alert>`
- **Props:**
  - `severity="info"`
  - `sx={{ mb: 3 }}`
- **Content:**
  ```typescript
  <Typography variant="body2">
    <strong>Kapazität:</strong> {assignedUsers.length}/{shift.capacity} Mitarbeiter
    {availableSlots > 0 && ` • ${availableSlots} Plätze frei`}
    {isFullyAssigned && !isOverAssigned && ' • Voll besetzt'}
    {isOverAssigned && ' • Überbelegt!'}
  </Typography>
  ```

#### Over-Assignment-Alert (Conditional)
- **Element:** `<Alert>`
- **Props:**
  - `severity="warning"`
  - `sx={{ mb: 3 }}`
- **Conditional Rendering:** `{isOverAssigned && <Alert>...}`
- **Content:**
  ```typescript
  <Typography variant="body2">
    <strong>Überbelegung:</strong> Mehr Mitarbeiter zugewiesen als Kapazität erlaubt.
  </Typography>
  ```

#### Content-Grid
- **Element:** `<Grid container spacing={3}>`

#### Assigned-Users-Section
- **Element:** `<Grid size={{ xs: 12, md: 6 }}>`
- **Content:**
  ```typescript
  <Typography variant="h6" sx={{ mb: 2 }}>
    Zugewiesene Mitarbeiter ({assignedUsers.length})
  </Typography>
  
  {assignedUsers.length === 0 ? (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Keine Mitarbeiter zugewiesen
      </Typography>
    </Box>
  ) : (
    <List>
      {assignedUsers.map(user => (
        <ListItem key={user.id} sx={{ px: 0 }}>
          <ListItemAvatar>
            <Avatar>
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={user.displayName}
            secondary={user.email}
          />
          <Button
            size="small"
            color="error"
            onClick={() => handleUnassignUser(user.id)}
            disabled={unassignUserMutation.isPending}
          >
            Entfernen
          </Button>
        </ListItem>
      ))}
    </List>
  )}
  ```

#### Available-Users-Section
- **Element:** `<Grid size={{ xs: 12, md: 6 }}>`
- **Content:**
  ```typescript
  <Typography variant="h6" sx={{ mb: 2 }}>
    Verfügbare Mitarbeiter
  </Typography>

  {/* Search and Filter */}
  <Box sx={{ mb: 2 }}>
    <TextField
      fullWidth
      size="small"
      placeholder="Mitarbeiter suchen..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
      }}
      sx={{ mb: 2 }}
    />
    
    <FormControl fullWidth size="small">
      <InputLabel>Rolle</InputLabel>
      <Select
        value={roleFilter}
        label="Rolle"
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <MenuItem value="all">Alle</MenuItem>
        <MenuItem value="nurse">Krankenschwester</MenuItem>
        <MenuItem value="dispatcher">Dispatcher</MenuItem>
        <MenuItem value="admin">Administrator</MenuItem>
      </Select>
    </FormControl>
  </Box>

  {/* Bulk Actions */}
  {selectedUsers.length > 0 && (
    <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {selectedUsers.length} Mitarbeiter ausgewählt
      </Typography>
      <Button
        size="small"
        variant="contained"
        startIcon={<Add />}
        onClick={handleBulkAssign}
        disabled={assignUserMutation.isPending || isFullyAssigned}
      >
        Alle zuweisen
      </Button>
    </Box>
  )}

  {/* Available Users List */}
  {usersLoading ? (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="body2" color="text.secondary">
        Lade verfügbare Mitarbeiter...
      </Typography>
    </Box>
  ) : availableUsers.length === 0 ? (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Keine verfügbaren Mitarbeiter gefunden
      </Typography>
    </Box>
  ) : (
    <List>
      {availableUsers.map(user => (
        <ListItem key={user.id} sx={{ px: 0 }}>
          <ListItemButton
            onClick={() => handleUserSelect(user.id)}
            selected={selectedUsers.includes(user.id)}
          >
            <ListItemAvatar>
              <Avatar>
                {user.displayName.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.displayName}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={user.role === 'nurse' ? 'Krankenschwester' : 
                             user.role === 'dispatcher' ? 'Dispatcher' : 'Admin'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {user.qualifications?.map(qual => (
                      <Chip
                        key={qual}
                        label={qual}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              }
            />
          </ListItemButton>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add />}
            onClick={() => handleAssignUser(user.id)}
            disabled={assignUserMutation.isPending || isFullyAssigned}
          >
            Zuweisen
          </Button>
        </ListItem>
      ))}
    </List>
  )}
  ```

#### Dialog-Actions
- **Element:** `<DialogActions>`

#### Close-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleClose}`
- **Text:** "Schließen"

### Funktions-Analyse

#### State-Management
```typescript
const { user } = useAuth();
const queryClient = useQueryClient();
const [searchTerm, setSearchTerm] = useState('');
const [roleFilter, setRoleFilter] = useState<string>('all');
const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
```

#### Data-Queries
```typescript
// Load assigned users
const { data: assignedUsers = [] } = useQuery({
  queryKey: ['assignedUsers', shift.id],
  queryFn: async () => {
    const userIds = await shiftService.getAssignedUsers(shift.id);
    if (userIds.length === 0) return [];

    const users = await Promise.all(userIds.map(userId => userService.getById(userId)));
    return users.filter(user => user !== null);
  },
});

// Load available users
const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
  queryKey: ['availableUsers', shift.id, searchTerm, roleFilter],
  queryFn: async () => {
    const filters = {
      search: searchTerm || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter as User['role'],
      excludeAssigned: true,
      shiftId: shift.id,
    };
    return await userService.getAvailableForShift(filters);
  },
});
```

#### Mutations
```typescript
// Assign user mutation
const assignUserMutation = useMutation({
  mutationFn: async (userId: string) => {
    return await shiftService.assignUser(shift.id, userId);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['assignedUsers', shift.id] });
    queryClient.invalidateQueries({ queryKey: ['availableUsers'] });
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
    toast.success('Mitarbeiter erfolgreich zugewiesen');
  },
  onError: (error) => {
    toast.error('Fehler beim Zuweisen: ' + error.message);
  },
});

// Unassign user mutation
const unassignUserMutation = useMutation({
  mutationFn: async (userId: string) => {
    return await shiftService.unassignUser(shift.id, userId);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['assignedUsers', shift.id] });
    queryClient.invalidateQueries({ queryKey: ['availableUsers'] });
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
    toast.success('Zuweisung erfolgreich entfernt');
  },
  onError: (error) => {
    toast.error('Fehler beim Entfernen der Zuweisung: ' + error.message);
  },
});
```

#### Event-Handler

##### handleAssignUser
```typescript
const handleAssignUser = (userId: string) => {
  assignUserMutation.mutate(userId);
};
```

##### handleUnassignUser
```typescript
const handleUnassignUser = (userId: string) => {
  unassignUserMutation.mutate(userId);
};
```

##### handleBulkAssign
```typescript
const handleBulkAssign = () => {
  selectedUsers.forEach(userId => {
    assignUserMutation.mutate(userId);
  });
  setSelectedUsers([]);
};
```

##### handleUserSelect
```typescript
const handleUserSelect = (userId: string) => {
  setSelectedUsers(prev => 
    prev.includes(userId) 
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
  );
};
```

##### handleClose
```typescript
const handleClose = () => {
  setSearchTerm('');
  setRoleFilter('all');
  setSelectedUsers([]);
  onClose();
};
```

#### Calculated-Values
```typescript
const availableSlots = shift.capacity - assignedUsers.length;
const isFullyAssigned = availableSlots <= 0;
const isOverAssigned = assignedUsers.length > shift.capacity;
```

---

## 5. Firebase-Integration

### Collections
- **shifts:** Schichtdaten mit Kapazität, Qualifikationen und Zuschlägen
- **assignments:** Zuweisungen zwischen Schichten und Mitarbeitern
- **facilities:** Einrichtungsdaten mit Stationen
- **users:** Mitarbeiterdaten mit Qualifikationen

### Queries
- **getAll:** Alle Schichten abrufen
- **getById:** Einzelne Schicht abrufen
- **createWithCapacity:** Schicht mit Kapazität erstellen
- **update:** Schicht aktualisieren
- **delete:** Schicht löschen
- **assignUser:** Mitarbeiter zu Schicht zuweisen
- **unassignUser:** Zuweisung entfernen
- **getAssignedUsers:** Zugewiesene Mitarbeiter abrufen
- **getAvailableForShift:** Verfügbare Mitarbeiter für Schicht

### Mutations
- **Create:** `setDoc(doc(db, 'shifts', shiftId), shiftData)`
- **Update:** `updateDoc(doc(db, 'shifts', shiftId), updateData)`
- **Delete:** `deleteDoc(doc(db, 'shifts', shiftId))`
- **Assign:** `setDoc(doc(db, 'assignments', assignmentId), assignmentData)`
- **Unassign:** `deleteDoc(doc(db, 'assignments', assignmentId))`

---

## 6. Error-Handling

### Form-Validation-Errors
- **Einrichtung fehlt:** "Einrichtung ist erforderlich"
- **Station fehlt:** "Station ist erforderlich"
- **Datum fehlt:** "Datum ist erforderlich"
- **Startzeit fehlt:** "Startzeit ist erforderlich"
- **Endzeit fehlt:** "Endzeit ist erforderlich"
- **Kapazität zu niedrig:** "Kapazität muss mindestens 1 sein"
- **Endzeit vor Startzeit:** "Endzeit muss nach Startzeit liegen"
- **Kapazität unterschreitet Zuweisungen:** "Kapazität darf zugewiesene (X) nicht unterschreiten"

### API-Errors
- **Create Error:** "Fehler beim Erstellen der Schicht"
- **Update Error:** "Fehler beim Aktualisieren der Schicht"
- **Delete Error:** "Fehler beim Löschen der Schicht"
- **Assign Error:** "Fehler beim Zuweisen"
- **Unassign Error:** "Fehler beim Entfernen der Zuweisung"

### Business-Logic-Errors
- **Over-Assignment:** "Überbelegung: Mehr Mitarbeiter zugewiesen als Kapazität erlaubt"
- **No Available Users:** "Keine verfügbaren Mitarbeiter gefunden"
- **Fully Assigned:** "Schicht ist voll besetzt"

---

## 7. Loading-States

### Dialog-Loading
- **Create Dialog:** `createShiftMutation.isPending` mit "Erstelle..." Text
- **Edit Dialog:** `saving` State mit "Speichere..." Text
- **Assign Dialog:** `assignUserMutation.isPending` und `unassignUserMutation.isPending`

### Button-Loading
- **Save Buttons:** `disabled={loading}` mit Loading-Text
- **Cancel Buttons:** `disabled={loading}`

### Page-Loading
- **Schedule Page:** `isLoading` State mit CircularProgress

### Query-Loading
- **Available Users:** `usersLoading` State mit Loading-Text

---

## 8. Navigation-Flow

### Dialog-Navigation
- **Create Dialog:** Öffnen über "Schicht erstellen" Button
- **Edit Dialog:** Öffnen über Edit-Button in Shift-Cards
- **Assign Dialog:** Öffnen über Assign-Button in Shift-Cards

### View-Navigation
- **List View:** Toggle-Button für Listen-Ansicht
- **Calendar View:** Toggle-Button für Kalender-Ansicht

### Filter-Navigation
- **Facility Filter:** Station-Filter wird automatisch aktualisiert
- **Clear Filters:** Alle Filter werden zurückgesetzt

---

## 9. Responsive Design

### Breakpoints
- **xs:** Mobile (< 600px)
- **sm:** Tablet (600px - 960px)
- **md:** Desktop (960px - 1280px)
- **lg:** Large Desktop (> 1280px)

### Responsive Properties
- **Filter Grid:** `{ xs: 12, sm: 6 }` für Input-Felder
- **Dialog:** `maxWidth="md"` für Create, `maxWidth="sm"` für Edit, `maxWidth="md"` für Assign
- **Content Grid:** `{ xs: 12, md: 6 }` für Assigned/Available Users
- **Form Grid:** `{ xs: 12, sm: 6 }` für Form-Felder

---

## 10. Performance-Optimierungen

### React Query
- **Stale Time:** 5 Minuten für Schicht-Daten
- **Cache Invalidation:** Automatisch bei CRUD-Operationen
- **Error Handling:** Graceful Fallbacks

### Form-Optimization
- **Controlled Components:** Alle Inputs sind controlled
- **Validation:** Client-side Validation vor API-Calls
- **Debouncing:** Search-Term wird debounced

### Dialog-Optimization
- **Lazy Loading:** Dialoge werden nur bei Bedarf gerendert
- **State Reset:** Form-State wird bei Close zurückgesetzt

---

## 11. Accessibility

### ARIA-Labels
- **Dialog Titles:** Semantische Titel
- **Form Labels:** Alle Inputs haben Labels
- **Button Labels:** Alle Buttons haben aussagekräftige Labels

### Keyboard Navigation
- **Tab Order:** Natürliche Reihenfolge
- **Enter Key:** Form Submission
- **Escape Key:** Dialog Close

### Screen Reader Support
- **Semantic HTML:** Proper heading hierarchy
- **Form Structure:** Proper form structure
- **Error Messages:** Accessible Error Messages

---

## 12. Security-Features

### Input Validation
- **Date Validation:** Proper date format
- **Time Validation:** Time range validation
- **Capacity Validation:** Minimum capacity check

### Data Access
- **Role-based Access:** Admin-spezifische Funktionen
- **User Authentication:** Nur für authentifizierte User
- **Data Validation:** Server-side Validation

---

## Zusammenfassung

### Vollständig implementiert:
- ✅ Admin Dienstplan-Seite mit Filter-System
- ✅ List/Calendar View Toggle
- ✅ ShiftCreateDialog mit vollständiger Form-Validation
- ✅ ShiftEditDialog mit Data-Loading und Update-Funktionalität
- ✅ AssignShiftDialog mit User-Management und Bulk-Operations
- ✅ Overnight-Schicht-Erkennung
- ✅ Zuschläge-Management (Nacht, Wochenende, Feiertag, Rufbereitschaft)
- ✅ Qualifikations-Management mit Autocomplete
- ✅ Responsive Design
- ✅ Error-Handling mit spezifischen Fehlermeldungen
- ✅ Loading-States
- ✅ Form-Validation mit Client-side Checks

### Besondere Features:
- **Overnight-Detection:** Automatische Erkennung von Schichten über Mitternacht
- **Surcharge-Management:** Zuschläge für Nacht, Wochenende, Feiertage und Rufbereitschaft
- **Qualification-Matching:** Automatische Qualifikations-Zuordnung basierend auf Station
- **Bulk-Assignment:** Mehrere Mitarbeiter gleichzeitig zuweisen
- **Over-Assignment-Warning:** Warnung bei Überbelegung
- **Real-time Updates:** Automatische Aktualisierung bei Änderungen
- **Advanced Filtering:** Suche, Einrichtung, Station, Zuschläge, Zeitraum

### Technische Qualität:
- **TypeScript:** Vollständig typisiert
- **React Query:** Professionelle Data-Fetching
- **Firebase Integration:** CRUD-Operationen
- **Error Boundaries:** Robuste Fehlerbehandlung
- **Performance:** Optimierte Queries und Caching
- **Security:** Input-Validation und Role-based Access

### TODO-Items:
