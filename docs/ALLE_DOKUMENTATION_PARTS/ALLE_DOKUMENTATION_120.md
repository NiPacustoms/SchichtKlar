# JobFlow – Dokumentation Teil 120

*Zeichen 2364491–2384381 von 2862906*

---

- Batch-Update implementieren
- Alle Messages auf einmal markieren
- Firestore Batch-Write nutzen

---

### 13. Fehlende Pagination für große Listen

**Problem:**
- Große Listen werden komplett geladen
- Performance-Probleme bei vielen Einträgen
- Keine Virtualisierung

**Betroffene Bereiche:**
- Mitarbeiter-Liste
- Schicht-Liste
- Chat-Messages
- Timesheets

**Empfehlung:**
- Pagination implementieren (50 pro Seite)
- Virtual Scrolling für große Listen (>1000 Einträge)
- Infinite Scroll für Chat

---

### 14. Fehlende Keyboard-Navigation

**Problem:**
- Keyboard-Navigation nicht vollständig dokumentiert
- Escape-Taste funktioniert, aber nicht dokumentiert
- Tab-Order möglicherweise nicht optimal

**Empfehlung:**
- Keyboard-Navigation dokumentieren
- Tab-Order testen und optimieren
- Keyboard-Shortcuts hinzufügen (z.B. Strg+S zum Speichern)

---

### 15. Inkonsistente Button-Platzierung

**Problem:**
- Buttons mal links, mal rechts
- Keine einheitliche Regelung
- Inkonsistente UX

**Empfehlung:**
- Design-System für Button-Platzierung definieren
- Primäre Aktionen rechts, sekundäre links
- Konsistenz über alle Seiten

---

### 16. Fehlende Optimistic UI Updates

**Problem:**
- UI aktualisiert erst nach API-Response
- Langsame UX bei langsamen Verbindungen
- Keine sofortige Rückmeldung

**Empfehlung:**
- Optimistic Updates für häufige Aktionen
- Rollback bei Fehler
- React Query `onMutate` nutzen

---

### 17. Fehlende Retry-Mechanismen

**Problem:**
- Bei Netzwerkfehlern keine automatischen Retries
- Nutzer muss manuell erneut versuchen
- Keine Exponential Backoff

**Empfehlung:**
- React Query Retry-Konfiguration
- Manuelle Retry-Buttons
- Auto-Reconnect für Netzwerkfehler

---

### 18. Unklare Fehlermeldungen

**Problem:**
- Technische Fehlermeldungen für Endnutzer
- Fehlende Kontext-Informationen
- Inkonsistente Error-Messages

**Empfehlung:**
- User-friendly Error-Messages
- Kontext-spezifische Fehlermeldungen
- Hilfe-Links bei Fehlern

---

### 19. Fehlende Skeleton-Loader

**Problem:**
- Nur generischer CircularProgress
- Keine Skeleton-Loader für Content
- Schlechte UX beim Laden

**Empfehlung:**
- Skeleton-Loader für Cards, Tabellen, Listen
- `LoadingStates`-Komponente nutzen
- Content-Struktur während Laden anzeigen

---

### 20. Chat: Message-Pagination fehlt

**Problem:**
- Alle Messages werden auf einmal geladen
- Performance-Probleme bei vielen Messages
- Keine Lazy Loading

**Empfehlung:**
- Pagination implementieren (50 Messages pro Seite)
- Infinite Scroll nach oben
- Virtual Scrolling für große Listen

---

### 21. Fehlende Offline-Indikator

**Problem:**
- Nutzer weiß nicht, ob App offline ist
- Keine Offline-Modus-Anzeige
- Keine Offline-Daten-Sync

**Empfehlung:**
- Offline-Indikator in Header
- Service Worker für Offline-Modus
- Offline-Daten-Sync bei Online-Wiederkehr

---

### 22. Fehlende Hilfe-Texte in Formularen

**Problem:**
- Keine Hilfe-Texte in Formularen
- Unklare Feldbeschreibungen
- Keine Beispiele

**Empfehlung:**
- Hilfe-Texte unter Feldern
- Placeholder-Beispiele
- Tooltips für komplexe Felder

---

### 23. Fehlende Onboarding-Tour

