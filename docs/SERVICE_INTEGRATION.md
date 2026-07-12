# Service-Integration in Schichtklar

## Übersicht

Schichtklar implementiert eine vollständige Service-Integration mit React Query, optimiertem Caching, Error Boundaries und Performance-Optimierungen.

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
