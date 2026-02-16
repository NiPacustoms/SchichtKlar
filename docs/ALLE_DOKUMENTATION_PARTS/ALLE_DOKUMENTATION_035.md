# JobFlow – Dokumentation Teil 35

*Zeichen 675588–695473 von 2862906*

---

  - `label="Abrechnungsadresse"`
  - `value={formData.billingAddress}`
  - `onChange={(e) => handleInputChange('billingAddress', e.target.value)}`
  - `helperText="Falls abweichend von der Hauptadresse"`
  - `multiline`
  - `rows={2}`

#### Abrechnungs-Email-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Abrechnungs-E-Mail"`
  - `type="email"`
  - `value={formData.billingEmail}`
  - `onChange={(e) => handleInputChange('billingEmail', e.target.value)}`
  - `error={!!errors.billingEmail}`
  - `helperText={errors.billingEmail || 'Falls abweichend von der Haupt-E-Mail'}`

#### Abrechnungs-Telefon-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Abrechnungs-Telefon"`
  - `value={formData.billingPhone}`
  - `onChange={(e) => handleInputChange('billingPhone', e.target.value)}`
  - `helperText="Falls abweichend von der Haupt-Telefonnummer"`

#### Zahlungsbedingungen-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Zahlungsbedingungen"`
  - `value={formData.paymentTerms}`
  - `onChange={(e) => handleInputChange('paymentTerms', e.target.value)}`
  - `helperText="z.B. '30 Tage netto'"`

#### Steuernummer-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Steuernummer"`
  - `value={formData.taxId}`
  - `onChange={(e) => handleInputChange('taxId', e.target.value)}`

#### Umsatzsteuer-ID-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Umsatzsteuer-ID"`
  - `value={formData.vatId}`
  - `onChange={(e) => handleInputChange('vatId', e.target.value)}`
  - `helperText="Falls vorhanden"`

#### Dialog-Actions
- **Element:** `<DialogActions>`
- **Props:**
  - `sx={{ p: 3 }}`

#### Cancel-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleClose}`
  - `disabled={createFacilityMutation.isPending}`
- **Text:** "Abbrechen"

#### Submit-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleSubmit}`
  - `variant="contained"`
  - `disabled={createFacilityMutation.isPending}`
- **Text:** `{createFacilityMutation.isPending ? 'Erstellen...' : 'Erstellen'}`

### Funktions-Analyse

#### State-Management
```typescript
const [formData, setFormData] = useState<FacilityFormData>(initialFormData);
const [errors, setErrors] = useState<Partial<FacilityFormData>>({});
const queryClient = useQueryClient();
```

#### Initial-Form-Data
```typescript
const initialFormData: FacilityFormData = {
  name: '',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  debtorNumber: '',
  billingAddress: '',
  billingEmail: '',
  billingPhone: '',
  paymentTerms: '30 Tage netto',
  taxId: '',
  vatId: '',
  colorCode: '#005f73',
};
```

#### Color-Options
```typescript
const colorOptions = [
  { value: '#005f73', label: 'Blau' },
  { value: '#0a9396', label: 'Türkis' },
  { value: '#94d2bd', label: 'Mint' },
  { value: '#e9d8a6', label: 'Gelb' },
  { value: '#ee9b00', label: 'Orange' },
  { value: '#ca6702', label: 'Dunkelorange' },
  { value: '#bb3e03', label: 'Rot' },
  { value: '#ae2012', label: 'Dunkelrot' },
  { value: '#9b2226', label: 'Burgunder' },
  { value: '#7209b7', label: 'Lila' },
  { value: '#560bad', label: 'Dunkellila' },
  { value: '#3a0ca3', label: 'Indigo' },
];
```

#### Mutation
```typescript
const createFacilityMutation = useMutation({
  mutationFn: (data: any) => facilityService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['facilities'] });
    toast.success('Einrichtung erfolgreich erstellt!');
    handleClose();
  },
  onError: (error: unknown) => {
    toast.error('Fehler beim Erstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  },
});
```

#### Event-Handler

##### handleClose
```typescript
const handleClose = () => {
  setFormData(initialFormData);
  setErrors({});
  onClose();
};
```

