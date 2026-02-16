# JobFlow – Dokumentation Teil 89

*Zeichen 1748469–1768349 von 2862906*

---

- Mapping-Funktionen: `getStatusColor`, `getStatusText`, `formatCurrency`
- Handlers: Menu open/close, Aktion wählen, Aktion bestätigen (switch → Hook-Methoden)
- Loading/Fehler: `LoadingSpinner`, `ErrorDisplay`

### Hook-Analyse `usePayroll`
- Queries:
  - `['payrollPeriods']` → `payrollService.getAll()`
  - `['payrollStatistics']` → `payrollService.getStatistics()`
- Mutations (+Toast + Cache-Invalidation):
  - `createPeriod` (unused in Page), `calculatePayroll`, `approvePayroll`, `markAsPaid`, `lockPayroll`
  - Exporte: `generateDATEVExport` (CSV-Blob-URL Download), `generatePDF` (HTML-Blob-URL Download)
- Helper: `usePayrollItems(periodId)`
- Rückgabe von Loading-Flags: `isCreating|isCalculating|isApproving|isMarkingAsPaid|isLocking|isGeneratingDATEV|isGeneratingPDF`

### Service-Analyse `payrollService`
- Collections: `payrollPeriods`, `payrollItems`
- Perioden:
  - `getAll()` sortiert (year desc, month desc); mapped Timestamps → Date
  - `getById(id)`
  - `create({year,month,startDate,endDate})` → initiale Summen=0, status=open
  - `getStatistics()` aggregiert über Perioden Summen/Anzahl
- Berechnungen:
  - `calculatePayroll(periodId)`
    - Status → calculating
    - `getById` + `getActiveEmployees` + `getTimesheetsForPeriod`
    - Iterate Mitarbeiter → `calculateEmployeePayroll` → Summen akkumulieren
    - Status → ready, schreibt Totals und Timestamps
    - Fehlerfall: Status zurück auf open
  - `approvePayroll(periodId, approvedBy)` → Status approved, Zeitstempel
  - `markAsPaid(periodId)` → Status paid, Zeitstempel
  - `lockPayroll(periodId)` → Status locked
- Items:
  - `getPayrollItems(periodId)` → Query + Mapping aller Beträge/Anteile
- Exporte:
  - `generateDATEVExport(periodId)` → CSV-Header + Zeilen (Lohnkosten Konto 7000, Gegenkonto 1200); Blob-URL
  - `generatePDF(periodId)` → HTML-Report mit Tabelle und Summary; Blob-URL
- Hilfsdaten:
  - `getActiveEmployees()` liest `users` (status=='active'), mappt Sätze inkl. Sätze/Grundlohn
  - `getTimesheetsForPeriod(periodId,start,end)` aggregiert Timesheets pro User (sum fields)
  - `calculateEmployeePayroll(employee,timesheet,periodId)` berechnet Beträge und legt Item in DB an, gibt `PayrollItem` zurück

### Error-/Loading-States
- Seite: LoadingSpinner, ErrorDisplay; Dialog-Confirm disabled bei laufenden Mutationen
- Hook: Toasts pro Mutation, Query-Errors an Page durchgereicht
- Service: try/catch, Status-Rollback bei Fehlern

### Accessibility
- Klar beschriftete Buttons, `Chip`-Labels für Status
- Tabellenstruktur mit Kopfzeile
- Dialoge mit erklärenden Alerts zu jeder Aktion

### Performance
- React Query Cache + gezielte Invalidierung nach Mutationen
- Serverseitige Aggregation in Services (minimale UI-Logik)
- Blob-URLs für sofortige Downloads (kein Netzwerk-Roundtrip)

---

## Zusammenfassung
- ✅ Admin Berichte vollständig mit drei Report-Typen + Exporten (PDF/Excel/CSV)
- ✅ Recharts-Visualisierungen (Line/Bar/Pie) responsiv
- ✅ Umfassende Filter (Zeitraum, Einrichtung, Typ) und Tabs (Übersicht/Charts/Details)
- ✅ Lohnabrechnung: Perioden-Übersicht, KPI-Karten, Aktionen (Berechnen, Genehmigen, Export, PDF)
- ✅ Vollständige Service-Schicht für Reports und Payroll inkl. Firebase-Anbindung
- ✅ Saubere Loading/Error/Toast-UX, Caching und Invalidierung

