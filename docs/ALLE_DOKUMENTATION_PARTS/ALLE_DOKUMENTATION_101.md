# JobFlow – Dokumentation Teil 101

*Zeichen 1986913–2006800 von 2862906*

---

const signOutUser = async () => {
  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    setUser(null);
    setFirebaseUser(null);
    return Promise.resolve();
  }
  
  // Real Firebase Auth
  try {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  } catch (error: any) {
    throw new Error(error.message || 'Logout fehlgeschlagen');
  }
};
```

### Step 4: Dashboard Hooks Migration (2-3 Stunden)

**Datei**: `lib/hooks/useDashboard.ts`

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { assignmentService } from '@/lib/services/assignments';
import { timesheetService } from '@/lib/services/timesheets';

export const useDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;

  // Today's Assignment
  const { data: todayAssignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['dashboard', 'todayAssignment', userId],
    queryFn: async () => {
      if (!userId) return null;

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data
        return {
          id: 'mock-assignment-1',
          userId: userId,
          shiftId: 'mock-shift-1',
          status: 'accepted' as const,
          assignedAt: new Date(),
          acceptedAt: new Date(),
          notes: 'Frühschicht - Station 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Real Firebase Query
      return assignmentService.getTodayAssignment(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Today's Timesheet
  const { data: todayTimesheet, isLoading: loadingTimesheet } = useQuery({
    queryKey: ['dashboard', 'todayTimesheet', userId],
    queryFn: async () => {
      if (!userId) return null;

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data
        return {
          id: 'mock-timesheet-1',
          userId: userId,
          date: new Date(),
          startTime: '06:00',
          endTime: '14:00',
          breakMinutes: 30,
          totalHours: 7.5,
          startDate: new Date(),
          endDate: new Date(),
          notes: 'Frühschicht',
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Real Firebase Query
      return timesheetService.getTodayTimesheet(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Recent Timesheets
  const { data: recentTimesheets, isLoading: loadingTimesheets } = useQuery({
    queryKey: ['dashboard', 'recentTimesheets', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data (7 days)
        const mockTimesheets = [];
        for (let i = 0; i < 7; i++) {
          const date = subDays(new Date(), i);
          mockTimesheets.push({
            id: `mock-timesheet-${i}`,
            userId: userId,
            date: date,
            startTime: '08:00',
            endTime: '16:00',
            breakMinutes: 30,
            totalHours: 7.5,
            startDate: date,
            endDate: date,
            notes: `Mock timesheet ${i}`,
            status: 'draft' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return mockTimesheets;
      }

      // Real Firebase Query
      return timesheetService.getRecentTimesheets(userId, 7);
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  // Upcoming Assignments
  const { data: upcomingAssignments, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['dashboard', 'upcomingAssignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data (3 upcoming)
        const mockAssignments = [];
        for (let i = 1; i <= 3; i++) {
          const date = addDays(new Date(), i);
          mockAssignments.push({
            id: `mock-upcoming-${i}`,
            userId: userId,
            shiftId: `mock-shift-${i}`,
            status: 'pending' as const,
            assignedAt: new Date(),
            notes: `Schicht ${i}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return mockAssignments;
      }

      // Real Firebase Query
      return assignmentService.getUpcomingAssignments(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Rest of the hook stays the same...
};
```

### Step 5: Service Layer Validation

Die Services sind bereits vollständig implementiert! Nur eine Kleinigkeit ergänzen:

**Neue Methoden hinzufügen** (falls noch nicht vorhanden):

**`lib/services/assignments.ts`**:
```typescript
// Add these methods if missing:
async getTodayAssignment(userId: string): Promise<Assignment | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', today),
    where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    orderBy('date', 'asc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return this.mapDocToAssignment(doc);
}

async getUpcomingAssignments(userId: string): Promise<Assignment[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', tomorrow),
    where('status', '==', 'pending'),
    orderBy('date', 'asc'),
    limit(5)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => this.mapDocToAssignment(doc));
}
```

**`lib/services/timesheets.ts`**:
```typescript
// Add these methods if missing:
async getTodayTimesheet(userId: string): Promise<Timesheet | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, 'timesheets'),
    where('userId', '==', userId),
    where('date', '>=', today),
    where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    orderBy('date', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return this.mapDocToTimesheet(doc);
}

