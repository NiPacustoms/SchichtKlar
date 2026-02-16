# JobFlow – Dokumentation Teil 73

*Zeichen 1430563–1450427 von 2862906*

---

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
- `payrollAuditLogs`: Nur Admin - Zeile 667

**Interpretation:** `OK` - Payroll-Security korrekt implementiert

### 1.7 Gefährliche Patterns

**Status:** ✅ KEINE GEFUNDEN

**Prüfung:**
- `allow read, write: if true` - NICHT GEFUNDEN
- Alle Rules haben Authentifizierungs- und Autorisierungs-Checks

**Interpretation:** `OK` - Keine über-permissiven Rules

---

## 2. Storage Security Rules

### 2.1 Datei
- **Pfad:** `storage.rules`
- **Zeilen:** 50
- **Status:** ✅ VORHANDEN

### 2.2 Logos (`/logos/{allPaths=**}`)

**Status:** ⚠️ ÖFFENTLICHER READ-ZUGRIFF

**Details:**
- Zeile 7: `allow read: if true;` - Öffentlicher Lesezugriff
- Zeile 9-11: Write nur für authentifizierte User, max 5MB, nur Images
- Zeile 13: Delete nur für Admin

**Interpretation:** `OK` - Öffentlicher Read für Logos ist beabsichtigt (für Anzeige in App)

### 2.3 Documents (`/documents/{userId}/{documentId}/{fileName}`)

**Status:** ✅ SICHER

**Details:**
- Zeile 19-21: Read nur für eigenen User oder Admin/Dispatcher
- Zeile 24-27: Write nur für eigenen User, max 10MB, nur Images/PDF
- Zeile 30-31: Delete nur für eigenen User oder Admin

**Interpretation:** `OK` - Dokumente sind korrekt geschützt

### 2.4 Chat Uploads (`/chatUploads/{channelId}/{fileName}`)

**Status:** ⚠️ NUR AUTHENTIFIZIERUNG

**Details:**
- Zeile 37: Read für alle authentifizierten User
- Zeile 40-42: Write für alle authentifizierten User, max 10MB, nur Images/PDF
- Zeile 45: Delete für alle authentifizierten User

**Problem:** Keine Channel-Teilnehmer-Prüfung

**Interpretation:** `MUSS` - Chat-Uploads sollten nur für Channel-Teilnehmer erlaubt sein

**Beleg:** `storage.rules` Zeile 35-46

---

## 3. API-Route-Validierung

### 3.1 Validierungs-Framework

**Status:** ✅ IMPLEMENTIERT

**Framework:** Zod (v4.1.12)

**Helper-Funktion:**
- `validateRequest()` - `lib/validations/index.ts` Zeile 18-60
- Unterstützt Body- und Query-Parameter-Validierung

### 3.2 Validierte API-Routes

**Status:** ✅ MEISTE ROUTES VALIDIERT

**Gefundene Validierungen:**
1. `/api/auth/register-admin` - `registerAdminSchema` - Zeile 36
2. `/api/auth/accept-invite` - `acceptInviteSchema` - Zeile 23
3. `/api/chat/channels` (POST) - `createChannelSchema` - Zeile 103
4. `/api/chat/messages` (POST) - `sendMessageSchema` - Zeile 130
5. `/api/chat/messages` (GET) - `messagesQuerySchema` - Zeile 31
6. `/api/admin/shifts` (GET) - `shiftsQuerySchema` - Zeile 49
7. `/api/admin/shifts` (POST) - `createShiftSchema` - Zeile 202
8. `/api/templates` (POST) - `createTemplateSchema` - Zeile 97
9. `/api/templates` (GET) - `templateQuerySchema` - Zeile 23
10. `/api/templates/[templateId]` (PUT) - `updateTemplateSchema` - Zeile 89

**Interpretation:** `OK` - Wichtige API-Routes sind validiert

### 3.3 Nicht-validierte API-Routes

**Status:** ⚠️ EINIGE ROUTES OHNE VALIDIERUNG