Besondere Hinweise:
- `reportService` nutzt aktuell Platzhalter-UserId; Integration mit echtem Auth-Context empfohlen.
- Reale Daten für Einrichtungen im Filter sind als TODO kenntlich (derzeit statische Beispiele).

```

---

### 📄 ANALYSE_07_ADMIN_CHAT.md

```markdown
# ANALYSE_07_ADMIN_CHAT.md - Admin Chat & Kommunikation

## Übersicht
Dieser Bericht dokumentiert die Chat-Administration vollständig: Kanäle, Nachrichten, Radios (Broadcasts), Ankündigungen, Benutzerverwaltung, Dialoge, Status/Trends, sowie die zugrunde liegenden Hooks/Services und Firestore-Collections.

---

## 1) Admin Chat Seite (`/admin/chat`)

### Datei: `app/(admin)/admin/chat/page.tsx`
- Root: `<AppLayout>` → Hauptcontainer `<Box maxWidth=1400 p=3>`
- Header:
  - `<Typography variant="h3" fontWeight=700>`: "Chat Administration"
  - Untertitel: "Verwalten Sie Kanäle, Radios und Ankündigungen"
- Statistik-Karten (`<Grid>` 4x):
  - Kanäle (stats.totalChannels)
  - Aktive Benutzer (stats.activeUsers)
  - Nachrichten (stats.totalMessages)
  - Ungelesen (stats.unreadMessages)
- Aktionen (Button-Gruppe):
  - "Neuer Kanal" contained, startIcon `<Add>`, onClick öffnet CreateDialog, disabled bei `isCreating`
  - "Radio" outlined, startIcon `<Radio>`, onClick öffnet Broadcast-Dialog, disabled bei `isSending`
  - "Ankündigung" outlined, startIcon `<Announcement>`, onClick öffnet Announcement-Dialog, disabled bei `isSending`
  - "Einstellungen" outlined, startIcon `<Settings>`, `Link` → `/admin/einstellungen`
- Tabs (`<Paper className="glass">`):
  - Kanäle (Zähler)
  - Radios (Zähler)
  - Ankündigungen (Zähler)
  - Benutzer (Zähler)

#### Tab 1: Kanäle
- Filter-Leiste (`<Paper className="glass" p=3>`):
  - Suche `<TextField size="small" placeholder="Kanäle suchen..." InputProps.startAdornment=<Search>`, bindet `searchTerm`
  - Typ-Filter `<Select size="small">`: Werte: all|public|private|announcement, bindet `channelType`
  - Refresh `<IconButton><Refresh/></IconButton>` (reload)
- Liste (`<Grid>` Karten je Kanal):
  - Kopf: Icon nach Typ (public `<Public/>`, private `<Lock/>`, announcement `<Announcement/>`) + Titel + `<Chip>` Typfarbe
  - Beschreibung `<Typography body2>`
  - Fuß: Metadaten (memberCount • messageCount) und Aktionen:
    - Nachrichten anzeigen: `<IconButton><Message/></IconButton>` setzt `selectedChannel`
    - Bearbeiten: `<IconButton><Edit/></IconButton>` öffnet Edit-Dialog
    - Löschen: `<IconButton color="error"><Delete/></IconButton>` öffnet Delete-Dialog

#### Tab 2: Radios (Broadcasts)
- Tabelle (`Titel`, `Priorität`-Chip, `Empfänger`, `Gesendet (format)`, `Status`-Chip, Aktionen ...)

#### Tab 3: Ankündigungen
- Tabelle (`Titel`, `Typ`-Chip, `Geplant für` (format), `Status`-Chip, Aktionen Edit/Delete)

#### Tab 4: Benutzer-Verwaltung
- Tabelle (`Benutzer` inkl. `<Avatar>`+Name+Email, `Rolle` Chip, `Status` Chip (online=success), `Letzte Aktivität` (format), `Kanäle`, Aktionen (Settings))

