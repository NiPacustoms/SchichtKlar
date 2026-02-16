# JobFlow – Sachstand & Konsolidierte Dokumentations-Zusammenfassung

**Stand:** 2026-02-16  
**Zweck:** Zentrale Referenz für Sachstandsauswertung und Onboarding. Basiert auf der vollständigen Projekt-Dokumentation (ALLE_DOKUMENTATION.md, APP_ZUSAMMENFASSUNG, README, Audits, Roadmaps, Checklisten).

---

## 1. App-Überblick

### 1.1 Was ist JobFlow?

JobFlow ist eine **DSGVO-konforme Webanwendung** für Zeitarbeitsfirmen im **medizinischen Bereich**. Kernzweck:

- **Personalplanung** für Pflegekräfte, Ärzte etc.
- **Zeiterfassung** mit GPS, ArbZG-Compliance, Pausen und Nettozeit
- **Lohnabrechnung** nach deutschem Steuerrecht (BMF-Lohnsteuertabelle 2025, MiLoG, GoBD)
- **Schichtverwaltung** mit Konfliktprüfung, Zuweisungen, Verfügbarkeit
- **Dokumentenverwaltung** für Qualifikationen, Ablaufverfolgung, Verifizierung
- **Benachrichtigungen** (Push/FCM, E-Mail, In-App)

**Version:** 0.1.0  
**Status (laut Doku):** Production-Ready / Verkaufsfertig (Sales Readiness Re-Audit: 95/100). **Aktueller Abgleich (siehe Abschnitt 11):** Build und TypeScript schlagen fehl – die App ist derzeit **nicht** build- und deploy-fähig.

### 1.2 Rollen & Berechtigungen

| Rolle        | Zugriff |
|-------------|---------|
| **Admin**   | Vollzugriff: Mitarbeiter, Einrichtungen, Schichten, Lohnabrechnung, Berichte, Einstellungen, Audit-Logs |
| **Dispatcher** | Schichtverwaltung, Mitarbeiterübersicht, Stunden, Dokumente; keine Lohnabrechnung, keine Systemeinstellungen |
| **Nurse** (Mitarbeiter) | Eigene Zeiterfassung, Dienstplan, Dokumente, Profil, Berichte, Benachrichtigungen |

RBAC über Firebase Custom Claims; Mandanten-Isolation über `companyId`/`tenantId` in Firestore Rules und API.

---

## 2. Technologie-Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript (strict), MUI 7, Tailwind, Glasmorphism, Dark Mode
- **State/Daten:** TanStack React Query, React Hook Form, Zod
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions, Node 20), Region `europe-west1`
- **PWA:** Service Worker, Manifest, Offline-Support, FCM für Push
- **Qualität:** ESLint, Prettier, Playwright E2E; Unit-Tests/Vitest konfiguriert, Coverage laut Doku nicht flächendeckend

---

## 3. Architektur (Kurz)

- **App-Shell:** `app/layout.tsx` – Emotion, GlobalErrorBoundary, QueryProvider, AuthProvider, MUITheme, ConditionalHeader, InstallPrompt, CookieBanner
- **Routen:** `(auth)` Login/Registrierung/Rechtliches, `(admin)/admin/*` Admin-Backend, `(employee)/employee/*` Mitarbeiter-App; Ziel laut Architektur-Roadmap: **einheitlich deutsche Routen** (z. B. `/anmelden`, `/admin/schichten`, `/admin/dokumenttypen`), englische als 301-Redirects
- **API:** `app/api/*` – Auth, Chat (API bleibt, UI entfernt), Invitations, Payroll, Health/Debug etc.
- **Services:** `lib/services/*` – User, Auth, Shifts, Assignments, Timesheet, Documents, Payroll, Reports, Audit, API-Monitoring; Ziel: **keine direkten Firestore-Imports in Komponenten**
- **Contexts:** AuthContext (User, Rolle, Loading), RoleContext, ThemeContext; Ziel: schlanker AuthContext, Auth-Logik in `lib/services/authService.ts`
- **Validierung:** Eine Quelle `lib/validations/`; kein `lib/validation/`
- **Typen:** Domänenorientiert in `lib/types/*.ts`, `index.ts` nur Re-Exports
- **Fehler:** Einheitliches API-Format über `lib/errors/apiErrorResponse.ts`

