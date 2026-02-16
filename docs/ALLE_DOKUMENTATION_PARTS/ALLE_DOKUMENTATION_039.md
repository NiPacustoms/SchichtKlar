# JobFlow – Dokumentation Teil 39

*Zeichen 755141–775027 von 2862906*

---

### 4. RoleBasedNavigation wird nicht genutzt

**Problem:** `RoleBasedNavigation.tsx` existiert, wird aber möglicherweise nicht verwendet:

- BottomNavigation ist die primäre Navigation
- RoleBasedNavigation scheint für Desktop-Header gedacht, wird aber nicht in GlobalHeader verwendet

**Empfehlung:** Entweder nutzen oder entfernen.

### 5. Landing Page für eingeloggte User

**Problem:** `/` leitet eingeloggte User sofort weiter, bietet keine echte Landing Page.

**Empfehlung:** Optional eine Dashboard-Übersicht für eingeloggte User anbieten.

### 6. Deprecated Route

**Problem:** `/register` ist als deprecated markiert, sollte zu `/admin-register` weiterleiten.

**Empfehlung:** Redirect implementieren.

### 7. Chat-Kanal-Seiten sehr einfach

**Problem:** `/admin/chat/[channelId]` und `/employee/chat/[channelId]` sind sehr einfache Wrapper-Seiten.

**Empfehlung:** Funktionalität erweitern oder in Haupt-Chat-Seite integrieren.

---

## Navigationsoptimierungsvorschläge

### Priorität 1: Kritisch

1. **BottomNavigation konsistent gestalten**
   - Admin: Dashboard als Haupttab hinzufügen oder entfernen
   - Mitarbeiter: "Mehr"-Menü erweitern um fehlende Routen
   - Konsistente Anzahl von Haupttabs (4-5)

2. **Links zu Detail-Seiten hinzufügen**
   - Breadcrumbs auf Detail-Seiten
   - Explizite Links von Listen zu Details
   - "Zurück"-Buttons auf Detail-Seiten

3. **Mitarbeiter-Navigation vervollständigen**
   - Alle wichtigen Routen in "Mehr"-Menü oder zusätzlicher Navigation
   - Klare Hierarchie: Haupttabs vs. Sekundär-Navigation

### Priorität 2: Wichtig

4. **RoleBasedNavigation nutzen oder entfernen**
   - Entscheidung treffen: Desktop-Header-Navigation oder nicht
   - Wenn nicht genutzt: Code entfernen

5. **Deprecated Route behandeln**
   - `/register` → `/admin-register` Redirect implementieren

6. **Landing Page verbessern**
   - Für eingeloggte User: Dashboard-Übersicht oder schnelle Navigation
   - Für nicht-eingeloggte User: Marketing-Landing Page (bereits vorhanden)

### Priorität 3: Optional

7. **Chat-Kanal-Seiten verbessern**
   - Funktionalität erweitern
   - Oder in Haupt-Chat-Seite integrieren

8. **Debug-Routen dokumentieren**
   - `/status`, `/debug-env` etc. dokumentieren oder entfernen

9. **Legacy-Routen prüfen**
   - `/admin/staff-simple` prüfen: Nutzung oder Entfernung

---

## Seitenlogik-Probleme

### 1. Rollenbasierte Zugriffe

**Status:** ✅ Gut implementiert
- AuthGuard und RoleGuard vorhanden
- Middleware prüft Rollen
- Keine Probleme identifiziert

### 2. Layouts

**Status:** ✅ Gut implementiert
- Admin Layout: `app/(admin)/admin/layout.tsx`
- Employee Layout: `app/(employee)/layout.tsx`
- Auth Layout: `app/(auth)/layout.tsx`
- Keine Probleme identifiziert

### 3. Redirects

**Status:** ✅ Gut implementiert
- Alias-Redirects funktionieren
- Rollenbasierte Redirects funktionieren
- Keine Probleme identifiziert

---

## Zusammenfassung

### Stärken
- ✅ Klare Route-Struktur
- ✅ Gute Trennung zwischen Admin und Mitarbeiter
- ✅ Alias-Redirects funktionieren
- ✅ Rollenbasierte Zugriffe gut implementiert
- ✅ Layouts gut strukturiert

