# JobFlow – Dokumentation Teil 20

*Zeichen 377461–397345 von 2862906*

---

- `/profile` - `app/profile/page.tsx`
- `/profil` - `app/profil/page.tsx`
- `/documents` - `app/documents/page.tsx`
- `/dokumente` - `app/dokumente/page.tsx`
- `/reports` - `app/reports/page.tsx`
- `/berichte` - `app/berichte/page.tsx`
- `/facilities` - `app/facilities/page.tsx`
- `/einrichtungen` - `app/einrichtungen/page.tsx`
- `/benachrichtigungen` - `app/benachrichtigungen/page.tsx`
- `/accept-invite` - `app/accept-invite/page.tsx`
- `/maintenance` - `app/maintenance/page.tsx`
- `/status` - `app/status/page.tsx`
- `/debug-env` - `app/debug-env/page.tsx`
- `/debug/token` - `app/debug/token/page.tsx`

### 1.6 API-Routes (`app/api/`)
- `/api/auth/register-admin` - `app/api/auth/register-admin/route.ts`
- `/api/auth/accept-invite` - `app/api/auth/accept-invite/route.ts`
- `/api/chat/**` - 11 Dateien in `app/api/chat/`
- `/api/admin/shifts` - `app/api/admin/shifts/route.ts`
- `/api/audit/logs` - `app/api/audit/logs/route.ts`
- `/api/forms/reminders` - `app/api/forms/reminders/route.ts`
- `/api/health` - `app/api/health/route.ts`
- `/api/invitations/**` - 2 Dateien in `app/api/invitations/`
- `/api/push/notify` - `app/api/push/notify/route.ts`
- `/api/templates/**` - 3 Dateien in `app/api/templates/`
- `/api/debug/**` - 2 Dateien in `app/api/debug/`

---

## 2. Firebase-Konfiguration

### 2.1 Firebase-Initialisierung
- **Datei:** `lib/firebase.ts`
- **Status:** Initialisiert mit env-Variablen
- **Services:** Auth, Firestore, Storage, Functions, Messaging (optional)
- **Emulator-Support:** Ja (via `NEXT_PUBLIC_USE_EMULATOR`)

### 2.2 Firebase-Config-Datei
- **Datei:** `firebase.json`
- **Hosting:** Next.js Framework Backend (europe-west1)
- **Functions:** `functions/` Verzeichnis, Node.js 20
- **Firestore:** Rules: `firestore.rules`, Indexes: `firestore.indexes.json`
- **Storage:** Rules: `storage.rules`
- **Emulators:** Auth (9099), Functions (5001), Firestore (8080), Storage (9199), UI (4000)

### 2.3 Firestore Security Rules
- **Datei:** `firestore.rules`
- **Zeilen:** 810
- **Features:**
  - Rollenbasierte Zugriffe: `hasRole()`, `isAdmin()`, `isDispatcher()`
  - Mandantenisolation: `belongsToSameCompany()`, `creatingForSameCompany()`
  - Chat: Channel-Teilnehmer-Checks
  - Timesheets: GoBD-konform (approved/submitted unveränderlich)
  - Payroll: Nur Admin/Dispatcher Zugriff

### 2.4 Storage Security Rules
- **Datei:** `storage.rules`
- **Zeilen:** 50
- **Features:**
  - Logos: Public read, authenticated write (max 5MB, images only)
  - Documents: User-own oder Admin/Dispatcher (max 10MB, images/PDF)
  - Chat Uploads: Authenticated (max 10MB, images/PDF)

### 2.5 Firestore Indexes
- **Datei:** `firestore.indexes.json`
- **Zeilen:** 848
- **Collections mit Indexen:**
  - assignments (mehrere Indexe)
  - timesheets (mehrere Indexe)
  - channels, messages, adminMessages
  - documents
  - users
  - payrollPeriods, payrollItems, payrollAuditLogs
  - shifts
  - alerts, notifications, activities
  - times
  - chatChannels

---

## 3. Auth & Role-System

### 3.1 AuthContext
- **Datei:** `contexts/AuthContext.tsx`
- **Features:**
  - Firebase Auth Integration
  - User-Dokument aus Firestore laden
  - Custom Claims Support (role, companyId)
  - Retry-Mechanismus für Token-Refresh
  - E2E Test Mode Support
