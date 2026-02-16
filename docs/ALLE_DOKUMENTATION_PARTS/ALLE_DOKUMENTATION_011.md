# JobFlow – Dokumentation Teil 11

*Zeichen 198760–218603 von 2862906*

---

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



---

## Quelle: docs/ASVS_CHECKLIST.md

# OWASP ASVS / Penetrationstest Checkliste

Diese Checkliste unterstützt interne Sicherheitsreviews und externe Penetrationstests.

## 1. Architektur & Bedrohungsmodell

- [ ] Datenflussdiagramm (Auth, Firestore, Storage, Functions)
- [ ] Vertrauensgrenzen definiert (Client, Middleware, Functions, GCP)
- [ ] Mandantenisolation dokumentiert (`tenantId` in Regeln/Code)

## 2. Authentisierung & Session

- [ ] Firebase Auth Provider auf erlaubte Domains begrenzt
- [ ] Session/ID Token Validierung auf Server-seite (bei geschützten Endpunkten)
- [ ] MFA für Admin-Konten aktiviert

## 3. Autorisierung (RBAC/ABAC)

- [ ] Deny-by-default im UI (Guards) und in `firestore.rules`
- [ ] Rollen und Scopes getestet (Admin/Dispatcher/Nurse)
- [ ] Zugriff über `tenantId` isoliert (negativ/positiv Tests)

## 4. Eingabenvalidierung / Deserialisierung

- [ ] Uploads: MIME/Größe geprüft, keine SVG-Script-Injektion
- [ ] API/Functions: Parameter-Validierung und Fehlermeldungen ohne Details

## 5. Sicherheits-Header & CSP

- [ ] CSP ohne Inline, Ausnahmen dokumentiert
- [ ] Referrer-Policy, X-Content-Type-Options, X-Frame-Options, HSTS aktiv

## 6. Geheimnisse & Konfiguration

- [ ] Keine Secrets im Repo; Nutzung von env/Secret Manager
- [ ] Schlüssel-Rotation geplant/dokumentiert

## 7. Protokollierung & Monitoring

- [ ] Audit-Logs für Admin-Aktionen vollständig und fälschungssicher
- [ ] Security-Events (Rate Limit, Auth-Fehler) erzeugen Alerts

## 8. Kryptografie

- [ ] TLS erzwungen (HSTS), keine Mixed Content Warnungen
- [ ] Hashing/Signaturen für revisionssichere Dokumentation (Roadmap)

## 9. Fehlerbehandlung

- [ ] Keine Stacktraces an Endnutzer; generische Fehlermeldungen
- [ ] Zentrale Error-Boundaries im UI aktiv

## 10. Abhängigkeiten & Supply Chain

- [ ] `npm audit`/`yarn audit` regelmäßig
- [ ] Dependabot/ Renovate aktiviert

## 11. Cloud / GCP-Freigaben

- [ ] Least-Privilege IAM für Service Accounts (Backup/Deploy)
- [ ] Firestore/Storage Regeln getestet, nur notwendige Indizes vorhanden

## 12. DR & Backups

- [ ] Backups erfolgreich; Restore-Drill < 2h (RTO), RPO < 24h

## Common Findings & Gegenmaßnahmen

- [ ] CSP-Blocker: externe Domains whitelisten oder Nonce nutzen
- [ ] Rate-Limit-Umgehung: Key-Strategie erweitern (User+IP)
- [ ] Übermäßige Firestore-Lesezugriffe: Indizes/Queries optimieren

Abschlusskriterium: Alle kritischen/high Findings geschlossen; mittlere binnen 14 Tagen; niedrige geplant.



---

## Quelle: docs/CHANGELOG.md

# Changelog

## [Unreleased]

### Added

- Sicherheits-Header & CSP in Middleware/Next Config
- Rate Limiting für `/api` & `/auth`
- Strenge Firestore-Regeln (Mandanten-Isolation via `tenantId`)
- DSGVO: `exportUserData`, `deleteUserData`
- Audit-Logs + Viewer (`/admin/audit-logs`)
- Backups: `scripts/firestore-backup.sh`, `scripts/storage-backup.sh`
- DR-Runbook, SLO/SLA-Doku, Incident-Runbooks
- Security-Events Webhook
- OIDC-SSO (optional, env-gesteuert)
- Health-Endpoint `/api/health` und Status-Seite `/status`

### Changed

- RBAC-Scopes im Client (`tenantId`, `facilityIds`) in `AuthContext`/`RoleGuard`

### Removed