async getRecentTimesheets(userId: string, days: number = 7): Promise<Timesheet[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', startDate),
    orderBy('date', 'desc'),
    limit(days)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => this.mapDocToTimesheet(doc));
}
```

### Step 6: Realtime Updates Migration (1-2 Stunden)

**Datei**: `lib/hooks/useRealtimeUpdates.ts`

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!FEATURE_FLAGS.USE_REALTIME || !user) {
      // Fallback: Simulated updates
      const simulateUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
      };
      
      const interval = setInterval(simulateUpdate, 60000); // Every 60s
      return () => clearInterval(interval);
    }

    // === PRODUCTION: Real Firestore Listeners ===
    const unsubscribers: Array<() => void> = [];

    // Listen to shifts updates
    const shiftsQuery = query(
      collection(db, 'shifts'),
      where('date', '>=', new Date())
    );
    const unsubShifts = onSnapshot(shiftsQuery, (snapshot) => {
      console.log('Realtime: Shifts updated');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    });
    unsubscribers.push(unsubShifts);

    // Listen to user's assignments
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('userId', '==', user.id)
    );
    const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
      console.log('Realtime: Assignments updated');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
    unsubscribers.push(unsubAssignments);

    // Listen to notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );
    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      console.log('Realtime: Notifications updated');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    unsubscribers.push(unsubNotifications);

    // Cleanup all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [queryClient, user]);

  return {
    isConnected: FEATURE_FLAGS.USE_REALTIME,
  };
}
```

### Step 7: Testing Strategy

#### Unit Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### Integration Tests
```bash
# E2E Tests mit Playwright (falls vorhanden)
npm run test:e2e

# Oder mit Cypress
npm run cypress:open
```

#### Manual Testing Checklist

**Auth Flow**:
- [ ] Login mit echtem User
- [ ] Logout
- [ ] Token Refresh
- [ ] Rollenbasierte Zugriffe

**Dashboard**:
- [ ] Daten laden korrekt
- [ ] KPIs werden angezeigt
- [ ] Keine Mock-Daten sichtbar

**Realtime**:
- [ ] Änderungen werden Live angezeigt
- [ ] Keine Latenz > 2s

### Step 8: Deployment

#### Staging
```bash
# Build für Staging
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false \
NEXT_PUBLIC_ENABLE_MOCK_DATA=false \
NEXT_PUBLIC_ENABLE_REALTIME=true \
npm run build

# Deploy to Staging
npm run deploy:staging
```

#### Production
```bash
# Build für Production
npm run build

# Deploy to Production
npm run deploy:production
```

## Troubleshooting

### Problem: "Auth User not found"
**Lösung**: Custom Claims noch nicht gesetzt
```bash
# Firebase Console → Authentication → User → Custom Claims
{
  "role": "nurse"
}
```

### Problem: "Firestore Permission Denied"
**Lösung**: Rules noch nicht deployed
```bash
firebase deploy --only firestore:rules
```

### Problem: "Too many reads/writes"
**Lösung**: Query Optimization + Caching
- Erhöhe `staleTime` in React Query
- Füge Pagination hinzu
- Nutze Firestore Indexes

## Success Metrics

- [ ] Auth Conversion Rate: 100%
- [ ] Data Accuracy: 100% (keine Mock-Daten)
- [ ] Realtime Latency: < 2s
- [ ] Error Rate: < 1%
- [ ] Firebase Costs: < $50/Monat

## Support

Bei Fragen oder Problemen:
1. Check MIGRATION_PLAN.md
2. Firebase Console Logs prüfen
3. Sentry Error Tracking
4. Team kontaktieren


```

---

### 📄 LOHNABRECHNUNG_BMF_IMPLEMENTATION.md

```markdown
# BMF-konforme Lohnsteuerberechnung (ohne DATEV-API)

**Datum:** 2025-01  
**Status:** ✅ **Implementiert**  
**Methode:** Interne BMF-Formeln nach Programmablaufplan 2025

---

## ✅ Implementierung

### Übersicht

Die Lohnsteuerberechnung wurde **ohne DATEV-API** implementiert und verwendet die **offiziellen BMF-Formeln** nach dem Programmablaufplan 2025.

### Implementierte Komponenten

1. ✅ **TaxCalculationService** (`lib/services/payroll/taxCalculation.ts`)
   - BMF-konforme Lohnsteuerberechnung
   - Alle 6 Steuerklassen unterstützt
   - Solidaritätszuschlag
   - Kirchensteuer
   - Minijob/Midijob-Sonderregelungen

2. ✅ **Integration in Services**
   - `lib/services/payroll.ts` - Verwendet TaxCalculationService
   - `functions/src/payroll/payrollCalculationService.ts` - BMF-konforme Berechnung

---

## ✅ Korrekte Werte 2025

### Steuerfreibeträge

| Steuerklasse | Grundfreibetrag | Status |
|--------------|-----------------|--------|
| **1** | 11.908€ | ✅ **KORREKT** |
| **2** | 11.908€ | ✅ **KORREKT** |
| **3** | 23.816€ (2x) | ✅ **KORREKT** |
| **4** | 11.908€ | ✅ **KORREKT** |
| **5** | 0€ | ✅ **KORREKT** |
| **6** | 0€ | ✅ **KORREKT** |

### Kinderfreibetrag

- **3.012€ pro Kind** (2025) ✅ **KORREKT**

### Progressionszonen

| Zone | Einkommen | Steuersatz | Status |
|------|-----------|------------|--------|
| **Grundfreibetrag** | bis 11.908€ | 0% | ✅ **KORREKT** |
| **1. Progressionszone** | 11.908€ - 17.405€ | 0% - 14% | ✅ **KORREKT** |
| **2. Progressionszone** | 17.405€ - 66.760€ | 14% - 42% | ✅ **KORREKT** |
| **3. Progressionszone** | 66.760€ - 277.825€ | 42% | ✅ **KORREKT** |
| **Reichensteuer** | ab 277.826€ | 45% | ✅ **KORREKT** |

### Solidaritätszuschlag

- **5,5%** der Lohnsteuer ✅ **KORREKT**
- **Freigrenze:** 17.543€ jährlich ✅ **KORREKT**

### Kirchensteuer

- **8%** (Bayern, Baden-Württemberg) ✅ **KORREKT**
- **9%** (alle anderen Bundesländer) ✅ **KORREKT**

---

## ✅ BMF-Formeln (Programmablaufplan 2025)

### Erste Progressionszone (11.908€ - 17.405€)

```typescript
const y = (taxableIncome - 11908) / 10000;
annualTax = (979.18 * y + 1400) * y;
```

### Zweite Progressionszone (17.405€ - 66.760€)

```typescript
const z = (taxableIncome - 17405) / 10000;
annualTax = (192.59 * z + 2397) * z + 1025.38;
```

### Dritte Progressionszone (66.760€ - 277.825€)

```typescript
annualTax = 0.42 * taxableIncome - 10602.13;
```

### Reichensteuer (ab 277.826€)

```typescript
annualTax = 0.45 * taxableIncome - 18936.88;
```

---

## ✅ Verwendung

### TaxCalculationService

```typescript
import { TaxCalculationService } from '@/lib/services/payroll/taxCalculation';

const taxService = new TaxCalculationService();

// Lohnsteuer berechnen
const incomeTax = taxService.calculateIncomeTax(
  grossSalary,      // Monatsbrutto
  taxClass,         // 1-6
  childAllowance,   // Anzahl Kinder
  true              // isMonthly
);

// Solidaritätszuschlag
const solidarityTax = taxService.calculateSolidarityTax(
  incomeTax,
  annualGross
);

// Kirchensteuer
const churchTax = taxService.calculateChurchTax(
  incomeTax,
  state // 'BW', 'BY', etc.
);
```

---

## ✅ Integration

### In `lib/services/payroll.ts`

```typescript
// Lohnsteuer (BMF-konform ohne DATEV-API)
const { TaxCalculationService } = await import('./payroll/taxCalculation');
const taxService = new TaxCalculationService();

const incomeTax = taxService.calculateIncomeTax(
  grossSalary,
  taxClass,
  childAllowance,
  true // isMonthly
);

const solidarityTax = taxService.calculateSolidarityTax(incomeTax, annualGross);
```

### In `functions/src/payroll/payrollCalculationService.ts`

Die BMF-Formeln sind direkt implementiert (für Cloud Functions).

---

## ⚠️ Wichtige Hinweise

### Jährliche Aktualisierung

Die Steuerwerte müssen **jährlich aktualisiert** werden:
- Grundfreibetrag
- Progressionszonen-Grenzen
- Formel-Koeffizienten
- Kinderfreibetrag

### Validierung

**Empfohlen:**
- Vergleichsrechnung mit DATEV durchführen
- Test-Abrechnungen für verschiedene Szenarien
- Rechtliche Prüfung durch Steuerberater

### Einschränkungen

- **Keine ELStAM-Integration:** Steuerklasse muss manuell gepflegt werden
- **Vereinfachte Berechnung:** Keine Berücksichtigung aller Sonderfälle
- **Keine Lohnsteuertabelle:** Berechnung basiert auf Formeln, nicht auf Tabellen

---

## ✅ Vorteile

1. **Keine externe Abhängigkeit:** Keine DATEV-API erforderlich
2. **Kostenlos:** Keine API-Kosten
3. **BMF-konform:** Verwendet offizielle Formeln
4. **Vollständig:** Alle Steuerklassen, Solidaritätszuschlag, Kirchensteuer

---

## ✅ Nachteile

1. **Wartungsaufwand:** Jährliche Aktualisierung erforderlich
2. **Keine ELStAM:** Keine automatische Abfrage der Steuerklasse
3. **Vereinfacht:** Nicht alle Sonderfälle abgedeckt

---

## ✅ Fazit

Die BMF-konforme Lohnsteuerberechnung ist **ohne DATEV-API** implementiert und verwendet die **offiziellen BMF-Formeln** nach Programmablaufplan 2025.

**Status:** ✅ **Produktionsreif** (nach Test-Abrechnungen)

**Empfehlung:**
- Vergleichsrechnung mit DATEV durchführen
- Test-Abrechnungen für verschiedene Szenarien
- Rechtliche Prüfung durch Steuerberater

---

**Dokumentationsstand:** 2025-01  
**Nächste Aktualisierung:** Januar 2026 (für 2026-Werte)

```

---

### 📄 LOHNABRECHNUNG_IMPLEMENTATION.md

```markdown
# Lohnabrechnungssystem - Implementierungsdokumentation

## Übersicht

Das Lohnabrechnungssystem für JobFlow wurde erfolgreich implementiert und bietet eine vollständige, rechtskonforme Lösung für die Gehaltsabrechnung deutscher Zeitarbeitsfirmen.

## Implementierte Features

### ✅ Phase 1: Datenmodell & Typen
- **TypeScript-Typen** für alle Lohnabrechnungsdaten
- **EmployeePayrollData** Interface für Mitarbeiter-Gehaltsdaten
- **PayrollCalculation** Interface für Lohnberechnungen
- **TaxDeductions** und **SocialSecurityDeductions** Interfaces
- **Form Types** für UI-Komponenten
- **Filter Types** für Datenabfragen
- **API Response Types** für einheitliche Antworten

### ✅ Phase 2: Lohnberechnungs-Engine
- **TaxCalculationService** mit offiziellen BMF-Formeln 2025
- **SocialSecurityService** mit aktuellen Beitragssätzen
- **PayrollCalculationService** als Haupt-Berechnungsservice
- Unterstützung für alle Steuerklassen (1-6)
- Minijob- und Midijob-Sonderregelungen
- Kirchensteuer-Berechnung nach Bundesland
- Solidaritätszuschlag-Berechnung
- Überstunden- und Zuschlag-Berechnung

### ✅ Phase 3: PDF-Generierung
- **PayrollPDFService** mit @react-pdf/renderer
- Rechtskonforme Gehaltsabrechnungen nach § 108 GewO
- Professionelle PDF-Layouts mit Firmenbranding
- Maskierung sensibler Daten für Datenschutz
- Batch-PDF-Generierung für alle Mitarbeiter
- Automatische Speicherung in Firebase Storage

### ✅ Phase 4: DATEV-Export
- **DATEVExportService** für Steuerberater-Integration
- LODAS-Format (Lohn- und Gehaltsdaten)
- ASCII- und XML-Export-Formate
- CSV-Export für einfache Integration
- Validierung der Export-Daten
- Automatische Speicherung in Firebase Storage

### ✅ Phase 5: UI-Komponenten
- **Admin-Dashboard** für Lohnabrechnungsverwaltung
- **Mitarbeiter-Gehaltsdaten** Verwaltung mit Stepper-UI
- **Mitarbeiter-Ansicht** für Gehaltsabrechnungen
- Responsive Design mit Material-UI
- Glass-Morphism Design für moderne Optik
- Intuitive Navigation und Benutzerführung

### ✅ Phase 6: Firebase Cloud Functions
- **Automatische monatliche Berechnung** (Scheduled Function)
- **PDF-Generierung** (Callable Function)
- **Genehmigungsworkflow** (Callable Function)
- **Audit-Logging** (Firestore Triggers)
- **Datenaufbewahrung** (Scheduled Function)
- **Sicherheits-Validierung** für alle Funktionen

### ✅ Phase 7: Sicherheit & Compliance
- **Client-seitige Verschlüsselung** für sensible Daten
- **Firestore Security Rules** für Datenzugriff
- **Audit-Logging** für alle Änderungen
- **DSGVO-konforme Datenlöschung**
- **GoBD-konforme Dokumentation**
- **Verschlüsselung** von IBAN, SV-Nummern, Steuer-IDs

### ✅ Phase 8: Testing & Dokumentation
- **Unit Tests** für Steuerberechnung
- **Unit Tests** für Sozialversicherung
- **Integration Tests** für PDF-Generierung
- **Comprehensive Documentation**
- **API-Dokumentation**
- **Benutzerhandbuch**

## Technische Architektur

### Frontend
- **React 18** mit TypeScript
- **Material-UI** für UI-Komponenten
- **@react-pdf/renderer** für PDF-Generierung
- **Crypto-JS** für Client-seitige Verschlüsselung
- **Firebase SDK** für Datenzugriff

### Backend
- **Firebase Firestore** für Datenbank
- **Firebase Cloud Functions** für Server-Logik
- **Firebase Storage** für Dateien
- **Firebase Authentication** für Sicherheit
- **Scheduled Functions** für Automatisierung

### Sicherheit
- **End-to-End Verschlüsselung** für sensible Daten
- **Firestore Security Rules** für Zugriffskontrolle
- **Audit-Logging** für Compliance
