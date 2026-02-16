# JobFlow – Dokumentation Teil 141

*Zeichen 2781641–2801515 von 2862906*

---

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



---

## Quelle: docs/SLO_SLA.md

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



---

## Quelle: docs/SOTA_ANALYSE.md

# SOTA-Analyse: JobFlow Codebase

## Executive Summary

Die JobFlow-App zeigt bereits gute Grundlagen, hat aber noch Verbesserungspotenzial in mehreren Bereichen, um State-of-the-Art (SOTA) Standards zu erreichen.

**Gesamtbewertung: 7/10**

### Stärken ✅
- Gutes Error Handling System vorhanden (AppError, ErrorHandler)
- API Routes haben strukturiertes Error Handling
- React Query wird verwendet
- Rate Limiting implementiert
- TypeScript wird verwendet

### Verbesserungsbereiche 🔧
- Services verwenden noch `throw new Error()` statt AppError
- Hooks haben viele `any` Types (96 matches)
- Console Statements in Hooks (9 Dateien)
- Fehlende Konsistenz im Error Handling
- Keine einheitliche Retry-Logik

---

## 1. API Routes (Bewertung: 8/10)

### ✅ Gut implementiert:
- Strukturiertes Error Handling mit try-catch
- Rate Limiting vorhanden
- Request Validation mit Zod
- Logger wird verwendet
- Proper HTTP Status Codes

### 🔧 Verbesserungen:

#### 1.1 Konsistentes Error Handling
**Problem:** API Routes verwenden unterschiedliche Error-Response-Formate

**Beispiel aus `app/api/admin/shifts/route.ts`:**
```typescript
// Aktuell: Unterschiedliche Formate
return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
return NextResponse.json({ success: false, error: '...', code: 'UNAUTHENTICATED' }, { status: 401 });
```

**SOTA Lösung:**
```typescript
// Einheitliches Error-Response-Format
interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    userMessage: string;
    details?: Record<string, unknown>;
  };
}

// Helper-Funktion
function createErrorResponse(error: AppError, status: number): NextResponse {
  return NextResponse.json({
    success: false,
    error: {
      code: error.code,
      message: error.technicalMessage,
      userMessage: error.userMessage,
      details: error.metadata.additionalData,
    }
  }, { status });
}
```

#### 1.2 AppError Integration
**Problem:** API Routes transformieren Errors manuell statt AppError zu verwenden

**SOTA Lösung:**
```typescript
import { errorHandler } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // ... logic
  } catch (error: unknown) {
    const appError = errorHandler.handleFirebaseError(error, {
      component: 'GET /api/admin/shifts',
      route: '/api/admin/shifts'
    });
    
    logger.error('Error in GET /api/admin/shifts', appError);
    return createErrorResponse(appError, getHttpStatusFromError(appError));
  }
}
```

---

## 2. Services (Bewertung: 6/10)

### ❌ Kritische Probleme:

#### 2.1 Fehlende AppError Verwendung
**Problem:** Services verwenden `throw new Error()` statt AppError

**Statistik:**
- `lib/services/shifts.ts`: 19 `throw` Statements, 0 AppError Verwendungen
- `lib/services/assignments.ts`: 15 `throw` Statements
- Gesamt: 577 `throw` Statements in Services

**Beispiel aus `lib/services/shifts.ts`:**
```typescript
// ❌ NICHT SOTA
if (!companyId) {
  throw new Error('No companyId found for shift');
}

// ✅ SOTA
if (!companyId) {
  throw createAppError(
    new Error('No companyId found for shift'),
    ErrorCode.VALIDATION_REQUIRED_FIELD,
    { component: 'shiftService', action: 'create' }
  );
}
```

#### 2.2 Inconsistent Error Handling
**Problem:** Manche Services verwenden Logger, andere nicht

**SOTA Lösung:**
```typescript
import { errorHandler, logger, createAppError, ErrorCode } from '@/lib/errors';

export const shiftService = {
  async create(data: ShiftCreateInput): Promise<string> {
    try {
      // ... logic
    } catch (error: unknown) {
      const appError = errorHandler.handleFirebaseError(error, {
        component: 'shiftService',
        action: 'create'
      });
      
      logger.error('Failed to create shift', appError, { shiftData: data });
      throw appError;
    }
  }
}
```