---

## 4. Kernfunktionen (Feature-Status)

### 4.1 Vollständig implementiert (laut Doku)

- Authentifizierung (E-Mail/Passwort, optional OIDC-SSO), RBAC, Session, Passwort-Reset
- Admin: Dashboard, Mitarbeiter, Einrichtungen, Schichten, Dienstplan, Stundenübersicht, Lohnabrechnung, Berichte, Dokumenttypen, Einstellungen, Audit-Logs
- Mitarbeiter: Dashboard, Dienstplan, Zeiterfassung (Start/Stop/Pause, GPS, ArbZG-Pausen), Zeiten-Historie, Dokumente, Einsätze, Signatur-Workflow, Profil, Gehaltsabrechnungen, Benachrichtigungen
- Zeiterfassung: ArbZG (30 min nach 6 h, 45 min nach 9 h), Ruhezeiten, Nettozeit, Offline-Queue, Sync
- Lohnabrechnung: BMF 2025, Kirchensteuer, Soli, SV, Minijob/Midijob, MiLoG, GoBD, PDF/DATEV/Excel, Status-Workflow (open → calculating → ready → approved → paid → locked)
- Dokumentenverwaltung: Upload, Preview, Ablauf, Verifizierung
- PWA, Offline, FCM-Push, Security Headers, Rate Limiting, Audit-Logging

### 4.2 Eingeschränkt / Entfernt

- **Chat:** Aus UI entfernt; API-Endpunkte bleiben, nicht über UI erreichbar
- Geplant/optional: Scheduled Reports, Custom Report Builder, erweiterte DSGVO-Features

---

## 5. Sicherheit & Compliance

- **RBAC & Mandanten:** Firestore/Storage Rules mit `tenantId`/`companyId`; deny-by-default
- **DSGVO:** Cookie-Banner, Datenschutzerklärung, Datenexport (Art. 15), Datenlöschung (Art. 17), Anonymisierung für GoBD-relevante Daten
- **Rechtliches:** Impressum konfigurierbar über ENV; Mock-Daten mit Warnung
- **Sicherheit:** Keine Secrets im Repo; Gitleaks/Pre-Commit; Security Headers (CSP, HSTS etc.) in Middleware; Rate Limiting; XSS-Schutz (DOMPurify bei Chat-Text); serverseitige Validierung; Sentry optional
- **ArbZG:** Pausen-, Arbeitszeit- und Ruhezeiten-Prüfung sowie Dokumentation
- **GoBD:** Unveränderliche Lohn-/Timesheet-Berechnungen, Audit-Logging

---

## 6. Bekannte Issues & Audits

### 6.1 Architektur-Audit (kritisch/high)

- **Doppelte Routen** (DE/EN): Konsolidierung auf Deutsch, Redirects in `next.config.js` (teilweise umgesetzt)
- **Direkte Firestore-Zugriffe in Komponenten:** z. B. NotificationSettings, ApiStatsChart, AuditLogViewer – Refactoring über Services (Roadmap Phase B)
- **AuthContext:** zu „fett“ – Auslagerung in authService (Roadmap Phase C)
- **Validierung/Types/API-Fehler:** Konsolidierung (Phase D; Teile als erledigt markiert)

### 6.2 Marktreife-Analyse (Stand 27.01.2026)

- **Blockierer (historisch):** Build fehlgeschlagen, 50+ TypeScript-Fehler, ESLint/Parsing-Fehler. **Korrektur:** Das Modul `@/lib/services/facilities` **existiert**; fehlend sind u. a. `@/lib/services/payrollSettings`, `@/lib/config/payrollRules` (nur .js.map in lib, Quelle in `functions/src/config/`), `@/lib/services/payroll/arbzgValidation` (siehe Abschnitt 11).
- **Wichtig:** Keine Unit-Tests flächendeckend; Performance nicht verifiziert
- **Positiv:** Features implementiert, Security/DSGVO gut bewertet, E2E-Tests vorhanden

