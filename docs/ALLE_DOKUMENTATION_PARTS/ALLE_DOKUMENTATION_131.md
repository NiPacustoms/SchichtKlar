# JobFlow – Dokumentation Teil 131

*Zeichen 2583041–2602790 von 2862906*

---

   - **Empfehlung:** ENTFERNEN (wenn keine Edge Functions geplant)

2. **`roles/firebasemods.serviceAgent`**
   - **Zweck:** Firebase Mods Service Agent
   - **Verwendung:** Nur wenn Firebase Mods verwendet werden
   - **Aktuell:** Nicht verwendet
   - **Empfehlung:** ENTFERNEN (wenn keine Firebase Mods geplant)

## Minimale Rollen-Liste

Nach Bereinigung sollten nur diese Rollen bleiben:

1. ✅ `roles/cloudfunctions.admin`
2. ✅ `roles/firebase.sdkAdminServiceAgent`
3. ✅ `roles/firebaseextensions.admin`
4. ✅ `roles/firebasehosting.admin`
5. ✅ `roles/run.admin`
6. ✅ `roles/serviceusage.serviceUsageAdmin`

**Total: 6 Rollen** (statt aktuell 10)

## Empfohlene Aktion

Entfernen:
- ❌ `roles/firebase.admin`
- ❌ `roles/serviceusage.serviceUsageViewer`
- ⚠️ `roles/edgecontainer.serviceAccountAdmin` (falls keine Edge Functions)
- ⚠️ `roles/firebasemods.serviceAgent` (falls keine Firebase Mods)


```

---

### 📄 SERVICE_INTEGRATION.md

```markdown
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
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  })

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  expect(result.current.customers).toHaveLength(3)
})
```

### Integration Tests

```typescript
// __tests__/integration/ServiceIntegration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { ServiceErrorBoundary } from '../ServiceErrorBoundary'

test('should handle service errors gracefully', async () => {
  const ThrowError = () => {
    throw new Error('Service unavailable')
  }

  render(
    <ServiceErrorBoundary>
      <ThrowError />
    </ServiceErrorBoundary>
  )

  await waitFor(() => {
    expect(screen.getByText('Fehler aufgetreten')).toBeInTheDocument()
    expect(screen.getByText('Erneut versuchen')).toBeInTheDocument()
  })
})
```

## 📊 Bundle-Analyse

### Analyse-Skripte

```bash
# Standard Bundle-Analyse
npm run analyze

# Detaillierte Bundle-Analyse
npm run analyze:detailed