**Gefundene Routes ohne explizite Validierung:**
- `/api/health` - Keine Body-Validierung nötig (GET-only)
- `/api/debug/**` - Debug-Routes (sollten in Production deaktiviert sein)
- `/api/push/notify` - Keine Validierung gefunden (Import-Fehler in Build)

**Interpretation:** `SOLLTE` - Alle POST/PUT-Routes sollten validiert werden

**Beleg:** Grep-Ergebnis: 17 Validierungen gefunden, aber nicht alle Routes geprüft

### 3.4 Authentifizierung in API-Routes

**Status:** ✅ IMPLEMENTIERT

**Pattern:**
- Token-Verifizierung via `verifyIdToken()` aus `@/lib/server/firebaseAdmin`
- Rate Limiting via `checkRateLimit()`
- Custom Claims für Rollen-Checks

**Beispiel:** `app/api/auth/register-admin/route.ts` Zeile 25-33

**Interpretation:** `OK` - Authentifizierung ist durchgängig implementiert

---

## 4. Gefährliche Patterns

### 4.1 `dangerouslySetInnerHTML`

**Status:** ⚠️ VERWENDET

**Gefundene Verwendungen:**

1. **`app/layout.tsx`** - Zeile 57, 107, 173
   - Verwendung für Script-Tags (Google Analytics, etc.)
   - **Interpretation:** `OK` - Für externe Scripts akzeptabel, sollte aber überprüft werden

2. **`app/(employee)/employee/chat/components/MessageBubble.tsx`** - Zeile 435
   - Verwendung für Chat-Text-Formatierung: `dangerouslySetInnerHTML={{ __html: formatChatText(message.content) }}`
   - **Problem:** User-Input wird direkt gerendert
   - **Interpretation:** `MUSS` - Chat-Content sollte sanitized werden (z.B. mit DOMPurify)

3. **`app/debug-env/page.tsx`** - Zeile 58
   - Verwendung von `eval()`: `const evalResult = eval(evalStr);`
   - **Problem:** `eval()` ist extrem gefährlich
   - **Interpretation:** `BLOCKER` - `eval()` sollte entfernt werden (Debug-Route sollte in Production deaktiviert sein)

**Beleg:** Grep-Ergebnis: 5 Treffer

### 4.2 `any` Type Usage

**Status:** ⚠️ VERWENDET

**Details:**
- In TypeScript-Check gefunden: Viele `any` Types in API-Routes
- Beispiel: `(decoded as any).role` - Zeile 62 in `app/api/auth/register-admin/route.ts`

**Interpretation:** `SOLLTE` - `any` Types sollten durch korrekte Types ersetzt werden

### 4.3 Fehlende Input-Sanitization

**Status:** ⚠️ TEILWEISE

**Details:**
- Chat-Messages werden mit `dangerouslySetInnerHTML` gerendert ohne Sanitization
- `formatChatText()` sollte DOMPurify verwenden

**Interpretation:** `MUSS` - User-Input sollte immer sanitized werden

---

## 5. Legal-Seiten

### 5.1 Impressum

**Status:** ⚠️ MOCK-DATEN

**Datei:** `app/(auth)/legal/imprint/page.tsx`

**Inhalt:**
- JobFlow GmbH (Platzhalter)
- Musterstraße 123, 12345 Musterstadt (Platzhalter)
- E-Mail: info@jobflow.de (Platzhalter)
- Telefon: +49 123 456789 (Platzhalter)
- HRB 12345 (Platzhalter)
- Max Mustermann, Geschäftsführer (Platzhalter)

**Interpretation:** `BLOCKER` - Echte Firmendaten müssen vor Verkauf eingetragen werden

**Beleg:** `app/(auth)/legal/imprint/page.tsx` Zeile 18-54

### 5.2 Datenschutzerklärung

**Status:** ⚠️ GENERISCH

**Datei:** `app/(auth)/legal/privacy/page.tsx`

**Inhalt:**
- Generische Datenschutzerklärung
- Keine spezifischen Details zu:
  - Firebase/Firestore Datenverarbeitung
  - Push-Notifications
  - Chat-Daten
  - Zeiterfassungsdaten
  - Payroll-Daten
  - Cookies/Tracking

