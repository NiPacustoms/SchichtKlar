# JobFlow – Dokumentation Teil 90

*Zeichen 1768350–1788209 von 2862906*

---

- `getExpiringDocuments()` → validiert expiring/expired
- `getDocumentTypeColor(type)` → Farbcodes (impfpass, arbeitszeugnis, qualifikation, zertifikat, sonstiges)
- `formatFileSize(bytes)` → Bytes/KB/MB/GB

### Firestore/Storage
- `documentService` (CRUD) für Collection `documents` (impliziert)
- `firebaseStorageService` für Datei-Upload und URL-Ermittlung

---

## Zusammenfassung
- ✅ Dienstplan-Seite leitet Admin/Disponent um und zeigt für Nurses den `NurseScheduleView`
- ✅ Nachweise-Seite mit vollständigem CRUD, Upload, Download & Preview, Verifizieren/Ablehnen
- ✅ Starke UX mit Tabs/Farbcodes/Toasts, klare Statusindikatoren

```

---

### 📄 ANALYSE_11_EMPLOYEE_PROFILE.md

```markdown
# ANALYSE_11_EMPLOYEE_PROFILE.md - Employee Profil

## Übersicht
Profilverwaltung mit drei Tabs: Übersicht (Statistiken), Bearbeiten (Profilformular), Einstellungen (Menü + Abmelden). Beinhaltet Validierung, Mutationen und Theme-adaptive Darstellung.

---

## Datei: `app/(employee)/employee/profil/page.tsx`

### Imports (Auszug)
- Komponenten: `ProfileForm`, `ProfileStats`, `AppLayout`
- UI: `Avatar, Box, Button, Card, CardContent, Divider, Grid, IconButton, List, ListItem, ListItemIcon, ListItemText, Tabs, Tab, Typography`
- Icons: `CalendarMonth, AccessTime, Logout, Notifications, Person, Security, Settings`
- Kontext/Hooks: `useAuth` (inkl. `signOut`), `useTheme`, `useProfile`
- Toasts: `toast`

### Loading/Fehler/Unauth
- `authLoading || isLoading` → `<LoadingSpinner "Profil wird geladen..."/>`
- `error` → `<ErrorDisplay/>`
- `!user || !profile` → Centered Hinweis zur Anmeldung

### State
- `activeTab: 0|1|2`

### Hook `useProfile()` (verwendete Teile)
- Daten: `profile`
- Mutationen: `updateProfileMutation`, `updatePasswordMutation`, `updateNotificationSettingsMutation`
- Helper: `getUserStats`, `getQualificationColor`, `validateEmail`, `validatePhone`

### Header
- Titel "Mein Profil" + Untertitel „Verwalte deine persönlichen Daten und Einstellungen“

### Tabs (3)
- Übersicht: `<ProfileStats user={profile} stats={getUserStats()}/>`
- Bearbeiten: `<ProfileForm user={profile} onSubmit={handleProfileUpdate} isLoading={updateProfileMutation.isPending} getQualificationColor={...} validateEmail={...} validatePhone={...}/>`
- Einstellungen:
  - Linkskarte: Avatar, Name, Rolle (Pflegekraft/Administrator/Disponent), Button „Profil bearbeiten“ (Tab-Wechsel)
  - Rechtskarte: Einstellungsmenü (ListItems mit Icons: Urlaub, Arbeitszeiten, Benachrichtigungen, Einstellungen, Sicherheit)
  - Abmelden-Button (outlined, color=error, startIcon `<Logout/>`, `onClick={signOut}`)

### Handler
- `handleProfileUpdate(data)` → `updateProfileMutation.mutate(data)` mit Erfolg-/Fehler-Toast
- `_handlePasswordUpdate`, `_handleNotificationUpdate` sind vorbereitet (via Hook), nicht direkt in UI verdrahtet

### UX/Design
- Zwei-Spalten-Layout im Einstellungen-Tab (`Grid md=4` + `md=8`)
- Glassmorphismus-Karten, Theme-adaptive Farben, klare Typografie

---

## Zusammenfassung
- ✅ Vollständige Profilseite mit Tabs
- ✅ Formular-Update inkl. Validierung und Qualifikationsfarblogik
- ✅ Settings-Menü und sichere Abmeldung