### 6.3 Sales Readiness Re-Audit (27.01.2026)

- **Ergebnis:** 95/100 – verkaufsfertig
- **Behoben:** TypeScript 0 Fehler, Build erfolgreich, Next.js 15 params-Promise, fehlende Types, eval() entfernt, XSS-Schutz, Chat-Upload-Prüfung, API-Validierung, Impressum/DSGVO/Cookie-Banner/Datenexport/-löschung
- **Rest:** ESLint-Command-Warnung, Impressum Mock (ENV-konfigurierbar), Storage Rules nur Kommentar (serverseitige Prüfung vorhanden)

**Hinweis:** Der aktuelle Abgleich (Abschnitt 11) zeigt: Build und TypeScript schlagen fehl, ESLint-Konfiguration ist defekt.

---

## 11. Abgleich mit aktuellem App-Stand (2026-02-16)

Dieser Abschnitt dokumentiert das Ergebnis der Prüfung **vor Ort** (Build, Typecheck, Lint, Codebasis). Die Zusammenfassung wurde daran angeglichen.

### 11.1 Build

- **Ergebnis:** ❌ **Fehlgeschlagen**
- **Ursache:** Fehlende Module (Webpack/Next.js):
  - `@/lib/services/payrollSettings` – wird in `app/(admin)/admin/mitarbeiter/[uid]/page.tsx` und `lib/services/users.ts` genutzt; existiert nur unter `functions/src/services/payrollSettings.ts`, nicht in `lib/services/`.
  - `@/lib/config/payrollRules` – wird in `lib/services/users.ts` genutzt; unter `lib/config/` existiert nur `payrollRules.js.map`, keine TypeScript-Quelle (Quelle in `functions/src/config/payrollRules.ts`).

### 11.2 TypeScript (`npm run typecheck`)

- **Ergebnis:** ❌ **Viele Fehler** (ca. 90+)
- **Kategorien:**
  - **Fehlende Module:** `@/lib/services/payrollSettings`, `@/lib/config/payrollRules`, `./payrollSettings` (in users.ts), `@/lib/services/payroll/arbzgValidation` (in useAdminDashboard.ts; Ordner `lib/services/payroll/` fehlt), ggf. `./payroll`/`./employeePayslips` (je nach Cache/Version in index).
  - **Fehlende/veraltete Routen in .next/types:** Verweise auf nicht vorhandene Seiten (z. B. `admin/lohnabrechnung/page.js`, `admin/mitarbeiter/[uid]/gehalt/page.js`, `admin/urlaubsantraege/page.js`, `employee/gehaltsabrechnungen/page.js`, `api/payroll/items/[itemId]/route.js`).
  - **Typen/Interfaces:** `User` ohne `lastActive`; `Assignment` ohne `facilityId`, `startDate`, `startTime`, `endTime`, `qualification`, `candidateUserIds`; Dashboard-Hooks ohne `vacationDays`, `usedVacationDays`, `workTimeReport`, `surchargesReport`, `vacationReport`, `formatTime`, `formatWeek`, etc.; `Facility` ohne `billingName`, `billingZip`, `billingCity`; `ErrorContext` ohne `companyId`, `reportId`, `shiftId`.
  - **Services:** `assignmentService` ohne Methoden wie `runScheduledReportsNow`, `getAvailableEmployeeIdsForSlot`, `notifyFacilityForAssignment`, `createChatChannelForAssignment`, `declineAssignmentWithSignature`, `createAssignmentWithMatching`; `assignmentWorkflow` nutzt diese; `useFormStatus` erwartet `notifyAdminsAboutFormStatus`.
  - **MUI/UI:** Grid-Props (xs/sm/md) in `AdminKpiGrid` inkompatibel (MUI-Version); `LinearProgress` ohne `size`; MUI-Icons `Night`, `Holiday`, `Vacation`, `LineChart` nicht gefunden.
  - **TipTap:** `@tiptap/extension-table` und `insertTable` in `EmailTemplateEditor`.
  - **Chat:** `Timestamp` vs. `Date` in `chatMappers.ts` und Chat-Komponenten; `Channel`-Typ inkompatibel (`createdAt`).
  - **Sonstiges:** Doppeltes JSX-Attribut in `StaffEditDialog`; Implicit `any` in employee/berichte.