- **Funktionen:** `signIn()`, `signOut()`, `updateUser()`, `sendPasswordReset()`, `sendEmailVerificationEmail()`

### 3.2 RoleContext
- **Datei:** `contexts/RoleContext.tsx`
- **Rollen:** `nurse`, `dispatcher`, `admin`
- **Features:**
  - Role aus AuthContext ableiten
  - localStorage Persistenz
  - Helper: `isAdmin`, `isNurse`

### 3.3 Auth Guards
- **Datei:** `components/auth/AuthGuard.tsx`
- **Datei:** `components/auth/RoleGuard.tsx`
- **Verwendung:** In Layouts (`app/(admin)/admin/layout.tsx`, `app/(employee)/employee/layout.tsx`)

### 3.4 Rollen-Definition
- **admin:** Vollzugriff, kann alles verwalten
- **dispatcher:** Kann Schichten, Assignments, Einrichtungen verwalten
- **nurse:** Mitarbeiter, sieht nur eigene Daten

---

## 4. Services & Features

### 4.1 Zeiterfassung (Time Tracking)
- **Services:**
  - `lib/services/timesheets.ts` - Timesheet-Verwaltung (GoBD-konform)
  - `lib/services/times.ts` - Time-Entries (work, break, vacation, sick)
- **Routes:**
  - `/employee/zeiterfassung` - `app/(employee)/employee/zeiterfassung/page.tsx`
  - `/employee/zeiten` - `app/(employee)/employee/zeiten/page.tsx`
  - `/zeiterfassung` - `app/zeiterfassung/page.tsx`
  - `/time` - `app/time/page.tsx`
- **Components:**
  - `components/time/TimesheetForm.tsx`
  - `components/time/TimesheetHistory.tsx`

### 4.2 Payroll (Lohnabrechnung)
- **Services:**
  - `lib/services/payroll.ts` - Haupt-Payroll-Service
  - `lib/services/payroll/payrollCalculation.ts` - Berechnungslogik
  - `lib/services/payroll/taxCalculation.ts` - Steuerberechnung
  - `lib/services/payroll/socialSecurityCalculation.ts` - Sozialversicherung
  - `lib/services/payroll/elstamService.ts` - ELStAM-Abfrage
  - `lib/services/payroll/datevExport.ts` - DATEV-Export
  - `lib/services/payroll/pdfGeneration.tsx` - PDF-Generierung
  - `lib/services/payrollSettings.ts` - Payroll-Einstellungen
  - `lib/services/payrollAuditService.ts` - Audit-Logging
  - `lib/services/employeePayslips.ts` - Mitarbeiter-Gehaltsabrechnungen
- **Routes:**
  - `/admin/lohnabrechnung` - `app/(admin)/admin/lohnabrechnung/page.tsx`
  - `/employee/gehaltsabrechnungen` - `app/(employee)/employee/gehaltsabrechnungen/page.tsx`

### 4.3 Chat
- **Services:**
  - `lib/services/chatService.ts` - Haupt-Chat-Service
  - `lib/services/messages.ts` - Nachrichten-Verwaltung
  - `lib/services/adminChat.ts` - Admin-Chat
  - `lib/services/_chatService.impl.ts` - Chat-Implementierung
  - `lib/services/chatApiClient.ts` - API-Client
- **Routes:**
  - `/chat` - `app/(app)/chat/page.tsx`
  - `/chat/[channelId]` - `app/(app)/chat/[channelId]/page.tsx`
  - `/employee/chat` - `app/(employee)/employee/chat/page.tsx`
  - `/admin/chat` - `app/(admin)/admin/chat/page.tsx`
  - `/messenger` - `app/messenger/page.tsx`
- **Components:**
  - `components/chat/` - 2 Dateien
  - `app/(employee)/employee/chat/components/` - 9 Chat-Komponenten

### 4.4 Dienstplan (Schedule/Shifts)
- **Services:**
  - `lib/services/shifts.ts` - Schicht-Verwaltung
  - `lib/services/assignments.ts` - Assignment-Verwaltung
- **Routes:**
  - `/admin/dienstplan` - `app/(admin)/admin/dienstplan/page.tsx`
  - `/admin/shifts` - `app/(admin)/admin/shifts/page.tsx`
  - `/employee/dienstplan` - `app/(employee)/employee/dienstplan/page.tsx`
  - `/schedule` - `app/schedule/page.tsx`
  - `/dienstplan` - `app/dienstplan/page.tsx`