### Schwächen
- ❌ Inkonsistente BottomNavigation
- ❌ Viele Routen nicht in Navigation sichtbar
- ❌ Fehlende Links zu Detail-Seiten
- ❌ RoleBasedNavigation nicht genutzt
- ❌ Landing Page für eingeloggte User unklar

### Empfohlene Maßnahmen

1. **Sofort:** BottomNavigation konsistent gestalten
2. **Sofort:** Links zu Detail-Seiten hinzufügen
3. **Bald:** Mitarbeiter-Navigation vervollständigen
4. **Später:** RoleBasedNavigation entscheiden (nutzen oder entfernen)
5. **Später:** Landing Page verbessern

---

**Nächste Schritte:** Implementierung der Priorität-1-Optimierungen


```

---

### 📄 ANALYSE_AGENT2_FUNKTIONEN.md

```markdown
# Agent 2: Funktions- und Button-Analyse

**Datum:** 2025-01-27  
**Analysierter Bereich:** Alle Buttons, Formulare, Funktionsaufrufe, Service-Calls, Dialoge

---

## Button-Analyse

### Button-Typen und Verwendung

#### 1. Primary Actions (Contained Buttons)

**Verwendung:** Hauptaktionen wie "Speichern", "Erstellen", "Bestätigen"

**Beispiele:**
- `components/admin/QuickActions.tsx`: "Dienst anlegen", "Mitarbeiter hinzufügen"
- `app/(employee)/employee/zeiterfassung/page.tsx`: "Schicht starten", "Schicht beenden"
- `components/dashboard/AssignmentCard.tsx`: "Dienst starten"

**Status:** ✅ Gut implementiert
- Konsistente Verwendung von `variant="contained"`
- Disabled-States vorhanden
- Loading-States vorhanden

#### 2. Secondary Actions (Outlined Buttons)

**Verwendung:** Sekundäre Aktionen wie "Abbrechen", "Bearbeiten", "Exportieren"

**Beispiele:**
- `components/admin/QuickActions.tsx`: "Bericht exportieren", "Einstellungen"
- `components/dashboard/AssignmentCard.tsx`: "Pause hinzufügen", "Dienst beenden"

**Status:** ✅ Gut implementiert
- Konsistente Verwendung von `variant="outlined"`
- Disabled-States vorhanden

#### 3. Navigation Buttons

**Verwendung:** Links zu anderen Seiten

**Beispiele:**
- `components/layout/BottomNavigation.tsx`: Tab-Navigation
- `components/layout/GlobalHeader.tsx`: Logo-Link, Logout-Button

**Status:** ✅ Gut implementiert
- Next.js `Link` Komponente verwendet
- ARIA-Labels vorhanden

#### 4. Icon Buttons

**Verwendung:** Kompakte Aktionen wie "Löschen", "Bearbeiten", "Aktualisieren"

**Beispiele:**
- `app/(admin)/admin/dienstplan/page.tsx`: Refresh-Button
- Verschiedene Tabellen: Edit/Delete-Buttons

**Status:** ✅ Gut implementiert
- ARIA-Labels vorhanden (siehe `lib/utils/ariaLabels.ts`)

---

## Formular-Analyse

### Formulare mit Validierung

#### 1. TimesheetForm

**Datei:** `components/time/TimesheetForm.tsx`

**Validierung:**
- ✅ Zod-Schema: `timesheetSchema`
- ✅ React Hook Form Integration
- ✅ Validierung: Datum, Startzeit, Endzeit, Pausenzeit, Notizen

**Status:** ✅ Vollständig implementiert
- Alle Felder validiert
- Error-Handling vorhanden
- Submit-Handler vorhanden

#### 2. ProfileForm

**Datei:** `components/profile/ProfileForm.tsx`

**Validierung:**
- ✅ Zod-Schema: `profileSchema`
- ✅ React Hook Form Integration
- ✅ Validierung: Name, E-Mail, Telefon, Adresse, Qualifikationen, Urlaubstage

**Status:** ✅ Vollständig implementiert
- Alle Felder validiert
- Error-Handling vorhanden
- Submit-Handler vorhanden

#### 3. ShiftCreateDialog

**Datei:** `components/admin/ShiftCreateDialog.tsx`

**Validierung:**
- ✅ Zod-Schema: `shiftCreateSchema`
- ✅ React Hook Form Integration