### State & Logik
- `activeTab: number`
- `selectedChannel: string | null`
- `newMessage: string`
- Dialog-States: `createDialogOpen`, `editDialogOpen`, `deleteDialogOpen`, `broadcastDialogOpen`, `announcementDialogOpen`
- Edit/Lösch Objekte: `editingChannel`, `deletingChannel`
- Filter: `searchTerm`, `channelType`
- Handler:
  - `handleEditChannel(channel)` → öffnet Edit-Dialog
  - `handleDeleteChannel(channel)` → öffnet Delete-Dialog
  - `confirmDeleteChannel()` → ruft `deleteChannel(id)`
  - `handleSendMessage()` → validiert und ruft `sendMessage(selectedChannel, newMessage)`
  - `handleCreateChannel(data)` → `createChannel`
  - `handleSendRadio(data)` → nutzt `sendMessage` (Anmerkung: aktuell Platzhalter; Broadcast-API unten)
  - `handleCreateAnnouncement(data)` → `createAnnouncement`
- Hilfsfunktionen: `getChannelIcon(type)`, `getChannelColor(type)`
- `stats = getChannelStats()` aus Hook
- `filteredChannels` nach `searchTerm`/`channelType`

### Dialoge
- Create Channel Dialog: Felder Name, Beschreibung, Typ (Select), Mitglieder (Select multiple über `users`), Buttons Abbrechen/Erstellen
- Radio Dialog: Felder Titel, Nachricht, Priorität (Select), Empfänger (Select multiple), Buttons Abbrechen/Senden
- Announcement Dialog: Felder Titel, Nachricht, Typ (Select), Geplant für (datetime-local), Buttons Abbrechen/Erstellen
- Edit Channel Dialog: Felder Name/Beschreibung, Speichern
- Delete Channel Dialog: Bestätigungsdialog mit Kanalnamen, Löschen (error)

---

## 2) Hook: `useAdminChat`

### Queries
- `['adminChannels']` → `adminChatService.getChannels()`
- `['adminMessages']` → `adminChatService.getMessages()`
- `['adminChatUsers']` → `adminChatService.getUsers()`

### Mutations (mit Toasts + Cache-Invalidation)
- `createChannel({ name, description, type, members })`
- `updateChannel({ id, data })`
- `deleteChannel(id)`
- `sendMessage({ channelId, content })` → invalidiert `['adminMessages']`
- `sendBroadcast({ title, message, priority, targetUsers })` → invalidiert `['adminBroadcasts']`
- `createAnnouncement({ title, message, type, scheduledFor? })` → invalidiert `['adminAnnouncements']`

### Helper / Rückgabe
- `getChannelStats()` → liefert aggregierte Statistiken (Mockdaten + Ableitung aus geladenen Arrays)
- Loading: `isLoading` über OR der drei Query-Loadings
- Error: kombinierte Fehler
- Flags: `isSending`, `isCreating`, `isUpdating`, `isDeleting`

---

## 3) Service: `adminChatService`

### Collections
- `adminChannels` (Kanäle)
- `adminMessages` (Nachrichten)
- `adminBroadcasts` (Radios)
- `adminAnnouncements` (Ankündigungen)
- `users` (Benutzer, für Chat-User-Liste/Status)

### Methoden
- Channels: `getChannels()`, `createChannel(data)`, `updateChannel(id,data)`, `deleteChannel(id)`, `getChannelById(id)`
- Messages: `getMessages()`, `getChannelMessages(channelId, limit)`
- Broadcasts: `getBroadcasts()`, `sendBroadcast(data)`
- Announcements: `getAnnouncements()`, `createAnnouncement(data)`
- Users: `getUsers()`, `updateUserStatus(userId, status)`
- Channel-Statistik: `getChannelStats()` (Firestore-Counts + Mock `unread`)

### Datenmapping
- Firestore Timestamps → `.toDate()`
- Default-Felder: `memberCount/messageCount` (0), `status`, `type`

### Anmerkungen
- `createChannel/sendMessage` erwarten eine gültige User-ID aus dem AuthContext (Fallback entfällt).
- `sendMessage` inkrementiert `messageCount` und pflegt `unreadCount`/`lastMessage` über Firestore-Transaktionen.

---

## 4) Fehler- und Ladebehandlung
- Seite: `LoadingSpinner`, `ErrorDisplay`
- Mutations: Toasts bei Erfolg/Fehler
- Dialog-Buttons disabled, wenn entsprechende Mutation pending

---

## 5) Barrierefreiheit & UX
- Konsistente Labels/Icons, verständliche Status-Chips
- Bestätigungsdialoge für destructive Actions
- Such-/Filterleiste mit Tastaturbedienbarkeit