**Interpretation:** `MUSS` - DSGVO-konforme Datenschutzerklärung mit spezifischen Details erforderlich

**Beleg:** `app/(auth)/legal/privacy/page.tsx` Zeile 13-77

### 5.3 DSGVO-Compliance

**Status:** ⚠️ UNVOLLSTÄNDIG

**Fehlende Elemente:**
- Keine Cookie-Banner gefunden
- Keine Opt-Out-Mechanismen für Tracking
- Keine Datenexport-Funktion für User (DSGVO Art. 15)
- Keine Datenlöschung-Funktion für User (DSGVO Art. 17)

**Interpretation:** `MUSS` - DSGVO-Compliance-Features müssen implementiert werden

---

## 6. Zusammenfassung

### 6.1 Security-Stärken

✅ **Firestore Rules:**
- Mandantenisolation implementiert
- Rollenbasierte Zugriffe korrekt
- Chat-Security korrekt
- GoBD-Konformität für Timesheets
- Payroll-Security korrekt

✅ **API-Validierung:**
- Zod-Schemas für wichtige Routes
- Authentifizierung durchgängig
- Rate Limiting implementiert

### 6.2 Security-Schwächen

🔴 **BLOCKER:**
1. `eval()` in Debug-Route (`app/debug-env/page.tsx`) - muss entfernt werden
2. Impressum enthält nur Mock-Daten - echte Daten erforderlich

🟡 **MUSS:**
1. Chat-Uploads: Storage Rules sollten Channel-Teilnehmer prüfen
2. Chat-Content: `dangerouslySetInnerHTML` ohne Sanitization
3. Datenschutzerklärung: DSGVO-konform mit spezifischen Details
4. DSGVO-Compliance: Cookie-Banner, Datenexport, Datenlöschung

🟢 **SOLLTE:**
1. Alle API-Routes validieren (einige fehlen)
2. `any` Types durch korrekte Types ersetzen

### 6.3 Legal-Compliance

🔴 **BLOCKER:**
- Impressum: Mock-Daten müssen durch echte Firmendaten ersetzt werden

🟡 **MUSS:**
- Datenschutzerklärung: DSGVO-konform mit spezifischen Details
- DSGVO-Features: Cookie-Banner, Datenexport, Datenlöschung

---

**Nächste Schritte:** Siehe `03_FEATURE_COVERAGE.md` für Feature-Prüfungen.


```

---

### 📄 release/03_FEATURE_COVERAGE.md

```markdown
# JobFlow - Feature Coverage

**Erstellt:** 2025-01-27  
**Zweck:** Prüfung der Feature-Abdeckung für Verkaufsbereitschaft

---

## 1. Admin-Features

### 1.1 Dashboard

**Status:** ✅ IMPLEMENTIERT

**Route:** `/admin/dashboard`  
**Datei:** `app/(admin)/admin/dashboard/page.tsx`

**Features:**
- KPIs (Mitarbeiter, Assignments, Trends, Warnings, Check-ins, Einrichtungen)
- Quick Actions (Schicht erstellen, Mitarbeiter hinzufügen, etc.)
- Alerts Panel
- Statistics Tabs
- Recent Activities
- Realtime Updates

**Hooks:**
- `useAdminDashboard()` - `lib/hooks/useAdminDashboard.ts`
- `useRealtimeUpdates()` - `lib/hooks/useRealtimeUpdates.ts`

**Components:**
- `AdminKPICard` - `components/admin/AdminKPICard.tsx`
- `QuickActions` - `components/admin/QuickActions.tsx`
- `AlertsPanel` - `components/admin/AlertsPanel.tsx`
- `StatisticsTabs` - `components/admin/StatisticsTabs.tsx`
- `RecentActivities` - `components/admin/RecentActivities.tsx`

**Interpretation:** `OK` - Dashboard vollständig implementiert

---

### 1.2 Mitarbeiter-Verwaltung

**Status:** ✅ IMPLEMENTIERT

**Route:** `/admin/mitarbeiter`  
**Datei:** `app/(admin)/admin/mitarbeiter/page.tsx`

