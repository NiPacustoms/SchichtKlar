# JobFlow – App-Zusammenfassung

**Stand:** 17. Februar 2026  
**Zweck:** Vollständige, aktuelle Übersicht über alle Workflows, alle Funktionen (API, Cloud Functions, Services) und sämtliche UI (Seiten, Komponenten).

---

## 1. Was ist JobFlow?

**JobFlow** ist eine **DSGVO-konforme Webanwendung** für **Zeitarbeitsfirmen im medizinischen Bereich**. Zielgruppe: Pflegekräfte, Ärzte, medizinisches Personal. Keine KI-Funktionen – nur bewährte Business-Logik.

- **Version:** 0.1.0  
- **Sprache:** Deutsch (UI, Routen, Labels)  
- **Fokus:** Desktop-First (≥1280px), responsive auf Mobile  
- **PWA:** Service Worker, Manifest, Offline-Support, FCM für Push  

**Kernzweck:** Personalplanung, Zeiterfassung (GPS, ArbZG, Pausen, Nettozeit), Schichtverwaltung, Einsätze mit Status-Workflow, Dokumentenverwaltung, Benachrichtigungen (Push/FCM, E-Mail, In-App).

**Nicht in der App:** Kein Chat/Messenger, keine Lohnabrechnung (Payroll) – diese Bereiche sind vollständig aus der Codebase entfernt und kommen in dieser Dokumentation nicht vor.

---

## 2. Rollen & Berechtigungen

| Rolle         | Zugriff |
|---------------|---------|
| **Admin**     | Vollzugriff: Mitarbeiter, Einrichtungen, Schichten, Dienstplan, Stunden, Berichte, Einstellungen, Audit-Logs, Prüfprotokolle, Sicherheits-Check, Dokumentvorlagen, geplante Berichte |
| **Dispatcher**| Schichtverwaltung, Mitarbeiter, Stunden, Dokumente; keine Systemeinstellungen (über benutzerdefinierte Berechtigungen steuerbar) |
| **Nurse**     | Eigene Zeiterfassung, Dienstplan, Dokumente, Profil, Berichte, Benachrichtigungen, Einsätze, Formulare, Einrichtungen, Zeiten |

- **RBAC:** Firebase Custom Claims (`admin`, `dispatcher`, `nurse`)  
- **Mandanten-Isolation:** `companyId` / `tenantId` in Firestore Rules und API  
- **Feinere Rechte:** `lib/constants/permissions.ts` – PERMISSION_OPTIONS (Zugang, Dienstplan, Einsätze, Mitarbeiter, Einrichtungen, Zeiterfassung, Berichte, Dokumente, System). PermissionsContext für UI-Ausblendung.  

---

## 3. Technologie-Stack

| Schicht        | Technologie |
|----------------|-------------|
| **Frontend**   | Next.js 15 (App Router), React 18, TypeScript (strict), MUI 7, Emotion, Tailwind 4, Glasmorphism, Dark Mode |
| **State/Daten**| TanStack React Query, React Hook Form, Zod |
| **Backend**    | Firebase (Auth, Firestore, Storage, Cloud Functions, Node 20), Region `europe-west1` |
| **PWA**        | Service Worker, Manifest, Offline-Support, FCM |
| **Qualität**   | ESLint, Prettier; Playwright E2E; Unit/Vitest konfiguriert |

---

## 4. Architektur (Kurz)