---

## 6) Performance
- React Query Caching pro Entität
- Selektive Invalidierung nach Mutationen
- Tabellen listen paginiert werden können (künftige Optimierung)

---

## Zusammenfassung
- ✅ Vollständige Admin-Chat-Verwaltung mit Kanälen, Nachrichten, Broadcasts, Ankündigungen und Benutzerübersicht
- ✅ Solide Service-Schicht für Firestore CRUD
- ✅ Auth-UserId-Platzhalter entfernt; `messageCount`/`unreadCount` werden korrekt gepflegt
- ✅ Gute UX mit Dialogen, Filtern und Statusvisualisierung

```

---

### 📄 ANALYSE_08_ADMIN_OTHER.md

```markdown
# ANALYSE_08_ADMIN_OTHER.md - Admin Sonstige (Audit Logs, Document Types)

## Übersicht
Dieser Bericht deckt sonstige Admin-Bereiche ab: Audit Logs (Komponente) und Hinweise auf Document Types (falls Seite/Manager vorhanden).

---

## 1) Audit Logs

### Komponenten-Datei: `components/admin/AuditLogViewer.tsx`
- Zweck: Live-Ansicht der Audit-Einträge aus `auditLogs` Collection (Firestore)
- Exporte: Default-Komponente `AuditLogViewer({ tenantId? })`

### UI-Analyse
- Filterleiste: 2 Inputs (Action-Filter, Actor-Filter)
- Tabelle mit Spalten: Zeit, Action, Actor, Target, RequestId
- Datenzeilen: konvertieren `createdAt` (Timestamp oder Date) via `.toLocaleString()`

### State & Logik
- Local State:
  - `logs: AuditLog[]`
  - `actionFilter: string`
  - `actorFilter: string`
- Effekt: `onSnapshot` auf Query
  - Query-Basis: `collection(db,'auditLogs')`, `orderBy('createdAt','desc')`, `limit(100)`
  - Optionaler `tenantId`-Filter: `where('tenantId','==', tenantId)`
  - Mapping: `snap.docs.map(d => ({ id: d.id, ...d.data() }))`
- Abgeleitete Liste: `filtered = logs.filter(...)` nach `actionFilter`/`actorFilter`

### Firestore-Integration
- Collection: `auditLogs`
- Felder (typisch): `actorUid`, `tenantId`, `action`, `target{collection,id}`, `requestId`, `createdAt`, `before`, `after`
- Realtime: `onSnapshot`

### Sicherheit & DSGVO
- Logs enthalten Akteur/Action/Target → personenbezogener Bezug möglich
- Sicherstellen: Nur berechtigte Admins, Mandantenfilter via `tenantId`

### Performance
- Live-Stream `limit(100)`
- Client-Filterung (leichtgewichtige Suchfelder)

---

## 2) Document Types (Hinweis)

- Im Projekt existiert eine Admin-Seite `app/(admin)/admin/document-types/page.tsx` (laut Struktur) die den `DocumentTypeManager` rendert (nicht eingelesen).
- Erwartete Funktionen eines Document Type Managers:
  - CRUD für Dokumenttypen (Name, Kategorie, Gültigkeitsdauer, Pflicht-Feld-Definitionen)
  - Zuweisung zu Upload-Validierungen (siehe Employee-Dokumente)
  - Firestore-Collection z. B. `documentTypes` mit Feldern: `name`, `category`, `defaultExpiryMonths`, `required` etc.
- Schnittstelle zu Employee-Dokumenten (`useDocuments`):
  - Dokumenttypabhängige Farb-/Label-Logik
  - Validierungs-/Ablauf-Policy

---

## Zusammenfassung
- ✅ `AuditLogViewer` liefert eine schlanke, Echtzeit-fähige Tabellenansicht der Audit Logs
- ✅ Filter nach `action`/`actor`
- 🔜 Document Types Manager: Erwartete CRUD/Policy-Funktionen (implizit, Seite referenziert)

```

---

### 📄 ANALYSE_09_EMPLOYEE_DASHBOARD.md

```markdown
# ANALYSE_09_EMPLOYEE_DASHBOARD.md - Employee Dashboard