##### validateForm
```typescript
const validateForm = (): boolean => {
  const newErrors: Partial<FacilityFormData> = {};

  if (!formData.name.trim()) newErrors.name = 'Name ist erforderlich';
  if (!formData.address.trim()) newErrors.address = 'Adresse ist erforderlich';
  if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Ansprechpartner ist erforderlich';
  if (!formData.phone.trim()) newErrors.phone = 'Telefon ist erforderlich';
  if (!formData.email.trim()) newErrors.email = 'E-Mail ist erforderlich';
  if (!formData.debtorNumber.trim()) newErrors.debtorNumber = 'Debitornummer ist erforderlich';

  // E-Mail Validierung
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    newErrors.email = 'Ungültige E-Mail-Adresse';
  }
  if (formData.billingEmail && !emailRegex.test(formData.billingEmail)) {
    newErrors.billingEmail = 'Ungültige E-Mail-Adresse';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

##### handleSubmit
```typescript
const handleSubmit = () => {
  if (validateForm()) {
    createFacilityMutation.mutate(formData);
  }
};
```

##### handleInputChange
```typescript
const handleInputChange = (field: keyof FacilityFormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Fehler für dieses Feld entfernen
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }
};
```

---

## 4. FacilityEditDialog-Komponente

### Datei: `components/admin/FacilityEditDialog.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
interface FacilityEditDialogProps {
  open: boolean;
  onClose: () => void;
  facility: Facility;
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
    Einrichtung bearbeiten
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
  - `label="Abrechnungsadresse"`
  - `value={formData.billingAddress}`
  - `onChange={(e) => handleInputChange('billingAddress', e.target.value)}`
  - `helperText="Falls abweichend von der Hauptadresse"`
  - `multiline`
  - `rows={2}`

#### Abrechnungs-Email-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Abrechnungs-E-Mail"`
  - `type="email"`
  - `value={formData.billingEmail}`
  - `onChange={(e) => handleInputChange('billingEmail', e.target.value)}`
  - `error={!!errors.billingEmail}`
  - `helperText={errors.billingEmail || 'Falls abweichend von der Haupt-E-Mail'}`

#### Abrechnungs-Telefon-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Abrechnungs-Telefon"`
  - `value={formData.billingPhone}`
  - `onChange={(e) => handleInputChange('billingPhone', e.target.value)}`
  - `helperText="Falls abweichend von der Haupt-Telefonnummer"`

#### Zahlungsbedingungen-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Zahlungsbedingungen"`
  - `value={formData.paymentTerms}`
  - `onChange={(e) => handleInputChange('paymentTerms', e.target.value)}`
  - `helperText="z.B. '30 Tage netto'"`

#### Steuernummer-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Steuernummer"`
  - `value={formData.taxId}`
  - `onChange={(e) => handleInputChange('taxId', e.target.value)}`

#### Umsatzsteuer-ID-Input
- **Element:** `<TextField>`
- **Props:**
  - `fullWidth`
  - `label="Umsatzsteuer-ID"`
  - `value={formData.vatId}`
  - `onChange={(e) => handleInputChange('vatId', e.target.value)}`
  - `helperText="Falls vorhanden"`

#### Dialog-Actions
- **Element:** `<DialogActions>`
- **Props:**
  - `sx={{ p: 3 }}`

#### Cancel-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleClose}`
  - `disabled={updateFacilityMutation.isPending}`
- **Text:** "Abbrechen"

#### Submit-Button
- **Element:** `<Button>`
- **Props:**
  - `onClick={handleSubmit}`
  - `variant="contained"`
  - `disabled={updateFacilityMutation.isPending}`
- **Text:** `{updateFacilityMutation.isPending ? 'Speichern...' : 'Speichern'}`

### Funktions-Analyse

#### State-Management
```typescript
const [formData, setFormData] = useState<FacilityFormData>({
  name: facility.name,
  address: facility.address,
  contactPerson: facility.contactPerson,
  phone: facility.phone,
  email: facility.email,
  debtorNumber: facility.debtorNumber,
  billingAddress: facility.billingAddress || '',
  billingEmail: facility.billingEmail || '',
  billingPhone: facility.billingPhone || '',
  paymentTerms: facility.paymentTerms || '30 Tage netto',
  taxId: facility.taxId || '',
  vatId: facility.vatId || '',
  colorCode: facility.colorCode,
});

const [errors, setErrors] = useState<Partial<FacilityFormData>>({});
const queryClient = useQueryClient();
```

#### useEffect für Data-Loading
```typescript
useEffect(() => {
  if (facility) {
    setFormData({
      name: facility.name,
      address: facility.address,
      contactPerson: facility.contactPerson,
      phone: facility.phone,
      email: facility.email,
      debtorNumber: facility.debtorNumber,
      billingAddress: facility.billingAddress || '',
      billingEmail: facility.billingEmail || '',
      billingPhone: facility.billingPhone || '',
      paymentTerms: facility.paymentTerms || '30 Tage netto',
      taxId: facility.taxId || '',
      vatId: facility.vatId || '',
      colorCode: facility.colorCode,
    });
  }
}, [facility]);
```

#### Mutation
```typescript
const updateFacilityMutation = useMutation({
  mutationFn: (data: FacilityFormData) => facilityService.update(facility.id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['facilities'] });
    toast.success('Einrichtung erfolgreich aktualisiert!');
    handleClose();
  },
  onError: (error: unknown) => {
    toast.error('Fehler beim Aktualisieren: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  },
});
```

#### Event-Handler

##### handleClose
```typescript
const handleClose = () => {
  setErrors({});
  onClose();
};
```

##### validateForm
```typescript
const validateForm = (): boolean => {
  const newErrors: Partial<FacilityFormData> = {};

  if (!formData.name.trim()) newErrors.name = 'Name ist erforderlich';
  if (!formData.address.trim()) newErrors.address = 'Adresse ist erforderlich';
  if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Ansprechpartner ist erforderlich';
  if (!formData.phone.trim()) newErrors.phone = 'Telefon ist erforderlich';
  if (!formData.email.trim()) newErrors.email = 'E-Mail ist erforderlich';
  if (!formData.debtorNumber.trim()) newErrors.debtorNumber = 'Debitornummer ist erforderlich';

  // E-Mail Validierung
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    newErrors.email = 'Ungültige E-Mail-Adresse';
  }
  if (formData.billingEmail && !emailRegex.test(formData.billingEmail)) {
    newErrors.billingEmail = 'Ungültige E-Mail-Adresse';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

##### handleSubmit
```typescript
const handleSubmit = () => {
  if (validateForm()) {
    updateFacilityMutation.mutate(formData);
  }
};
```

##### handleInputChange
```typescript
const handleInputChange = (field: keyof FacilityFormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Fehler für dieses Feld entfernen
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }
};
```

---

## 5. FacilityService-Analyse

### Datei: `lib/services/facilities.ts`
**Status:** ✅ Vollständig implementiert

### Service-Methods

#### getById
```typescript
async getById(id: string): Promise<Facility | null> {
  const facilityDoc = await getDoc(doc(db, COLLECTION_NAME, id));
  if (!facilityDoc.exists()) return null;

  const data = facilityDoc.data() as {
    name: string;
    address: string;
    contactPerson: string;
    phone: string;
    email: string;
    stations?: unknown[];
    colorCode?: string;
    debtorNumber?: string;
    billingAddress?: string;
    billingEmail?: string;
    billingPhone?: string;
    paymentTerms?: string;
    taxId?: string;
    vatId?: string;
    createdAt?: { toDate: () => Date };
    updatedAt?: { toDate: () => Date };
  };
  return {
    id: facilityDoc.id,
    name: data.name,
    address: data.address,
    contactPerson: data.contactPerson,
    phone: data.phone,
    email: data.email,
    stations: (data.stations as Station[]) || [],
    colorCode: data.colorCode || '#005f73',
    debtorNumber: data.debtorNumber || '',
    billingAddress: data.billingAddress || '',
    billingEmail: data.billingEmail || '',
    billingPhone: data.billingPhone || '',
    paymentTerms: data.paymentTerms || '',
    taxId: data.taxId || '',
    vatId: data.vatId || '',
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}
```

#### getAll
```typescript
async getAll(): Promise<Facility[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));

  const snapshot = await getDocs(q);
  const facilities: Facility[] = [];

  snapshot.forEach(doc => {
    const data = doc.data() as {
      name: string;
      address: string;
      contactPerson: string;
      phone: string;
      email: string;
      stations?: unknown[];
      colorCode?: string;
      debtorNumber?: string;
      billingAddress?: string;
      billingEmail?: string;
      billingPhone?: string;
      paymentTerms?: string;
      taxId?: string;
      vatId?: string;
      createdAt?: { toDate: () => Date };
      updatedAt?: { toDate: () => Date };
    };
    facilities.push({
      id: doc.id,
      name: data.name,
      address: data.address,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      stations: (data.stations as Station[]) || [],
      colorCode: data.colorCode || '#005f73',
      debtorNumber: data.debtorNumber || '',
      billingAddress: data.billingAddress || '',
      billingEmail: data.billingEmail || '',
      billingPhone: data.billingPhone || '',
      paymentTerms: data.paymentTerms || '',
      taxId: data.taxId || '',
      vatId: data.vatId || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });

  return facilities;
}
```

#### getAllPaginated
```typescript
async getAllPaginated(page = 1, pageSize = 50): Promise<PaginatedResponse<Facility>> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'), limit(pageSize));

  const snapshot = await getDocs(q);
  const facilities: Facility[] = [];

  snapshot.forEach(doc => {
    const data = doc.data() as {
      name: string;
      address: string;
      contactPerson: string;
      phone: string;
      email: string;
      stations?: unknown[];
      colorCode?: string;
      debtorNumber?: string;
      billingAddress?: string;
      billingEmail?: string;
      billingPhone?: string;
      paymentTerms?: string;
      taxId?: string;
      vatId?: string;
      createdAt?: { toDate: () => Date };
      updatedAt?: { toDate: () => Date };
    };
    facilities.push({
      id: doc.id,
      name: data.name,
      address: data.address,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      stations: (data.stations as Station[]) || [],
      colorCode: data.colorCode || '#005f73',
      debtorNumber: data.debtorNumber || '',
      billingAddress: data.billingAddress || '',
      billingEmail: data.billingEmail || '',
      billingPhone: data.billingPhone || '',
      paymentTerms: data.paymentTerms || '',
      taxId: data.taxId || '',
      vatId: data.vatId || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });

  return {
    data: facilities,
    total: facilities.length,
    page,
    limit: pageSize,
    hasMore: facilities.length === pageSize,
  };
}
```

#### create
```typescript
async create(data: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Best-effort Audit Log (client-side)
  try {
    await writeAuditLog({
      actorUid: (await import('firebase/auth')).getAuth().currentUser?.uid || 'unknown',