#### 2.3 Fehlende Retry-Logik
**Problem:** Keine automatische Retry-Logik für transient errors

**SOTA Lösung:**
```typescript
import { retry } from '@/lib/retry';

export const shiftService = {
  async getAll(filters: ShiftFilters): Promise<Shift[]> {
    return retry(
      async () => {
        // ... Firestore query
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
        retryableErrors: ['unavailable', 'deadline-exceeded']
      }
    );
  }
}
```

---

## 3. React Hooks (Bewertung: 6.5/10)

### ❌ Probleme:

#### 3.1 Type Safety
**Problem:** 96 `any` Types in 14 Hook-Dateien

**Beispiel aus `lib/hooks/useChat.ts`:**
```typescript
// ❌ NICHT SOTA
/* eslint-disable @typescript-eslint/no-explicit-any */
const convertedNewMessages = (newMessages as ChatMessage[]).map(m => convertChatMessage(m, channelId));
lastMessageAt: ch.lastMessage?.createdAt instanceof Date ? ch.lastMessage.createdAt : (ch.lastMessage?.createdAt as any)?.toDate(),

// ✅ SOTA
interface TimestampLike {
  toDate(): Date;
}

function isTimestamp(value: unknown): value is TimestampLike {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as TimestampLike).toDate === 'function';
}

const lastMessageAt = isTimestamp(ch.lastMessage?.createdAt) 
  ? ch.lastMessage.createdAt.toDate()
  : ch.lastMessage?.createdAt instanceof Date 
    ? ch.lastMessage.createdAt 
    : undefined;
```

#### 3.2 Console Statements
**Problem:** 9 Hook-Dateien verwenden noch `console.error/log`

**Betroffene Dateien:**
- `lib/hooks/useShifts.ts` (Zeile 42)
- `lib/hooks/useChat.ts`
- `lib/hooks/useReports.ts`
- `lib/hooks/usePushNotifications.ts`
- `lib/hooks/usePerformanceMonitoring.ts`
- `lib/hooks/usePerformance.ts`
- `lib/hooks/useFCM.ts`
- `lib/hooks/useChatChannels.ts`
- `lib/hooks/useAdminChatMessages.ts`

**SOTA Lösung:**
```typescript
// ❌ NICHT SOTA
catch (err) {
  console.error('Error fetching shifts:', err);
  return [];
}

// ✅ SOTA
import { logger } from '@/lib/logging';

catch (err) {
  logger.error('Error fetching shifts', err instanceof Error ? err : new Error(String(err)), {
    component: 'useShifts',
    action: 'fetchShifts'
  });
  return [];
}
```

#### 3.3 React Query Best Practices
**Problem:** Fehlende Error Transformation in React Query

**Beispiel aus `lib/hooks/useShifts.ts`:**
```typescript
// ❌ NICHT SOTA
const { data: shifts = [], isLoading, error } = useQuery<Shift[]>({
  queryKey: ['shifts', filtersWithCompanyId],
  queryFn: async () => {
    try {
      return await shiftService.getAll(filtersWithCompanyId);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      return [];
    }
  },
});

// ✅ SOTA
import { errorHandler } from '@/lib/errors';

const { data: shifts = [], isLoading, error } = useQuery<Shift[]>({
  queryKey: ['shifts', filtersWithCompanyId],
  queryFn: async () => {
    return await shiftService.getAll(filtersWithCompanyId);
  },
  retry: (failureCount, error) => {
    const appError = errorHandler.handleError(error);
    return appError.metadata.retryable !== false && failureCount < 3;
  },
  onError: (error) => {
    const appError = errorHandler.handleError(error, {
      component: 'useShifts',
      action: 'fetchShifts'
    });
    logger.error('Failed to fetch shifts', appError);
  },
});
```

---

## 4. Cloud Functions (Bewertung: 7/10)

### ✅ Gut:
- Strukturierte Exports
- Proper Firebase Admin Setup

### 🔧 Verbesserungen:

#### 4.1 Error Handling
**Problem:** Cloud Functions sollten AppError verwenden