**Status:** ✅ Vollständig implementiert

#### 4. StaffCreateDialog

**Datei:** `components/admin/StaffCreateDialog.tsx`

**Validierung:**
- ✅ Zod-Schema: `staffCreateSchema` (aus `lib/validation/staffSchemas.ts`)
- ✅ React Hook Form Integration
- ✅ Umfangreiche Validierung: Name, E-Mail, Telefon, Rolle, Qualifikationen, Adresse, Kontakt, Notfallkontakt, Bankdaten, Ausbildung

**Status:** ✅ Vollständig implementiert

#### 5. DocumentUpload

**Datei:** `components/documents/DocumentUpload.tsx`

**Validierung:**
- ✅ Zod-Schema: `documentSchema`
- ✅ React Hook Form Integration
- ✅ File-Upload-Validierung

**Status:** ✅ Vollständig implementiert

#### 6. FacilityCreateDialog

**Datei:** `components/admin/FacilityCreateDialog.tsx`

**Validierung:**
- ✅ Zod-Schema vorhanden
- ✅ React Hook Form Integration

**Status:** ✅ Vollständig implementiert

#### 7. AssignmentForm

**Datei:** `app/(employee)/employee/forms/assignment/[assignmentId]/page.tsx`

**Validierung:**
- ✅ Zod-Schema: `assignmentFormSchema`
- ✅ React Hook Form Integration

**Status:** ✅ Vollständig implementiert

---

## Service-Aufrufe Analyse

### Service-Funktionen

#### 1. Timesheet Service

**Datei:** `lib/services/timesheets.ts`

**Funktionen:**
- `getTimesheet(uid, date)` - ✅ Implementiert
- `upsertTimesheet(uid, date, data)` - ✅ Implementiert
- `getByUserId(uid)` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 2. User Service

**Datei:** `lib/services/users.ts`

**Funktionen:**
- `getById(uid)` - ✅ Implementiert
- `getAll()` - ✅ Implementiert
- `create(data)` - ✅ Implementiert
- `update(uid, data)` - ✅ Implementiert
- `delete(uid)` - ✅ Implementiert

**TODOs:**
- ⚠️ `excludeAssigned` Logic: `// TODO: Implement excludeAssigned logic` (Zeile 475)

**Status:** 🟡 Fast vollständig, 1 TODO vorhanden

#### 3. Shift Service

**Datei:** `lib/services/shifts.ts`

**Funktionen:**
- `getAll(filters)` - ✅ Implementiert
- `getById(id)` - ✅ Implementiert
- `create(data)` - ✅ Implementiert
- `update(id, data)` - ✅ Implementiert
- `delete(id)` - ✅ Implementiert
- `assignShift(shiftId, userId)` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 4. Assignment Service

**Datei:** `lib/services/assignments.ts`

**Funktionen:**
- `getAll(page, limit)` - ✅ Implementiert
- `getById(id)` - ✅ Implementiert
- `getByUserId(uid)` - ✅ Implementiert
- `create(data)` - ✅ Implementiert
- `update(id, data)` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 5. Document Service

**Datei:** `lib/services/documents.ts`

**Funktionen:**
- `getAll()` - ✅ Implementiert
- `getById(id)` - ✅ Implementiert
- `getByUserId(uid)` - ✅ Implementiert
- `upload(file, data)` - ✅ Implementiert
- `delete(id)` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 6. Facility Service

**Datei:** `lib/services/facilities.ts`

**Funktionen:**
- `getAll()` - ✅ Implementiert
- `getById(id)` - ✅ Implementiert
- `create(data)` - ✅ Implementiert
- `update(id, data)` - ✅ Implementiert
- `delete(id)` - ✅ Implementiert
- `addStation(facilityId, station)` - ✅ Implementiert
- `updateStation(facilityId, stationId, station)` - ✅ Implementiert
- `removeStation(facilityId, stationId)` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 7. Reports Service

**Datei:** `lib/services/reports.ts`

**Funktionen:**
- `generateTimeAccountReport(filters)` - ✅ Implementiert
- `generateSurchargeReport(filters)` - ✅ Implementiert
- `generateEmployeeStatistics(filters)` - ✅ Implementiert
- `exportReport(reportId, format)` - ✅ Implementiert