- **Chat-System komplett aus UI entfernt** (2025-01-XX)
  - Alle Chat-Routen (`/chat`, `/admin/chat`, `/employee/chat`, `/messenger`) leiten jetzt auf Dashboard/Homepage um
  - Chat-Navigation aus BottomNavigation entfernt
  - Chat-Feature-Flags (`canAccessAdminChat`, `canAccessEmployeeChat`) entfernt
  - Chat-Einstellungen aus Admin-Einstellungen entfernt
  - Chat-Schnellzugriff aus Employee-Dashboard entfernt
  - Chat-Tests (`tests/e2e/nurse/chat.spec.ts`, `tests/e2e/admin/chat-system.spec.ts`) entfernt
  - **Hinweis:** Chat-API-Endpunkte und -Services bleiben im Code, sind aber nicht mehr über die UI erreichbar



---

## Quelle: docs/CODEBASE_OVERVIEW.md

# JobFlow – Codebase Overview

Dieses Dokument gibt einen kompakten Überblick über den Aufbau des JobFlow‑Repositories und die wichtigsten Codebereiche. Es ergänzt das bestehende `README.md` um eine eher code‑zentrierte Sicht.

## 1. Technologie-Stack (Code-Perspektive)

- **Framework**: Next.js 15 (App Router) mit React 18 und TypeScript
- **UI & Styling**: MUI (`@mui/material`, `@mui/icons-material`) + eigenes Design-System (Glasmorphism, `gradient-background`, etc.)
- **State & Daten**: TanStack React Query (`QueryProvider`), React Contexts (`AuthContext`, `RoleContext`, `ThemeContext`)
- **Backend/Infra**: Firebase (Auth, Firestore, Storage, Cloud Functions), Firestore/Storage-Rules, Indexes
- **Qualität**: ESLint, TypeScript `noEmit`, Playwright E2E-Tests

## 2. High-Level Architektur

- **App-Shell**: `app/layout.tsx`
  - Registriert globale Fonts (Inter), PWA-Metadaten und Service Worker.
  - Wrappt das komplette UI mit
    - `EmotionRegistry` (SSR‑sichere Emotion Integration),
    - `GlobalErrorBoundary` (zentrale Fehlerbehandlung),
    - `QueryProvider` (React Query),
    - `AuthProvider` (Auth & RBAC),
    - `MUIThemeProviderWrapper` (Theming),
    - `ConditionalHeader`, `InstallPrompt`, `CookieBanner`.
- **Startseite**: `app/page.tsx`
  - Nutzt `useAuth` und `useBrandingSettings` zur Weiterleitung:
    - Admin/Dispatcher → `/admin/uebersicht`
    - Nurse/Mitarbeiter → `/employee/arbeitsplatz`
  - Zeigt ansonsten eine Marketing/Onboarding‑Landingpage mit Feature‑Kacheln.
- **Layout-Shell**: `components/layout/AppLayout.tsx`
  - Gemeinsame App-Hülle mit Header (`GlobalHeader`), Hintergrund und einheitlichen Abständen.

## 3. Verzeichnisstruktur (vereinfachte Übersicht)

- `app/`
  - Next.js App Router Struktur mit Segmente‑Ordnern:
    - `(auth)/…` – Login, Registrierung, rechtliche Seiten (Impressum, Datenschutz, Fehlerseiten).
    - `(admin)/admin/...` – Admin‑Backend (Dashboard, Mitarbeiter, Einsätze, Lohnabrechnung, Dokumente, Kommunikation, etc.).
    - `(employee)/employee/...` – Mitarbeiter‑App (Arbeitsplatz, Dienstplan, Zeiten, Dokumente, Unterhaltungen, Profil).
    - Weitere Routen wie `dashboard`, `schedule`, `time`, `documents`, Debug‑Seiten usw.
  - `app/api/...` – API‑Routen für:
    - Auth (z.B. Registrierung, Invite‑Annahme, Claim‑Sync),
    - Chat (Channels, Messages, Upload, Typing, User),
    - Forms/Reminders,
    - Invitations & Users,
    - Payroll (Items, Templates),
    - Health/Debug‑Endpunkte.
- `components/`
  - **Core/Layout**: `AppLayout`, `GlobalHeader`, `BottomNavigation`, `ConditionalHeader`, `NotificationBell`, PWA-Komponenten.
  - **Admin UI**: viele spezialisierte Komponenten (`AdminKPICard`, `Staff*`, `Shift*`, `Payroll*`, `Statistics*`, `TemplateManager`, usw.).
  - **Employee UI**: Chat‑ und Conversations‑Komponenten, Zeit- und Dokument-Komponenten.
  - **Common UI**: Dialoge (`ConfirmDialog`), Filter, Error‑ und Loading‑Komponenten, Dokument‑Upload/Anzeige, Profile‑Formular, etc.
  - **Fehlerbehandlung**: `GlobalErrorBoundary`, `RouteErrorBoundary`, `ComponentErrorBoundary`, `ErrorToast` u.a.