- **Components:**
  - `components/schedule/` - 15 Dateien

### 4.5 Reports
- **Services:**
  - `lib/services/reports.ts` - Haupt-Reports-Service
  - `lib/services/reportService.ts` - Legacy Reports
  - `lib/services/employeeReports.ts` - Mitarbeiter-Reports
- **Routes:**
  - `/admin/berichte` - `app/(admin)/admin/berichte/page.tsx`
  - `/employee/berichte` - `app/(employee)/employee/berichte/page.tsx`
  - `/reports` - `app/reports/page.tsx`
  - `/berichte` - `app/berichte/page.tsx`

### 4.6 Weitere Services
- `lib/services/users.ts` - User-Verwaltung
- `lib/services/facilities.ts` - Einrichtungen
- `lib/services/documents.ts` - Dokumente
- `lib/services/documentTypes.ts` - Dokumenttypen
- `lib/services/notifications.ts` - Benachrichtigungen
- `lib/services/notificationService.ts` - Notification-Service
- `lib/services/settings.ts` - Einstellungen
- `lib/services/settingsService.ts` - Settings-Service
- `lib/services/adminSettings.ts` - Admin-Einstellungen
- `lib/services/activities.ts` - Aktivitäts-Log
- `lib/services/alerts.ts` - Alerts
- `lib/services/invitations.ts` - Einladungen
- `lib/services/templateService.ts` - Templates
- `lib/services/employeeFacilities.ts` - Mitarbeiter-Einrichtungen
- `lib/services/holidayProvider.ts` - Feiertage

---

## 5. Layout-Struktur

### 5.1 Admin Layout
- **Datei:** `app/(admin)/admin/layout.tsx`
- **Guards:** `AuthGuard` (requireAdmin), `RoleGuard` (admin/dispatcher)
- **Components:** `AppLayout`, `BottomNav`

### 5.2 Employee Layout
- **Datei:** `app/(employee)/employee/layout.tsx`
- **Guards:** `AuthGuard`, `RoleGuard` (nurse)
- **Components:** `AppLayout`, `BottomNav`

### 5.3 App Layout (gemeinsam)
- **Datei:** `app/(app)/layout.tsx`
- **Guards:** `AuthGuard`
- **Components:** `AppLayout`, `BottomNav`

### 5.4 Root Layout
- **Datei:** `app/layout.tsx`
- **Features:** ThemeProvider, AuthProvider, RoleProvider, i18n

---

## 6. Middleware

- **Datei:** `middleware.ts`
- **Features:**
  - Security Headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection)
  - Edge Runtime-kompatibel
  - Matcher: Alle Routes außer `_next/static`, `_next/image`, `favicon.ico`

---

## 7. Package.json Scripts

- `npm run dev` - Development Server (Port 3000)
- `npm run build` - Production Build
- `npm run start` - Production Server
- `npm run lint` - ESLint Check (max-warnings=0)
- `npm run typecheck` - TypeScript Check
- `npm run validate` - lint + typecheck
- `npm run ci:verify` - CI-Verification (lint:ci + typecheck:ci + static-scan)

---

## 8. Zusammenfassung

### 8.1 Route-Statistik
- **Auth-Routes:** 7
- **Admin-Routes:** 20+
- **Employee-Routes:** 15+
- **App-Routes:** 3
- **Legacy-Routes:** 15+
- **API-Routes:** 20+

### 8.2 Services-Statistik
- **Haupt-Services:** 25+
- **Payroll-Services:** 8
- **Chat-Services:** 4

### 8.3 Firebase-Statistik
- **Firestore Rules:** 810 Zeilen
- **Storage Rules:** 50 Zeilen
- **Indexes:** 848 Zeilen (mehrere Collections)

---

**Nächste Schritte:** Siehe `01_STATIC_CHECKS.md` für Code-Qualitätsprüfungen.


```

---

### 📄 release/01_STATIC_CHECKS.md

```markdown
# JobFlow - Static Checks & Commands

**Erstellt:** 2025-01-27  
**Zweck:** Code-Qualitätsprüfungen (Lint, TypeScript, Build, Tests)

---

## 1. Lint-Check

### Command
```bash
npm run lint
```

### Definition
- **Datei:** `package.json`, Zeile 16
- **Command:** `eslint . --max-warnings=0`