**TODOs:**
- ⚠️ `userName: ''` - `// TODO: Aus User-Service laden` (Zeile 486)
- ⚠️ Vacation Report: `// TODO: Implementiere echte Vacation Report Funktionalität` (Zeile 547)

**Status:** 🟡 Fast vollständig, 2 TODOs vorhanden

#### 8. Employee Reports Service

**Datei:** `lib/services/employeeReports.ts`

**Funktionen:**
- `getWeeklyData(userId, startDate, endDate)` - ⚠️ TODO: Echte Datenberechnung
- `getMonthlyOvertime(userId, year)` - ⚠️ TODO: Echte Datenberechnung
- `getWorktimeDetails(userId, startDate, endDate)` - ⚠️ TODO: Echte Datenberechnung
- `getBonusDetails(userId, startDate, endDate)` - ⚠️ TODO: Echte Datenberechnung
- `getVacationDetails(userId, year)` - ⚠️ TODO: Echte Datenberechnung

**TODOs:**
- ⚠️ `paid: 0` - `// TODO: Aus Payroll-Daten berechnen` (Zeile 215)
- ⚠️ `timeOff: 0` - `// TODO: Aus Time-Off-Daten berechnen` (Zeile 216)
- ⚠️ `emergencyDays: 0` - `// TODO: Aus Entry-Daten extrahieren` (Zeile 259)
- ⚠️ `special: 0` - `// TODO: Aus speziellen Zuschlägen berechnen` (Zeile 301)
- ⚠️ `score: 0` - `// TODO: Performance-Score berechnen` (Zeile 330)
- ⚠️ `trend: 'stable'` - `// TODO: Trend aus historischen Daten berechnen` (Zeile 331)
- ⚠️ `goals: []` - `// TODO: Aus User-Daten laden` (Zeile 332)

**Status:** 🔴 Unvollständig - Viele TODOs, echte Datenberechnung fehlt

#### 9. Payroll Service

**Datei:** `lib/services/payroll.ts`

**Funktionen:**
- `getAll()` - ✅ Implementiert
- `getById(id)` - ✅ Implementiert
- `create(data)` - ✅ Implementiert
- `calculatePayroll(periodId)` - ✅ Implementiert
- `approvePayroll(periodId, approvedBy)` - ✅ Implementiert
- `markAsPaid(periodId)` - ✅ Implementiert
- `lockPayroll(periodId)` - ✅ Implementiert
- `unlockPayroll(periodId)` - ⚠️ TODO: `// TODO: unlock function`

**TODOs:**
- ⚠️ Lohnsteuertabelle: `// TODO: Ersetzen durch echte BMF-Lohnsteuertabelle` (Zeile 1311)
- ⚠️ Kirchensteuer: `// TODO: Aus Employee-Daten laden` (Zeile 1325)
- ⚠️ Unlock-Funktion: Fehlt komplett

**Status:** 🟡 Fast vollständig, 3 TODOs vorhanden

#### 10. Admin Chat Service

**Datei:** `lib/services/adminChat.ts`

**Funktionen:**
- `getChannels()` - ✅ Implementiert
- `createChannel(data)` - ✅ Implementiert
- `getMessages(channelId)` - ✅ Implementiert
- `sendMessage(channelId, content)` - ✅ Implementiert

**TODOs:**
- ⚠️ `currentUserId` - `// TODO: Should come from auth context` (mehrfach)
- ⚠️ `unreadMessages: 0` - `// TODO: Implementiere echte Unread-Count Berechnung` (Zeile 739)

**Status:** 🟡 Fast vollständig, mehrere TODOs vorhanden

#### 11. Settings Service

**Datei:** `lib/services/settings.ts`

**Funktionen:**
- `getSettings()` - ✅ Implementiert
- `updateSettings(data)` - ✅ Implementiert

**TODOs:**
- ⚠️ Import: `// TODO: Import user roles, document types, and email templates` (Zeile 342)

**Status:** 🟡 Fast vollständig, 1 TODO vorhanden

#### 12. Notifications Service

**Datei:** `lib/services/notifications.ts`

**Funktionen:**
- `getNotifications(userId)` - ✅ Implementiert
- `markAsRead(notificationId)` - ✅ Implementiert

**TODOs:**
- ⚠️ `currentUserId` - `// TODO: Get current user ID from auth context` (Zeile 57)