# Build mit Analyse-Konfiguration
npm run build:analyze
```

### Bundle-Insights

- **Vendor Bundle**: ~150KB (React, Router)
- **MUI Bundle**: ~200KB (Material-UI)
- **Firebase Bundle**: ~100KB (Firebase SDK)
- **Feature Bundles**: 50-100KB je Feature
- **Gesamtgröße**: ~800KB (ungzipped), ~200KB (gzipped)

## 🔄 Caching-Strategien

### Query Keys

```typescript
// Hierarchische Query Keys für optimale Invalidation
const queryKeys = {
  customers: ['customers'],
  customer: (id: string) => ['customers', id],
  customerOrders: (id: string) => ['customers', id, 'orders'],

  worktimes: ['worktimes'],
  worktimesByEmployee: (employeeId: string) => ['worktimes', 'byEmployee', employeeId],
  activeWorktimes: ['worktimes', 'active'],
};
```

### Cache-Invalidation

```typescript
// Intelligente Cache-Invalidation
const updateCustomer = useMutation({
  mutationFn: updateCustomerService,
  onSuccess: (data, variables) => {
    // Invalidate specific customer
    queryClient.invalidateQueries(['customers', variables.id]);

    // Invalidate customer list
    queryClient.invalidateQueries(['customers']);

    // Update cache directly for immediate UI update
    queryClient.setQueryData(['customers', variables.id], data);
  },
});
```

## 🚨 Error Handling

### Fehlerkategorien

1. **Network Errors**: Verbindungsprobleme
2. **Permission Errors**: Zugriffsverweigerung
3. **Validation Errors**: Eingabefehler
4. **System Errors**: Server-Fehler
5. **Unknown Errors**: Unbekannte Fehler

### Recovery-Strategien

- **Automatisch**: Retry nach 5 Sekunden
- **Manuell**: Benutzer-Initiiertes Retry
- **Fallback**: Alternative Datenquellen
- **Graceful Degradation**: Reduzierte Funktionalität

## 📈 Monitoring & Debugging

### React Query DevTools

```typescript
// Automatisch in Development aktiviert
{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
```

### Performance-Metriken

- **Query-Zeit**: Durchschnittliche Ausführungszeit
- **Cache-Hit-Rate**: Anteil der Cache-Treffer
- **Background Updates**: Anzahl der Hintergrund-Updates
- **Error Rate**: Fehlerrate je Service

## 🔧 Konfiguration

### QueryClient-Konfiguration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Service-spezifische Konfiguration

```typescript
// Verschiedene Konfigurationen je nach Service
const serviceConfigs = {
  auth: { retry: false, staleTime: 2 * 60 * 1000 },
  worktimes: { refetchInterval: 30 * 1000, staleTime: 30 * 1000 },
  reports: { staleTime: 15 * 60 * 1000, gcTime: 30 * 60 * 1000 },
};
```

## 📚 Best Practices

### 1. Query Key Struktur

- Verwende hierarchische Query Keys
- Konsistente Namenskonventionen
- Vermeide zu spezifische Keys

### 2. Optimistic Updates

- Implementiere immer Rollback-Logik
- Aktualisiere alle betroffenen Queries
- Zeige Loading-States an

### 3. Error Handling

- Benutzerfreundliche Fehlermeldungen
- Recovery-Optionen anbieten
- Logging für Debugging

### 4. Performance

- Lazy Loading für seltene Features
- Intelligentes Caching
- Bundle-Optimierung

### 5. Testing

- Unit Tests für alle Hooks
- Integration Tests für Service-Interaktionen
- Error Boundary Tests

## 🔮 Zukünftige Verbesserungen

- **Service Worker**: Offline-Funktionalität
- **Real-time Updates**: WebSocket-Integration
- **Advanced Caching**: Redis-ähnliche Cache-Strategien
- **Performance Monitoring**: APM-Integration
- **A/B Testing**: Feature-Flag-Integration

---

Diese Dokumentation wird kontinuierlich aktualisiert. Bei Fragen oder Verbesserungsvorschlägen wenden Sie sich an das Entwicklungsteam.

```

---

### 📄 SLO_SLA.md

```markdown
# SLO/SLA & Error Budgets

## Service Level Objectives (SLO)
- Verfügbarkeit (Monat): 99.9% (Downtime ≤ ~43min/Monat)
- Fehlerquote (5xx / 4xx authz): P95 < 0.5%
- Latenz API (P95): < 400ms, (P99): < 900ms
- App LCP: < 2.5s (P75), INP < 200ms (P75)

## Service Level Indicators (SLI)
- Uptime: Health-Endpoint `/api/health` (200 OK)
- Error Rate: Anteil nicht-erfolgreicher Requests
- Latenz: P95/P99 aus Logs/Monitoring

## Error Budget
- Monatliches Budget: 0.1% Nichtverfügbarkeit
- Policy: Bei Budgetverbrauch > 50% Feature-Freeze, Fokus auf Stabilität

## Messung & Reporting
- Status-Seite `/status` (öffentlich)
- Alerting: Degraded Health, Error-Rate > Schwellwert, Latenz-Spikes
- Wöchentlicher SLO-Report im Team-Channel

## SLA (extern, informativ)
- Basic SLA: 99.9% Availability (Monat) – geplante Wartungsfenster exkl.
- Support-Reaktionszeiten: P1 ≤ 1h, P2 ≤ 4h (Geschäftszeiten), P3 ≤ 2 WT

```

---

### 📄 STATIC_TEMPLATE_NOTES.md

```markdown
# Notes zu statischen Templates

- Kein Placeholder-Support: Inhalte werden komplett in Firestore gepflegt.
- Pro Kombination aus (`companyId`, `templateKey`, `channel`, `locale`) existiert eine finale Variante.
- Cloud Functions wählen Variante aus und speichern sie direkt als Notification / senden E-Mail.
- Wenn keine Variante existiert, greifen Default-Texte im Code.
- Admin-UI muss Preview anhand der Felder `title`, `message`, `subject`, `bodyHtml`, `actionText` rendern.
- NotificationSettings bleiben unverändert (channel/type toggles).



```

---

### 📄 TEMPLATE_MANAGEMENT.md

```markdown
# Template-Verwaltung in JobFlow

## Überblick

JobFlow stellt Unternehmen eine mandantenfähige Vorlagenverwaltung zur Verfügung. Admins können für jeden Mandanten:

- **In-App-Benachrichtigungen** (Kanal `app`) definieren,
- **E-Mail-Benachrichtigungen** (Kanal `email`) mit HTML-/Text-Inhalten hinterlegen,
- Templates mehrsprachig (`locale`) und versioniert verwalten.

Vorlagen werden in der Sammlung `companyTemplates` gespeichert und sind eindeutig durch die Kombination aus `companyId`, `key`, `channel` und `locale`.

## Administrationsoberfläche

Die neue Seite `Admin → Dokumente → Templates` (`/admin/documents/templates`) bietet:

- Filter nach Kanal, Status und Locale,
- Volltextsuche über Namen, Keys und Beschreibungen,
- Editor mit Live-Vorschau für App- und E-Mail-Inhalte,
- Direkte Eingabe der finalen Inhalte (Titel, Nachricht, Betreff, HTML-Body, Action-Text),
- Sofortige Vorschau sowie Aktionen zum Bearbeiten und Löschen.

Ein Direktlink führt zu den bestehenden Dokumententypen, damit alle dokumentbezogenen Aufgaben zentral erreichbar bleiben.

## Template Keys

Die Cloud Functions erwarten feste Keys, die im Template-Editor verwendet werden sollten:

| Key                         | Zweck                                                |
|-----------------------------|------------------------------------------------------|
| `shift_assigned`            | Mitarbeiter erhält eine neue Schicht                 |
| `assignment_confirmed`      | Mitarbeiter hat eine Schicht bestätigt               |
| `assignment_rejected`       | Mitarbeiter hat eine Schicht abgelehnt               |
| `document_verified`         | Dokument wurde verifiziert                           |
| `document_rejected`         | Dokument wurde abgelehnt                             |
| `document_expiry_warning`   | Dokument läuft in Kürze ab                           |
| `new_message`               | Neue Chat-Nachricht                                  |
| `shift_requested_admin`     | Schicht-Anfrage eines Mitarbeiters an den Admin      |
| `assignment_accepted_admin` | Mitarbeiter hat eine angefragte Schicht angenommen   |
| `shift_full_admin`          | Schicht hat das Soll erreicht (Admin-Benachrichtigung) |

Weitere Keys können jederzeit ergänzt werden; die Trigger-Funktionen greifen automatisch auf veröffentlichte Templates zu.

## Kanal- und Typ-Einstellungen

Die Benachrichtigungseinstellungen (`notificationSettings/{userId}`) unterstützen neue Felder:

```json
{
  "channels": {
    "app": true,
    "email": true,
    "sms": false
  },
  "typeChannels": {
    "shift_assigned": { "app": true, "email": false }
  },
  "preferredLocale": "de"
}
```

- `channels` schaltet globale Kanäle (App, E-Mail, SMS) ein/aus.
- `typeChannels` überschreibt das Verhalten pro Template-Key.
- `types` wird weiterhin als Legacy-Flag ausgewertet (z.B. globale Deaktivierung eines Keys).
- `preferredLocale` erlaubt benutzerspezifische Lokalisierung (Fallback `de`).

## API & Queries

- **List/Create**: `GET/POST /api/templates`
- **Einzelzugriff**: `GET/PATCH/DELETE /api/templates/{id}`
- Admin-Berechtigung ist erforderlich (`role === admin/dispatcher`); die Functions lesen den Mandanten aus dem User-Dokument.
- Firestore-Indizes für `companyTemplates` wurden ergänzt (`companyId`, `channel`, `status`, `locale`, `updatedAt`).

## Cloud Functions

`functions/src/notificationTriggers.ts` lädt Templates direkt aus Firestore und nutzt die gespeicherten statischen Inhalte:

- Vorlagen für App-Notifications werden direkt aus der Datenbank geladen (basierend auf `companyId`, `templateKey`, `channel`, `locale`),
- Die gespeicherten Felder (`title`, `message`, `subject`, `bodyHtml`, `actionText`) werden ohne weitere Verarbeitung verwendet,
- Optional werden E-Mails versendet (unter Berücksichtigung der Settings),
- Bei fehlenden Templates wird auf Fallback-Texte ausgewichen,
- Metadaten (Template-ID, Template-Key) werden in den Notification-Dokumenten hinterlegt.

## Manual Tests

1. **Templates anlegen**: Admin erstellt je ein `app`- und `email`-Template für `shift_assigned` (Locale `de`) mit finalen Inhalten:
   - App-Template: `title` und `message` werden direkt eingegeben
   - Email-Template: `subject` und `bodyHtml` werden direkt eingegeben
2. **Benachrichtigung triggern**: Eine Schicht wird neu zugewiesen (`onShiftAssigned`).
3. **Erwartung**:
   - In-App-Benachrichtigung enthält die exakt gespeicherten Werte aus dem Template.
   - E-Mail wird versendet (SMTP-Konfiguration vorausgesetzt) mit den gespeicherten Inhalten.
   - Notification-Datensatz enthält `metadata.templateKey` und `channel: 'app'`.
4. **Settings prüfen**: `channels.email = false` verhindert den Versand; `typeChannels.shift_assigned.email = false` deaktiviert nur die E-Mail.

Weitere manuelle Tests:

- `assignment_confirmed`/`assignment_rejected`: Statuswechsel triggert passende Templates.
- `document_verified`/`document_rejected`: Dokumentprüfung im Admin führt zu neuen Notifications.
- Chat-Nachricht löst `new_message` aus (nur bei aktiven Templates).

## Template-Struktur

