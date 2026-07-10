# Schichtklar – Codebase Overview

Dieses Dokument gibt einen kompakten Überblick über den Aufbau des Schichtklar‑Repositories und die wichtigsten Codebereiche. Es ergänzt das bestehende `README.md` um eine eher code‑zentrierte Sicht.

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
  - Registrierung von `/sw.js` (Haupt‑Service Worker) und `/firebase-messaging-sw.js`.
  - Übergabe der Firebase‑Konfiguration per `postMessage` an den Service Worker.
  - Retry‑Logik und Logging für SW‑Registrierung.

## 7. Qualitätssicherung & Tests

- **Linting**: `npm run lint` / `lint:ci` mit strikten Regeln.
- **Typecheck**: `npm run typecheck` / `typecheck:ci`.
- **Static Scan**: `node scripts/static-scan.js` (Sicherheits‑/Qualitäts‑Heuristiken).
- **E2E-Tests**: Playwright‑Suites für verschiedene Rollen/Flows (`tests/e2e/...`).

## 8. Wie man im Code navigiert

- Einstiegspunkte:
  - UI‑Flow: `app/page.tsx` → `(auth)` / `(admin)` / `(employee)`‑Pages → zugehörige Komponenten in `components/`.
  - Layout/Theming: `app/layout.tsx`, `components/layout/*`, `components/ThemeProvider.tsx`.
  - Auth/RBAC: `contexts/AuthContext.tsx`, `components/auth/*`, `middleware.ts`.
  - Geschäftslogik / Backend: `app/api/*`, `functions/`, relevante Services unter `lib/`.
- Für neue Features:
  - Passende Route unter `app/` anlegen/erweitern.
  - UI-Komponenten in `components/` (ggf. Unterordner für Admin/Employee).
  - Backend‑Logik in `app/api/...` bzw. in `functions/` kapseln.

Diese Übersicht soll als Startpunkt dienen, um sich im Code zurechtzufinden. Für tiefere Details zu einzelnen Domänen (z.B. Payroll, Chat, Zeiterfassung) können die jeweiligen `app/`‑Routen und spezialisierten Komponenten/Services direkt verfolgt werden.
