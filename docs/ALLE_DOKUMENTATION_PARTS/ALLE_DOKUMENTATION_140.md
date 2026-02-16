# JobFlow – Dokumentation Teil 140

*Zeichen 2761773–2781640 von 2862906*

---

**Rechtsstand:** Deutschland, BAG-Urteil 2022, ArbZG, GoBD, DSGVO  
**Prüfungsbereich:** Vollständige Zeiterfassungsfunktionalität

---

## 1. BAG-Urteil 2022 Compliance

### 1.1 Objektive Erfassung ✅

**Rechtsgrundlage:** BAG-Urteil vom 13. September 2022 (1 ABR 22/21)

**Anforderung:** System muss objektiv arbeiten, ohne Manipulationsmöglichkeiten

**Prüfung:**
- ✅ **Server-seitige Berechnung:** `totalHours` wird in `submitTimesheet.ts` (Zeile 69-70) server-seitig berechnet
- ✅ **Client-Manipulation verhindert:** Client kann `totalHours` nicht direkt setzen
- ✅ **Validierung vor Submit:** Vollständige ArbZG-Validierung in `submitTimesheet.ts` (Zeile 87) blockiert ungültige Zeiterfassungen

**Status:** ✅ **ERFÜLLT**

### 1.2 Verlässliche Erfassung ✅

**Anforderung:** Daten müssen korrekt und vollständig sein

**Prüfung:**
- ✅ **Vollständige Validierung:** `validateTimesheetArbZG()` prüft alle ArbZG-Anforderungen
- ✅ **Mehrfache Validierung:** 
  - Bei Erstellung (`timesheetValidation.ts` Zeile 34-99)
  - Bei Update (`timesheetValidation.ts` Zeile 101-159)
  - Vor Submit (`submitTimesheet.ts` Zeile 87)
- ✅ **Fehlerbehandlung:** Validierungsfehler werden gespeichert und blockieren Submit

**Status:** ✅ **ERFÜLLT**

### 1.3 Zugängliche Erfassung ✅

**Anforderung:** Daten müssen für Arbeitgeber und Arbeitnehmer zugänglich sein

**Prüfung:**
- ✅ **Mitarbeiter-UI:** `/employee/zeiterfassung` - Vollständige Zeiterfassungsfunktionalität
- ✅ **Admin-Übersicht:** Admin kann alle Timesheets einsehen
- ✅ **Historie:** Mitarbeiter können ihre eigenen Zeiterfassungen einsehen
- ✅ **Firestore Rules:** Zugriffskontrolle über `firestore.rules` (Zeilen 348-395)

**Status:** ✅ **ERFÜLLT**

---

## 2. ArbZG-Konformität

### 2.1 Höchstarbeitszeit (§3 ArbZG)

#### 2.1.1 Tägliche Höchstarbeitszeit (10 Stunden) ✅

**Rechtsgrundlage:** ArbZG §3 Abs. 2

**Prüfung:**
- ✅ **Konstante definiert:** `ARBZG_CONSTANTS.MAX_DAILY_HOURS = 10` (`timesheetValidationUtils.ts` Zeile 12)
- ✅ **Validierung implementiert:** `timesheetValidationUtils.ts` Zeile 111-115
- ✅ **Netto-Arbeitszeit:** Prüfung bezieht sich auf Netto-Arbeitszeit (nach Pausenabzug)
- ✅ **Blockierung bei Verstoß:** Fehler blockiert Submit (`submitTimesheet.ts` Zeile 90-106)

**Status:** ✅ **ERFÜLLT**

#### 2.1.2 Wöchentliche Höchstarbeitszeit (48 Stunden) ✅

**Rechtsgrundlage:** ArbZG §3 Abs. 1

**Prüfung:**
- ✅ **Konstante definiert:** `ARBZG_CONSTANTS.MAX_WEEKLY_HOURS = 48` (`timesheetValidationUtils.ts` Zeile 13)
- ✅ **Berechnung implementiert:** `calculateWeeklyHours()` (`timesheetValidationUtils.ts` Zeile 256-294)
- ✅ **Wochenberechnung:** Montag bis Sonntag (korrekt)
- ✅ **Validierung:** `timesheetValidationUtils.ts` Zeile 141-147
- ✅ **Blockierung bei Verstoß:** Fehler blockiert Submit

**Status:** ✅ **ERFÜLLT**

### 2.2 Ruhepausen (§4 ArbZG)

#### 2.2.1 30 Minuten Pause nach 6 Stunden ✅

**Rechtsgrundlage:** ArbZG §4 Abs. 1

**Prüfung:**
- ✅ **Konstante definiert:** `ARBZG_CONSTANTS.MIN_BREAK_AFTER_6_HOURS = 30` (`timesheetValidationUtils.ts` Zeile 14)
- ✅ **Validierung implementiert:** `timesheetValidationUtils.ts` Zeile 119-123
- ✅ **Brutto-Arbeitszeit:** Prüfung bezieht sich auf Brutto-Arbeitszeit (Zeitspanne zwischen Start und Ende)
- ✅ **Blockierung bei Verstoß:** Fehler blockiert Submit

**Status:** ✅ **ERFÜLLT**

#### 2.2.2 45 Minuten Pause nach 9 Stunden ✅

**Rechtsgrundlage:** ArbZG §4 Abs. 2

**Prüfung:**
- ✅ **Konstante definiert:** `ARBZG_CONSTANTS.MIN_BREAK_AFTER_9_HOURS = 45` (`timesheetValidationUtils.ts` Zeile 15)
- ✅ **Validierung implementiert:** `timesheetValidationUtils.ts` Zeile 126-130
- ✅ **Brutto-Arbeitszeit:** Prüfung bezieht sich auf Brutto-Arbeitszeit
- ✅ **Blockierung bei Verstoß:** Fehler blockiert Submit

**Status:** ✅ **ERFÜLLT**

### 2.3 Ruhezeiten (§5 ArbZG) ✅

**Rechtsgrundlage:** ArbZG §5 Abs. 1 - 11 Stunden Ruhezeit zwischen Schichten

**Prüfung:**
- ✅ **Konstante definiert:** `ARBZG_CONSTANTS.MIN_REST_PERIOD = 11` (`timesheetValidationUtils.ts` Zeile 16)
- ✅ **Validierung implementiert:** `validateRestPeriod()` (`timesheetValidationUtils.ts` Zeile 171-251)
- ✅ **Aufruf in Hauptvalidierung:** `timesheetValidationUtils.ts` Zeile 133-139
- ✅ **Aufruf bei Submit:** Wird über `validateTimesheetArbZG()` aufgerufen (`submitTimesheet.ts` Zeile 87)
- ✅ **Nachtschicht-Handling:** Korrekte Behandlung von Nachtschichten (Zeile 212-215)
- ✅ **Blockierung bei Verstoß:** Fehler blockiert Submit

**Hinweis:** Die Compliance-Analyse vom Januar 2025 war veraltet. Die Ruhezeiten-Validierung ist vollständig implementiert.

**Status:** ✅ **ERFÜLLT**

### 2.4 Überschneidungsprüfung ✅

**Prüfung:**
- ✅ **Implementiert:** `checkTimesheetOverlaps()` (`timesheetValidationUtils.ts` Zeile 299-357)
- ✅ **Aufruf:** `timesheetValidationUtils.ts` Zeile 150-158
- ✅ **Nachtschicht-Handling:** Korrekte Behandlung von Nachtschichten
- ✅ **Blockierung bei Verstoß:** Fehler blockiert Submit

**Status:** ✅ **ERFÜLLT**

---

## 3. GoBD-Konformität

### 3.1 Unveränderlichkeit nach Genehmigung ✅

**Rechtsgrundlage:** GoBD - Unveränderlichkeit nach Genehmigung

**Prüfung:**

#### 3.1.1 Firestore Security Rules ✅
- ✅ **Update-Verbot:** `firestore.rules` Zeile 372-374 blockiert Updates bei `approved`/`submitted`
- ✅ **Delete-Verbot:** `firestore.rules` Zeile 383-385 blockiert Löschung bei `approved`/`submitted`
- ✅ **Status-Prüfung:** Explizite Prüfung auf `status != 'approved' && status != 'submitted'`