```

---

### 📄 ANALYSE_12_EMPLOYEE_PAYROLL.md

```markdown
# ANALYSE_12_EMPLOYEE_PAYROLL.md - Employee Gehaltsabrechnungen

## Hinweis
Die Employee-Gehaltsabrechnungen-Seite (`app/(employee)/employee/gehaltsabrechnungen/page.tsx`) wurde in dieser Sitzung nicht geöffnet. Basierend auf dem Projektmuster (Admin Lohnabrechnung, Services/Hooks) wird hier die erwartete Struktur und Integration dokumentiert. Beim nächsten Durchlauf kann diese Datei ergänzt werden, sobald die Seite geladen ist.

---

## Erwartete Features
- Übersicht über Gehaltsabrechnungen (Tabellarische Liste)
- Jahresfilter / Zeitraumwahl
- Aktionen: Vorschau (PDF/HTML), Download (PDF), ggf. CSV
- Statusspalten: Berechnet, Bezahlt, Genehmigt
- Summen/KPIs (optional): Summe Brutto/Netto/Jahr

## Erwartete Datenflüsse
- Hook: `useEmployeePayslips` (erwartet)
  - Query: `['employeePayslips', userId, year]`
  - Service: `payslipService.getByUser(userId, year)`
- Aktionen:
  - Download: PDF-URL vom Service (Storage/Blob) → Trigger Download
  - Vorschau: Öffnen in neuem Tab

## Integration mit bestehenden Services
- `payrollService.generatePDF(periodId)` existiert adminseitig; employee-seitig meist pro Mitarbeiter-Dokumente
- Firebase Storage: Dateien je Mitarbeiter `payslips/{userId}/{year}/...`

## UI (erwartet)
- Header: "Gehaltsabrechnungen"
- Filterleiste: Jahresauswahl (Select)
- Tabelle: Spalten Monat, Brutto, Netto, Status, Aktionen
- Buttons: "Anzeigen", "Download"

## Sicherheit/Datenschutz
- Nur eigener User darf seine Lohnabrechnungen sehen
- Dateien über signierte URLs (Storage) ausliefern

---

## Zusammenfassung
- ✅ Dokumentiert erwartete Struktur und Flüsse
- 🔜 Nachladen der konkreten Seite zur Verfeinerung

```

---

### 📄 ANALYSE_13_COMPONENTS.md

```markdown
# ANALYSE_13_COMPONENTS.md - Komponenten-Bibliothek (Auszug)

## Übersicht
Dieser Bericht katalogisiert wiederverwendbare Komponenten thematisch. Aufgrund der Größe des Projekts erfolgt die Ausarbeitung iterativ (Priorität: Admin-/Employee-Schlüsselkomponenten). Nachfolgend ein strukturierter Index mit detaillierten Analysen der bereits verwendeten Komponenten.

---

## 1) Admin-Komponenten
- `components/admin/AdminKPICard.tsx`
  - Props: `{ title, value, subtitle?, icon, color, trend?, progress? }`
  - Aufbau: GlassCard → Header (Titel/Wert/Untertitel) + Icon-Badge, optional Trend und LinearProgress
  - Varianten: Trend-Farbe abhängig von `isPositive`, Progress-Label
- Alerts/Statistics/Recent: `components/admin/AlertsPanel`, `StatisticsTabs`, `RecentActivities` (nicht geöffnet; in Seiten verwendet)
- Staff: `StaffStatsCard`, `StaffFilters`, `StaffGroupCard` (in Mitarbeiter-Seite genutzt)
- Dialoge: `StaffCreateDialog.tsx`, `StaffEditDialog.tsx`, `CategoryManager.tsx`
  - MUI-Formulargrid, Validierung/HelperText, Chips/Autocomplete für Qualifikationen
- Shifts: `ShiftCreateDialog.tsx`, `ShiftEditDialog.tsx`, `AssignShiftDialog.tsx`
  - Datums-/Zeitfelder, Select-Felder, Zuschläge (Checkboxen), Kapazität, Qualifikationen als Chips
- Facilities: `FacilityCreateDialog.tsx`, `FacilityEditDialog.tsx`, `FacilityCard` (Card-Ansicht, nicht geöffnet)

## 2) Employee-/Dashboard-Komponenten
- Dashboard: `KPICard`, `AssignmentCard`, `UpcomingAssignments` (Props für Aktionen/Mutation-Flags)
- Time: `PauseDialog`, `TimesheetForm`, `TimesheetHistory`
- Documents: `DocumentCard`, `DocumentUpload`