### Ergebnis
**STATUS:** ❌ FEHLGESCHLAGEN

**Output:**
```
sh: eslint: command not found
```

**Interpretation:** `BLOCKER`

**Details:**
- ESLint ist nicht im PATH verfügbar
- Mögliche Ursachen:
  - `node_modules/.bin` nicht im PATH
  - ESLint nicht installiert (obwohl in `package.json` als devDependency)
  - `npm install` wurde nicht ausgeführt

**Beleg:** Terminal-Output vom 2025-01-27

---

## 2. TypeScript-Check

### Command
```bash
npm run typecheck
```

### Definition
- **Datei:** `package.json`, Zeile 18
- **Command:** `tsc --noEmit`

### Ergebnis
**STATUS:** ❌ FEHLGESCHLAGEN

**Fehleranzahl:** 60+ TypeScript-Fehler

### Kategorien der Fehler

#### 2.1 Fehlende Properties in Types
- `Assignment.relievingSignatures` existiert nicht (3x)
- `Assignment.pdfGenerated` existiert nicht
- `Assignment.pdfUrl` existiert nicht (2x)
- `Assignment.signatureSchedule` existiert nicht
- `User.jobTitle` existiert nicht (8x)
- `User.preferences` existiert nicht (8x)
- `TimeEntry.createdAt` existiert nicht (2x)
- `Shift.companyId` existiert nicht

**Betroffene Dateien:**
- `app/(admin)/admin/assignments/page.tsx`
- `app/(admin)/admin/mitarbeiter/page.tsx`
- `app/(admin)/admin/shifts/page.tsx`
- `app/(admin)/admin/urlaubsantraege/page.tsx`
- `app/(employee)/employee/profil/page.tsx`
- `app/(employee)/employee/zeiterfassung/page.tsx`

#### 2.2 Fehlende Imports/Exports
- `TemplateStatus` nicht exportiert aus `@/lib/types` (4x)
- `TemplateChannel` nicht exportiert aus `@/lib/types` (2x)
- `CompanyTemplate` nicht exportiert aus `@/lib/types`
- `doc`, `getDoc` nicht exportiert aus `@/lib/firebase`

**Betroffene Dateien:**
- `app/api/templates/**`
- `app/api/push/notify/route.ts`
- `components/admin/TemplateManager.tsx`

#### 2.3 Fehlende Variablen/Funktionen
- `payrollSettingsQuery` nicht definiert
- `setStationName` nicht definiert
- `stationName` nicht definiert
- `requestVacationMutation` nicht definiert
- `userId` nicht definiert (2x)

**Betroffene Dateien:**
- `app/(admin)/admin/mitarbeiter/[uid]/page.tsx`
- `app/(employee)/employee/forms/assignment/[assignmentId]/page.tsx`
- `app/(employee)/employee/zeiten/page.tsx`
- `components/admin/AssignShiftDialog.tsx`

#### 2.4 Type-Inkompatibilitäten
- `Assignment` Type-Konflikte zwischen `lib/types` und `lib/services/assignments` (4x)
- `instanceof` Checks auf falsche Typen (4x)
- Fehlende Properties in ErrorContext/LogContext (10x)
- `DocumentType` Record fehlt `"assignment-signatures"` (2x)

**Betroffene Dateien:**
- `components/schedule/NurseScheduleView.tsx`
- `components/schedule/AssignmentCard.tsx`
- `app/api/admin/shifts/route.ts`
- `components/documents/DocumentGenerator.tsx`

#### 2.5 API-Route Type-Fehler
- Next.js 15 `params` muss Promise sein
- `app/(app)/chat/[channelId]/page.tsx` - params nicht als Promise

**Betroffene Dateien:**
- `app/(app)/chat/[channelId]/page.tsx`

### Interpretation
**STATUS:** `BLOCKER`

**Begründung:**
- 60+ TypeScript-Fehler verhindern sauberen Build
- Viele Fehler deuten auf fehlende Type-Definitionen hin
- API-Route-Fehler verhindert Production-Build

**Beleg:** Terminal-Output vom 2025-01-27, `npm run typecheck`

---

## 3. Build-Check

### Command
```bash
npm run build
```

### Definition
- **Datei:** `package.json`, Zeile 14
- **Command:** `next build`