#### 3.1.2 Cloud Function Schutz ✅
- ✅ **Trigger implementiert:** `protectApprovedTimesheets` (`protectTimesheet.ts` Zeile 18-119)
- ✅ **Automatische Wiederherstellung:** Bei Änderungsversuch werden Werte wiederhergestellt (Zeile 94-104)
- ✅ **Audit-Log:** Alle Änderungsversuche werden protokolliert (Zeile 77-88)

**Status:** ✅ **ERFÜLLT**

### 3.2 Audit-Trail ✅

**Prüfung:**
- ✅ **Audit-Logs:** `auditLogs` Collection vorhanden
- ✅ **Erstellung bei Submit:** `submitTimesheet.ts` Zeile 122-136
- ✅ **Erstellung bei Validierung:** `timesheetValidation.ts` Zeile 63-73, 139-149
- ✅ **Erstellung bei Änderungsversuch:** `protectTimesheet.ts` Zeile 77-88
- ✅ **Vollständigkeit:** Alte und neue Werte werden gespeichert
- ✅ **Unveränderlichkeit:** Audit-Logs sind unveränderlich (`firestore.rules` Zeile 586)

**Status:** ✅ **ERFÜLLT**

### 3.3 Vollständigkeit ✅

**Prüfung:**
- ✅ **Pflichtfelder:** Alle ArbZG-Pflichtfelder werden erfasst:
  - `date` (Datum)
  - `startTime` (Startzeit)
  - `endTime` (Endzeit)
  - `breakMinutes` (Pausen)
  - `totalHours` (Gesamtstunden)
- ✅ **Zusatzfelder:** Zusätzliche Felder für Pflegebereich:
  - `nightHours` (Nachtschicht-Stunden)
  - `weekendHours` (Wochenend-Stunden)
  - `holidayHours` (Feiertags-Stunden)
  - `overtimeHours` (Überstunden)

**Status:** ✅ **ERFÜLLT**

### 3.4 Nachvollziehbarkeit ✅

**Prüfung:**
- ✅ **Audit-Logs:** Vollständige Änderungshistorie
- ✅ **Timestamps:** `createdAt`, `updatedAt`, `submittedAt`, `approvedAt`
- ✅ **Benutzer-Tracking:** `userId`, `approvedBy`, `facilitySignedBy`

**Status:** ✅ **ERFÜLLT**

### 3.5 Aufbewahrung ⚠️

**Rechtsgrundlage:** GoBD - 10 Jahre Aufbewahrung für Lohnabrechnungen

**Prüfung:**
- ⚠️ **Keine automatische Archivierung:** Keine Cloud Function für Archivierung nach 10 Jahren
- ⚠️ **Keine automatische Löschung:** Keine Cloud Function für Löschung nach Aufbewahrungsfrist
- ✅ **Daten bleiben erhalten:** Daten werden nicht automatisch gelöscht

**Status:** ⚠️ **TEILWEISE** - Manuelle Archivierung/Löschung erforderlich

**Empfehlung:** Cloud Function für automatische Archivierung nach 10 Jahren implementieren

---

## 4. DSGVO-Konformität

### 4.1 Rechtmäßigkeit ✅

**Rechtsgrundlage:** DSGVO Art. 6 Abs. 1 lit. c - Erfüllung rechtlicher Verpflichtung

**Prüfung:**
- ✅ **Gesetzliche Verpflichtung:** Zeiterfassung ist gesetzlich vorgeschrieben (BAG-Urteil 2022, ArbZG §16)
- ✅ **Rechtsgrundlage klar:** Zeiterfassung dient der Erfüllung arbeitsrechtlicher Verpflichtungen

**Status:** ✅ **ERFÜLLT**

### 4.2 Zweckbindung ✅

**Prüfung:**
- ✅ **Zweck:** Zeiterfassung für Lohnabrechnung und Arbeitszeitnachweis
- ✅ **Keine Weitergabe:** Daten werden nicht an Dritte weitergegeben (außer gesetzlich erforderlich)

**Status:** ✅ **ERFÜLLT**

### 4.3 Datensparsamkeit ✅