- `contexts/`
  - `AuthContext` – Authentifizierter Benutzer, Rolle(n), Ladezustand.
  - `RoleContext` – zusätzliche Role/RBAC‑Informationen.
  - `ThemeContext` – Theme‑Modus und Farbwelt.
- `lib/`
  - Helper, Services und Konfigurationen (z.B. Logging, Branding, Konfig, Hooks, API-Wrapper).
- `functions/`
  - Firebase Cloud Functions (u.a. komplexere Payroll‑Berechnungen, Backoffice‑Automatisierung, Sicherheit/Validierung).
- `docs/`
  - Projektdokumentation, Architektur‑Analyse, Sicherheits-/DSGVO‑Aspekte u.a. (z.B. Deployment, Audits, SOTA‑Analyse).
- `tests/e2e/`
  - Playwright‑Tests für Admin, Dispatcher, Nurse und Shared‑Flows (Login, Navigation, kritische Workflows).
- `scripts/`
  - Dev- und Ops‑Hilfsskripte (Seed/Backup/Migration, Env‑Validierung, Static‑Scan, Auto‑Deploy, Worktree‑Cleanup, usw.).

## 4. Routing & Rollen

- **Rollen** werden im `AuthContext` verwaltet und über Guards/Context in den einzelnen Seiten und Komponenten geprüft.
- Admin/Dispatcher nutzen v. a. Routen unter `(admin)/admin/...`.
- Nurses/Mitarbeiter nutzen Routen unter `(employee)/employee/...`.
- Public/Onboarding/Auth‑Routen liegen unter `(auth)/...` sowie der Root‑Landingpage `app/page.tsx`.

### 4.1 Dashboard-Flows (2026 Design-Update)

**Employee Dashboard (`/employee/arbeitsplatz`):**

- Verwendet `useDashboard`, `useEmployeeNotifications`, `useTimesheet`, `useDocuments`, `useChannels` Hooks
- Feature-Flag: `enableNewEmployeeHome` (verfügbar in `useFeatureFlags`)
- Struktur: Hero-Karte (heutiger/nächster Einsatz), "Heute wichtig" (Zeiten, Dokumente, Nachrichten), kommende Einsätze, Sidebar (Urlaub, Benachrichtigungen, Schnellzugriffe)
- Responsive: Mobile-First mit BottomNav, Cards stapeln auf XS
- Datenquellen:
  - `openTimeEntriesCount`: Berechnet aus `useTimesheet` (offene Zeiteinträge)
  - `newDocumentsCount`: Berechnet aus `useDocuments` (Dokumente der letzten 7 Tage)
  - `unreadMessagesCount`: Berechnet aus `useChannels` (Chat-Channels) oder `useEmployeeNotifications` (Fallback)

**Admin Dashboard (`/admin/uebersicht`):**

- Verwendet `useAdminDashboard`, `useAdminDashboardKpis`, `useAdminActionItems`, `useStaffingOverview`, `useRecentActivities` Hooks
- Feature-Flag: `enableNewAdminDashboard` (verfügbar in `useFeatureFlags`)
- Struktur: KPI-Grid, Action Center, Schedule Preview, Recent Activities
- Komponenten: `AdminKpiGrid`, `AdminActionCenter`, `SchedulePreviewCardDashboard`, `RecentActivities`
- Typen: `lib/admin/dashboardTypes.ts` definiert `DashboardKpi`, `DashboardActionItem`, `StaffingDayOverview`, `DashboardActivity`
- Backend-Anbindung:
  - KPIs werden aus echten Services aggregiert (`userService`, `timesheetService`, `assignmentService`, `shiftService`, `documentService`)
  - Action Items werden aus KPIs und Alerts generiert
  - Staffing Overview aggregiert Schichtdaten pro Tag
  - Recent Activities nutzt `activityService.getRecent()`
- Sicherheit: Geschützt durch `AuthGuard` und `RoleGuard` (nur `admin`/`dispatcher`)

## 5. Fehlerhandhabung & Stabilität

- **GlobalErrorBoundary** fängt ungefangene Render‑Fehler ab und zeigt nutzerfreundliche Fehlermeldungen.
- Spezialisierte Error‑Komponenten für Route‑Fehler, Async‑Errors und UI‑Fehler in kritischen Bereichen.
- Logging über `logger` (z.B. in `app/layout.tsx` bei Legal‑Validierung und Service‑Worker‑Registrierung).
- Sentry‑Konfiguration (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) für Error‑Tracking.

## 6. PWA & Service Worker

- PWA‑Metadaten und Manifest‑Einbindung in `app/layout.tsx`.
- In Development werden vorhandene Service Worker aggressiv deregistriert und Caches gelöscht, um HMR‑/Dev‑Probleme zu vermeiden.
- In Production:
