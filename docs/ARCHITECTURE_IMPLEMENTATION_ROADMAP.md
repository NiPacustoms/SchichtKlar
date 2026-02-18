# JobFlow – Architektur-Implementierungs-Roadmap

**Basis:** [ARCHITECTURE_AUDIT_REPORT.md](./ARCHITECTURE_AUDIT_REPORT.md)  
**Stand:** 2025-02-16  
**Sprache:** Deutsch (Ziel-Routen)

---

## Kurzfassung: Zielzustand (max. 10 Punkte)

- **Routen:** Einheitlich **Deutsch**; englische Pfade nur als 301-Redirects auf deutsche Routen; keine doppelten Seiten.
- **Middleware:** Aktiv mit Matcher für geschützte Routen; Auth-Check (Token-Prüfung); Security-Header; Redirect-Logik optional in Middleware oder `next.config.js`.
- **Services:** Eine klare Service-Schicht; **keine** direkten Firestore-Imports in Komponenten; alle DB-Zugriffe über `lib/services/*`.
- **Auth:** Dünner `AuthContext` (nur State + Provider); Auth-Logik in `lib/services/authService.ts`; spezifische Hooks (z. B. `useTokenRefresh`, `useAuthSync`).
- **Validierung:** Eine Quelle: `lib/validations/`; alle Imports von dort; kein `lib/validation/` mehr.
- **Typen:** Domänenorientiert in `lib/types/` (z. B. `user.ts`, `shift.ts`); `index.ts` nur Re-Exports.
- **API-Fehler:** Einheitliches Format (`success: false`, `error: { code, message, userMessage, details? }`); Nutzung von `lib/errors/apiErrorResponse.ts`.
- **Report-Service:** Ein Service `lib/services/reports.ts`; Legacy `reportService.ts` entfernt; keine doppelten Exports in `index.ts`.
- **Keine irrelevanten Framework-Wechsel;** Next.js App Router und bestehende Fachlogik bleiben unverändert.

---

## Roadmap (nur Codeänderungen, ohne bereits Erledigtes)

| Phase | Fokus                              | Status |
| ----- | ---------------------------------- | ------ |
| **A** | Routen & Middleware                | Offen  |
| **B** | Services & Firestore-Zugriffe      | Offen  |
| **C** | AuthContext & Hooks                | Offen  |
| **D** | Types, Validierung, Error-Handling | Offen  |

---

## Phase A: Routen & Middleware

### A.1 Sprachstandard

- **Entscheidung:** Primär **Deutsch** (wie in den Project Rules).
- Alte (englische) URLs werden per **301-Redirect** auf deutsche Routen geführt.
- Interne Links und `router.push` nutzen ausschließlich deutsche Pfade.

### A.2 Migrations-Tabelle (Routenpaare)

| Alte Route              | Neue Route             | Art der Änderung                                                                                                      |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/login`                | `/anmelden`            | Redirect in `next.config.js`; Seite `app/(auth)/login/page.tsx` kann durch Redirect-Seite oder Löschen ersetzt werden |
| `/register`             | `/registrieren`        | Redirect; Duplikat-Seite entfernen oder nur Redirect                                                                  |
| `/forgot-password`      | `/passwort-vergessen`  | Redirect; Duplikat entfernen                                                                                          |
| `/profile`              | `/profil`              | Redirect (bereits `app/profile/page.tsx` → `redirect('/profil')`); ggf. Seite behalten                                |
| `/documents`            | `/dokumente`           | Redirect; Duplikat entfernen oder nur Redirect                                                                        |
| `/facilities`           | `/einrichtungen`       | Redirect; Duplikat entfernen                                                                                          |
| `/time`                 | `/zeiten`              | Redirect; Duplikat ggf. nur Re-Export → konsolidieren                                                                 |
| `/schedule`             | `/dienstplan`          | Redirect; Duplikat entfernen                                                                                          |
| `/messenger`            | `/nachrichten`         | Redirect; `nachrichten` ggf. weiter auf `/unterhaltungen` führen (bereits so)                                         |
| `/accept-invite`        | `/einladung-annehmen`  | Redirect                                                                                                              |
| `/admin/document-types` | `/admin/dokumenttypen` | Keine eigene Seite für document-types; **Links anpassen** auf `/admin/dokumenttypen`                                  |
| `/admin/shifts`         | `/admin/schichten`     | **Links anpassen** auf `/admin/schichten`                                                                             |

Hinweis: Redirects sind in `next.config.js` bereits größtenteils vorhanden. Prüfen, ob alle obigen Quell-Routen abgedeckt sind, und fehlende ergänzen.

### A.3 Redirect-Konfiguration (next.config.js)

Bereits vorhanden; ggf. ergänzen um:

```javascript
// next.config.js – async redirects() – ergänzen falls fehlend
{
  source: '/admin/document-types',
  destination: '/admin/dokumenttypen',
  permanent: true,
},
{
  source: '/admin/shifts',
  destination: '/admin/schichten',
  permanent: true,
},
```

Optional: Zusätzliche Redirects in der **Middleware** (wenn du alle englischen Pfade zentral abfangen willst):

```typescript
// middleware.ts – am Anfang von middleware(), vor anderen Checks
const EN_TO_DE: Record<string, string> = {
  '/login': '/anmelden',
  '/register': '/registrieren',
  '/forgot-password': '/passwort-vergessen',
  '/profile': '/profil',
  '/documents': '/dokumente',
  '/facilities': '/einrichtungen',
  '/time': '/zeiten',
  '/schedule': '/dienstplan',
  '/messenger': '/nachrichten',
  '/accept-invite': '/einladung-annehmen',
  '/admin/document-types': '/admin/dokumenttypen',
  '/admin/shifts': '/admin/schichten',
};
const dest = EN_TO_DE[pathname];
if (dest) {
  return NextResponse.redirect(new URL(dest, request.url), 308);
}
```

### A.4 Interne Links anpassen (Beispiele)

**1) Komponente: immer deutsche Pfade**

```tsx
// components/admin/QuickActions.tsx
// Vorher (englisch):
<Link href="/admin/document-types" ...>

// Nachher (deutsch):
<Link href="/admin/dokumenttypen" ...>
```

```tsx
// Vorher:
<Link href="/admin/shifts" ...>

// Nachher:
<Link href="/admin/schichten" ...>
```

**2) router.push**

```tsx
// Immer deutsche Routen verwenden
router.push('/admin/schichten');
router.push('/admin/dokumenttypen');
router.push('/anmelden');
router.push('/employee/arbeitsplatz');
```

**3) Debug-Seite**

```tsx
// app/debug-env/page.tsx – Zeile 34
// Vorher: href="/login"
// Nachher: href="/anmelden"
```

### A.5 Checkliste Phase A

- [ ] Alle Redirects in `next.config.js` für obige Routenpaare vorhanden (inkl. `/admin/document-types`, `/admin/shifts`).
- [ ] Optional: Middleware-Redirect-Map wie oben ergänzt.
- [ ] Alle `Link`- und `router.push`-Aufrufe auf deutsche Pfade umgestellt (z. B. QuickActions, debug-env).
- [ ] Doppelte Seiten (z. B. `(auth)/login/page.tsx`, `(auth)/register/page.tsx`) entweder durch schlanke Redirect-Page oder Löschen ersetzt; Hauptinhalt nur unter deutscher Route.
- [ ] E2E-Tests: URLs auf deutsche Routen umstellen (z. B. `dokumente-verwaltung.spec.ts`: `/admin/dokumenttypen` statt `/admin/document-types`).

---

## Phase B: Services & Firestore-Zugriffe

### B.1 Komponenten mit direktem Firestore-Zugriff (aus Report + Codebase)

| Komponente           | Datei                                      | Firestore-Nutzung                                                              |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| NotificationSettings | `components/chat/NotificationSettings.tsx` | `getDoc`, `updateDoc` auf `users/{uid}` (Lesen/Schreiben notificationSettings) |
| ApiStatsChart        | `components/admin/ApiStatsChart.tsx`       | `getDocs` auf `api_monitoring`                                                 |
| AuditLogViewer       | `components/admin/AuditLogViewer.tsx`      | `onSnapshot` auf `auditLogs`                                                   |

Hinweis: `DocumentCard.tsx` nutzt nur die Prop `getDocumentTypeColor` – kein direkter Firestore-Zugriff. `DocumentGenerator` wurde im Audit genannt; in der Codebase wurde kein Firestore-Import in `components/documents` gefunden – ggf. nur prüfen.

### B.2 Service-Struktur (Dateipfade)

- `lib/services/users.ts` – bereits vorhanden (userService); um Methoden für **Notification-Einstellungen** erweitern.
- `lib/services/apiMonitoring.ts` – vorhanden; Nutzung für API-Stats prüfen/erweitern.
- `lib/services/auditLogService.ts` – vorhanden; um **subscribeAuditLogs** (oder ähnlich) für Echtzeit-Stream erweitern.

Konkret:

| Service                    | Datei                             | Neue/angepasste Methoden                                                            |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| User-Notification-Settings | `lib/services/users.ts`           | `getUserNotificationSettings(uid)`, `updateUserNotificationSettings(uid, settings)` |
| API-Monitoring             | `lib/services/apiMonitoring.ts`   | `getHistoricalStats(limitDays)` (falls noch nicht vorhanden)                        |
| Audit-Logs                 | `lib/services/auditLogService.ts` | `subscribeAuditLogs(companyId?, callback)` (onSnapshot-Wrapper)                     |

### B.3 Refactoring-Beispiele

**1) NotificationSettings.tsx**

Vorher (Auszug): direkter Firestore in der Komponente.

```typescript
// Vorher: components/chat/NotificationSettings.tsx
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
// ...
const userRef = doc(getDb(), 'users', user.id);
const userDoc = await getDoc(userRef);
// ...
await updateDoc(userRef, { notificationSettings: { ... } });
```

Nachher: Aufruf über userService.

In `lib/services/users.ts` ergänzen:

```typescript
// lib/services/users.ts

export type UserNotificationSettings = {
  chatEnabled?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  shiftReminders?: boolean;
  documentExpiry?: boolean;
  systemAnnouncements?: boolean;
};

export const userService = {
  // ... bestehende Methoden ...

  async getUserNotificationSettings(uid: string): Promise<UserNotificationSettings | null> {
    if (!db || typeof window === 'undefined') return null;
    const userDoc = await getDoc(doc(getDb(), COLLECTION_NAME, uid));
    if (!userDoc.exists()) return null;
    return (userDoc.data().notificationSettings as UserNotificationSettings) ?? null;
  },

  async updateUserNotificationSettings(
    uid: string,
    settings: Partial<UserNotificationSettings>
  ): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    const userRef = doc(getDb(), COLLECTION_NAME, uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error('User-Dokument existiert nicht');
    const current = (userDoc.data().notificationSettings as UserNotificationSettings) ?? {};
    await updateDoc(userRef, {
      notificationSettings: { ...current, ...settings },
      updatedAt: serverTimestamp(),
    });
  },
};
```

Komponente:

```tsx
// components/chat/NotificationSettings.tsx (angepasst)
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services/users';
// Kein Import von firebase/firestore oder getDb

// Lade Einstellungen
useEffect(() => {
  if (!user?.id) return;
  let cancelled = false;
  userService.getUserNotificationSettings(user.id).then(settings => {
    if (!cancelled && settings) setChatEnabled(settings.chatEnabled !== false);
  });
  return () => {
    cancelled = true;
  };
}, [user?.id]);