- **App-Shell:** `app/layout.tsx` – Emotion, GlobalErrorBoundary, QueryProvider, AuthProvider, PermissionsProvider, MUITheme, ThemeModeProvider, ConditionalHeader, InstallPrompt, CookieBanner, Legal-Config-Validierung (Production).  
- **Routen:** (auth), (admin)/admin/*, (employee)/employee/*; Redirects in Middleware und next.config.js (englische/Doppel-URLs → deutsche kanonische Routen).  
- **API:** `app/api/*`. **Services:** `lib/services/*` – keine direkten Firestore-Imports in Komponenten (Ziel).  
- **Contexts:** AuthContext, RoleContext, ThemeModeContext, PermissionsContext.  
- **Validierung:** Eine Quelle `lib/validations/`. **Typen:** `lib/types/*` (user, assignment, facility, shift, timesheet, document, notification, audit, …).  

---

## 5. Alle Workflows (100 %)

### 5.1 Auth-Workflow

1. **Anmelden:** `/anmelden` → E-Mail/Passwort (oder OIDC-SSO) → Session + Cookie `jobflow_role` (admin/nurse) → Redirect nach Rolle: Admin → `/admin/uebersicht`, Nurse → `/employee/arbeitsplatz`.  
2. **Registrieren (öffentlich):** `/registrieren` – deprecated/deaktiviert.  
3. **Admin-Registrieren:** `/admin-registrieren` → API `auth/register-admin` → User + Custom Claims.  
4. **Passwort vergessen:** `/passwort-vergessen` → Firebase sendPasswordResetEmail.  
5. **E-Mail bestätigen:** `/e-mail-bestaetigen` → Link aus E-Mail.  
6. **Einladung annehmen:** `/einladung-annehmen` oder `/accept-invite` → Token-Validierung → API `auth/accept-invite` → Rolle setzen, Redirect in App.  
7. **Callback/OIDC:** `/auth/callback`, `/anmeldung/rueckruf` → Session setzen.  
8. **Fix-Admin-Role:** `/fix-admin-role` – Hilfsroute zum Setzen der Admin-Rolle.  
9. **Abmelden:** signOut → Clear Session/Cookie → Redirect `/anmelden`.  

### 5.2 Assignment-Workflow (Einsätze)

**Status:** `requested` | `accepted` | `declined` | `assigned` | `completed` | `pending-signature` | `pending` | `done` | `published`.

- **Erstellen (Admin):**  
  - Schicht direkt zuweisen: `assignShift(shiftId, userId, isRequest?, adminOverride?)` (CF `assignShift`).  
  - Einsatz mit Matching: `assignmentWorkflow.createWithMatching({ facilityId, companyId, startDate, startTime, endTime, qualification?, hours?, limit?, selectedUserIds? }, idToken)` → CF `createAssignmentWithMatching` (in `functions/src/assignment/createWithMatching.ts`) – erstellt Assignment mit Status `published`, findet Kandidaten, sendet FCM.  
- **Mitarbeiter:**  
  - Schicht anfragen: `requestShift(shiftId, message?)` (CF `requestShift`) → Status `requested`.  
  - Annehmen: Admin bestätigt oder Mitarbeiter bestätigt → `accepted`/`assigned`.  
  - Ablehnen: `declineAssignment(data)` (CF `declineAssignment`) oder mit Signatur `assignmentWorkflow.declineWithSignature({ assignmentId, reason, signatureDataUrl })` (CF `declineAssignmentWithSignature`).  
- **Zuweisung zurücknehmen:** `unassignUser(assignmentId, reason?)` (CF `unassignShift`).  
- **Einrichtung benachrichtigen:** `assignmentWorkflow.notifyFacility({ assignmentId, employeeName, contact? })` (CF `notifyFacilityForAssignment`).  
- **Trigger:** Firestore `onAssignmentCreated`, `onAssignmentUpdated` → Audit; `onAssignmentStatusChanged` → Benachrichtigungen.  

### 5.3 Zeiterfassungs-Workflow

1. **Starten:** Mitarbeiter startet Schicht (mit/ohne Assignment) → `timesService.startShift(assignmentId?)` / Timesheet `draft` mit Startzeit (optional GPS).  
2. **Pause:** Pause erfassen (ArbZG: 30 min nach 6 h, 45 min nach 9 h) → Pausenabzug in Nettozeit.  
3. **Beenden:** Schicht beenden → Endzeit, Nettozeit-Berechnung.  
4. **Einreichen:** `submitTimesheet` (CF) → Status z. B. `submitted`.  
5. **Genehmigung:** Admin in `/admin/stunden` → Status `approved`/`rejected`.  
6. **Schutz:** CF `protectApprovedTimesheets` verhindert Änderung genehmigter Zeiten.  
7. **Validierung:** CF `validateTimesheet`, `updateTimesheetValidation`; Client: `arbzgValidationService` (ArbZG-Prüfung).  

### 5.4 Dokumenten-Workflow

1. **Upload:** Mitarbeiter/Admin lädt Dokument hoch (Typ, Ablaufdatum) → Storage + Firestore `documents`.  
2. **Verifizierung:** Admin prüft → Status verifiziert/abgelehnt → CF `onDocumentVerified` → Benachrichtigung.  
3. **Ablauf:** Geplante CF `checkDocumentExpiry` / `checkDocumentExpiryScheduled`, `checkSpecificDocumentTypes`, `manualDocumentExpiryCheck` → Warnungen/Benachrichtigungen.  
4. **Audit:** `onDocumentCreated`, `onDocumentUpdated` → Audit-Log.  

### 5.5 Benachrichtigungs-Workflow

- **In-App:** Firestore `notifications` – Liste, Tabs (Alle/Ungelesen/Gelesen/Archiviert), Mark as Read, Bulk.  
- **Push (FCM):** Token speichern (`saveFCMToken`), CF/Backend senden Push; Trigger z. B. bei Assignment-Status, Schicht-Zuweisung, Dokument-Ablauf.  
- **E-Mail:** Einladung (`sendInvitationEmailCF`), Formular-Erinnerungen (`scheduledFormReminders` 24h, `runFormReminders` HTTP), Einsatz-Signatur/Einsatzmitteilung.  

### 5.6 Formular-Einsatz-Workflow (Mitarbeiter)

1. **Einsatzmitteilung:** `/employee/formulare/einsaetze/[assignmentId]` – Formular ausfüllen (Ort, Zeiten, Notizen), ggf. Signatur.  
2. **Zusammenfassung:** `/employee/formulare/einsaetze/[assignmentId]/zusammenfassung` – Finale Zusammenfassung, Signatur.  
3. **Erinnerungen:** API `forms/reminders`, CF `scheduledFormReminders` (täglich), `runFormReminders` (HTTP).  

### 5.7 Geplante Berichte

- Admin konfiguriert geplante Berichte (`/admin/berichte/geplante-berichte`) → API `admin/scheduled-reports`, `admin/scheduled-reports/[configId]`.  
- CF `runScheduledReportsNow` (onCall) – manueller Lauf; geplante Ausführung über Scheduler (wenn konfiguriert).  

---

## 6. Alle Routen (UI – 100 %)

### Öffentlich / Auth

| Route | Datei | Beschreibung |
|-------|--------|--------------|
| `/` | `app/page.tsx` | Home/Landing |
| `/anmelden` | `app/(auth)/anmelden/page.tsx` | Login |
| `/registrieren` | `app/(auth)/registrieren/page.tsx` | Registrierung (deprecated) |
| `/admin-registrieren` | `app/(auth)/admin-registrieren/page.tsx` | Admin-Registrierung |
| `/passwort-vergessen` | `app/(auth)/passwort-vergessen/page.tsx` | Passwort zurücksetzen |
| `/e-mail-bestaetigen` | `app/(auth)/e-mail-bestaetigen/page.tsx` | E-Mail bestätigen |
| `/recht/datenschutz` | `app/(auth)/recht/datenschutz/page.tsx` | Datenschutz |
| `/recht/impressum` | `app/(auth)/recht/impressum/page.tsx` | Impressum |
| `/auth/callback` | `app/(auth)/auth/callback/page.tsx` | OAuth/OIDC Callback |
| `/anmeldung/rueckruf` | `app/(auth)/anmeldung/rueckruf/page.tsx` | Anmeldung Rückruf |
| `/einladung-annehmen` | `app/einladung-annehmen/page.tsx` | Einladung per Link |
| `/accept-invite` | `app/accept-invite/page.tsx` | Accept Invite (Redirect-Ziel) |
| `/fix-admin-role` | `app/(auth)/fix-admin-role/page.tsx` | Admin-Rolle setzen |
| `/login`, `/register`, `/forgot-password` | (Redirect in next.config/middleware) | → deutsche Routen |
| `/profile` | `app/profile/page.tsx` | Redirect zu Profil |

### Admin (`/admin/*`)

| Route | Datei | Beschreibung |
|-------|--------|--------------|
| `/admin` | `app/(admin)/admin/page.tsx` | Admin-Root (Redirect) |
| `/admin/uebersicht` | `app/(admin)/admin/uebersicht/page.tsx` | Dashboard/Übersicht |
| `/admin/schichten` | `app/(admin)/admin/schichten/page.tsx` | Schichten |
| `/admin/dienstplan` | `app/(admin)/admin/dienstplan/page.tsx` | Dienstplan |
| `/admin/mitarbeiter` | `app/(admin)/admin/mitarbeiter/page.tsx` | Mitarbeiterliste |
| `/admin/mitarbeiter/[uid]` | `app/(admin)/admin/mitarbeiter/[uid]/page.tsx` | Mitarbeiter-Detail |
| `/admin/einrichtungen` | `app/(admin)/admin/einrichtungen/page.tsx` | Einrichtungen |
| `/admin/einrichtungen/[id]` | `app/(admin)/admin/einrichtungen/[id]/page.tsx` | Einrichtungs-Detail |
| `/admin/stunden` | `app/(admin)/admin/stunden/page.tsx` | Stunden/Zeiterfassung |
| `/admin/berichte` | `app/(admin)/admin/berichte/page.tsx` | Berichte |
| `/admin/berichte/geplante-berichte` | `app/(admin)/admin/berichte/geplante-berichte/page.tsx` | Geplante Berichte |
| `/admin/einstellungen` | `app/(admin)/admin/einstellungen/page.tsx` | Einstellungen |
| `/admin/einsaetze` | `app/(admin)/admin/einsaetze/page.tsx` | Einsätze |
| `/admin/einsaetze/new` | `app/(admin)/admin/einsaetze/new/page.tsx` | Neuer Einsatz |
| `/admin/pruefprotokolle` | `app/(admin)/admin/pruefprotokolle/page.tsx` | Prüfprotokolle |
| `/admin/sicherheits-check` | `app/(admin)/admin/sicherheits-check/page.tsx` | Sicherheits-Check |
| `/admin/dokumente/vorlagen` | `app/(admin)/admin/dokumente/vorlagen/page.tsx` | Dokumentvorlagen |
| `/admin/personal-kompakt` | `app/(admin)/admin/personal-kompakt/page.tsx` | Personal kompakt |
| `/admin/staff-simple` | `app/(admin)/admin/staff-simple/page.tsx` | Staff Simple |
| `/admin/staff` | `app/(admin)/admin/staff/page.tsx` | Staff |
| `/admin/audit-logs` | `app/(admin)/admin/audit-logs/page.tsx` | Audit-Logs |
| `/admin/aktivitaeten` | `app/(admin)/admin/aktivitaeten/page.tsx` | Aktivitäten |

### Mitarbeiter (`/employee/*`)

| Route | Datei | Beschreibung |
|-------|--------|--------------|
| `/employee/arbeitsplatz` | `app/(employee)/employee/arbeitsplatz/page.tsx` | Dashboard |
| `/employee/dienstplan` | `app/(employee)/employee/dienstplan/page.tsx` | Dienstplan |
| `/employee/zeiterfassung` | `app/(employee)/employee/zeiterfassung/page.tsx` | Zeiterfassung |
| `/employee/zeiten` | `app/(employee)/employee/zeiten/page.tsx` | Zeiten/Historie |
| `/employee/profil` | `app/(employee)/employee/profil/page.tsx` | Profil |
| `/employee/dokumente` | `app/(employee)/employee/dokumente/page.tsx` | Dokumente |
| `/employee/einsaetze` | `app/(employee)/employee/einsaetze/page.tsx` | Einsätze |
| `/employee/einsaetze/[id]` | `app/(employee)/employee/einsaetze/[id]/page.tsx` | Einsatz-Detail |
| `/employee/einrichtungen` | `app/(employee)/employee/einrichtungen/page.tsx` | Einrichtungen |
| `/employee/berichte` | `app/(employee)/employee/berichte/page.tsx` | Berichte |
| `/employee/benachrichtigungen` | `app/(employee)/employee/benachrichtigungen/page.tsx` | Benachrichtigungen |
| `/employee/formulare/einsaetze/[assignmentId]` | `app/(employee)/employee/formulare/einsaetze/[assignmentId]/page.tsx` | Formular Einsatz |
| `/employee/formulare/einsaetze/[assignmentId]/zusammenfassung` | `app/(employee)/employee/formulare/einsaetze/[assignmentId]/zusammenfassung/page.tsx` | Zusammenfassung |

### Sonstige

| Route | Datei | Beschreibung |
|-------|--------|--------------|
| `/customers` | `app/customers/page.tsx` | Kunden |
| `/systemstatus` | `app/systemstatus/page.tsx` | Systemstatus |
| `/wartung` | `app/wartung/page.tsx` | Wartung |
| `/debug-env` | `app/debug-env/page.tsx` | Debug Umgebung |
| `/debug/token` | `app/debug/token/page.tsx` | Debug Token |

---

## 7. Alle API-Routen (100 %)

| Methode | Pfad | Datei | Beschreibung |
|---------|------|--------|--------------|
| GET/POST | `/api/auth/session` | `app/api/auth/session/route.ts` | Session lesen/setzen |
| POST | `/api/auth/register-admin` | `app/api/auth/register-admin/route.ts` | Admin registrieren |
| POST | `/api/auth/sync-claims` | `app/api/auth/sync-claims/route.ts` | Claims synchronisieren |
| POST | `/api/auth/accept-invite` | `app/api/auth/accept-invite/route.ts` | Einladung annehmen |
| POST | `/api/auth/ensure-admin-role` | `app/api/auth/ensure-admin-role/route.ts` | Admin-Rolle sicherstellen |
| GET/POST | `/api/user/data-export` | `app/api/user/data-export/route.ts` | DSGVO Datenexport (User) |
| POST | `/api/user/data-deletion` | `app/api/user/data-deletion/route.ts` | DSGVO Datenlöschung (User) |
| GET/POST | `/api/admin/user/[userId]/data-export` | `app/api/admin/user/[userId]/data-export/route.ts` | Admin: User-Datenexport |
| POST | `/api/admin/user/[userId]/data-deletion` | `app/api/admin/user/[userId]/data-deletion/route.ts` | Admin: User-Datenlöschung |
| GET/POST | `/api/admin/scheduled-reports` | `app/api/admin/scheduled-reports/route.ts` | Geplante Berichte Liste |
| GET/PUT/DELETE | `/api/admin/scheduled-reports/[configId]` | `app/api/admin/scheduled-reports/[configId]/route.ts` | Geplante Berichte CRUD |
| GET/POST | `/api/invitations` | `app/api/invitations/route.ts` | Einladungen |
| GET/POST | `/api/invitations/[token]` | `app/api/invitations/[token]/route.ts` | Einladung per Token |
| GET/POST | `/api/templates` | `app/api/templates/route.ts` | Vorlagen |
| GET/PUT/DELETE | `/api/templates/[templateId]` | `app/api/templates/[templateId]/route.ts` | Vorlage CRUD |
| POST | `/api/assignment/create` | `app/api/assignment/create/route.ts` | Einsatz erstellen |
| GET/POST | `/api/assignment/available-employees` | `app/api/assignment/available-employees/route.ts` | Verfügbare MA für Slot |
| GET/POST | `/api/admin/shifts` | `app/api/admin/shifts/route.ts` | Admin Schichten |
| POST | `/api/forms/reminders` | `app/api/forms/reminders/route.ts` | Formular-Erinnerungen auslösen |
| GET | `/api/health` | `app/api/health/route.ts` | Health-Check |
| POST | `/api/proxy-create` | `app/api/proxy-create/route.ts` | Proxy für Erstellung |
| GET/POST | `/api/cf` | `app/api/cf/route.ts` | Cloud-Function-Proxy |
| GET | `/api/debug/admin-status` | `app/api/debug/admin-status/route.ts` | Debug Admin-Status |
| GET | `/api/debug/whoami` | `app/api/debug/whoami/route.ts` | Debug WhoAmI |
| GET | `/api/debug/test-services` | `app/api/debug/test-services/route.ts` | Debug Services testen |
| GET/PATCH | `/api/users/[userId]` | `app/api/users/[userId]/route.ts` | User lesen/aktualisieren |
| GET | `/api/route.ts` | `app/api/route.ts` | API-Root |

---

## 8. Alle Cloud Functions (100 %)

**Exportiert aus `functions/src/index.ts`:**

| Name | Typ | Beschreibung |
|------|-----|--------------|
| `getUserRole` | onCall | Rolle abfragen |
| `getUsersWithRoles` | onCall | User mit Rollen |
| `setUserRole` | onCall | Rolle setzen |
| `onUserCreated` | Firestore Trigger | User erstellt |
| `onUserUpdated` | Firestore Trigger | User aktualisiert |
| `onAssignmentCreated` | Firestore Trigger | Assignment erstellt (Audit) |
| `onAssignmentUpdated` | Firestore Trigger | Assignment aktualisiert (Audit) |
| `onDocumentCreatedAudit` | Firestore Trigger | Dokument erstellt (Audit) |
| `onDocumentUpdatedAudit` | Firestore Trigger | Dokument aktualisiert (Audit) |
| `onShiftCreated` | Firestore Trigger | Schicht erstellt (Audit) |
| `onShiftUpdated` | Firestore Trigger | Schicht aktualisiert (Audit) |
| `onTimesheetCreated` | Firestore Trigger | Timesheet erstellt (Audit) |
| `onTimesheetUpdated` | Firestore Trigger | Timesheet aktualisiert (Audit) |
| `onTimesheetDeleted` | Firestore Trigger | Timesheet gelöscht (Audit) |
| `checkDocumentExpiry` | (Notification) | Dokumentablauf prüfen |
| `onAssignmentStatusChanged` | Firestore Trigger | Assignment-Status → Benachrichtigung |
| `onDocumentVerified` | Firestore Trigger | Dokument verifiziert → Benachrichtigung |
| `onShiftAssigned` | Firestore Trigger | Schicht zugewiesen → Benachrichtigung |
| `updateTimesheetValidation` | Firestore Trigger | Timesheet-Validierung aktualisieren |
| `validateTimesheet` | onCall | Timesheet validieren |
| `checkDocumentExpiryScheduled` | Scheduler | Geplant Dokumentablauf |
| `checkSpecificDocumentTypes` | onCall | Bestimmte Dokumenttypen prüfen |
| `manualDocumentExpiryCheck` | onCall | Manueller Dokumentablauf-Check |
| `notifyShiftCreated` | Firestore Trigger | Schicht erstellt → Benachrichtigung |
| `notifyShiftUpdated` | Firestore Trigger | Schicht aktualisiert → Benachrichtigung |
| `aggregateKPIs` | (KPI) | KPI-Aggregation |
| `dailyKPIAggregation` | (KPI) | Tägliche KPI-Aggregation |
| `deleteAllAssignments` | onCall | Alle Assignments löschen (Admin) |
| `assignShift` | onCall | Schicht zuweisen |
| `declineAssignment` | onCall | Assignment ablehnen |
| `findCandidates` | onCall | Kandidaten für Schicht finden |
| `requestShift` | onCall | Schicht anfragen (Mitarbeiter) |
| `unassignShift` | onCall | Zuweisung zurücknehmen |
| `submitTimesheet` | onCall | Timesheet einreichen |
| `protectApprovedTimesheets` | Firestore Trigger | Genehmigte Timesheets schützen |
| `sendInvitationEmailCF` | onCall | Einladungs-E-Mail senden |
| `exportUserData` | onCall | DSGVO Export |
| `deleteUserData` | onCall | DSGVO Löschung |
| `cleanupApiMonitoring` | Scheduler | API-Monitoring aufräumen |
| `manualCleanupApiMonitoring` | onCall | Manuell API-Monitoring aufräumen |
| `checkApiLimitAlert` | Scheduler | API-Limit-Alert prüfen |
| `manualCheckApiLimitAlert` | onCall | Manuell API-Limit prüfen |
| `scheduledFormReminders` | Pub/Sub (24h) | Formular-Erinnerungen täglich |
| `runFormReminders` | HTTPS | Formular-Erinnerungen HTTP |

**Weitere im Code (Client ruft auf, ggf. in index nachziehen):**

| Name (Client) | Datei | Beschreibung |
|---------------|--------|--------------|
| `createAssignmentWithMatching` | `assignment/createWithMatching.ts` | Einsatz mit Matching + FCM |
| `declineAssignmentWithSignature` | `assignment/declineWithSignature.ts` | Ablehnung mit Signatur |
| `notifyFacilityForAssignment` | `assignment/notifyFacility.ts` | Einrichtung benachrichtigen |
| `getAvailableEmployeeIdsForSlot` | `assignment/getAvailableEmployeeIdsForSlot.ts` | Verfügbare MA für Slot |
| `runScheduledReportsNow` | `scheduledReports.ts` | Geplante Berichte jetzt ausführen |

---

## 9. Alle Services (lib/services) – Export & Kernmethoden

**Aus `lib/services/index.ts` exportiert:**

| Service | Export | Kernmethoden (Auswahl) |
|---------|--------|------------------------|
| authService | AuthService | signIn, signOut, registerAdmin, … |
| assignmentService | assignmentService | getById, getByUserId, getByShiftId, create, update, delete, list (Filters) |
| cloudFunctions | cloudFunctions | assignShiftToUser, unassignUser, declineAssignment, requestShiftAssignment, findAvailableCandidates, runScheduledReportsNow, getAvailableEmployeeIdsForSlot, notifyFacilityForAssignment, declineAssignmentWithSignature, createAssignmentWithMatching |
| shiftAssignmentHelpers | shiftAssignmentHelpers | checkQualifications, formatConflicts, getScoreColor, deleteAllAssignments |
| documentTypeService | documentTypeService | CRUD Dokumenttypen |
| documentService | documentService | getById, getByUserId, create, update, delete, list |
| facilityService | facilityService | getById, getAll, create, update, delete |
| facilityHoursService | facilityHoursService | Öffnungszeiten Einrichtungen |
| notificationService | notificationService | Liste, Mark Read, … |
| reportService | reportService | Berichte generieren/abrufen |
| settingsService | settingsService | Einstellungen lesen/schreiben |
| shiftService | shiftService | getById, getAll, create, update, delete (mit Filtern) |
| timesheetService | timesheetService | getById, getByUserId, getByDate, create, update, delete, submit; aggregateTimesheetsByUser |
| userService | userService | getById, getAll, create, update, delete, list |
| timesService | timesService | startShift, endShift, addBreak, getActiveTimesheet, … |
| employeeFacilitiesService | employeeFacilitiesService | Einrichtungen für MA |
| adminSettingsService | adminSettingsService | Rollen, getRoleById, Einstellungen |
| employeeReportsService | employeeReportsService | Berichte für MA |
| holidayProvider | holidayProvider | Feiertage (Bundesland) |
| templateService | templateService | Vorlagen CRUD |

**Weitere Services (nicht in index, aber im Projekt):**

- assignmentWorkflow (createWithMatching, declineWithSignature, notifyFacility)  
- activities (activityService)  
- alerts (alertService)  
- arbzgValidation (arbzgValidationService)  
- authUserService (getOrCreateAuthUser, loadUserForAuth, updateAuthUserProfile, …)  
- auditLogService (writeAuditLog, subscribeAuditLogs)  
- categories (categoriesService)  
- documentGeneration (documentGenerationService)  
- firebaseStorage (firebaseStorageService)  
- invitations (invitationService)  
- maps (geocodeAddress, getRoute)  
- notifications (notificationService – alternative)  
- offlineQueue (offlineQueueService)  
- offlineStorage (getAllQueueItems, addQueueItem, removeQueueItem, clearQueue, updateQueueItem)  
- pushNotifications (getFCMToken, saveFCMToken, sendPushNotification, setupMessageListener, …)  
- scheduledReportConfigService  
- timesheetProof (timesheetProofService)  
- staffGroups (staffGroupService)  
- email (renderInviteEmailHtml, sendInvitationEmail, sendAssignmentFormEmail, …)  
- companies (companyService)  
- exportTokenService  

---

## 10. Alle UI-Komponenten (100 %)

### Layout

- AppLayout, BottomNavigation, ConditionalHeader, GlobalHeader, GlobalSearchDialog, RoleBasedNavigation, BackButton, PageHeader, PageContainer, PageBreadcrumbs, NotificationBell.

### Auth

- AuthGuard, RoleGuard, EmailVerificationBanner.

### Admin

- AssignShiftDialog, DashboardSkeleton, AdminKpiGrid, SchedulePreviewCardDashboard, StaffEditDialog, CategoryManager, AuditLogViewer, TemplateManager, TopPerformers, StatisticsTabs, StatisticsChart, StaffStatusCard, StaffStatsCard, StaffGroupManager, StaffGroupDialog, StaffGroupCard, StaffFilters, StaffCreateDialog, ShiftRangeDialog, ShiftManagementCard, ShiftEditDialog, ShiftCreateDialog, SchedulePreviewCard, RecentActivities, QuickActions, FacilityHoursDashboard, FacilityEditDialog, FacilityCreateDialog, EmployerCostsCard, DailySignatureDialog, ApiStatsChart, AlertsPanel, AdminKPICard, AdminActionCenter.

### Schedule

- AssignmentRequestCard, NurseScheduleView, ExportButton, ShiftStatusManager, ShiftList, OpenShiftCard, MyAssignmentCard, AssignmentCard, AdminListView, AdminCalendarView, AcceptShiftDialog, ScheduleFilters, ConflictBanner, CapacityIndicator.

### Time

- TimesheetForm, PauseDialog, TimesheetHistory.

### Documents

- DocumentUpload, DocumentGenerator, DocumentCard.

### Assignments

- RelievingPersonnelSignatureDialog, DeclineAssignmentModal, AssignmentStatusBadge, FormStatusAlertButton.

### Profile

- ProfileForm, ProfileStats.

### UI (allgemein)

- SyncStatusIndicator, EmptyState, AccessibilityProvider, LoadingSpinner, AppLogo, GlassCard, VirtualizedList, SignatureDialog, OptimizedList, OptimizedImage, ErrorBoundary, Dialog, DebouncedSearch, ConfirmDestructiveDialog.

### Errors

- GlobalErrorBoundary, ComponentErrorBoundary, AuthErrorBoundary.

### PWA / Legal

- PushNotificationInitializer, InstallPrompt, CookieBanner.

### Theme / Provider

- ThemeProvider, EmotionRegistry.

---

## 11. Hooks (lib/hooks)

- useOfflineSync, useFeatureFlags, useAdminDashboard, useRealtimeUpdates, useEmployeeReports, useShifts, useBrandingSettings, useAdminSettings, useDashboard, usePerformance, useFCM, usePushNotifications, useTimes, useEmployeeFacilities, useAssignments, useAdminReports, useTimesheet, useProfile, useNurseSchedule, useNotifications, useFormStatus, useFacilityHours, useEmployeeNotifications, useDocuments, useBulkOperations, useAlerts.

---

## 12. Contexts

- AuthContext (user, firebaseUser, loading, signIn, signOut, updateUser, sendPasswordReset, sendEmailVerification).  
- RoleContext (Rolle für UI).  
- ThemeModeContext (Dark/Light).  
- PermissionsContext (permissions, hasPermission, canAccessAdminArea, isLoading).  

---

## 13. Design-System (Kurz)

- **Farben:** Primary Petrol `#005f73`, Secondary Mustard `#e8aa42`, Hintergrund `#252422`, Cards Glasmorphism `rgba(255,255,255,0.08)`.  
- **Typografie:** Inter, 8px-Grid, Hierarchie h1 32/40 bis body2 13/18.  
- **Layout:** Desktop-First, Container max 1440px, Sidebar 280px, Cards Radius 16px. Mobile: Stack, Safe-Area, Bottom-Navigation.  

---

## 14. Sicherheit & Compliance

- RBAC & Mandanten (Firestore/Storage Rules, tenantId/companyId); deny-by-default.  
- DSGVO: Cookie-Banner, Datenschutz, Datenexport (Art. 15), Datenlöschung (Art. 17), Anonymisierung wo nötig.  
- Security Headers (CSP, HSTS, X-Frame-Options) in Middleware.  
- Rate Limiting, serverseitige Validierung.  
- ArbZG: Pausen-, Arbeitszeit-, Ruhezeiten-Prüfung.  
- GoBD: Unveränderliche Timesheet-Dokumentation, Audit-Logging.  

---

## 15. Bekannter technischer Status (17.02.2026)

- **Pipeline:** Typecheck und Lint stabil (tsconfig ohne .next/types; source-map-js für Build). Build: `npm run build` nach `npm install`.  
- **TODOs:** Alle offenen TODOs bereinigt oder als V2/optional dokumentiert (Admin-ID, Pausenerinnerung, RateLimit, Reports, E-Mail, Feiertage, Sentry, Legal, Health-Checks).  
- Routen-Redirects: Middleware + next.config.js; deutsche Routen kanonisch.  
- Assignment-CFs: Client ruft sie auf; ggf. in functions/src/index.ts exportieren, falls noch nicht deployt.  

---

## 16. Projektstruktur (Kern)

```
app/
  (auth)/          – Anmelden, Registrieren, Recht, Callback, Fix-Admin
  (admin)/admin/   – Übersicht, Schichten, Dienstplan, Mitarbeiter, Einrichtungen, Stunden,
                     Berichte, geplante Berichte, Einstellungen, Einsätze, Prüfprotokolle,
                     Sicherheits-Check, Dokumentvorlagen, Personal-kompakt, Staff-Simple,
                     Staff, Audit-Logs, Aktivitäten
  (employee)/employee/ – Arbeitsplatz, Dienstplan, Zeiterfassung, Zeiten, Profil, Dokumente,
                         Einsätze, Einrichtungen, Berichte, Benachrichtigungen, Formulare
  api/             – auth, user, admin, invitations, templates, assignment, forms, health, debug, cf, proxy-create
  customers, systemstatus, wartung, debug-env, debug/token, page.tsx
components/        – admin, layout, schedule, time, documents, assignments, profile, ui, errors, legal, pwa
contexts/         – AuthContext, RoleContext, ThemeModeContext, PermissionsContext
lib/
  constants/       – routes, permissions
  hooks/           – siehe Abschnitt 11
  services/        – siehe Abschnitt 9
  types/           – user, assignment, facility, shift, timesheet, document, …
  validations/     – authForms, staff, invitations, …
functions/         – Firebase Cloud Functions (Auth, Audit, Notifications, Timesheet, Document, Assignment, DSGVO, API Monitoring, Form Reminders)
docs/              – Dokumentation, diese Datei
e2e/               – Playwright (admin, dispatcher, nurse, shared)
```

---

## 17. Schnellprüfung

1. **Build:** `npm run build`  
2. **TypeScript:** `npm run typecheck`  
3. **Lint:** `npm run lint` / `npm run lint:ci`  
4. **E2E:** Playwright-Suites  
5. **Health:** `/api/health`, `/systemstatus`  
6. **Dev:** `npm run dev` (Port 3000); bei Änderungen an next.config, middleware, .env, API-Routen: Dev-Server neu starten.  

---

Diese Zusammenfassung deckt **alle Workflows, alle Funktionen (API, Cloud Functions, Services) und die gesamte UI (Seiten + Komponenten)** der JobFlow-App ab und kann für Onboarding, Sachstandsauswertung und Planung verwendet werden.
