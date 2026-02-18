# Firebase Firestore – Query- und Index-Audit (JobFlow)

Stand: Vollprüfung aller Queries in `lib/` und Abgleich mit `firestore.indexes.json`.

## Aktuelle Queries (Übersicht)

- **Gezählte Query-Calls** (where/orderBy/limit) in `lib/`: ~450+ Vorkommen über 50+ Dateien.
- **Wichtige Collections**: assignments, timesheets, shifts, users, reports, alerts, documents, employeeNotifications, chatChannels, messages, times, payrollItems, activities, facilities.

---

## Kritische Queries und zugehörige Indexes

### 1. Timesheets (Hochfrequenz)

| Quelle | Query | Index-Status |
|--------|------|--------------|
| `lib/services/timesheets/read.ts` | `userId` ==, `orderBy('date','desc')`, limit | ✅ userId ASC, date DESC |
| `lib/services/timesheets/read.ts` | `userId` ==, `date` >=/<=, `orderBy('date','asc')` | ✅ userId ASC, date ASC |
| `lib/services/timesheets/read.ts` | `userId` ==, `date` >=, `orderBy('date','desc')`, limit(1) | ✅ userId ASC, date DESC |
| companyId + userId + date (ASC/DESC) | Diverse Listen/Exporte | ✅ in firestore.indexes.json |

**Verwendeter Index (Beispiel):**  
`collectionGroup: timesheets`  
`fields: userId ASC, date DESC` (bzw. date ASC je nach Query).

---

### 2. Assignments (Pflegekraft & Admin)

| Quelle | Query | Index-Status |
|--------|------|--------------|
| `lib/services/assignments/read.ts` | companyId, userId, orderBy assignedAt desc, limit | ✅ companyId, userId, assignedAt |
| `lib/services/assignments/read2.ts` | companyId, shiftId, orderBy assignedAt asc | ✅ **NEU:** companyId, shiftId, assignedAt ASC |
| `lib/services/assignments/read2.ts` | companyId, orderBy assignedAt desc, limit | ✅ companyId, assignedAt DESC |
| useRealtimeUpdates | userId, (companyId), assignments | ✅ companyId, userId, assignedAt |

---

### 3. Reports

| Quelle | Query | Index-Status |
|--------|------|--------------|
| `lib/services/reports.ts` | companyId, userId, orderBy createdAt desc | ✅ **NEU:** reports – companyId ASC, userId ASC, createdAt DESC |
| getReportCounts | companyId, userId (, status) | Gleichheitsfilter; kein zusätzlicher Composite nötig |

**Generierter Index:**  
`collectionGroup: reports`  
`fields: companyId ASC, userId ASC, createdAt DESC`

---

### 4. Users (Admin-Dashboard / Staff)

| Quelle | Query | Index-Status |
|--------|------|--------------|
| `lib/services/users.ts` getByStatus | currentStatus ==, orderBy displayName asc | ✅ **NEU:** users – currentStatus ASC, displayName ASC |
| role, active, displayName / companyId, createdAt | Diverse Listen | ✅ bereits in firestore.indexes.json |

**Generierter Index:**  
`collectionGroup: users`  
`fields: currentStatus ASC, displayName ASC`

---

### 5. Shifts (Dienstplan)

| Quelle | Query | Index-Status |
|--------|------|--------------|
| `lib/services/shifts/read4.ts` getWithFilters | companyId, facilityId, stationId?, type, status, date >=/<=, orderBy date asc | ✅ **NEU:** shifts – companyId, facilityId, stationId, type, status, date ASC |
| `lib/services/shifts/read7.ts` | dateFrom/To, facilityId, status, type, orderBy date asc, startTime asc | ✅ **NEU:** shifts – facilityId, status, type, date ASC, startTime ASC |
| read2, read3, shiftsLegacy | facilityId, companyId, status, type, date | ✅ diverse bestehende Shift-Indizes |

---

### 6. Limit-Erhöhungsanträge (Mitarbeiter)

| Quelle | Query | Index-Status |
|--------|------|--------------|
| `lib/services/timesheets/requestLimitIncrease.ts` | mitarbeiterId, status == 'pending', orderBy createdAt desc, limit(1) | ✅ limitIncreaseRequests – mitarbeiterId, status, createdAt DESC |

---

### 7. Weitere Collections (bereits abgedeckt)

- **employeeNotifications:** userId, companyId, orderBy createdAt desc ✅  
- **alerts:** companyId, userId, orderBy createdAt desc ✅  
- **chatChannels:** participants array-contains, archived, orderBy updatedAt desc ✅  
- **messages / adminMessages:** channelId, orderBy createdAt asc/desc ✅  
- **facilities:** companyId, orderBy name asc ✅  
- **documents, times, payrollItems, activities, companyTemplates:** vorhandene Indizes ✅  

---

## In dieser Prüfung ergänzte Composite-Indizes

| # | collectionGroup | Felder | Verwendung |
|---|-----------------|--------|------------|
| 1 | reports | companyId ASC, userId ASC, createdAt DESC | reports.getAll() |
| 2 | users | currentStatus ASC, displayName ASC | users.getByStatus() (Staff/Admin) |
| 3 | shifts | companyId, facilityId, stationId, type, status, date ASC | shifts read4 getWithFilters (mit stationId) |
| 4 | shifts | facilityId, status, type, date ASC, startTime ASC | shifts read7 getShiftsWithAssignments |
| 5 | assignments | companyId, shiftId, assignedAt ASC | assignments read2 getByShiftId |

---

## Checkliste Vorher/Nachher

### Vorher

- [ ] Firebase Console: Missing-Index-Warnungen prüfen  
- [ ] Query-Logs: langsame Queries (>500 ms) identifizieren  

### Nachher (Ziel)

- [ ] Alle neuen Indizes in Firebase auf „READY“  
- [ ] Query-Performance <100 ms bei typischen Listen (z. B. 10k+ Dokumente)  
- [ ] Keine „Missing index“-Fehler für die oben genannten Queries  

---

## Deploy der Indizes

```bash
firebase deploy --only firestore:indexes
```

Nach dem Deploy in der [Firebase Console](https://console.firebase.google.com) unter **Firestore → Indexes** prüfen, bis alle neuen Indizes den Status **READY** haben (typisch 5–15 Minuten).

---

## Hinweise

- **Einzelfeld-Indizes** (z. B. createdAt, updatedAt, mitarbeiterId) werden von Firestore automatisch erstellt.  
- **Gleichheitsfilter ohne orderBy** benötigen keinen eigenen Composite-Index.  
- Bei **Inequality + orderBy** muss das orderBy-Feld im Index enthalten sein; bei mehreren Gleichheitsfiltern müssen alle vor dem Bereichs-/Sortierfeld im Index stehen.
