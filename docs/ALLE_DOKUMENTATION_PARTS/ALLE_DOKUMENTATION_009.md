# JobFlow – Dokumentation Teil 9

*Zeichen 159009–178885 von 2862906*

---

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

## Quelle: docs/ADMIN_GUIDE.md

# Admin Guide

Dieser Leitfaden beschreibt die wichtigsten Admin-Workflows in JobFlow.

## Anmeldung

- Klassisch mit E-Mail/Passwort
- Optional SSO (OIDC), wenn `NEXT_PUBLIC_OIDC_PROVIDER_ID` konfiguriert ist

## Rollen & Berechtigungen

- Rollen: Admin, Dispatcher, Nurse
- Mandanten & Scopes:
  - Mandant wird über `tenantId` gesteuert (Server-Regeln + Client-Guards)
  - Zugriffe auf Einrichtungen über `facilityIds` (Client-Guards)

## Audit Logs

- Ansicht: Admin → Audit Logs (`/admin/audit-logs`)
- Enthält: Actor, Aktion, Ziel, Zeitstempel
- Filterbar nach Aktion und Actor

## Sicherheit & Stabilität

- Sicherheits-Header & CSP aktiv
- Rate Limiting für `/api` & `/auth`
- Health-Check: `/api/health`, Status-Seite: `/status`

## DSGVO

- Datenexport (Callable): `exportUserData`
- Datenlöschung (Callable): `deleteUserData` (Soft-/Hard-Delete)
- Prozesse: siehe `docs/DSGVO_PROZESSE.md`

## Backups & Wiederherstellung

- Firestore-Backup: `scripts/firestore-backup.sh`
- Storage-Backup: `scripts/storage-backup.sh`
- Runbook: `docs/DISASTER_RECOVERY.md`

## Häufige Admin-Operationen

- Einrichtungen verwalten (Anlegen, Bearbeiten, Löschen)
- Schichten verwalten (Kapazität, Status, Zuweisungen)
- Nutzer verwalten (Rollen, Aktivierung, Profile)

Hinweis: Änderungen werden in Audit-Logs protokolliert.



---

## Quelle: docs/API_MONITORING.md

# API-Monitoring & Caching für Routenberechnung

## Übersicht

Das System überwacht und optimiert die Nutzung der OpenRouteService API für Routenberechnungen in JobFlow.

## Features

### 1. **API-Monitoring** (`lib/services/apiMonitoring.ts`)

- **Tägliches Limit**: 2.000 Requests/Tag (OpenRouteService Free Tier)
- **Rate Limiting**: 40 Requests/Minute
- **Firestore-basiert**: Persistente Speicherung der API-Call-Statistiken
- **Automatische Bereinigung**: Alte Daten (>7 Tage) werden automatisch gelöscht

### 2. **Mehrstufiges Caching** (`lib/services/maps.ts`)

#### Memory Cache (schnell)

- In-Memory-Speicherung für sofortigen Zugriff
- TTL: 24 Stunden

#### Firestore Cache (persistent)

- Persistente Speicherung in Firestore
- TTL: 24 Stunden
- Überlebt Browser-Neustarts

#### Cache-Strategie

1. Zuerst Memory Cache prüfen (schnellste Option)
2. Falls nicht vorhanden: Firestore Cache prüfen
3. Falls im Firestore Cache: Zurück in Memory Cache laden
4. Bei Cache-Miss: API-Call durchführen

### 3. **Rate Limiting**

- Prüft vor jedem API-Call, ob Limits erreicht sind
- Blockiert Requests bei Limit-Erreichung
- Fallback auf OpenStreetMap-Link bei Limit-Erreichung

### 4. **Fehlerbehandlung**

- **429 (Too Many Requests)**: Fallback auf OpenStreetMap-Link
- **Tägliches Limit erreicht**: Fallback mit Hinweis
- **Rate Limit erreicht**: Fallback mit Hinweis
- **Fail-Open-Strategie**: Bei Monitoring-Fehlern wird Request erlaubt

## Verwendung

### Routenberechnung