### 11.3 ESLint

- **`npm run lint`:** ❌ Scheitert – Option `--ext` ist bei Verwendung von `eslint.config.js` (Flat Config) nicht mehr gültig.
- **`npm run lint:ci`:** ❌ Scheitert – `Package subpath './config' is not defined by "exports"` beim Import aus `eslint.config.mjs` (ESLint-8-Export-Struktur).

### 11.4 Was stimmt (Abgleich)

- **Routen-Redirects:** `next.config.js` enthält die deutschen Redirects (login→anmelden, register→registrieren, forgot-password→passwort-vergessen, profile→profil, documents→dokumente, facilities→einrichtungen, time→zeiten, schedule→dienstplan, messenger→nachrichten, accept-invite→einladung-annehmen, admin/shifts→admin/schichten).
- **Modul `facilities`:** `lib/services/facilities.ts` **existiert** und wird korrekt exportiert (Marktreife-Analyse nannte fälschlich „facilities“ als fehlend).
- **Services-Struktur:** `lib/services/index.ts` exportiert u. a. authService, assignmentService, facilityService, userService, shiftService, timesheetService, reportService – **ohne** payroll/payrollSettings/employeePayslips; fehlende Referenzen kommen aus anderen Dateien (users.ts, mitarbeiter/[uid]/page.tsx, useAdminDashboard).

### 11.5 Empfohlene nächste Schritte (Priorität)

1. **Build wiederherstellen:**  
   - `lib/config/payrollRules.ts` anlegen (oder aus `functions/src/config/payrollRules.ts` übernehmen/teilen).  
   - `lib/services/payrollSettings.ts` anlegen (oder Frontend auf API/Cloud Function umstellen, die auf `functions` zugreift).  
   - `lib/services/payroll/arbzgValidation.ts` anlegen bzw. Import in `useAdminDashboard` auf vorhandenen Service umstellen.

2. **TypeScript bereinigen:**  
   - Fehlende Properties in `User`, `Assignment`, `Facility`, `ErrorContext` und in Dashboard-/Report-Hooks ergänzen oder Referenzen anpassen.  
   - assignmentService-Methoden implementieren oder Aufrufer anpassen.  
   - MUI/TipTap-Imports und -Typen an installierte Versionen anpassen.  
   - Chat-Typen (Timestamp/Date, Channel) vereinheitlichen.

3. **ESLint:**  
   - `lint`-Script auf Flat Config umstellen (ohne `--ext`).  
   - `eslint.config.mjs` so anpassen, dass keine nicht exportierten ESLint-Subpaths verwendet werden (oder ESLint-Version prüfen).

4. **Routen aufräumen:**  
   - Entweder fehlende Seiten anlegen (lohnabrechnung, gehalt, urlaubsantraege, gehaltsabrechnungen, payroll/items) oder `.next` löschen und nur tatsächlich genutzte Routen bauen, damit `.next/types/validator.ts` keine toten Referenzen enthält.

---

## 7. Roadmaps & Checklisten

### 7.1 Architektur-Implementierungs-Roadmap (Phase A–D)

- **A – Routen & Middleware:** Deutsche Routen, Redirects, interne Links/`router.push` auf DE
- **B – Services:** Kein Firestore in Komponenten; userService (Notification-Settings), apiMonitoring (getHistoricalStats), auditLogService (subscribeAuditLogs)
- **C – Auth:** AuthContext schlank, Logik in authService
- **D – Types/Validierung/Errors:** Domänen-Typen, eine Validierungs-Quelle, einheitliche API-Fehler (teilweise erledigt)

### 7.2 Marktreife-Roadmap

- Phase 1: Build-Fähigkeit (Syntax, TypeScript, ESLint, fehlende Module)
- Phase 2: Code-Qualität (Unit-Tests, Coverage, Performance-Audit)
- Phase 3: Production-Ready (Sentry, Impressum, Monitoring, Go-Live-Checklist)