**Prüfung:**
- ✅ **Nur notwendige Daten:** Nur für Zeiterfassung erforderliche Daten werden gespeichert
- ✅ **GPS optional:** GPS-Standort ist optional (nicht blockierend)
- ✅ **Keine überflüssigen Daten:** Keine unnötigen personenbezogenen Daten

**Status:** ✅ **ERFÜLLT**

### 4.4 Technische und organisatorische Maßnahmen (TOMs) ✅

**Prüfung:**
- ✅ **Verschlüsselung:** Firebase verschlüsselt Daten at-rest
- ✅ **Zugriffskontrolle:** Firebase Auth + Firestore Security Rules
- ✅ **Audit-Logs:** Vollständige Nachvollziehbarkeit
- ✅ **Backup:** Firebase automatische Backups

**Status:** ✅ **ERFÜLLT**

### 4.5 Betroffenenrechte ⚠️

**Prüfung:**
- ✅ **Zugriff:** Mitarbeiter können eigene Zeiterfassungen einsehen
- ✅ **Export:** Export-Funktion vorhanden (über Admin-UI)
- ⚠️ **Löschung:** Keine automatische Löschung nach Aufbewahrungsfrist (aber GoBD erfordert 10 Jahre Aufbewahrung)

**Status:** ✅ **ERFÜLLT** (Löschung nach Aufbewahrungsfrist widerspricht GoBD)

---

## 5. Signatur-Workflow

### 5.1 Mitarbeiter-Signatur ✅

**Prüfung:**
- ✅ **Feld vorhanden:** `employeeSignatureUrl`, `employeeSignedAt` im Timesheet-Interface
- ✅ **Speicherung:** Signatur wird in Firebase Storage gespeichert

**Status:** ✅ **ERFÜLLT**

### 5.2 Einrichtungs-Signatur ✅

**Prüfung:**
- ✅ **Feld vorhanden:** `facilitySignatureUrl`, `facilitySignedAt`, `facilitySignedBy` im Timesheet-Interface
- ✅ **Dialog:** `DailySignatureDialog.tsx` implementiert
- ✅ **Tägliche Signatur:** Signatur wird nach Schichtende angefordert

**Status:** ✅ **ERFÜLLT**

### 5.3 Sammelsignatur (>7 Tage) ❌

**Status:** ❌ **OBSOLET** - Wochensignatur wurde entfernt. Es werden nur noch tägliche Signaturen verwendet.

---

## 6. GPS-Tracking

### 6.1 GPS-Erfassung ✅

**Prüfung:**
- ✅ **Feld vorhanden:** `location` im Timesheet-Interface (`timesheets.ts` Zeile 41-45, `types/index.ts` Zeile 372-376)
- ✅ **Erfassung beim Start:** `zeiterfassung/page.tsx` Zeile 113
- ✅ **Erfassung beim Ende:** `zeiterfassung/page.tsx` Zeile 164
- ✅ **Browser Geolocation API:** Verwendet `navigator.geolocation`

**Status:** ✅ **ERFÜLLT**

### 6.2 GPS-Validierung ✅

**Prüfung:**
- ✅ **Validierung vorhanden:** `validateLocation()` in `timesheetValidation.ts` Zeile 265-311
- ✅ **Warnung bei Abweichung:** Warnung wenn >1km von Einrichtung entfernt
- ✅ **Nicht blockierend:** GPS-Fehler blockieren nicht (praxisnah)

**Status:** ✅ **ERFÜLLT**

---

## 7. Kritische Punkte und Empfehlungen

### 7.1 Keine kritischen Lücken gefunden ✅

**Ergebnis:** Die Zeiterfassung ist vollständig rechtskonform implementiert.

### 7.2 Verbesserungsvorschläge (optional)

#### 7.2.1 Automatische Archivierung nach 10 Jahren ⚠️

**Status:** Optional, nicht kritisch

**Empfehlung:** Cloud Function implementieren, die Timesheets nach 10 Jahren automatisch archiviert

#### 7.2.2 Sonntagsarbeit-Warnung ⚠️

**Status:** Optional, nicht kritisch

**Empfehlung:** Warnung bei Sonntagsarbeit hinzufügen (ArbZG §10 erlaubt Sonntagsarbeit in Pflegebereich mit Genehmigung)

---

## 8. Zusammenfassung

### 8.1 Gesamtbewertung