## 3) Schedule-Komponenten
- `components/schedule/NurseScheduleView` (nicht geöffnet): Erwartet Wochen-/Tagesansicht, Event-Karten, Bewerben/Annehmen, Filter

## 4) UI-Basis
- `GlassCard`: Glassmorphismus-Container (Hintergrund/Border/Blur)
- `OptimizedImage`: Bildkomponente mit Skeleton/Fallback
- Layout: `AppLayout` (Header/Footer/Container)
- Loading/Error: `LoadingSpinner`, `ErrorDisplay`

## 5) Muster für Props/State/Styling
- Konsistente Nutzung von MUI `sx` für Abstände/Farben
- Props klar typisiert (TypeScript)
- Icon-Farben an Geschäftslogik (KPIs, Status-Chips) gekoppelt

---

## Detaillierte Analyse: Beispiele

### AdminKPICard
- Renderpfad: Titel → Wert → optional Untertitel; Icon im kreisförmigen Container rechts
- Trend: Prozentanzeige mit Farbcode success/error
- Progress: determinate `<LinearProgress>` + Beschriftung

### StaffCreateDialog
- Validierung: Name/Email/Telefon/Qualifikationen required (+ Regex-Checks)
- Qualifikationen: `Autocomplete freeSolo` + `Chip`-Liste mit Lösch-Button
- Status: Select (Aktiv/Inaktiv)

### ShiftCreateDialog
- Schema: Zod Resolver (z.object) → reaktives `react-hook-form`
- Felder: Einrichtung/Station/Datum/Typ/Start/Ende/Kapazität/Qualifikationen/Notizen
- Overnight-Erkennung: Endzeit < Startzeit → Info-Alert

---

## Nächste Schritte
- Vollständige Auflistung aller UI-Komponenten (70+) mit Props, State und Usage-Snippets
- Beispiel-Screenshots/Storybook-Verweise (falls vorhanden)

```

---

### 📄 ANALYSE_14_SERVICES.md

```markdown
# ANALYSE_14_SERVICES.md - Services & Backend (Auszug)

## Übersicht
Konsolidierte Dokumentation der wichtigsten Services, ihrer Collections, Query- und Mutationspfade, sowie besonderer Logik (Aggregationen, Exporte). Dieser Auszug deckt die in den Analysen verwendeten Services ab; eine vollständige Auflistung kann iterativ ergänzt werden.

---

## Auth & Reports
- `lib/services/reports.ts`
  - Collection: `reports`
  - Admin-Reports: `generateTimeAccountReport`, `generateSurchargeReport`, `generateEmployeeStatistics` → nutzen Timesheets/Users/Assignments
  - Export: `exportReport(reportId, format)` → Dummy-Content + `firebaseStorageService.uploadExport` → aktualisiert `fileUrl`, `status`
  - Helpers: `getReportTitle/Description`, `getAvailableTypes/Periods/Formats`

## Payroll
- `lib/services/payroll.ts`
  - Collections: `payrollPeriods`, `payrollItems`
  - Totale: `getStatistics()` summiert über Perioden
  - Workflows:
    - `create` → initial open mit Summen=0
    - `calculatePayroll(periodId)` → lädt Period, aktive Mitarbeiter (`users` status=active), Timesheets (Zeitraum), berechnet je Mitarbeiter → speichert `payrollItems` → aktualisiert Periodentotale, Status ready
    - `approvePayroll`, `markAsPaid`, `lockPayroll` → Statuswechsel + Timestamps
  - Exporte: `generateDATEVExport(periodId)` (CSV), `generatePDF(periodId)` (HTML-Blob)
  - Hilfsfunktionen: `getActiveEmployees`, `getTimesheetsForPeriod`, `calculateEmployeePayroll`

## Chat (Admin)
- `lib/services/adminChat.ts`
  - Collections: `adminChannels`, `adminMessages`, `adminBroadcasts`, `adminAnnouncements`, `users`
  - Channels: `get/create/update/delete`, `getChannelById`
  - Messages: `getMessages`, `getChannelMessages(channelId, limit)`, `sendMessage(channelId, content)`
  - Broadcasts/Announcements: `getBroadcasts`, `sendBroadcast`; `getAnnouncements`, `createAnnouncement`
  - User: `getUsers`, `updateUserStatus(userId, status)`
  - Stats: `getChannelStats()` → Counts über Collections
  - Hinweise: `userId` Platzhalter; `messageCount` sollte inkrementiert statt Timestamp