**Status:** 🟡 Fast vollständig, 1 TODO vorhanden

---

## API-Routen Analyse

### API-Endpunkte

#### 1. Auth API

**Routen:**
- `POST /api/auth/register-admin` - ✅ Implementiert
- `POST /api/auth/accept-invite` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 2. Health API

**Routen:**
- `GET /api/health` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 3. Debug API

**Routen:**
- `GET /api/debug/admin-status` - ✅ Implementiert
- `GET /api/debug/whoami` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 4. Forms API

**Routen:**
- `POST /api/forms/reminders` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

#### 5. Invitations API

**Routen:**
- `GET /api/invitations` - ✅ Implementiert
- `GET /api/invitations/[token]` - ✅ Implementiert

**Status:** ✅ Vollständig implementiert

---

## Dialoge und Modals

### Dialog-Komponenten

#### 1. ConfirmDialog

**Datei:** `components/common/ConfirmDialog.tsx`

**Funktionen:**
- ✅ Bestätigungs-Dialog
- ✅ Loading-State
- ✅ Custom Text

**Status:** ✅ Vollständig implementiert

#### 2. ConfirmDestructiveDialog

**Datei:** `components/ui/ConfirmDestructiveDialog.tsx`

**Funktionen:**
- ✅ Destruktive Aktionen bestätigen
- ✅ Warnung-Styling

**Status:** ✅ Vollständig implementiert

#### 3. ShiftCreateDialog

**Datei:** `components/admin/ShiftCreateDialog.tsx`

**Funktionen:**
- ✅ Schicht erstellen
- ✅ Form-Validierung
- ✅ Error-Handling

**Status:** ✅ Vollständig implementiert

#### 4. ShiftEditDialog

**Datei:** `components/admin/ShiftEditDialog.tsx`

**Funktionen:**
- ✅ Schicht bearbeiten
- ✅ Form-Validierung
- ✅ Error-Handling

**Status:** ✅ Vollständig implementiert

#### 5. StaffCreateDialog

**Datei:** `components/admin/StaffCreateDialog.tsx`

**Funktionen:**
- ✅ Mitarbeiter erstellen
- ✅ Umfangreiches Formular
- ✅ Form-Validierung

**Status:** ✅ Vollständig implementiert

#### 6. StaffEditDialog

**Datei:** `components/admin/StaffEditDialog.tsx`

**Funktionen:**
- ✅ Mitarbeiter bearbeiten
- ✅ Form-Validierung
- ✅ Error-Handling

**Status:** ✅ Vollständig implementiert

#### 7. FacilityCreateDialog

**Datei:** `components/admin/FacilityCreateDialog.tsx`

**Funktionen:**
- ✅ Einrichtung erstellen
- ✅ Form-Validierung

**Status:** ✅ Vollständig implementiert

#### 8. FacilityEditDialog

**Datei:** `components/admin/FacilityEditDialog.tsx`

**Funktionen:**
- ✅ Einrichtung bearbeiten
- ✅ Form-Validierung

**Status:** ✅ Vollständig implementiert

#### 9. PauseDialog

**Datei:** `components/time/PauseDialog.tsx`

**Funktionen:**
- ✅ Pause hinzufügen
- ✅ Form-Validierung

**Status:** ✅ Vollständig implementiert

#### 10. SignatureDialog

**Datei:** `components/ui/SignatureDialog.tsx`

**Funktionen:**
- ✅ Signatur erfassen
- ✅ Canvas-basiert

**Status:** ✅ Vollständig implementiert

---

## Identifizierte Probleme

### Kritisch

1. **Employee Reports Service - Datenberechnungen fehlen**
   - **Problem:** Alle Datenberechnungen sind TODOs
   - **Betroffen:** `/employee/berichte`
   - **Impact:** Reports zeigen keine echten Daten
   - **Priorität:** 🔴 Hoch

2. **Payroll Unlock-Funktion fehlt**
   - **Problem:** `unlockPayroll()` Funktion fehlt komplett
   - **Betroffen:** `/admin/lohnabrechnung`, `/admin/mitarbeiter/[uid]/gehalt`
   - **Impact:** Lohnabrechnungen können nicht entsperrt werden
   - **Priorität:** 🔴 Hoch