**Features:**
- Mitarbeiter-Liste mit Filterung
- Mitarbeiter-Details (`/admin/mitarbeiter/[uid]`)
- Gehaltsverwaltung (`/admin/mitarbeiter/[uid]/gehalt`)
- Mitarbeiter erstellen/bearbeiten
- Rollen-Verwaltung
- Qualifikationen-Verwaltung

**Services:**
- `userService` - `lib/services/users.ts`

**Hooks:**
- `useUsers()` - `lib/hooks/useUsers.ts`

**Type-Fehler gefunden:**
- `User.jobTitle` existiert nicht (8x Fehler in TypeScript-Check)
- Siehe `01_STATIC_CHECKS.md` für Details

**Interpretation:** `OK` - Funktional implementiert, aber Type-Definitionen fehlen

---

### 1.3 Einrichtungen-Verwaltung

**Status:** ✅ IMPLEMENTIERT

**Route:** `/admin/einrichtungen`  
**Datei:** `app/(admin)/admin/einrichtungen/page.tsx`

**Features:**
- Einrichtungen-Liste
- Einrichtungen-Details (`/admin/einrichtungen/[id]`)
- Einrichtungen erstellen/bearbeiten
- Logo-Upload

**Services:**
- `facilityService` - `lib/services/facilities.ts`

**Interpretation:** `OK` - Vollständig implementiert

---

### 1.4 Dienstplan-Verwaltung

**Status:** ✅ IMPLEMENTIERT

**Route:** `/admin/dienstplan`, `/admin/shifts`  
**Datei:** `app/(admin)/admin/dienstplan/page.tsx`, `app/(admin)/admin/shifts/page.tsx`

**Features:**
- Schichten-Liste mit Filterung
- Schichten erstellen/bearbeiten
- Assignments verwalten (`/admin/assignments`)
- Schicht-Zuweisungen

**Services:**
- `shiftService` - `lib/services/shifts.ts`
- `assignmentService` - `lib/services/assignments.ts`

**Components:**
- `components/schedule/` - 15 Dateien

**Type-Fehler gefunden:**
- `Shift.companyId` existiert nicht (TypeScript-Check)
- Siehe `01_STATIC_CHECKS.md` für Details

**Interpretation:** `OK` - Funktional implementiert, aber Type-Definitionen fehlen

---

### 1.5 Lohnabrechnung

**Status:** ✅ IMPLEMENTIERT

**Route:** `/admin/lohnabrechnung`  
**Datei:** `app/(admin)/admin/lohnabrechnung/page.tsx`

**Features:**
- Payroll-Perioden-Verwaltung
- Lohnabrechnung berechnen
- Genehmigungsworkflow (approve, mark as paid, lock)
- Export-Funktionen:
  - DATEV-Export
  - PDF-Export
  - CSV-Export (vollständig)
- KPIs (Gesamtgehälter, Arbeitgeberkosten, etc.)

**Services:**
- `payrollService` - `lib/services/payroll.ts`
- `payrollCalculationService` - `lib/services/payroll/payrollCalculation.ts`
- `taxCalculationService` - `lib/services/payroll/taxCalculation.ts`
- `socialSecurityCalculationService` - `lib/services/payroll/socialSecurityCalculation.ts`
- `elstamService` - `lib/services/payroll/elstamService.ts`
- `datevExportService` - `lib/services/payroll/datevExport.ts`
- `pdfGenerationService` - `lib/services/payroll/pdfGeneration.tsx`

**Hooks:**
- `usePayroll()` - `lib/hooks/usePayroll.ts`

**Components:**
- `CalculatePayrollDialog` - `components/admin/CalculatePayrollDialog.tsx`
- `ApprovePayrollDialog` - `components/admin/ApprovePayrollDialog.tsx`
- `LockPayrollDialog` - `components/admin/LockPayrollDialog.tsx`

**Interpretation:** `OK` - Vollständig implementiert mit GoBD-Konformität

---

### 1.6 Berichte

**Status:** ✅ IMPLEMENTIERT

**Route:** `/admin/berichte`  
**Datei:** `app/(admin)/admin/berichte/page.tsx`

**Services:**
- `reportService` - `lib/services/reports.ts`
- `employeeReportsService` - `lib/services/employeeReports.ts`