## Übersicht
Dashboard für Mitarbeitende (Pflegekräfte) und Fallback-Admin-Ansicht in derselben Seite. Beinhaltet KPI-Karten, aktuellen Dienst, Mutationen (Timesheet, Assignment), sowie Admin-KPI-Spiegel bei Admin-Rolle.

---

## Datei: `app/(employee)/employee/dashboard/page.tsx`

### Imports (Auszug)
- Admin-Komponenten: `AdminKPICard`, `RecentActivities`, `TopPerformers`
- Employee-Komponenten: `AssignmentCard`, `KPICard`, `UpcomingAssignments`
- Layout/UI: `GlassCard`, `LoadingSpinner`, MUI (`Box, Grid, CardContent, Typography, Chip`)
- Kontext/Hooks: `useAuth`, `useTheme`, `useDashboard`, `useAdminDashboard`, React Query `useMutation`, `useQueryClient`
- Services: `assignmentService`, `timesheetService`

### High-Level Struktur
- Ermittelt `user` und Theme (`isDark`)
- Lädt Employee-Daten via `useDashboard`
- Lädt Admin-Daten via `useAdminDashboard` (für Admin-Ansicht)
- Definiert Mutationen für Start/Ende Arbeitszeit und Assignment-Aktionen
- Entscheidet Ansicht: Nurse vs. Admin (`isNurse = user.role === 'nurse'`)

### Loading/Unauth
- `if (authLoading || isLoading) LoadingSpinner("Dashboard wird geladen...")`
- `if (!user)` → Centered Hinweis zur Anmeldung

### Nurse-Ansicht
- Kopf: Titel "Willkommen zurück!" + Untertitel
- KPI-Karten (3x): Heute, Diese Woche, Dieser Monat (Icons, Farbcircles)
- Aktueller Dienst (`GlassCard`): Einrichtung/Station, Zeitspanne, Statuschip "Im Dienst"
- `AssignmentCard` (Props):
  - `assignment={todayAssignment}`
  - `timesheet={todayTimesheet}`
  - `onStartWork`, `onPauseWork`, `onEndWork`
  - `isLoading` (Mutationflags)
- `UpcomingAssignments` (Liste mit Accept/Decline Handlers)

### Admin-Ansicht
- Kopf: Titel "Admin Dashboard"
- Admin KPI-Karten (4x) aus `adminKpis`: Aktive Mitarbeiter, Arbeitsstunden (Woche), Ausstehende Zuweisungen, Offene Schichten
- Top Performers & Recent Activities (2-Spalten Grid)
- Weitere Admin Stats (4x): Einrichtungen, Abgelaufene Nachweise, Zuweisungen (Woche), Schichten (Woche)

### Mutationen (Employee-Aktionen)
- `startWorkMutation`:
  - `timesheetService.create(user.id, { date: today, startTime, endTime:'', breakMinutes:0, notes:'' })`
  - onSuccess: invalidate `['dashboard']`
- `endWorkMutation`:
  - `timesheetService.update(todayTimesheet.id, { endTime: now })`
  - onSuccess: invalidate `['dashboard']`
- `acceptAssignmentMutation`: `assignmentService.accept(assignmentId)` → invalidate `['dashboard']`
- `declineAssignmentMutation`: `assignmentService.decline(assignmentId)` → invalidate `['dashboard']`

### Abhängigkeiten & Datenflüsse
- `useDashboard` liefert: `todayAssignment`, `todayTimesheet`, `upcomingAssignments`, `kpis`, `addBreak`, `isLoading`
- `useAdminDashboard` liefert: `kpis`, `getRecentActivities`, `getTopPerformers`, weitere Entitäten für Admin-Karten

### UX/Design
- Glassmorphismus-Karten, Theme-adaptive Farben, klare Hierarchie
- Chips mit Status/Labels

### Tests/IDs
- Keine speziellen Test-IDs in dieser Seite; Interaktionen laufen über Komponenten-Props/Mutationen

---

## Zusammenfassung
- ✅ Duale Ansicht (Nurse/Admin) in einer Seite, basierend auf `user.role`
- ✅ Vollständige Employee-Aktionen (Schicht starten/beenden, Pause, Einsätze annehmen/ablehnen)
- ✅ Admin-KPIs und Aktivitäts-Widgets integriert
- ✅ Konsistente UX mit Glass Cards und responsivem Grid