| Kategorie | Status | Bewertung |
|-----------|--------|-----------|
| **BAG-Urteil 2022** | ✅ | **100% ERFÜLLT** |
| **ArbZG-Konformität** | ✅ | **100% ERFÜLLT** |
| **GoBD-Konformität** | ✅ | **95% ERFÜLLT** (Aufbewahrung manuell) |
| **DSGVO-Konformität** | ✅ | **100% ERFÜLLT** |
| **Signatur-Workflow** | ✅ | **100% ERFÜLLT** |
| **GPS-Tracking** | ✅ | **100% ERFÜLLT** |

### 8.2 Compliance-Score

**Aktuell: 99/100** ✅

- BAG-Urteil: 100/100 ✅
- ArbZG: 100/100 ✅
- GoBD: 95/100 ✅ (Aufbewahrung manuell)
- DSGVO: 100/100 ✅
- Signatur: 100/100 ✅
- GPS: 100/100 ✅

### 8.3 Rechtliche Risiken

**Keine kritischen Risiken identifiziert** ✅

Die Zeiterfassung erfüllt alle gesetzlichen Anforderungen:
- ✅ BAG-Urteil 2022 vollständig erfüllt
- ✅ ArbZG vollständig konform
- ✅ GoBD konform (Aufbewahrung manuell)
- ✅ DSGVO konform
- ✅ Signatur-Workflow vollständig implementiert
- ✅ GPS-Tracking implementiert

### 8.4 Empfehlungen

**Sofort umsetzen:**
- Keine kritischen Punkte

**Mittelfristig (optional):**
1. Automatische Archivierung nach 10 Jahren implementieren
2. Sonntagsarbeit-Warnung hinzufügen

---

**Erstellt:** 2025-01-27  
**Nächste Prüfung:** Bei Änderungen an der Zeiterfassung oder neuen gesetzlichen Anforderungen




---

## Quelle: docs/SERVICE_INTEGRATION.md

# Service-Integration in JobFlow

## Übersicht

JobFlow implementiert eine vollständige Service-Integration mit React Query, optimiertem Caching, Error Boundaries und Performance-Optimierungen.

## 🏗️ Architektur

### Service-Layer

- **Firebase Services**: Zentrale Service-Klassen für alle CRUD-Operationen
- **React Query Hooks**: Feature-basierte Hooks mit optimiertem Caching
- **Error Boundaries**: Graceful Degradation bei Service-Fehlern
- **Performance**: Code-Splitting und Lazy Loading

### Service-Struktur

```
src/
├── services/
│   └── firebase.ts          # Alle Firebase-Services
├── features/
│   ├── auth/hooks/useAuth.ts
│   ├── customers/hooks/useCustomers.ts
│   ├── employees/hooks/useEmployees.ts
│   ├── orders/hooks/useOrders.ts
│   ├── worktimes/hooks/useWorktimes.ts
│   ├── documents/hooks/useDocuments.ts
│   ├── reports/hooks/useReports.ts
│   ├── invites/hooks/useInvites.ts
│   ├── notifications/hooks/useNotifications.ts
│   └── settings/hooks/useSettings.ts
├── hooks/
│   └── useServices.ts       # Zentraler Service-Hook
└── components/error/
    └── ServiceErrorBoundary.tsx
```

## 🚀 React Query Hooks

### Grundprinzipien

- **Optimistic Updates**: Sofortige UI-Updates mit Rollback bei Fehlern
- **Intelligentes Caching**: `staleTime` und `gcTime` für optimale Performance
- **Background Refetching**: Automatische Datenaktualisierung im Hintergrund
- **Error Handling**: Benutzerfreundliche Fehlermeldungen mit Recovery-Optionen

### Beispiel: useCustomers Hook

```typescript
export const useCustomers = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  // Fetch all customers
  const {
    data: customers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: data => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showSnackbar('Kunde erfolgreich erstellt', 'success');
    },
    onError: error => {
      showSnackbar(error.message, 'error');
    },
  });

  return {
    customers,
    isLoading,
    error,
    createCustomer: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};
```

### Optimistic Updates