```typescript
import { maps } from '@/lib/services/maps';

const route = await maps.getRoute(
  { latitude: 52.52, longitude: 13.405 }, // Origin
  { latitude: 48.1351, longitude: 11.582 } // Destination
);

if (route) {
  console.log(`Distanz: ${route.distanceMeters}m`);
  console.log(`Dauer: ${route.durationSeconds}s`);
}
```

### API-Statistiken abrufen

```typescript
import { ApiMonitoringService } from '@/lib/services/apiMonitoring';

const stats = await ApiMonitoringService.getStats();
console.log(`Verwendet: ${stats.dailyCount}/${2000}`);
console.log(`Verbleibend: ${stats.remaining}`);
console.log(`Prozent: ${stats.percentageUsed.toFixed(1)}%`);
```

### Rate Limit prüfen

```typescript
const check = await ApiMonitoringService.canMakeRequest();
if (!check.allowed) {
  console.warn(check.reason);
}
```

## Firestore Collections

### `api_monitoring`

- **Document ID**: Datum im Format `YYYY-MM-DD`
- **Felder**:
  - `date`: Datum (string)
  - `count`: Anzahl API-Calls (number)
  - `lastCallAt`: Zeitpunkt des letzten Calls (Timestamp)
  - `rateLimitWindow`: Array mit minütlichen Call-Zählern
  - `updatedAt`: Letzte Aktualisierung (Timestamp)

### `route_cache`

- **Document ID**: Cache-Key (z.B. `route:52.52,13.405->48.1351,11.5820`)
- **Felder**:
  - `value`: RouteSummary-Objekt
  - `expiresAt`: Ablaufzeitpunkt (Timestamp)
  - `cachedAt`: Zeitpunkt der Speicherung (Timestamp)

## Performance-Optimierungen

1. **Cache-Hit-Rate**: Durch 24h TTL werden identische Routen nicht mehrfach berechnet
2. **Memory + Firestore**: Kombination für beste Performance
3. **Rate Limiting**: Verhindert unnötige API-Calls bei Limit-Erreichung
4. **Fail-Silently**: Cache-Fehler blockieren nicht die App

## Limits & Kosten

- **Tägliches Limit**: 2.000 Requests/Tag (kostenlos)
- **Rate Limit**: 40 Requests/Minute
- **Kosten bei Überschreitung**: Keine (API blockiert nur)
- **Cache-Reduktion**: ~60-80% weniger API-Calls durch Caching

## Monitoring & Wartung

### Alte Daten bereinigen

```typescript
await ApiMonitoringService.cleanupOldRecords();
```

**Empfehlung**: Als Cloud Function täglich ausführen.

### Statistiken überwachen

Für Admin-Dashboard:

- Tägliche API-Call-Anzahl
- Verbleibende Requests
- Cache-Hit-Rate (kann über Firestore-Queries berechnet werden)

## Troubleshooting

### Problem: "API-Limit erreicht"

- **Lösung**: Warten bis zum nächsten Tag (Reset um 00:00 UTC)
- **Prävention**: Caching optimieren, weniger API-Calls

### Problem: Cache funktioniert nicht

- **Prüfen**: Firestore-Berechtigungen für `route_cache` Collection
- **Prüfen**: Browser-Konsole auf Fehler

### Problem: Rate Limit trotz Monitoring

- **Ursache**: Mehrere gleichzeitige Requests
- **Lösung**: Rate Limiting funktioniert, aber mehrere Requests können gleichzeitig durchgehen

## Zukünftige Verbesserungen

- [ ] Cache-Hit-Rate-Metriken
- [ ] Admin-Dashboard für API-Statistiken
- [ ] Automatische Cleanup-Cloud-Function
- [ ] Erweiterte Rate-Limiting-Strategien (z.B. pro User)



---

## Quelle: docs/ARCHITECTURE_AUDIT_REPORT.md

# JobFlow - Comprehensive Architecture Audit Report

**Date:** 2025-01-27  
**Scope:** Full codebase analysis  
**Type:** Read-only audit (no code changes)

---

## Executive Summary

This audit identified **8 critical issues**, **12 high-priority improvements**, and **15 optional enhancements** across the codebase. The architecture is generally well-structured with clear separation between services, components, and API routes, but several areas need consolidation and refactoring.

**Overall Assessment:**