**SOTA Lösung:**
```typescript
import { errorHandler, logger } from '@/lib/errors';

export const onShiftCreated = functions.firestore
  .document('shifts/{shiftId}')
  .onCreate(async (snapshot, context) => {
    try {
      // ... logic
    } catch (error: unknown) {
      const appError = errorHandler.handleFirebaseError(error, {
        component: 'onShiftCreated',
        action: 'processShift'
      });
      
      logger.error('Error in onShiftCreated', appError, {
        shiftId: context.params.shiftId
      });
      
      // Re-throw für Firebase Functions Error Handling
      throw appError;
    }
  });
```

---

## 5. Type System (Bewertung: 6/10)

### ❌ Probleme:

#### 5.1 Viele `any` Types
**Statistik:** 96 `any` Types in Hooks, weitere in Services

**SOTA Lösung:**
- Alle `any` Types durch konkrete Types ersetzen
- Type Guards für unsichere Konvertierungen verwenden
- Union Types statt `any` verwenden

#### 5.2 Konsistente Interfaces
**Problem:** Unterschiedliche Interfaces für ähnliche Datenstrukturen

**Beispiel:**
- `lib/types/chat.ts`: `Message`, `Channel`
- `lib/types/chatChannels.ts`: `ChatMessage`, `ChatChannel`
- Konvertierungen zwischen beiden

**SOTA Lösung:**
- Einheitliche Type-Definitionen
- Type Mapper für Konvertierungen
- Shared Types in `lib/types/shared.ts`

---

## 6. Performance (Bewertung: 7/10)

### ✅ Gut:
- React Query für Caching
- Code Splitting vorhanden

### 🔧 Verbesserungen:

#### 6.1 Memoization
**Problem:** Fehlende `useMemo`/`useCallback` in manchen Hooks

**SOTA Lösung:**
```typescript
// ✅ SOTA
const getShiftStats = useMemo((): ShiftStats => {
  const shiftsArray = Array.isArray(shifts) ? shifts : [];
  // ... calculations
  return { total, open, filled, cancelled, assignedCount, totalCapacity };
}, [shifts]);
```

#### 6.2 React Query Optimierungen
**Problem:** Fehlende `staleTime` und `cacheTime` Konfiguration

**SOTA Lösung:**
```typescript
const { data } = useQuery({
  queryKey: ['shifts', filters],
  queryFn: () => shiftService.getAll(filters),
  staleTime: 5 * 60 * 1000, // 5 Minuten
  cacheTime: 10 * 60 * 1000, // 10 Minuten
  refetchOnWindowFocus: false,
});
```

---

## Priorisierte Verbesserungsliste

### 🔴 Kritisch (sofort)
1. **Services: AppError Integration** (577 `throw` Statements)
   - `lib/services/shifts.ts`
   - `lib/services/assignments.ts`
   - `lib/services/timesheets.ts`
   - Alle anderen Services

2. **Hooks: Console Statements entfernen** (9 Dateien)
   - Durch Logger ersetzen

3. **Type Safety: `any` Types eliminieren** (96+ Vorkommen)
   - Type Guards implementieren
   - Konkrete Types definieren

### 🟡 Hoch (diese Woche)
4. **API Routes: Einheitliches Error Format**
   - Helper-Funktion für Error Responses
   - AppError Integration

5. **React Query: Error Handling verbessern**
   - Error Transformation
   - Retry-Logik

6. **Services: Retry-Logik implementieren**
   - Für transient errors

### 🟢 Mittel (nächste Woche)
7. **Type System: Konsistente Interfaces**
   - Duplikate entfernen
   - Shared Types

8. **Performance: Memoization**
   - `useMemo`/`useCallback` wo nötig
   - React Query Optimierungen

---

## Empfohlene Implementierungsreihenfolge

1. **Phase 1: Error Handling Standardisierung**
   - Services auf AppError migrieren
   - API Routes Error Format vereinheitlichen
   - Hooks Console Statements entfernen

2. **Phase 2: Type Safety**
   - `any` Types eliminieren
   - Type Guards implementieren
   - Konsistente Interfaces