**Interpretation:** `OK` - Implementiert

---

### 1.7 Chat

**Status:** ✅ IMPLEMENTIERT

**Route:** `/admin/chat`  
**Datei:** `app/(admin)/admin/chat/page.tsx`

**Features:**
- Channel-Liste
- Chat-View (`/admin/chat/[channelId]`)
- Nachrichten senden/empfangen
- Admin-spezifische Channels

**Services:**
- `adminChatService` - `lib/services/adminChat.ts`
- `chatService` - `lib/services/chatService.ts`
- `messageService` - `lib/services/messages.ts`

**Interpretation:** `OK` - Implementiert

---

### 1.8 Weitere Admin-Features

**Status:** ✅ IMPLEMENTIERT

- **Dokumente:** `/admin/documents` - Dokumenten-Verwaltung
- **Dokument-Templates:** `/admin/documents/templates` - Template-Verwaltung
- **Dokument-Typen:** `/admin/document-types` - Typ-Verwaltung
- **Einstellungen:** `/admin/einstellungen` - System-Einstellungen
- **Audit-Logs:** `/admin/audit-logs` - Audit-Log-Anzeige
- **Urlaubsanträge:** `/admin/urlaubsantraege` - Urlaubsanträge-Verwaltung

**Interpretation:** `OK` - Alle Features implementiert

---

## 2. Mitarbeiter-Features

### 2.1 Dashboard

**Status:** ✅ IMPLEMENTIERT

**Route:** `/employee/dashboard`  
**Datei:** `app/(employee)/employee/dashboard/page.tsx`

**Features:**
- KPIs (Urlaubstage, Stunden, Assignments)
- Heutiges Assignment
- Heutige Zeiterfassung
- Nächste Assignments
- Benachrichtigungen
- Quick Actions

**Hooks:**
- `useDashboard()` - `lib/hooks/useDashboard.ts`
- `useEmployeeNotifications()` - `lib/hooks/useEmployeeNotifications.ts`
- `useTimesheet()` - `lib/hooks/useTimesheet.ts`
- `useFeatureFlags()` - `lib/hooks/useFeatureFlags.ts`

**Interpretation:** `OK` - Vollständig implementiert

---

### 2.2 Zeiterfassung

**Status:** ✅ IMPLEMENTIERT

**Route:** `/employee/zeiterfassung`, `/employee/zeiten`  
**Datei:** `app/(employee)/employee/zeiterfassung/page.tsx`, `app/(employee)/employee/zeiten/page.tsx`

**Features:**
- Timesheet-Formular (Start/Ende/Pause)
- Manuelle Eingabe
- Timesheet-Historie
- Tägliche Unterschriften (Daily Signature Dialog)
- Ablösungspersonal-Unterschriften (Relieving Personnel Signature Dialog)
- Assignment-Integration

**Services:**
- `timesheetService` - `lib/services/timesheets.ts`
- `timesService` - `lib/services/times.ts`

**Components:**
- `TimesheetForm` - `components/time/TimesheetForm.tsx`
- `TimesheetHistory` - `components/time/TimesheetHistory.tsx`
- `DailySignatureDialog` - `components/admin/DailySignatureDialog.tsx`
- `RelievingPersonnelSignatureDialog` - `components/assignments/RelievingPersonnelSignatureDialog.tsx`

**Hooks:**
- `useTimesheet()` - `lib/hooks/useTimesheet.ts`

**Type-Fehler gefunden:**
- `Assignment.signatureSchedule` existiert nicht (TypeScript-Check)
- Siehe `01_STATIC_CHECKS.md` für Details

**TODO gefunden:**
- `app/(employee)/employee/forms/assignment/[assignmentId]/page.tsx` Zeile 159: "TODO: Admin-ID aus Assignment oder System holen"

**Interpretation:** `OK` - Funktional implementiert, aber Type-Definitionen fehlen

---

### 2.3 Dienstplan

**Status:** ✅ IMPLEMENTIERT

**Route:** `/employee/dienstplan`  
**Datei:** `app/(employee)/employee/dienstplan/page.tsx`