```

---

### 📄 ANALYSE_10_EMPLOYEE_SCHEDULE.md

```markdown
# ANALYSE_10_EMPLOYEE_SCHEDULE.md - Employee Dienstplan & Dokumente

## Teil A: Employee Dienstplan

### Datei: `app/(employee)/employee/dienstplan/page.tsx`
- Lädt `useAuth()` und `useRouter()`
- `useEffect`: Wenn angemeldet und Rolle admin/dispatcher → Redirect `/admin/dashboard`
- Loading-Zustand (authLoading): Centered `<CircularProgress>`
- Unauth: `<Alert error>` mit Hinweis "Nicht angemeldet"
- Admin/Disponent (kurzzeitig): `<Alert info>` Weiterleitung
- Nurse: rendert `<NurseScheduleView />`

### UI-Fluss
- Kein eigener Inhalt außer Redirect/Wrapper → eigentliche Planung in `components/schedule/NurseScheduleView` (nicht geöffnet)
- Erwartet: Tages-/Wochen-Kalender, Schichten, Bewerben/Annehmen, Filter

### Navigation
- Redirect mittels `router.push('/admin/dashboard')` für Admin/Disponent

---

## Teil B: Employee Dokumente (Nachweise)

### Datei: `app/(employee)/employee/dokumente/page.tsx`
- Hooks/Kontext: `useAuth`, `useTheme`, `useDocuments`
- UI-Header: Titel "Meine Nachweise", Untertitel
- Tabs (4):
  - Alle (documents.length)
  - Gültig (getDocumentsByStatus('valid'))
  - Läuft ab (getDocumentsByStatus('expiring'))
  - Abgelaufen (getDocumentsByStatus('expired'))
- Aktionen:
  - "Ersten Nachweis hochladen" Button → `setShowUpload(true)`
- Grid mit `DocumentCard`-Kacheln (Edit/Delete/Download/View + Farb-/Label-Helfer)
- Upload-Dialog: `DocumentUpload` mit `onSubmit={handleUpload}` und `isLoading={uploadDocument.isPending}`

### Handler
- `handleUpload({ file, type, description? })`
  - ruft `uploadDocument.mutate({...})`
  - setzt Testdaten: `expiresAt` = +1 Jahr
  - Toasts für Erfolg/Fehler
- `handleEdit(document)` → setzt `editingDocument` und öffnet Dialog
- `handleDelete(documentId)` → Confirm → `deleteDocument.mutate`
- `handleDownload(doc)` / `handleView(doc)`:
  - `getDownloadURL(ref(storage, doc.filePath))` → temporärer Link (download) oder `window.open` (preview)
- `handleVerify(documentId)` → Confirm → `verifyDocument.mutate({ id, verifiedBy: user.id })`
- `handleReject(documentId)` → prompt reason → `rejectDocument.mutate({ id, rejectionReason })`

### Loading/Fehler/Unauth
- `authLoading || isLoading` → `<LoadingSpinner "Nachweise werden geladen..."/>`
- `error` → `<ErrorDisplay/>`
- `!user` → Centered Login-Hinweis

---

## Hook: `useDocuments`

### Queries
- `['documents', userId]` → `documentService.getByUserId(userId)`; enabled: `!!userId`, stale: 5 Min

### Mutations
- `uploadDocument(data: DocumentForm & { file: File })`:
  - Upload via `firebaseStorageService.uploadFile(file, path)`
  - erstellt `DocumentUpload` Payload (type mapping, url, size, contentType, expiryDate, notes)
  - `documentService.create(payload)`
  - onSuccess: invalidate `['documents']`
- `updateDocument({ id, data })` → mappt zu Service-Daten, invalidate `['documents']`
- `deleteDocument(id)` → invalidate `['documents']`
- `verifyDocument({ id, verifiedBy })` → invalidate `['documents']`
- `rejectDocument({ id, rejectionReason })` → nutzt `verify`-Service mit Ablehnungsgrund (vereinheitliche API), invalidate

### Helper
- `getDocumentStatus(doc)` → valid/expiring/expired (30-Tage-Schwelle via `addDays`)
- `getStatusColor(status)` → success/warning/error
- `getStatusLabel(status)` → Gültig/Läuft bald ab/Abgelaufen
- `getDocumentsByStatus(status)` → filtert Client-seitig