3. **Phase 3: Performance & Best Practices**
   - Memoization optimieren
   - React Query konfigurieren
   - Retry-Logik implementieren

---

## Metriken für Erfolg

- ✅ 0 `throw new Error()` in Services (nur AppError)
- ✅ 0 `console.*` Statements in Production-Code
- ✅ < 10 `any` Types in gesamter Codebase
- ✅ 100% API Routes mit einheitlichem Error Format
- ✅ 100% Services mit ErrorHandler Integration
- ✅ Alle Hooks mit proper Error Handling

---

## Fazit

Die JobFlow-App hat eine solide Basis, benötigt aber systematische Verbesserungen in:
1. **Error Handling Konsistenz** (höchste Priorität)
2. **Type Safety** (mittlere Priorität)
3. **Performance Optimierungen** (niedrige Priorität)

Mit den vorgeschlagenen Verbesserungen erreicht die Codebase SOTA-Standards.




---

## Quelle: docs/SYNTAX_FIXES_COMPLETE.md

# Syntax-Fehler Behebungs-Zusammenfassung - Final

**Datum:** 26. Januar 2026  
**Status:** 🟡 **Deutlicher Fortschritt - Build noch nicht erfolgreich**

---

## ✅ Erfolgreich behoben (35+ Dateien, 60+ Fehler)

### 1. Doppelte Destructuring-Patterns
**Behoben in ~25 Dateien:**
- Alle `const { prop: _prop, prop }` → `const { prop }` korrigiert
- Betroffene Dateien: employee/*, admin/*, app/page.tsx, api/*

### 2. Fehlende Import-Statements
**Behoben in 6 Dateien:**
- `app/(employee)/employee/berichte/page.tsx`
- `app/(admin)/admin/berichte/page.tsx`
- `app/(employee)/employee/zeiten/page.tsx`
- `app/(employee)/employee/benachrichtigungen/page.tsx`
- `app/(employee)/employee/dashboard/page.tsx`
- `app/(employee)/employee/profil/page.tsx`

### 3. JSX-Struktur-Fehler
**Behoben in 8 Dateien:**
- `app/(employee)/employee/dienstplan/page.tsx` - Komplette Struktur korrigiert
- `app/(employee)/employee/dashboard/page.tsx` - Fehlende Tags ergänzt, AdminDashboard-Funktion korrigiert
- `app/(employee)/employee/einrichtungen/page.tsx` - Fehlende schließende Klammern, Typography-Tags
- `app/(employee)/employee/benachrichtigungen/page.tsx` - Return-Statements, Typography-Struktur
- `app/(employee)/employee/dokumente/page.tsx` - Komplette Funktionsstruktur, Button-Tags
- `app/(employee)/employee/profil/page.tsx` - Typography-Tags, Button-Tags, sx-Objekte

### 4. Callback-Fehler
**Behoben in 3 Dateien:**
- `app/(employee)/employee/dokumente/page.tsx` - onError/onSuccess Callbacks
- `app/(employee)/employee/profil/page.tsx` - onError Callback
- `app/(employee)/employee/dashboard/page.tsx` - Mutation Callbacks

---

## ⚠️ Verbleibende Probleme

### Build schlägt noch fehl
- **Verbleibende Syntax-Fehler:** Unbekannt (Build-Output zeigt noch Fehler)
- Möglicherweise weitere strukturelle Probleme
- Möglicherweise TypeScript-Fehler, die als Syntax-Fehler erscheinen

---

## 📊 Statistik

- **Behobene Dateien:** ~35 Dateien
- **Behobene Fehler:** ~60+ Syntax-Fehler
- **Verbleibende Fehler:** Unbekannt (Build schlägt noch fehl)

---

## 🔧 Nächste Schritte

1. **Verbleibende Build-Fehler identifizieren**
   ```bash
   npm run build 2>&1 | grep -A 5 "Error:"
   ```

2. **Systematisch weitere Fehler beheben**
   - Weitere JSX-Struktur-Probleme finden
   - Weitere fehlende Tags identifizieren
   - TypeScript-Fehler prüfen (können als Syntax-Fehler erscheinen)

3. **Build erfolgreich machen**