### Wichtig

3. **User Service - excludeAssigned Logic fehlt**
   - **Problem:** `excludeAssigned` Parameter wird nicht verarbeitet
   - **Betroffen:** Mitarbeiter-Listen
   - **Impact:** Möglicherweise werden zugewiesene Mitarbeiter nicht korrekt gefiltert
   - **Priorität:** 🟡 Mittel

4. **Reports Service - User-Name fehlt**
   - **Problem:** `userName` wird nicht aus User-Service geladen
   - **Betroffen:** Reports
   - **Impact:** Reports zeigen leere Namen
   - **Priorität:** 🟡 Mittel

5. **Reports Service - Vacation Report fehlt**
   - **Problem:** Vacation Report Funktionalität fehlt
   - **Betroffen:** Reports
   - **Impact:** Urlaubsberichte nicht verfügbar
   - **Priorität:** 🟡 Mittel

6. **Admin Chat Service - Auth Context fehlt**
   - **Problem:** `currentUserId` wird nicht aus Auth Context geladen
   - **Betroffen:** Chat-Funktionen
   - **Impact:** Möglicherweise falsche User-IDs
   - **Priorität:** 🟡 Mittel

7. **Admin Chat Service - Unread Count fehlt**
   - **Problem:** Unread-Count wird nicht berechnet
   - **Betroffen:** Chat-Übersicht
   - **Impact:** Keine unread-Badges
   - **Priorität:** 🟡 Mittel

8. **Payroll Service - Lohnsteuertabelle**
   - **Problem:** Echte BMF-Lohnsteuertabelle fehlt
   - **Betroffen:** Lohnabrechnung
   - **Impact:** Möglicherweise falsche Steuerberechnung
   - **Priorität:** 🟡 Mittel

9. **Payroll Service - Kirchensteuer**
   - **Problem:** Kirchensteuer wird nicht aus Employee-Daten geladen
   - **Betroffen:** Lohnabrechnung
   - **Impact:** Kirchensteuer wird nicht berechnet
   - **Priorität:** 🟡 Mittel

10. **Settings Service - Import fehlt**
    - **Problem:** User roles, document types, email templates werden nicht importiert
    - **Betroffen:** Einstellungen
    - **Impact:** Möglicherweise fehlende Daten
    - **Priorität:** 🟡 Mittel

11. **Notifications Service - Auth Context fehlt**
    - **Problem:** `currentUserId` wird nicht aus Auth Context geladen
    - **Betroffen:** Benachrichtigungen
    - **Impact:** Möglicherweise falsche User-IDs
    - **Priorität:** 🟡 Mittel

### Optional

12. **Employee Reports Service - Performance Score**
    - **Problem:** Performance-Score wird nicht berechnet
    - **Betroffen:** Employee Reports
    - **Impact:** Performance-Metriken fehlen
    - **Priorität:** 🟢 Niedrig

---

## Funktionsverbesserungsvorschläge

### Priorität 1: Kritisch

1. **Employee Reports Datenberechnungen implementieren**
   - Alle TODO-Funktionen in `employeeReports.ts` implementieren
   - Echte Daten aus Timesheets, Payroll, etc. berechnen
   - Geschätzte Zeit: 2-3 Wochen

2. **Payroll Unlock-Funktion implementieren**
   - `unlockPayroll()` Funktion in `payroll.ts` implementieren
   - Security-Checks hinzufügen (nur Admin)
   - Audit-Logging hinzufügen
   - Geschätzte Zeit: 1-2 Tage

### Priorität 2: Wichtig

3. **Auth Context Integration**
   - `currentUserId` aus Auth Context in allen Services laden
   - Betroffen: `adminChat.ts`, `notifications.ts`
   - Geschätzte Zeit: 1 Tag

4. **User Service excludeAssigned Logic**
   - `excludeAssigned` Parameter implementieren
   - Geschätzte Zeit: 1 Tag

5. **Reports Service Verbesserungen**
   - User-Name aus User-Service laden
   - Vacation Report implementieren
   - Geschätzte Zeit: 2-3 Tage

6. **Payroll Service Verbesserungen**
   - Echte BMF-Lohnsteuertabelle integrieren
   - Kirchensteuer aus Employee-Daten laden
   - Geschätzte Zeit: 3-5 Tage