### 7.3 Go-Live / Production

- **Go-Live:** ENV prüfen (kein Emulator in Prod), Domains/HTTPS, CSP/Security nur über Middleware, Firestore/Storage Rules + Indizes, `frameworksBackend` Region, Monitoring/Backups
- **Production-Ready-Checklist:** Linter/TypeScript/Code-Coverage, Unit/Integration/E2E, Funktionalität (Auth, Admin, Mitarbeiter), Performance (Lighthouse), Security, Accessibility, Cross-Browser, Mobile, API, Firebase, Dokumentation, Deployment, Monitoring, Backup, Rechtliches

---

## 8. Dokumentation & Referenzen

### 8.1 Essentielle Docs (Betrieb & Entwicklung)

- **Setup:** ENVIRONMENT_SETUP, ENV_EXAMPLE, FIREBASE_SETUP, FIREBASE_SETUP_GUIDE, FCM_SETUP
- **Deployment/Ops:** GO_LIVE_CHECKLIST, PRODUCTION_READY_CHECKLIST, DISASTER_RECOVERY, INCIDENT_RUNBOOKS, SLO_SLA, API_MONITORING, ERROR_HANDLING
- **Compliance/Security:** ASVS_CHECKLIST, DSGVO_PROZESSE, release/02_SECURITY_LEGAL_AUDIT
- **Entwicklung:** README, ADMIN_GUIDE, LOHNABRECHNUNG_USER_GUIDE, IMPLEMENTATION_GUIDE, CHANGELOG, TESTS, PAYROLL_API_KONFIGURATION, SERVICE_INTEGRATION
- **Features:** ZEITERFASSUNG_IMPLEMENTIERUNG, LOHNABRECHNUNG_IMPLEMENTATION, RECHTSKONFORMITÄT_ZEITERFASSUNG_2025

### 8.2 Vollständige Doku

- **ALLE_DOKUMENTATION.md** – konsolidierte Markdown-Dokumentation (alle Quelldateien)
- **ALLE_DOKUMENTATION_INDEX.md** + **ALLE_DOKUMENTATION_PARTS/** – Aufteilung in Teile (max. 20.000 Zeichen); Neuaufteilung: `node scripts/split-docs.js`

---

## 9. Projektstruktur (Kurz)

```
app/           – (auth), (admin)/admin, (employee)/employee, api/*
components/    – admin, chat, common, layout, documents, schedule, time, ui, errors, …
contexts/      – AuthContext, RoleContext, ThemeContext
lib/           – config, constants, errors, hooks, services, types, utils, validations
functions/     – Firebase Cloud Functions (u. a. Payroll, Backoffice)
docs/          – Dokumentation, Audits, Checklisten, release/*
tests/e2e/     – Playwright (admin, dispatcher, nurse, shared)
scripts/       – Backup, Env, Secret-Scan, Split-Docs, …
```

---

## 10. Schnellprüfung Sachstand (Empfehlung)

1. **Build:** `npm run build` – aktuell ❌ (fehlende Module, siehe Abschnitt 11.1)
2. **TypeScript:** `npm run typecheck` – aktuell ❌ (ca. 90+ Fehler, siehe Abschnitt 11.2)
3. **Lint:** `npm run lint` / `npm run lint:ci` – aktuell ❌ (Config/Flat-Config-Problem, siehe Abschnitt 11.3)
4. **E2E:** Playwright-Suites für Admin/Dispatcher/Nurse/Shared
5. **Health:** `/api/health`, `/status`
6. **Routen:** Deutsche Redirects in `next.config.js` vorhanden (Abschnitt 11.4)
7. **Umgebung:** `.env.local` / Prod-ENV ohne Emulator, Firestore/Storage Rules deployed

**Letzter Abgleich:** 2026-02-16 (Abschnitt 11). Diese Zusammenfassung dient als Basis für den **Cursor-Prompt zur Sachstandsauswertung** (siehe `.cursor/SACHSTAND_PROMPT.md`).