// Speichern
const handleToggleChatNotifications = async (enabled: boolean) => {
  if (!user?.id) return;
  setLoading(true);
  try {
    await userService.updateUserNotificationSettings(user.id, { chatEnabled: enabled });
    setChatEnabled(enabled);
    setSuccess('...');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
  } finally {
    setLoading(false);
  }
};
```

**2) ApiStatsChart.tsx**

- Logik `fetchHistoricalStats()` in `lib/services/apiMonitoring.ts` verschieben (z. B. `getHistoricalStats(limitDays: number)`).
- Komponente ruft nur noch diese Service-Methode auf (oder einen Hook, der sie nutzt); keine `getDocs`/`collection` in der Komponente.

**3) AuditLogViewer.tsx**

- In `lib/services/auditLogService.ts` eine Methode `subscribeAuditLogs(options: { companyId?: string; limit?: number }, callback)` hinzufügen, die intern `onSnapshot` nutzt und `callback` mit den Logs aufruft.
- `AuditLogViewer` ruft nur diese Service-Methode in `useEffect` auf und abonniert/abbestellt; keine Firestore-Imports in der Komponente.

### B.4 Checkliste Phase B

- [ ] `userService.getUserNotificationSettings` und `updateUserNotificationSettings` in `lib/services/users.ts` implementiert.
- [ ] `NotificationSettings.tsx` auf userService umgestellt; Firestore-Imports entfernt.
- [ ] `apiMonitoring`-Service um `getHistoricalStats` ergänzt; `ApiStatsChart.tsx` nutzt nur den Service.
- [ ] `auditLogService.subscribeAuditLogs` implementiert; `AuditLogViewer.tsx` nutzt nur den Service.
- [ ] Keine direkten `firebase/firestore`- oder `getDb`-Imports in Komponenten mehr.

---

## Phase C: AuthContext & Hooks

### C.1 Zielstruktur

- **AuthContext:** Nur noch State (user, firebaseUser, loading) und Bereitstellung des Contexts; keine Firestore-/Token-Logik im Context.
- **lib/services/authService.ts:** Enthält: Token-Refresh, Sync Claims, Fallback-User-Erstellung, User-Dokument lesen/erstellen, Session-Cookie (Aufruf von API-Route), ggf. Retry-Logik.
- **Hooks:** z. B. `useAuth()` (bleibt), optional `useTokenRefresh()`, `useAuthSync()` für spezifische Flows.

### C.2 Konkretes Refactoring-Beispiel

**Schritt 1: authService erweitern**

Die bestehende `lib/services/authService.ts` ist schlank. Die **komplexe Logik** aus `AuthContext` (Retry, setDoc bei fehlendem User, Claims-Sync, Session-Cookie, buildFallbackUser) in den authService verschieben.

Neue Methoden in `lib/services/authService.ts` (oder in einer neuen Datei `lib/services/authUserLoader.ts`, die auth + firebase nutzt):

- `setSessionCookie(firebaseUser): Promise<void>` – ruft `/api/auth/session` auf.
- `clearSessionCookie(): Promise<void>` – ruft DELETE auf.
- `syncClaimsFromServer(firebaseUser, reason): Promise<IdTokenResult | null>` – ruft `/api/auth/sync-claims` auf, dann `getIdToken(true)`.
- `loadUserDocument(firebaseUser): Promise<User | null>` – enthält die komplette Retry-/setDoc-/permission-denied-Logik; gibt User-Objekt oder null zurück.
- `buildFallbackUser(firebaseUser): User` – aus Context ausgelagert.

**Schritt 2: AuthContext vereinfachen**

- Im Context nur noch:
  - `onAuthStateChanged` abonnieren.
  - Bei `firebaseUser`: `authService.loadUserDocument(firebaseUser)` aufrufen, dann `setUser(...)`; vorher/nachher `authService.setSessionCookie` / `clearSessionCookie`.
  - Kein `getDoc`/`setDoc`/`updateDoc` im Context; kein Retry-Code, keine Token-Logik im Context.
- `signIn`/`signOut`/`updateUser`/`sendPasswordReset`/`sendEmailVerification` können weiter im Context bleiben, rufen aber wo sinnvoll authService auf (z. B. signIn → Firebase Auth; nach State-Change übernimmt loadUserDocument das Laden).

**Beispiel: dünner Context (Auszug)**

```typescript
// contexts/AuthContext.tsx (vereinfacht)
import { authService } from '@/lib/services/authService';
// ...