**Problem:**
- Neue Nutzer wissen nicht, wo was ist
- Keine Einführung in Features
- Keine Kontext-Hilfe

**Empfehlung:**
- Onboarding-Tour für neue Nutzer
- Feature-Highlights
- Kontext-Hilfe-System

---

## 🟢 NICE-TO-HAVE - Später

### 24. Erweiterte Suche

**Problem:**
- Keine globale Suche
- Keine Volltext-Suche
- Suche nur in einzelnen Bereichen

**Empfehlung:**
- Global Search implementieren
- Volltext-Suche über alle Bereiche
- Suchvorschläge

---

### 25. Custom Dashboard-Widgets

**Problem:**
- Dashboard nicht anpassbar
- Keine Drag-and-Drop-Widgets
- Feste Widget-Anordnung

**Empfehlung:**
- Customizable Dashboard
- Drag-and-Drop-Widgets
- Widget-Konfiguration

---

### 26. Erweiterte Reporting-Features

**Problem:**
- Keine Custom Reports
- Kein Report-Scheduler
- Keine Report-Templates

**Empfehlung:**
- Custom Report-Builder
- Report-Scheduler (automatisch)
- Report-Templates
- Report-Sharing

---

### 27. Kalender-Integration

**Problem:**
- Kein iCal/Google Calendar Export
- Kein Kalender-Sync
- Keine Termin-Import

**Empfehlung:**
- iCal/Google Calendar Export
- Kalender-Sync (bidirektional)
- Termin-Import aus Kalendern

---

### 28. Erweiterte Chat-Features

**Problem:**
- Keine Message-Suche
- Keine Read Receipts
- Keine Typing-Indicator-Namen

**Empfehlung:**
- Message-Suche implementieren
- Read Receipts anzeigen
- Typing-Indicator mit Namen

---

### 29. Performance-Monitoring

**Problem:**
- Keine Performance-Tracking
- Schwer zu identifizieren, wo Optimierungen nötig sind
- Keine Metriken

**Empfehlung:**
- React DevTools Profiler
- Custom Performance-Metriken
- Performance-Dashboard

---

### 30. Erweiterte Filter-Optionen

**Problem:**
- Filter-Optionen begrenzt
- Keine gespeicherten Filter
- Keine Filter-Vorlagen

**Empfehlung:**
- Erweiterte Filter-Optionen
- Gespeicherte Filter
- Filter-Vorlagen

---

### 31. Dark Mode Verbesserungen

**Problem:**
- Dark Mode vorhanden, aber möglicherweise nicht optimal
- Kontraste möglicherweise nicht optimal
- Inkonsistente Farben

**Empfehlung:**
- Dark Mode optimieren
- Kontraste prüfen (WCAG AA)
- Konsistente Farben

---

### 32. Erweiterte Export-Optionen

**Problem:**
- Export-Formate begrenzt
- Keine Custom-Export-Formate
- Keine Export-Vorlagen

**Empfehlung:**
- Mehr Export-Formate (CSV, JSON, XML)
- Custom-Export-Formate
- Export-Vorlagen

---

### 33. Erweiterte Benachrichtigungen

**Problem:**
- Benachrichtigungen vorhanden, aber möglicherweise nicht optimal
- Keine Push-Benachrichtigungen
- Keine E-Mail-Benachrichtigungen

**Empfehlung:**
- Push-Benachrichtigungen
- E-Mail-Benachrichtigungen
- Benachrichtigungs-Präferenzen

---

### 34. Erweiterte Analytics

**Problem:**
- Keine Analytics-Dashboard
- Keine Nutzungsstatistiken
- Keine Performance-Metriken

**Empfehlung:**
- Analytics-Dashboard
- Nutzungsstatistiken
- Performance-Metriken

---

### 35. Erweiterte Sicherheits-Features

**Problem:**
- Sicherheit vorhanden, aber möglicherweise erweiterbar
- Keine 2FA
- Keine Session-Management

**Empfehlung:**
- 2FA implementieren
- Session-Management
- Erweiterte Audit-Logs

---

## 📊 Priorisierungs-Matrix

### Sofort umsetzen (Diese Woche)
1. ✅ ARIA-Labels hinzufügen
2. ✅ Console.log entfernen
3. ✅ Loading-States für Buttons
4. ✅ Bestätigungsdialoge für kritische Aktionen