### Ergebnis
**STATUS:** ❌ FEHLGESCHLAGEN

**Output-Zusammenfassung:**
```
⚠ Compiled with warnings in 2.2min

Import errors:
- 'getFirebaseConfig' is not exported from '@/lib/firebase' (2x)
- 'getDoc' is not exported from '@/lib/firebase'
- 'doc' is not exported from '@/lib/firebase'

⨯ ESLint must be installed in order to run during builds: npm install --save-dev eslint

Type error: Type '{ params: { channelId: string; }; }' does not satisfy the constraint 'PageProps'.
  Types of property 'params' are incompatible.
    Type '{ channelId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

Next.js build worker exited with code: 1 and signal: null
```

### Warnings
1. **Import-Fehler:** `getFirebaseConfig` nicht exportiert
   - Betroffen: `lib/services/pushNotifications.ts`
   - Impact: Push-Notifications funktionieren möglicherweise nicht

2. **Import-Fehler:** `doc`, `getDoc` nicht exportiert
   - Betroffen: `app/api/push/notify/route.ts`
   - Impact: Push-Notification API funktioniert nicht

### Build-Blocker
1. **ESLint fehlt:** Build erfordert ESLint-Installation
2. **Type-Fehler:** Next.js 15 `params` muss Promise sein

### Interpretation
**STATUS:** `BLOCKER`

**Begründung:**
- Build schlägt fehl aufgrund von Type-Fehlern
- ESLint-Installation fehlt (Build-Requirement)
- Production-Build nicht möglich

**Beleg:** Terminal-Output vom 2025-01-27, `npm run build`

---

## 4. Test-Check

### Prüfung
- **Datei:** `package.json`
- **Suche:** Test-Scripts (`"test"`, `"test:*"`, `vitest`, `jest`)

### Ergebnis
**STATUS:** `SCRIPT NICHT GEFUNDEN`

**Details:**
- `vitest` ist in `devDependencies` vorhanden (Zeile 95)
- Kein Test-Script in `package.json` definiert
- Keine Test-Dateien gefunden (außer `vitest.config.ts.disabled`)

**Interpretation:** `SOLLTE`

**Begründung:**
- Tests sind für Verkaufsbereitschaft nicht zwingend erforderlich
- Aber empfohlen für Qualitätssicherung

**Beleg:** `package.json` Zeile 95, keine Test-Scripts gefunden

---

## 5. Zusammenfassung

| Check | Status | Interpretation | Fehleranzahl |
|-------|--------|----------------|--------------|
| Lint | ❌ FEHLGESCHLAGEN | `BLOCKER` | ESLint nicht verfügbar |
| TypeScript | ❌ FEHLGESCHLAGEN | `BLOCKER` | 60+ Fehler |
| Build | ❌ FEHLGESCHLAGEN | `BLOCKER` | Type-Fehler + ESLint fehlt |
| Tests | ⚠️ NICHT GEFUNDEN | `SOLLTE` | Kein Test-Script |

### Kritische Issues

1. **ESLint nicht installiert/verfügbar** (`BLOCKER`)
   - Build erfordert ESLint
   - Lint-Check kann nicht ausgeführt werden

2. **60+ TypeScript-Fehler** (`BLOCKER`)
   - Fehlende Type-Definitionen
   - Type-Inkompatibilitäten
   - Fehlende Imports/Exports

3. **Next.js 15 Inkompatibilität** (`BLOCKER`)
   - `params` muss Promise sein in dynamischen Routes
   - Betroffen: `app/(app)/chat/[channelId]/page.tsx`

4. **Fehlende Firebase-Exports** (`MUSS`)
   - `getFirebaseConfig`, `doc`, `getDoc` nicht exportiert
   - Betroffen: Push-Notifications, API-Routes

5. **Fehlende Type-Properties** (`MUSS`)
   - `User.jobTitle`, `User.preferences`
   - `Assignment.relievingSignatures`, `Assignment.pdfUrl`
   - `TimeEntry.createdAt`

### Nächste Schritte
Siehe `02_SECURITY_LEGAL_AUDIT.md` für Security-Prüfungen.


```

---

### 📄 release/02_SECURITY_LEGAL_AUDIT.md

```markdown
# JobFlow - Security & Legal Audit

**Erstellt:** 2025-01-27  
**Zweck:** Security-Rules, API-Validierung und Legal-Compliance prüfen