- ✅ **Strengths:** Clear service layer, good TypeScript usage, feature-based organization
- ⚠️ **Weaknesses:** Duplicate routes, validation directory split, overly complex contexts, direct Firestore queries in components
- 🔧 **Priority:** Focus on route consolidation and service layer cleanup first

---

## 1. CRITICAL ISSUES (Must Fix)

### 1.1 Duplicate Route Paths (German/English)

**Severity:** 🔴 CRITICAL  
**Impact:** User confusion, SEO issues, maintenance burden

**Problem:**

- Multiple routes serve the same functionality:
  - `/anmelden` and `/login` (both login pages)
  - `/registrieren` and `/register` (both registration)
  - `/passwort-vergessen` and `/forgot-password`
  - `/einrichtungen` and `/facilities`
  - `/dokumente` and `/documents`
  - `/zeiten` and `/time`
  - `/zeiterfassung` and `/schedule`
  - `/profil` and `/profile`
  - `/nachrichten` and `/messenger`/`/chat`
  - `/benachrichtigungen` and `/notifications` (implied)

**Files Affected:**

- `app/(auth)/anmelden/page.tsx` ≈ `app/(auth)/login/page.tsx` (identical code)
- `app/(auth)/registrieren/page.tsx` ≈ `app/(auth)/register/page.tsx`
- Multiple other duplicate route pairs

**Recommendation:**

1. **Choose one language standard** (German recommended for target audience)
2. **Implement redirects** from English to German routes (or vice versa)
3. **Remove duplicate pages** after redirects are in place
4. **Update all internal links** to use consistent routes

**Steps:**

1. Add redirects in `next.config.js` or middleware
2. Consolidate duplicate pages
3. Update navigation components
4. Update documentation

---

### 1.2 Duplicate Validation Directories

**Severity:** 🔴 CRITICAL  
**Impact:** Confusion, inconsistent validation logic

**Problem:**

- Two validation directories exist:
  - `lib/validation/` (3 files: authSchemas.ts, payrollValidation.ts, staffSchemas.ts)
  - `lib/validations/` (8 files: admin.ts, auth.ts, chat.ts, forms.ts, invitations.ts, push.ts, templates.ts, index.ts)

**Files:**

- `lib/validation/authSchemas.ts` vs `lib/validations/auth.ts` (potential overlap)

**Recommendation:**

1. **Merge into single directory** (`lib/validations/` recommended)
2. **Consolidate duplicate schemas** (check authSchemas.ts vs validations/auth.ts)
3. **Update all imports** across codebase
4. **Remove empty directory**

**Steps:**

1. Compare schemas in both directories
2. Merge unique schemas into `lib/validations/`
3. Update all imports
4. Delete `lib/validation/` directory

---

### 1.3 Duplicate Service Files

**Severity:** 🔴 CRITICAL  
**Impact:** Confusion, potential bugs, maintenance issues

**Problem:**

- `lib/services/reportService.ts` (legacy, 578 lines)
- `lib/services/reports.ts` (newer, 804 lines)
- Both exported in `lib/services/index.ts`:
  ```typescript
  export { reportService } from './reports';
  export { reportService as reportServiceLegacy } from './reportService';
  ```

**Recommendation:**

1. **Compare functionality** between both files
2. **Merge into single service** (`reports.ts`)
3. **Remove legacy file**
4. **Update all imports**

**Steps:**

1. Audit both files for unique functionality
2. Merge into `reports.ts`
3. Remove `reportService.ts`
4. Update exports in `index.ts`

---

### 1.4 Components Directly Accessing Firestore

**Severity:** 🔴 CRITICAL  
**Impact:** Violates separation of concerns, makes testing difficult

**Problem:**
Components are using Firestore directly instead of going through services:

- `components/chat/NotificationSettings.tsx`
- `components/admin/ApiStatsChart.tsx`
- `components/documents/DocumentGenerator.tsx`
- `components/documents/DocumentCard.tsx`

**Example Pattern (WRONG):**

```typescript
import { getDoc, getDocs, collection } from 'firebase/firestore';
// Direct Firestore access in component
```

**Recommendation:**

1. **Create/use service methods** for all Firestore operations
2. **Move queries to appropriate services**
3. **Update components** to use services only
4. **Add service layer tests**

**Steps:**