### Nächste Iteration (Nächste 2 Wochen)
5. ✅ Inline-Validierung in Formularen
6. ✅ Chat Auto-Scroll optimieren
7. ✅ Error Boundaries hinzufügen
8. ✅ Tooltips auf Buttons
9. ✅ Mobile-Responsiveness verbessern

### Später (Nächster Monat)
10. ✅ Performance-Optimierungen (Memoization)
11. ✅ Pagination für große Listen
12. ✅ Optimistic UI Updates
13. ✅ Skeleton-Loader
14. ✅ Offline-Indikator

---

## 🛠️ Implementierungs-Empfehlungen

### 1. Systematische Code-Review

**Vorgehen:**
1. Alle Komponenten durchgehen
2. ARIA-Labels prüfen
3. Loading-States prüfen
4. Error-Handling prüfen

**Tools:**
- ESLint mit Accessibility-Plugins
- React DevTools
- Lighthouse Accessibility Audit

### 2. Design-System erweitern

**Komponenten:**
- `ConfirmDialog` (bereits vorhanden, mehr nutzen)
- `LoadingButton` (neue Komponente)
- `ErrorDisplay` (bereits vorhanden, mehr nutzen)
- `Tooltip` (standardisieren)

### 3. Testing-Strategie

**Tests:**
- Accessibility-Tests (axe-core)
- E2E-Tests für kritische Flows
- Performance-Tests
- Mobile-Responsiveness-Tests

### 4. Dokumentation

**Dokumentieren:**
- Keyboard-Shortcuts
- Accessibility-Features
- Performance-Best-Practices
- Mobile-Responsiveness-Guidelines

---

## 📈 Erfolgs-Metriken

### Vorher (Aktuell)
- ❌ ~50+ IconButtons ohne ARIA-Labels
- ❌ ~30+ console.log Statements
- ❌ ~20+ Buttons ohne Loading-States
- ❌ 0 Error Boundaries
- ❌ Inkonsistente Button-Platzierung

### Nachher (Ziel)
- ✅ 100% IconButtons mit ARIA-Labels
- ✅ 0 console.log in Production
- ✅ 100% Buttons mit Loading-States
- ✅ Error Boundaries für alle kritischen Bereiche
- ✅ Konsistente Button-Platzierung

---

## 🎯 Nächste Schritte

1. **Prioritäten setzen** - Welche Probleme sind am kritischsten?
2. **Sprint-Planning** - Probleme in Sprints aufteilen
3. **Implementierung** - Systematisch durcharbeiten
4. **Testing** - Jede Änderung testen
5. **Dokumentation** - Änderungen dokumentieren

---

**Erstellt:** 2025-01  
**Letzte Aktualisierung:** 2025-01  
**Status:** Bereit für Implementierung


```

---

### 📄 APP_OVERVIEW.md

```markdown
# JobFlow - App-Überblick

## 1) Routen & Seiten (Next.js App Router)

### Admin-Bereich /admin/*

- `/admin` → Redirect zu `/admin/shifts`
- `/admin/shifts` → Schichtverwaltung (CRUD, Zuweisen, Duplizieren)
- `/admin/dienstplan` → Kalender-Ansicht (Planung/Filter/Status)
- `/admin/mitarbeiter` → Mitarbeiterliste (Rollen, Aktiv/Deaktivieren)
- `/admin/mitarbeiter/[uid]` → Mitarbeiter-Detail (Profil, Nachweise, Historie)
- `/admin/einrichtungen` → Einrichtungsverwaltung
- `/admin/einrichtungen/[id]` → Einrichtungs-Detail (Stationen, Kontakte)
- `/admin/document-types` → Dokument-Typen (z. B. Zertifikate)
- `/admin/berichte` → Reports (Zeitkonten, Zuschläge, Exporte)
- `/admin/chat` → Admin-Chats (Übersicht)
- `/admin/chat/[channelId]` → Chat-Kanal
- `/admin/einstellungen` → Systemeinstellungen (Branding, Zuschläge, Rechte)

### Mitarbeiter-Bereich