---

## 1. Firestore Security Rules

### 1.1 Datei
- **Pfad:** `firestore.rules`
- **Zeilen:** 810
- **Status:** ✅ VORHANDEN

### 1.2 Mandantenisolation (`companyId`)

**Status:** ✅ IMPLEMENTIERT

**Details:**
- Helper-Funktionen vorhanden:
  - `belongsToSameCompany(resourceCompanyId)` - Zeile 29-34
  - `creatingForSameCompany(requestCompanyId)` - Zeile 37-42
- Verwendet in:
  - `users` (Zeile 75, 80, 85, 89)
  - `facilities` (Zeile 103, 104, 106, 107)
  - `shifts` (Zeile 118, 119, 121, 122)
  - `documents` (Zeile 133, 136, 139, 143)
  - `assignments` (Zeile 150, 153, 154, 156)
  - `reports` (Zeile 167, 170, 173)
  - `channels` (Zeile 204, 208, 212, 219)
  - `messages` (Zeile 231, 239, 245, 252)
  - `timesheets` (Zeile 358, 365, 371, 383)
  - `alerts` (Zeile 471, 474, 475, 479)
  - `notifications` (Zeile 491, 494, 495, 500)
  - `activities` (Zeile 338, 339, 340)
  - `auditLogs` (Zeile 602)

**Interpretation:** `OK` - Mandantenisolation ist durchgängig implementiert

### 1.3 Rollenbasierte Zugriffe

**Status:** ✅ IMPLEMENTIERT

**Helper-Funktionen:**
- `isAuthenticated()` - Zeile 5-7
- `hasRole(role)` - Zeile 9-17
- `isAdmin()` - Zeile 19-21
- `isDispatcher()` - Zeile 23-25

**Verwendung:**
- Admin-Zugriff: `isAdmin()` für sensible Collections (settings, auditLogs, employeePayrollData)
- Dispatcher-Zugriff: `isDispatcher()` für Shifts, Facilities, Assignments
- User-Zugriff: Eigene Daten + Company-Mitglieder

**Interpretation:** `OK` - Rollenbasierte Zugriffe korrekt implementiert

### 1.4 Chat-Security

**Status:** ✅ IMPLEMENTIERT

**Channel-Zugriff:**
- Lesen: Nur Teilnehmer (`request.auth.uid in resource.data.participants`) - Zeile 205
- Erstellen: User muss Teilnehmer sein - Zeile 209
- Update: Nur Ersteller oder Admin - Zeile 214
- Delete: Nur Admin - Zeile 219

**Message-Zugriff:**
- Lesen: Nur Channel-Teilnehmer (`isChannelParticipant()`) - Zeile 231-233
- Erstellen: Nur Channel-Teilnehmer, Broadcast nur Admin/Dispatcher - Zeile 239-242
- Update/Delete: Nur eigener Ersteller oder Admin - Zeile 245-255

**Helper-Funktionen:**
- `isChannelParticipant(channelId)` - Zeile 49-54
- `canCreateMessage(channelId)` - Zeile 56-64

**Interpretation:** `OK` - Chat-Security korrekt implementiert

### 1.5 Timesheets-Security

**Status:** ✅ IMPLEMENTIERT

**Zugriffsregeln:**
- Lesen: Eigene Timesheets ODER Admin derselben Company - Zeile 353-362
- Erstellen: Authentifizierte User - Zeile 363-366
- Update: Nur wenn NICHT approved/submitted (GoBD) - Zeile 369-378
- Delete: Nur wenn NICHT approved/submitted (GoBD) - Zeile 381-389

**GoBD-Konformität:**
- Approved/submitted Timesheets sind unveränderlich - Zeile 376-377, 387-388

**Interpretation:** `OK` - Timesheets-Security und GoBD-Konformität implementiert

### 1.6 Payroll-Security

**Status:** ✅ IMPLEMENTIERT

**Zugriffsregeln:**
- `payrollPeriods`: Nur Dispatcher/Admin - Zeile 617, 620, 627, 641
- `payrollItems`: Nur Cloud Functions können schreiben (false) - Zeile 656
- `employeePayrollData`: Nur Admin (sensible Daten: IBAN, SV-Nr., Steuer-ID) - Zeile 682, 685
- `payrollSettings`: Eigener User oder Admin/Dispatcher - Zeile 701, 707