useEffect(() => {
  if (!auth) {
    setLoading(false);
    return;
  }
  const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
    try {
      if (firebaseUser) {
        const userData = await authService.loadUserDocument(firebaseUser);
        if (userData) {
          await authService.setSessionCookie(firebaseUser);
          setUser(userData);
        } else {
          setUser(authService.buildFallbackUser(firebaseUser));
          await authService.setSessionCookie(firebaseUser);
        }
        setFirebaseUser(firebaseUser);
      } else {
        await authService.clearSessionCookie();
        setUser(null);
        setFirebaseUser(null);
      }
    } catch (error) {
      // Fehlerbehandlung wie bisher, aber ohne Firestore im Context
    } finally {
      setLoading(false);
    }
  });
  return () => unsubscribe();
}, []);
```

Alle Hilfsfunktionen (`buildFallbackUser`, `buildDefaultUserDocumentPayload`, `getFirestoreErrorCode`, `syncClaimsFromServer`, Retry-Schleife) liegen in `authService` (oder authUserLoader).

### C.3 Checkliste Phase C

- [ ] Auth-Logik (Load User, Retry, setDoc, Claims-Sync, Session-Cookie) in `lib/services/authService.ts` (oder ergänzenden Modul) ausgelagert.
- [ ] AuthContext unter ~200 Zeilen; keine Firestore-Imports im Context.
- [ ] Optional: Hooks `useTokenRefresh`, `useAuthSync` angelegt und genutzt.
- [ ] Bestehende useAuth()-API (user, firebaseUser, loading, signIn, signOut, updateUser, …) bleibt erhalten.

---

## Phase D: Types, Validierung, Error-Handling

### D.1 Typen nach Domänen

- **Ziel:** `lib/types/index.ts` nicht mehr als eine große Monolith-Datei; Aufteilung in z. B.:
  - `lib/types/user.ts`
  - `lib/types/shift.ts`
  - `lib/types/timesheet.ts`
  - `lib/types/document.ts`
  - `lib/types/facility.ts`
  - … (weitere Domänen aus der bestehenden index.ts)
- **lib/types/index.ts:** Nur noch Re-Exports von den Domänendateien, damit bestehende Imports `@/lib/types` weiter funktionieren.

### D.2 Validierung konsolidieren

- **Eine Quelle:** `lib/validations/`.
- **Prüfen:** Es gibt noch Imports von `@/lib/validation/authSchemas` und `@/lib/validation/staffSchemas` (passwort-vergessen, admin/mitarbeiter) sowie `@/lib/validation/payrollValidation` (payroll.ts). Das Verzeichnis `lib/validation/` existiert in der aktuellen Codebase ggf. nicht mehr – dann:
  - Alle Imports auf `@/lib/validations/...` umstellen:
    - `@/lib/validation/authSchemas` → `@/lib/validations/authForms` (passwordResetSchema) bzw. `auth` wo zutreffend.
    - `@/lib/validation/staffSchemas` → `@/lib/validations/staff` (roleLabelMap, etc.).
    - `@/lib/validation/payrollValidation` → in `lib/validations/` übernehmen (z. B. `payroll.ts` oder `payrollForms.ts`) und von dort importieren.
  - Danach: Kein Ordner `lib/validation/` mehr; alles unter `lib/validations/`.

### D.3 Einheitliches Fehler-Response-Format (API)

- **Bestehend:** `lib/errors/apiErrorResponse.ts` mit `ApiErrorResponseBody`, `createErrorResponse`, `createAuthErrorResponse`, `createValidationErrorResponse`, `createNotFoundErrorResponse`.
- **Ziel:** Alle API-Routen nutzen dieses Format bei Fehlern (z. B. `return createErrorResponse(appError)` statt `NextResponse.json({ message: '...' }, { status: 401 })`).
- **Schritte:** Pro Route prüfen, ob bei 4xx/5xx das einheitliche Format verwendet wird; wo nötig auf `createErrorResponse` / die Helper umstellen.

### D.4 Checkliste Phase D

- [x] Types in Domänendateien aufgeteilt; `lib/types/index.ts` nur Re-Exports (user, facility, shift, assignment, timesheet, document, message, notification, api, template, company, invitation, audit + core, ui).
- [x] Alle Imports von `lib/validation/*` auf `lib/validations/*` umgestellt; Ordner `lib/validation` existiert nicht.
- [x] Beispiel-API-Route `app/api/chat/users/route.ts` auf `createAuthErrorResponse` / `createValidationErrorResponse` / `createErrorResponse` umgestellt; `lib/errors/index.ts` exportiert `apiErrorResponse`. Weitere Routen schrittweise umstellbar.

---

## Report-Service-Konsolidation (aus Audit 1.3 / 1.7) ✅

- **Ziel:** Nur noch einen Report-Service; kein Legacy-Export.
- **Erledigt:**
  1. `reportServiceLegacy` wurde nirgends im Code verwendet (nur `reportService` aus `reports.ts`).
  2. `lib/services/reportService.ts` entfernt.
  3. In `lib/services/index.ts` der Export `reportService as reportServiceLegacy` entfernt; nur noch `reportService` aus `./reports`.

---

## Zusammenfassung der Dateipfade (Referenz)

| Thema                       | Dateipfad                                             |
| --------------------------- | ----------------------------------------------------- |
| Redirects                   | `next.config.js` (async redirects)                    |
| Middleware                  | `middleware.ts`                                       |
| User-Service (Notification) | `lib/services/users.ts`                               |
| API-Monitoring              | `lib/services/apiMonitoring.ts`                       |
| Audit-Logs                  | `lib/services/auditLogService.ts`                     |
| Auth-Logik                  | `lib/services/authService.ts`                         |
| Auth-Context                | `contexts/AuthContext.tsx`                            |
| Validierung                 | `lib/validations/*`                                   |
| Types                       | `lib/types/*.ts`, `lib/types/index.ts`                |
| API-Fehler                  | `lib/errors/apiErrorResponse.ts`                      |
| Report-Service              | `lib/services/reports.ts` (einzige Quelle nach Merge) |

Diese Roadmap bringt die Codebasis schrittweise auf den im Audit beschriebenen Zielzustand, ohne Fachlogik zu ändern und ohne Framework-Wechsel.