- `/dashboard` → Mitarbeiter-Dashboard (heute/ Woche / Nächster Dienst)
- `/dienstplan` ↔ (`/schedule`) → Dienstplan (User)
- `/zeiterfassung` ↔ (`/time`) → Zeiterfassung (Start, Pause, Ende, Notiz)
- `/zeiten` → Zeitnachweise-Liste (Filter/Export)
- `/profil` ↔ (`/profile`) → Profil
- `/dokumente` ↔ (`/documents`) → Dokumente
- `/assignments` → Zuweisungen
- `/einrichtungen` ↔ (`/facilities`) → Einrichtungen (Lesen)
- `/berichte` ↔ (`/reports`) → Eigene Berichte
- `/chat` → Chats-Übersicht
- `/chat/[channelId]` → Chat-Kanal
- `/benachrichtigungen` → Benachrichtigungen

### Auth, Rechtliches, System & Start

- `/login`, `/register`, `/auth/callback`
- `/legal/imprint`, `/legal/privacy`
- `/maintenance`, `/not-found.tsx`, `/` (rollenbasierter Redirect)

### Alias-Redirects (engl. → deutsch)

- `/schedule` → `/dienstplan`
- `/profile` → `/profil`
- `/documents` → `/dokumente`
- `/time` → `/zeiterfassung`
- `/messenger` → `/chat`
- `/facilities` → `/einrichtungen`
- `/reports` → `/berichte`

## 2) Layouts & Navigation

### Root Layout `app/layout.tsx`
Lädt globale Styles & Provider.

### Admin Layout `app/(admin)/admin/layout.tsx`
Enthält nur BottomNav (Bottom-Navigation) + SSR-Rollengate (Cookie role).

### Mitarbeiter Layout `app/(mitarbeiter)/layout.tsx`
Enthält BottomNav (mobile Bottom-Navigation) und Bodenabstand.

## 3) Kern-Komponenten (UI/Patterns)

- **GlassCard / GlassCardHover**: Transparente Karten mit Blur & Border, theme-aware.
- **KPICard**: Kennzahlen mit Titel, Wert, Trend, Icon-Dot.
- **ThemeButton**: MUI-Button mit Light/Dark abgestimmten Styles.
- **TimesheetForm**: RHF + Zod validiert date, startTime, endTime, breakMinutes, notes.
- **LoadingSpinner / CardSkeleton**: Konsistente Ladezustände.
- **BottomNav (Mitarbeiter)**: Tabs: Home, Dienstplan, Zeit, Profil.
- **BottomNav**: Einzige Navigation für alle Bereiche (Admin + Mitarbeiter).

## 4) Kontexte & Guards

### AuthContext
Firebase Auth-State, signIn/signOut/updateUser, lädt User-Doc & Custom Claims (role), setzt serverTimestamp().

### ThemeContext
mode: 'light'|'dark'|'system', setzt data-theme, synchron mit MUI.

### AuthGuard (Client)
Blockt anonyme Nutzer, zeigt Login-Hinweis.

### RoleGuard (Client)
Erlaubt Seiten nur für definierte Rollen.