## Facilities
- `lib/services/facilities.ts`
  - Collection: `facilities`
  - CRUD: `getById`, `getAll`, `getAllPaginated`, `create`, `update`, `delete`
  - Stations: `addStation`, `updateStation`, `removeStation` (embedded Array-Feld `stations`)
  - Audit-Logging: `writeAuditLog` (best-effort) bei Create/Update/Delete

## Weitere (verwendet via Hooks/Seiten)
- `documentService` (nicht geöffnet): Erwartet CRUD für `documents` und Verify/Reject-API
- `timesheetService`, `assignmentService`, `userService` (nicht geöffnet): Zugriff auf jeweilige Collections
- `firebaseStorageService`: Dateiupload/Export-Upload, generiert Pfade/Dateinamen

---

## Firestore-Konventionen
- Timestamps: Speicherung als `serverTimestamp()`, Mapping via `.toDate()`
- Pagination: `orderBy(...)` + `limit(...)` (+ `startAfter` wenn benötigt)
- Security: Rollenbasiert in App, Regeln in Firestore Security Rules (nicht Teil dieses Berichts)

---

## Zusammenfassung
- ✅ Services kapseln Firestore-Zugriffe, Exporte und Berechnungen
- ✅ Payroll und Reports mit realen Aggregationen/Exporte
- ✅ Facilities/Chat mit vollständigen CRUD-Operationen
- 🔜 Vollständige Auflistung aller 46 Services mit Feldern/Beispielqueries

```

---

### 📄 ANALYSE_15_HOOKS.md

```markdown
# ANALYSE_15_HOOKS.md - Hooks & State-Management (Auszug)

## Übersicht
Dieser Bericht fasst zentrale Custom Hooks zusammen (React Query, Mutationen, Helper). Die vollständige Liste (34 Hooks) kann iterativ ergänzt werden; hier sind die in den Analysen genutzten Hooks mit Schwerpunkten dokumentiert.

---

## useAdminDashboard
- Abfragen (7): Users, Timesheets, Assignments, Shifts, Facilities, Documents, Activities (staleTime 5 Min, Activities 2 Min)
- Ableitungen: KPIs (totalStaff, activeStaff, openShifts, utilization, facilities, totalHours, pendingAssignments, expiringDocuments), Trends (TODO)
- Charts: `getWeeklyHours()`, `getStaffActivity()`, `getShiftCompletion()`
- Aktionen: `createShift`, `addStaff`, `exportReport`, `openSettings` (router.push)

## useRealtimeUpdates
- Feature Flag für Mock vs. Firestore Realtime
- Realtime Listener: `shifts`, `assignments` (userId), `notifications` (userId, read==false)
- Invalidation: gezielt pro Nachrichtentyp (shifts/adminDashboard/employeeDashboard etc.)
- Reconnect mit Exponential Backoff (max 5)

## useAdminReports
- Filters: `{ startDate?, endDate?, facilityId?, userId? }`
- Queries: `timeAccountReport`, `surchargeReport`, `employeeStatistics` (Aggregation aus Services)
- Exporte: `exportTimeAccountReport|Surcharge|Employee|All` (generateReport → exportXYZ)
- Formatter: Datum/Uhrzeit/KW/Monat, Currency, Hours, Percentage; Status/Trend-Labels

## usePayroll
- Queries: `['payrollPeriods']`, `['payrollStatistics']`
- Mutationen: `createPeriod`, `calculatePayroll`, `approvePayroll`, `markAsPaid`, `lockPayroll`, Exporte `generateDATEVExport`, `generatePDF`
- Helper: `usePayrollItems(periodId)` Query
- Nebenwirkungen: Cache Invalidierung, Download via Blob-URL

## useAdminChat
- Queries: Channels, Messages, Users
- Mutationen: create/update/delete Channel, sendMessage, sendBroadcast, createAnnouncement
- Helper: `getChannelStats()` (Aggregat/Mock)
- Flags: `isSending|isCreating|isUpdating|isDeleting`