**Features:**
- Eigene Schichten anzeigen
- Assignments anzeigen
- Kalender-Ansicht

**Services:**
- `shiftService` - `lib/services/shifts.ts`
- `assignmentService` - `lib/services/assignments.ts`

**Components:**
- `components/schedule/` - 15 Dateien

**Interpretation:** `OK` - Implementiert

---

### 2.4 Chat

**Status:** ✅ IMPLEMENTIERT

**Route:** `/employee/chat`  
**Datei:** `app/(employee)/employee/chat/page.tsx`

**Features:**
- Channel-Liste
- Chat-View (`/employee/chat/[channelId]`)
- Nachrichten senden/empfangen
- Datei-Uploads
- Nachrichten bearbeiten/löschen
- Teilnehmer-Verwaltung
- Nachrichten-Suche

**Components:**
- `ChannelList` - `app/(employee)/employee/chat/components/ChannelList.tsx`
- `ChatView` - `app/(employee)/employee/chat/components/ChatView.tsx`
- `MessageBubble` - `app/(employee)/employee/chat/components/MessageBubble.tsx`
- `MessageInput` - `app/(employee)/employee/chat/components/MessageInput.tsx`
- `EditMessageDialog` - `app/(employee)/employee/chat/components/EditMessageDialog.tsx`
- `MessageSearchDialog` - `app/(employee)/employee/chat/components/MessageSearchDialog.tsx`
- `NewChatDialog` - `app/(employee)/employee/chat/components/NewChatDialog.tsx`
- `ParticipantsDialog` - `app/(employee)/employee/chat/components/ParticipantsDialog.tsx`
- `SwipeableMessage` - `app/(employee)/employee/chat/components/SwipeableMessage.tsx`

**Services:**
- `chatService` - `lib/services/chatService.ts`
- `messageService` - `lib/services/messages.ts`

**Security-Problem:**
- `MessageBubble.tsx` Zeile 435: `dangerouslySetInnerHTML` ohne Sanitization
- Siehe `02_SECURITY_LEGAL_AUDIT.md` für Details

**Interpretation:** `OK` - Funktional implementiert, aber Security-Problem vorhanden

---

### 2.5 Gehaltsabrechnungen

**Status:** ✅ IMPLEMENTIERT

**Route:** `/employee/gehaltsabrechnungen`  
**Datei:** `app/(employee)/employee/gehaltsabrechnungen/page.tsx`

**Features:**
- Eigene Gehaltsabrechnungen anzeigen
- PDF-Download
- Statistiken (Gesamtgehalt, Steuern, etc.)

**Services:**
- `employeePayslipsService` - `lib/services/employeePayslips.ts`

**Hooks:**
- `useEmployeePayslips()` - `lib/hooks/useEmployeePayslips.ts`

**Interpretation:** `OK` - Implementiert

---

### 2.6 Weitere Mitarbeiter-Features

**Status:** ✅ IMPLEMENTIERT

- **Assignments:** `/employee/assignments` - Assignment-Verwaltung
- **Assignment-Forms:** `/employee/forms/assignment/[assignmentId]` - Formular-Ausfüllung
- **Dokumente:** `/employee/dokumente` - Eigene Dokumente
- **Berichte:** `/employee/berichte` - Eigene Berichte
- **Einrichtungen:** `/employee/einrichtungen` - Zugewiesene Einrichtungen
- **Benachrichtigungen:** `/employee/benachrichtigungen` - Benachrichtigungen
- **Profil:** `/employee/profil` - Profil-Verwaltung

**Type-Fehler gefunden:**
- `User.preferences` existiert nicht (8x Fehler in TypeScript-Check)
- Siehe `01_STATIC_CHECKS.md` für Details

**TODO gefunden:**
- `app/(employee)/employee/profil/page.tsx` Zeile 366: "TODO: Implementiere automatische Pausenerinnerung"

**Interpretation:** `OK` - Funktional implementiert, aber Type-Definitionen fehlen

---

## 3. Chat-Features (gemeinsam)

### 3.1 Chat-Implementierung

**Status:** ✅ IMPLEMENTIERT

**Routes:**