1. Identify all direct Firestore imports in components
2. Create service methods for missing operations
3. Refactor components to use services
4. Remove direct Firestore imports from components

---

### 1.5 Middleware Disabled

**Severity:** 🔴 CRITICAL  
**Impact:** Security, routing, authentication checks bypassed

**Problem:**

- `middleware.ts` is completely disabled due to Next.js 15.5.6 Edge Runtime issues
- Matcher is empty array: `matcher: []`
- Comment indicates temporary workaround

**Files:**

- `middleware.ts` (disabled)
- `middleware.disabled.ts` (backup)
- `middleware.ts.backup` (another backup)

**Recommendation:**

1. **Upgrade Next.js** to latest version (if issue fixed)
2. **Implement workaround** if upgrade not possible
3. **Move auth checks** to route handlers or components temporarily
4. **Document security implications**

**Steps:**

1. Check Next.js 15.5.7+ for fix
2. If fixed, re-enable middleware
3. If not, implement alternative auth checks
4. Remove backup files after resolution

---

### 1.6 AuthContext Overly Complex

**Severity:** 🔴 CRITICAL  
**Impact:** Hard to maintain, test, and debug

**Problem:**

- `contexts/AuthContext.tsx` is **582 lines** with:
  - Complex retry logic (3 retries)
  - Token refresh logic
  - Fallback user creation
  - Permission-denied error handling
  - Custom claims synchronization
  - E2E test mode handling

**Recommendation:**

1. **Extract auth logic** to `lib/services/authService.ts`
2. **Create auth hooks** for specific operations
3. **Simplify context** to state management only
4. **Move business logic** to service layer

**Steps:**

1. Create `authService.ts` with core logic
2. Extract token management to separate module
3. Simplify AuthContext to state + service calls
4. Create focused hooks (useTokenRefresh, useAuthSync)

---

### 1.7 Service Export Inconsistencies

**Severity:** 🔴 CRITICAL  
**Impact:** Confusion, potential circular dependencies

**Problem:**

- `lib/services/index.ts` exports both:
  - `reportService` from `./reports`
  - `reportService as reportServiceLegacy` from `./reportService`
- Multiple services may have similar naming conflicts

**Recommendation:**

1. **Audit all service exports**
2. **Remove duplicate/legacy exports**
3. **Standardize naming** (use camelCase consistently)
4. **Document service dependencies**

---

### 1.8 Missing Type Safety in Service Layer

**Severity:** 🔴 CRITICAL  
**Impact:** Runtime errors, type mismatches

**Problem:**

- Services may not have consistent return types
- Some services use `any` or loose typing
- Missing error type definitions

**Recommendation:**

1. **Add strict return types** to all service methods
2. **Create service error types**
3. **Add runtime validation** with Zod where needed
4. **Document service contracts**

---

## 2. HIGH PRIORITY IMPROVEMENTS

### 2.1 Validation Schema Organization

**Severity:** 🟡 HIGH  
**Impact:** Maintainability

**Current State:**

- Schemas split across two directories
- Some schemas may be duplicated

**Recommendation:**

- Consolidate into `lib/validations/`
- Organize by domain (auth, payroll, admin, etc.)
- Create index file for easy imports

---

### 2.2 Hook Organization

**Severity:** 🟡 HIGH  
**Impact:** Discoverability

**Current State:**

- 44 hooks in `lib/hooks/`
- No clear organization by feature

**Recommendation:**

- Group hooks by feature domain
- Create subdirectories: `hooks/auth/`, `hooks/admin/`, `hooks/employee/`
- Or use naming convention: `useAdmin*`, `useEmployee*`, etc.

---

### 2.3 API Route Error Handling

**Severity:** 🟡 HIGH  
**Impact:** User experience, debugging

**Current State:**

- Inconsistent error responses
- Some routes may not handle errors gracefully

**Recommendation:**

- Create standardized error response format
- Add error handling middleware
- Document error codes

---

### 2.4 Component Complexity

**Severity:** 🟡 HIGH  
**Impact:** Maintainability, testing

**Problem:**

- Some components may be too large (>300 lines)
- Mixed concerns (UI + business logic)

**Recommendation:**

- Audit components >200 lines
- Extract business logic to hooks/services
- Split large components into smaller ones

---