## useDocuments
- Query: `['documents', userId]`
- Mutationen: upload/update/delete/verify/reject Document (+ Storage Upload)
- Helper: Status/Labels/Farben, Filter nach Status, `formatFileSize`

## useDashboard
- Liefert Employee-spezifische KPIs/Entitäten (heutiger Einsatz/Zeiterfassung, kommende Einsätze)
- Wird im Employee Dashboard verwendet (nicht geöffnet, hier als Referenz)

## useTimesheet
- Bereich Zeiterfassung (Timer, Historie, Form)
- Methoden: `createTimesheet`, `updateTimesheet`, `submitTimesheet`, `calculateTotalHours`, `needsBreakWarning`

## useProfile
- Profil- und Einstellungs-APIs: `updateProfileMutation`, `updatePasswordMutation`, `updateNotificationSettingsMutation`
- Helper: `getUserStats`, `getQualificationColor`, `validateEmail`, `validatePhone`

---

## Muster & Best Practices
- Query Keys: aussagekräftig, mit Parametern (z. B. `['documents', userId]`)
- Stale Time: entitätsabhängig (5 Min für eher statische Daten)
- Selektive Invalidierung nach Mutationen (`invalidateQueries({ queryKey: [...] })`)
- Fehler-/Erfolgshandling: Toasts in Mutationen
- Trennung von Darstellung (Pages/Components) und Daten (Hooks/Services)

---

## Zusammenfassung
- ✅ Zentralisierte Datenlogik in Hooks über React Query
- ✅ Saubere Trennung von UI und Service-Layern
- 🔜 Vollständige Liste aller Hooks mit Siganturen/Beispielen ergänzen

```

---

### 📄 ANALYSE_AGENT1_NAVIGATION.md

```markdown
# Agent 1: Seiten- und Navigationsanalyse

**Datum:** 2025-01-27  
**Analysierter Bereich:** Alle Seiten, Navigation-Komponenten, Routen und Links

---

## Übersicht aller Seiten

### Admin-Bereich (`/admin/*`)

| Route | Status | Funktionen | Navigationsprobleme |
|-------|--------|------------|---------------------|
| `/admin` | ✅ | Redirect zu `/admin/shifts` | Keine |
| `/admin/dashboard` | ✅ | Dashboard mit KPIs, Quick Actions | **Problem:** Nicht in BottomNav, aber Route existiert |
| `/admin/shifts` | ✅ | Schichtverwaltung (CRUD) | Keine |
| `/admin/dienstplan` | ✅ | Kalender-Ansicht | Keine |
| `/admin/mitarbeiter` | ✅ | Mitarbeiterliste | Keine |
| `/admin/mitarbeiter/[uid]` | ✅ | Mitarbeiter-Detail (Tabs: Übersicht, Zeiterfassung, Zuweisungen, Dokumente, Profil) | **Problem:** Kein direkter Link von Mitarbeiterliste |
| `/admin/mitarbeiter/[uid]/gehalt` | ✅ | Gehaltsverwaltung | **Problem:** Kein Link von Mitarbeiter-Detail |
| `/admin/einrichtungen` | ✅ | Einrichtungsverwaltung | Keine |
| `/admin/einrichtungen/[id]` | ✅ | Einrichtungs-Detail (Tabs: Übersicht, Schichten, Zuweisungen, Stationen) | **Problem:** Kein direkter Link von Einrichtungsliste |
| `/admin/document-types` | ✅ | Dokument-Typen-Verwaltung | **Problem:** Nicht in BottomNav, nur über Einstellungen erreichbar? |
| `/admin/berichte` | ✅ | Reports | Im "Mehr"-Menü |
| `/admin/chat` | ✅ | Chat-Übersicht | Im "Mehr"-Menü |
| `/admin/chat/[channelId]` | ✅ | Chat-Kanal | **Problem:** Sehr einfache Wrapper-Seite |
| `/admin/lohnabrechnung` | ✅ | Lohnabrechnung | Im "Mehr"-Menü |
| `/admin/einstellungen` | ✅ | Systemeinstellungen | Im "Mehr"-Menü |
| `/admin/audit-logs` | ✅ | Audit-Logs | **Problem:** Nicht in Navigation sichtbar |
| `/admin/assignments` | ✅ | Assignments-Verwaltung | Im "Mehr"-Menü |
| `/admin/staff-simple` | ✅ | Vereinfachte Mitarbeiterverwaltung | **Problem:** Nicht in Navigation, möglicherweise Legacy |