```typescript
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => customerService.update(id, data),
  onMutate: async ({ id, data }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['customers'] });

    // Snapshot previous value
    const previousCustomers = queryClient.getQueryData(['customers']);

    // Optimistically update
    queryClient.setQueryData(['customers'], old => {
      if (!old) return old;
      return old.map(customer =>
        customer.id === id ? { ...customer, ...data, updatedAt: new Date() } : customer
      );
    });

    return { previousCustomers };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousCustomers) {
      queryClient.setQueryData(['customers'], context.previousCustomers);
    }
  },
});
```

## 🛡️ Error Boundaries

### ServiceErrorBoundary

- **Automatische Fehlerkategorisierung**: Network, Permission, Validation, System
- **Benutzerfreundliche Meldungen**: Deutsche Fehlermeldungen mit Handlungsanweisungen
- **Recovery-Optionen**: Retry, Home, Refresh
- **Support-Integration**: Fehler-ID für Support-Anfragen

### Verwendung

```typescript
import { ServiceErrorBoundary } from '../components/error/ServiceErrorBoundary'

function App() {
  return (
    <ServiceErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling
        console.error('App error:', error, errorInfo)
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <YourApp />
    </ServiceErrorBoundary>
  )
}
```

### useServiceErrorHandler Hook

```typescript
import { useServiceErrorHandler } from '../components/error/ServiceErrorBoundary'

function MyComponent() {
  const { handleServiceError, isServiceHealthy, hasError } = useServiceErrorHandler()

  const handleAction = async () => {
    try {
      await someServiceAction()
    } catch (error) {
      handleServiceError(error, 'MyComponent.action')
    }
  }

  return (
    <div>
      {hasError && <Alert severity="error">Service-Fehler aufgetreten</Alert>}
      <Button onClick={handleAction}>Aktion ausführen</Button>
    </div>
  )
}
```

## 🔧 Zentrale Service-Integration

### useServices Hook

```typescript
import { useServices } from '../hooks/useServices'

function Dashboard() {
  const {
    auth,
    customers,
    employees,
    orders,
    worktimes,
    serviceStatus,
    isLoading,
    hasError,
    refreshAll
  } = useServices()

  // Global service status
  const isHealthy = !hasError
  const totalCustomers = customers.customers.length
  const activeWorktimes = worktimes.activeWorktimes.length

  return (
    <div>
      <ServiceHealthIndicator status={serviceStatus} />
      <DashboardStats
        customers={totalCustomers}
        worktimes={activeWorktimes}
        isLoading={isLoading}
      />
      <Button onClick={refreshAll}>Alle Daten aktualisieren</Button>
    </div>
  )
}
```

### Service Status

```typescript
const serviceStatus = {
  auth: {
    isLoading: false,
    hasError: false,
    isAuthenticated: true,
  },
  customers: {
    isLoading: false,
    hasError: false,
    count: 25,
  },
  // ... weitere Services
};
```

## ⚡ Performance-Optimierungen

### Code-Splitting

```typescript
// Lazy Loading für seltene Features
export const ReportsPage = lazy(() => import('../features/reports/pages/ReportsPage'));
export const NotificationsPage = lazy(
  () => import('../features/notifications/pages/NotificationsPage')
);
export const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'));
```

### Bundle-Optimierung

```typescript
// webpack.config.js
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom', 'react-router-dom'],
      mui: ['@mui/material', '@mui/icons-material'],
      firebase: ['firebase'],
      'react-query': ['@tanstack/react-query'],
      forms: ['react-hook-form', 'zod']
    }
  }
}
```

### Caching-Strategien

```typescript
// Verschiedene staleTime-Werte je nach Datenart
const queries = {
  // Häufig geänderte Daten
  worktimes: { staleTime: 30 * 1000, gcTime: 2 * 60 * 1000 },

  // Mäßig geänderte Daten
  customers: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },

  // Selten geänderte Daten
  settings: { staleTime: 15 * 60 * 1000, gcTime: 20 * 60 * 1000 },
};
```

## 🧪 Testing

### Unit Tests

```typescript
// __tests__/hooks/useCustomers.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCustomers } from '../useCustomers'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

test('should fetch customers', async () => {
  const { result } = renderHook(() => useCustomers(), {
    wrapper: ({ children }) => (