### middleware.ts (Server)
Erzwingt Admin-Redirect /admin → /admin/shifts, sperrt /admin/* für nurse (optional).

## 5) Daten & Services (Firebase)

### Collections

- `users/{uid}` – Profil, Rolle, Nachweise
- `timesheets/{uid}/entries/{entryId}` – Zeitnachweise (ID: YYYYMMDD)
- `shifts/{shiftId}` – Schichten (Status, Zuordnung)
- `einrichtungen/{id}` – Einrichtungen/Stationen
- `channels/{channelId}/messages/{messageId}` – Chat-Nachrichten

### Services (lib/services)

- `authService.ts` – Login/Signup/Reset/Profile-Update
- `timesheets.ts` – getTimesheet, upsertTimesheet (Merge + serverTimestamp)
- `shifts.ts` – CRUD/Assignment
- `documents.ts`, `assignments.ts` – Uploads/Zuordnungen

### React Query Hooks (lib/hooks)
z. B. `useTimesheet(uid, date)`, `useDashboard()`, `useAdminDashboard()`
→ Keys wie `['timesheets', uid, dateISO]`

### Cloud Functions (functions/src)

- `assignShift.ts` (onCall) – Zuweisen mit Claims-Check, Audit-Log
- `auth.ts` – OnCreate User-Dokument, evtl. Standardrolle

### Security Rules (Auszug)

- `users`: self|admin/dispatcher lesen/schreiben
- `timesheets`: self|admin/dispatcher lesen/schreiben
- `shifts/einrichtungen`: admin/dispatcher schreiben, alle eingeloggten lesen
- `channels/messages`: eingeloggte lesen/erstellen; update/delete self|admin/dispatcher

## 6) Formular-Validierung (RHF + Zod)

### Timesheet-Schema

- `date`: string (YYYY-MM-DD)
- `startTime`, `endTime`: string (HH:MM, Regex)
- `breakMinutes`: number (0–480, z.coerce.number())
- `refine(endTime > startTime)`

### Fehlerdarstellung
Inline-HelperTexts, Submit disabled bei Pending, Toasts bei Fehler/Erfolg.

## 7) Theming & Styling

### Material-UI 7 + Emotion
CSS Vars, CssVarsProvider, alpha()-Utilities.

### Tailwind
Für Layout/Spacing/Utilities (keine Kollision mit MUI-Theming).

### Theme-Sync
ThemeContext (data-theme) ↔ MUI Mode, FOUC-Schutz per suppressHydrationWarning.

## 8) API-Routen (Server)

- `POST /api/pdf/report` → Report-PDF generieren
- `POST /api/pdf/timesheet` → Timesheet-PDF generieren

(später: Auth-Session-Cookies, Webhooks, Exporte)

## 9) Navigation & Flows

### Start /
Wenn eingeloggt: admin|disponent → /admin/shifts, sonst → /dashboard, andernfalls → /login.

### Admin
BottomNav (Admin) führt zu: Übersicht, Schichten, Personal, Standorte + Mehr-Menü mit Einsätze, Berichte, Chat, Lohnabrechnung, Einstellungen.

### Mitarbeiter
BottomNav führt zu Dashboard, Dienstplan, Zeiterfassung, Profil.

## 10) Wichtigste User Stories (Kurz)

- **Mitarbeiter – Zeit erfassen**: Start → Pause(n) → Ende → Speichern → PDF
- **Mitarbeiter – Dienst annehmen/ablehnen**: /dienstplan → Detail → Entscheidung
- **Admin – Schicht planen**: /admin/shifts → Anlegen → Zuweisen → Duplizieren → Status verfolgen
- **Admin – Nachweise prüfen**: /admin/mitarbeiter/[uid] → Dokumente/Ablauf-Badges
- **Alle – Chat**: Kanal öffnen, Nachrichten live (onSnapshot)

## 11) Code-Orga (vereinfacht)

```
app/                # Routen (Admin/Mitarbeiter/System/API)
components/         # UI, Layout, Patterns (GlassCard, KPICard, BottomNav…)
contexts/           # AuthContext, ThemeContext
lib/                # firebase.ts, hooks/, services/, providers/, types/, utils/
functions/          # Cloud Functions (assignShift, auth)
docs/               # Blueprint & Spezifikationen
tasks/              # Checklisten (ui-refactor.todo.md)
```

```

---

### 📄 AUTOMATION.md

```markdown
# Firebase Service Account - Vollständige Automatisierung

## ✅ Was wurde automatisiert?

### 1. Service Account Rollen-Management
- ✅ Automatisches Setzen aller benötigten Rollen
- ✅ Automatisches Entfernen redundanter Rollen
- ✅ Verifikation der Konfiguration

### 2. Scripts

#### `setup-service-account.sh`
Vollständiges Setup eines Service Accounts mit optimalen Rollen.

```bash
./scripts/setup-service-account.sh
# oder
npm run firebase:setup
```

**Was macht es:**
- Prüft vorhandene Rollen
- Entfernt redundante Rollen (firebase.admin, serviceusage.viewer, etc.)
- Fügt fehlende Rollen hinzu (nur die 6 benötigten)
- Verifiziert das Ergebnis

#### `verify-service-account.sh`
Verifikation ob alle Rollen korrekt gesetzt sind.

```bash
./scripts/verify-service-account.sh
# oder
npm run firebase:verify
```

**Ausgabe:**
- ✅ Liste aller vorhandenen Rollen
- ❌ Liste fehlender Rollen
- ⚠️ Warnung bei redundanten Rollen
- Exit Code 1 wenn Fehler gefunden

#### `auto-setup-firebase.sh`
Vollständiges Firebase Setup (Service Account + APIs).

```bash
./scripts/auto-setup-firebase.sh
# oder
npm run firebase:setup:full
```

**Was macht es:**
- Service Account Rollen setzen
- Benötigte APIs aktivieren
- Verifikation durchführen

## 🚀 Verwendung

### Initial Setup (einmalig)

```bash
# 1. gcloud authentifizieren
gcloud auth login

# 2. Vollständiges Setup
npm run firebase:setup:full
```

### Rollen aktualisieren

```bash
# Nur Rollen setzen (entfernt redundante, fügt fehlende hinzu)
npm run firebase:setup
```

### Verifikation

```bash
# Prüft ob alle Rollen vorhanden sind
npm run firebase:verify
```

## 📋 Benötigte Rollen (automatisch gesetzt)

Die Scripts setzen automatisch diese 6 minimalen Rollen:

1. ✅ `roles/cloudfunctions.admin`
2. ✅ `roles/firebase.sdkAdminServiceAgent`
3. ✅ `roles/firebaseextensions.admin`
4. ✅ `roles/firebasehosting.admin`
5. ✅ `roles/run.admin`
6. ✅ `roles/serviceusage.serviceUsageAdmin`

## 🧹 Redundante Rollen (automatisch entfernt)

Die Scripts entfernen automatisch:

- ❌ `roles/firebase.admin` (zu breit)
- ❌ `roles/serviceusage.serviceUsageViewer` (redundant)
- ❌ `roles/edgecontainer.serviceAccountAdmin` (nicht benötigt)
- ❌ `roles/firebasemods.serviceAgent` (nicht benötigt)

## 🔄 Automatisierung in CI/CD

Die Scripts können auch in GitHub Actions verwendet werden:

```yaml
- name: Verify Service Account
  run: |
    gcloud auth activate-service-account --key-file=${{ secrets.FIREBASE_SERVICE_ACCOUNT_JobFlow }}
    npm run firebase:verify
```

## 📊 Beispiel-Output

```
🚀 Firebase Service Account Setup & Optimierung
================================================

📊 Aktuelle Rollen prüfen...

🧹 Entferne redundante Rollen...
  → Entferne: roles/firebase.admin

➕ Füge benötigte Rollen hinzu...
  ✓ Bereits vorhanden: roles/cloudfunctions.admin
  ✓ Bereits vorhanden: roles/firebase.sdkAdminServiceAgent
  + Füge hinzu: roles/firebaseextensions.admin
  ...

✅ Setup abgeschlossen!
📊 Anzahl Rollen: 6
```

## 🎯 Vorteile

1. **Einmalige Einrichtung:** Script läuft automatisch
2. **Selbst-heilend:** Fügt fehlende Rollen automatisch hinzu
3. **Optimierend:** Entfernt redundante Rollen
4. **Verifizierend:** Prüft automatisch die Konfiguration
5. **CI/CD-ready:** Kann in GitHub Actions verwendet werden

## 🔧 Manuelle Anpassung

Falls du Rollen manuell anpassen möchtest, bearbeite:

```bash
scripts/setup-service-account.sh
```

Ändere die Arrays:
- `REQUIRED_ROLES` - Rollen die hinzugefügt werden
- `REDUNDANT_ROLES` - Rollen die entfernt werden


```

---

### 📄 CHANGELOG.md

```markdown
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

```

---

### 📄 CHECK_SUMMARY.md

```markdown
# 100% App-Check - Zusammenfassung

## ✅ Status: Abgeschlossen

Alle 16 Bereiche wurden vollständig geprüft und dokumentiert.

## 📋 Geprüfte Bereiche

1. ✅ **Projektstruktur & Konfiguration** - package.json, tsconfig, next.config, eslint
2. ✅ **Firebase-Konfiguration** - Client, Admin, Rules, Storage, Functions
3. ✅ **Routing & Navigation** - App Router, Layouts, Middleware, Navigation Components
4. ✅ **Authentication & Authorization** - Context, Guards, Services, API Auth
5. ✅ **API Routes** - Admin, Auth, Chat, Health, Templates
6. ✅ **Services Layer** - Core, Payroll, Chat, Documents, Settings, Error Handling