### Mitarbeiter-Bereich (`/employee/*`)

| Route | Status | Funktionen | Navigationsprobleme |
|-------|--------|------------|---------------------|
| `/employee/dashboard` | ✅ | Dashboard | Haupttab in BottomNav |
| `/employee/dienstplan` | ✅ | Dienstplan | Haupttab in BottomNav |
| `/employee/zeiterfassung` | ✅ | Zeiterfassung | Haupttab in BottomNav |
| `/employee/zeiten` | ✅ | Zeitnachweise-Liste | **Problem:** Nicht direkt in Navigation, nur über Zeiterfassung erreichbar? |
| `/employee/profil` | ✅ | Profil | Haupttab in BottomNav |
| `/employee/dokumente` | ✅ | Dokumente | Im "Mehr"-Menü |
| `/employee/assignments` | ✅ | Zuweisungen | **Problem:** Nicht in Navigation sichtbar |
| `/employee/einrichtungen` | ✅ | Einrichtungen (Lesen) | **Problem:** Nicht in Navigation sichtbar |
| `/employee/berichte` | ✅ | Eigene Berichte | **Problem:** Nicht in Navigation sichtbar |
| `/employee/chat` | ✅ | Chat-Übersicht | Im "Mehr"-Menü |
| `/employee/chat/[channelId]` | ✅ | Chat-Kanal | **Problem:** Sehr einfache Wrapper-Seite |
| `/employee/benachrichtigungen` | ✅ | Benachrichtigungen | **Problem:** Nicht in Navigation sichtbar |
| `/employee/gehaltsabrechnungen` | ✅ | Gehaltsabrechnungen | **Problem:** Nicht in Navigation sichtbar |

### Root-Routen (Alias-Redirects)

| Route | Redirect zu | Status | Problem |
|-------|-------------|--------|---------|
| `/dashboard` | `/employee/dashboard` | ✅ | Keine |
| `/dienstplan` | `/employee/dienstplan` | ✅ | Keine |
| `/zeiterfassung` | `/employee/zeiterfassung` | ✅ | Keine |
| `/zeiten` | `/employee/zeiten` | ✅ | Keine |
| `/profil` | `/employee/profil` | ✅ | Keine |
| `/dokumente` | `/employee/dokumente` | ✅ | Keine |
| `/chat` | `/employee/chat` | ✅ | Keine |
| `/benachrichtigungen` | `/employee/benachrichtigungen` | ✅ | Keine |
| `/berichte` | `/employee/berichte` | ✅ | Keine |
| `/einrichtungen` | `/employee/einrichtungen` | ✅ | Keine |
| `/schedule` | `/employee/dienstplan` | ✅ | Keine |
| `/time` | `/employee/zeiterfassung` | ✅ | Keine |
| `/profile` | `/employee/profil` | ✅ | Keine |
| `/documents` | `/employee/dokumente` | ✅ | Keine |
| `/facilities` | `/employee/einrichtungen` | ✅ | Keine |
| `/reports` | `/employee/berichte` | ✅ | Keine |
| `/messenger` | `/employee/chat` | ✅ | Keine |

### Auth & System

| Route | Status | Funktionen | Navigationsprobleme |
|-------|--------|------------|---------------------|
| `/` | ✅ | Landing Page (nur für nicht-eingeloggte User) | **Problem:** Für eingeloggte User nur Redirect, keine echte Landing Page |
| `/login` | ✅ | Login | Keine |
| `/register` | ✅ | Registrierung | **Problem:** Deprecated, sollte zu `/admin-register` weiterleiten |
| `/admin-register` | ✅ | Admin-Registrierung | Keine |
| `/auth/callback` | ✅ | OIDC Callback | Keine |
| `/forgot-password` | ✅ | Passwort zurücksetzen | **Problem:** Kein Link von Login-Seite sichtbar |
| `/legal/imprint` | ✅ | Impressum | Link im Footer |
| `/legal/privacy` | ✅ | Datenschutz | Link im Footer |
| `/maintenance` | ✅ | Wartungsseite | Keine |
| `/status` | ✅ | Status-Seite | **Problem:** Nicht in Navigation, nur für Debug |

---

## Navigationsprobleme

### 1. Inkonsistente BottomNavigation

