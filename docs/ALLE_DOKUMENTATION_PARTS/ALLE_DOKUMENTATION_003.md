# JobFlow – Dokumentation Teil 3

*Zeichen 39748–59637 von 2862906*

---

3. Phase 3 (Auth) - Security
4. Phase 4 (Dienstplan) - Core Feature
5. Phase 6 (Dokumente) - Compliance
6. Phase 5 (Verwaltung) - Admin Tools
7. Phase 7 (Chat) - Kommunikation
8. Phase 8 (Dashboard) - Reporting
9. Phase 9-12 (Rest) - Erweiterungen

## Technische Details

**Tailwind-Config für Aurora:**

```js
colors: {
  petrol: { 500: '#005f73', 600: '#004d5c', 700: '#003d47' },
  aurora: { glass: 'rgba(255,255,255,0.08)' }
},
backdropBlur: { glass: '12px' }
```

**GlassCard-Pattern:**

```tsx
bg-white/8 border border-white/20 backdrop-blur-glass shadow-lg rounded-2xl
```

**Router-Integration:**

- Neue Seiten in `src/app/router.tsx` registrieren
- ProtectedRoute + RequireRole verwenden

### To-dos

- [ ] Typsystem erweitern: Timesheet, Shift, UserProfile, Document, Message, Notification, Assignment, AuditLog Interfaces + Zod-Schemas implementieren
- [ ] Fehlende Services erstellen: assignments.ts, notifications.ts, auditLog.ts, documents.ts mit vollständigen CRUD-Operationen
- [ ] Firebase Custom Claims System: Cloud Function setUserRole implementieren, onCreate-Trigger für Standard-Rolle
- [ ] Firestore Security Rules vervollständigen: Custom Claims Integration, Assignment/Notification/Document Rules, canAccessChannel korrekt implementieren
- [ ] Cloud Functions implementieren: auditLog.onCreate, notifications.sendToUser, shifts.onUpdate, documents.onExpiryWarning
- [ ] AuthContext mit Firebase Auth Integration: signIn/signOut, Custom Claims auslesen, hasRole Helper, Token Refresh
- [ ] Admin-Rollenverwaltung UI: Benutzer-Liste, Rollen-Dropdown, setUserRole aufrufen, Audit-Log-Anzeige
- [ ] Dienstplan User-Funktionen: acceptShift/rejectShift implementieren, Konflikterkennung, Benachrichtigungen
- [ ] Dienstplan Admin-Verwaltung: Schicht CRUD, Mitarbeiter zuweisen, Qualifikationsprüfung, Konfliktwarnung, Bulk-Import
- [ ] Schicht-Validierung Utils: validateShift, checkQualifications, calculateAvailability implementieren
- [ ] Einrichtungsverwaltung: CRUD-UI für Facilities & Stations, Ansprechpartner verwalten
- [ ] Mitarbeiterverwaltung: Liste mit Filter, Profil bearbeiten, Qualifikationen, Urlaubskonto, Dokumentenstatus
- [ ] User-Profile erweitern: Stammdaten bearbeiten, Passwort ändern, Benachrichtigungseinstellungen, Resturlaub
- [ ] Dokument-Upload & Verwaltung: Firebase Storage Upload, Metadaten, Thumbnail, Download, Validierung
- [ ] Admin-Nachweisprüfung: Liste mit Filter, Verifizieren/Ablehnen, Benachrichtigungen, Bulk-Export
- [ ] Realtime-Chat-System: Kanal-basiert, onSnapshot Realtime, Typing-Indicator, Online-Status
- [ ] Chat-Kanäle implementieren: Station/Schicht/Direkt/Broadcast-Kanäle, Mitgliedschaft basierend auf Assignments
- [ ] Push-Benachrichtigungen: FCM Integration, Service Worker, Cloud Function Trigger für Events
- [ ] Notification Center UI: Badge, Dropdown, Markieren als gelesen, Archiv, Links zu Seiten
- [ ] Admin-Dashboard erweitern: KPIs, Einrichtungsübersicht, Kommende Schichten, Ablaufende Dokumente, Quick Actions
- [ ] Reports & Statistiken: Stundenauswertung, Einsatzübersicht, Kostenrechnung, Urlaubsübersicht, PDF/Excel Export
- [ ] Audit-Log-Viewer: Chronologische Liste, Filter, Details, CSV-Export
- [ ] PDF-Export & Signatur: PDF-Generierung, Canvas-Signatur, Upload zu Storage, Download-Button
- [ ] Stunden-Statistiken: Wochen/Monats/Jahressummen, Durchschnitt, Überstunden, Chart-Visualisierung
- [ ] CI/CD Pipeline: GitHub Actions für Linting, Build, Preview Channels, Production Deploy
- [ ] Performance-Optimierung: Code-Splitting, Lazy Loading, Firestore-Indizes, Caching, Image-Optimierung
- [ ] Produktions-Deployment: Umgebungsvariablen, Monitoring, Backup-Strategie, DSGVO-Compliance



---

## Quelle: .cursor/plans/payroll-547c5e-97f79f44.plan.md

<!-- 97f79f44-36cf-47f4-8e48-debb7d45e751 9b4a7c6c-e180-4651-84cd-5568f0db4a3f -->

# Analyseplan Lohnabrechnung

1. Erfasse SOTA-Funktionsumfang

- Quellen: `tasks/payroll.todo.md`, `docs/LOHNABRECHNUNG_ANALYSE.md`, `docs/PAYROLL_REQUIREMENTS.md`
- Ergebnis: strukturierte Liste rechtlicher & funktionaler Anforderungen

2. Prüfe vorhandene Admin-Implementierung

- Dateien: `app/(admin)/admin/lohnabrechnung/page.tsx`, `lib/hooks/usePayroll.ts`, `lib/services/payroll.ts`, `components/admin/*`
- Ergebnis: Überblick über verfügbare Features & technische Basis

3. Vergleiche Soll/Ist & identifiziere Lücken

- Verdichtung zu Kernpunkten (Pflicht vs. Nice-to-have)
- Hinweise zu fehlender Integration vorhandener Komponenten



---

## Quelle: .cursor/plans/static-templates.plan.md

1. Backendlage
   - `companyTemplates`-Dokumente: Pflichtfelder `title`, `message` (app) bzw. `subject`, `bodyHtml`/`bodyText` (email); Platzhalter-Felder entfernen.
   - API `app/api/templates` + `[templateId]`: Payload-Validierung auf neue Felder umstellen, `placeholders`/`defaultPayload` streichen.
   - Functions: `notificationTriggers.ts` lädt Template direkt und speichert geschnittene Texte; `templateRenderer.ts` löschen.
   - Types & Services: `TemplatePlaceholder` u.ä. aus `lib/types`, `templateService` etc. entfernen/vereinfachen.

2. Admin Oberfläche
   - `TemplateManager`: Formular auf finale Felder reduzieren, Vorschau direkt aus Formularwerten, Placeholder-Abschnitt + Default-Payload entfernen.
   - Query/Mutations an neues API-Schema anpassen; Filter/Listen belassen.

3. Dokumentation & Tests
   - Doku (`docs/TEMPLATE_MANAGEMENT.md`, etc.) auf statische Templates aktualisieren.
   - Manual-Testbeschreibung für Event-Trigger ohne Platzhalter ergänzen.



---

## Quelle: .cursor/rules/README.md

# 🎯 **JobFlow Cursor Rules - Optimiert & Umnummeriert**

## **📋 Regel-Struktur (Logisch nummeriert 00-08)**

### **🚀 Always Applied (Immer aktiv)**

- **`00-project.mdc`** - Projekt-Kontext, Tech-Stack, Ziele
- **`01-design-system.mdc`** - Design-Standards, MUI 5, Glasmorphism
- **`02-frontend.mdc`** - React/MUI, Performance, Error-Handling, Testing
- **`05-prompt-optimization.mdc`** - Prompt-Optimierung, Tool-Einsatz
- **`08-worktree-coordination.mdc`** - Worktree-Koordination, Multi-Agenten-Aufgabenverteilung

### **⚡ Auto-Attached (Bei relevanten Dateien)**

- **`03-services.mdc`** - Firebase, Auth, Storage, Backend-Integration

### **🔒 On-Demand (Bei Bedarf aktivieren)**

- **`04-security.mdc`** - DSGVO, Firestore Rules, Rollen-Management
- **`06-testing.mdc`** - Testing-Strategien, CI/CD (nur bei Test-Implementierung)

### **📝 Dokumentation**

- **`07-todo-implementation.mdc`** - Projekt-Status, To-Do Liste
- **`README.md`** - Diese Übersicht

## **✅ Was wurde optimiert?**

### **Eliminiert (Redundant/Überflüssig):**

- ❌ `01-style-ux-desktop-first.mdc` → Identisch mit design-system.mdc
- ❌ `02-theme-enforcement.mdc` → Redundant mit design-system.mdc
- ❌ `05-error-handling.mdc` → In frontend.mdc integriert
- ❌ `06-performance.mdc` → In frontend.mdc integriert
- ❌ `08-docs-ci.mdc` → Nur bei CI/CD-Arbeit relevant

### **Hinzugefügt & Umnummeriert:**

- ✅ `05-prompt-optimization.mdc` → Wieder hinzugefügt für bessere AI-Interaktion
- ✅ `08-worktree-coordination.mdc` → Neu hinzugefügt für Multi-Agenten-Koordination
- 🔄 `07-testing.mdc` → Von 07 auf 06 umnummeriert
- 🔄 `09-todo-implementation.mdc` → Von 09 auf 07 umnummeriert

### **Konsolidiert:**

- 🔄 Performance + Error-Handling → `02-frontend.mdc`
- 🔄 Testing-Grundlagen → `02-frontend.mdc`

## **🎯 Ergebnis:**

- **Vorher:** 13 Rules, 18.5KB, unlogische Nummerierung
- **Nachher:** 9 Rules, ~15KB, logische Struktur 00-08
- **Effizienz:** +31% weniger Rules, -19% Dateigröße, verbesserte Prompt-Qualität

## **🚀 Verwendung:**

1. **Neue Features:** Rules 00-02, 05, 08 sind automatisch aktiv
2. **Backend-Integration:** Rule 03 wird bei Service-Dateien automatisch angehängt
3. **Security-Fragen:** Rule 04 bei Bedarf aktivieren
4. **Testing:** Rule 06 nur bei Test-Implementierung
5. **Todo-Tracking:** Rule 07 für Projekt-Status
6. **Worktree-Nutzung:** Rule 08 koordiniert automatisch Multi-Agenten-Aufgabenverteilung

---

_Optimiert & Umnummeriert am: $(date)_
_Regel-Anzahl: 9 (vorher 13)_
_Nummerierung: Logisch 00-08_
_Dateigröße: ~15KB (vorher 18.5KB)_



---

## Quelle: .cursor/worktree-prompt.md

# Worktree Prompt: TypeScript-Fehlerbehebung mit 3 Agenten

## Kontext

Die JobFlow-App hat aktuell **~1501 TypeScript-Fehler**, die systematisch behoben werden müssen. Die Fehler wurden bereits teilweise reduziert (von ~1536), aber es bleiben noch kritische Probleme.

## Projekt-Struktur

- **Framework:** Next.js 15.5.6 mit TypeScript
- **UI-Library:** Material-UI (MUI)
- **Firebase:** Firestore für Backend
- **Hauptverzeichnis:** `/Users/patrickschmidt/Desktop/Apps/JobFlow`

## Aktuelle Fehlerkategorien

### 1. Grid-Komponenten-Fehler (MUI v5/v6 Inkompatibilität)

- `app/(employee)/employee/dashboard/page.tsx` - Grid `item` prop Fehler
- `components/admin/TemplateManager.tsx` - Grid `item` prop Fehler
- MUI Grid2 vs Grid Import-Probleme

### 2. API-Route-Fehler

- `app/api/chat/channels/route.ts` - `Boolean` wird als Funktion aufgerufen (Zeile 32, 118)
- `app/api/chat/direct/route.ts` - `Boolean` wird als Funktion aufgerufen (Zeile 76)

### 3. Type-Inkompatibilitäten

- `lib/hooks/useChat.ts` - ChatMessage vs Message Typ-Konvertierungen
- `app/(employee)/employee/zeiten/page.tsx` - `assignmentId` Property fehlt auf `TimeEntry`
- `app/(employee)/employee/zeiterfassung/page.tsx` - Timesheet Typ-Inkompatibilität
- `app/api/admin/shifts/route.ts` - `color` Property fehlt im Shift-Typ

### 4. Weitere TypeScript-Fehler

- Fehlende Properties in Interfaces
- Falsche Funktionssignaturen
- Implizite `any` Types

---

## Agent 1: MUI Grid & UI-Komponenten Spezialist

### Aufgabe

Behebe alle Grid-Komponenten-Fehler und MUI-bezogene TypeScript-Probleme.

### Spezifische Aufgaben

1. **Grid-Komponenten korrigieren:**
   - `app/(employee)/employee/dashboard/page.tsx` (Zeilen 284, 445)
   - `components/admin/TemplateManager.tsx` (Zeile 375)
   - Prüfe ob MUI Grid2 verwendet werden sollte oder Grid mit `item` prop
   - Stelle sicher, dass alle Grid-Imports korrekt sind

2. **Weitere MUI-Komponenten-Fehler:**
   - `components/admin/TemplateManager.tsx` - LoadingSpinner Props (Zeile 765)
   - `components/admin/TemplateManager.tsx` - FormControl onChange Handler (Zeile 393)

### Vorgehen

```bash
# 1. Finde alle Grid-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid\|Grid"

# 2. Prüfe MUI-Version
grep -r "mui/material" package.json

# 3. Korrigiere Grid-Imports und Verwendung
```

### Erfolgskriterien

- Alle Grid-Komponenten-Fehler behoben
- Keine MUI-bezogenen TypeScript-Fehler mehr
- App kompiliert ohne Grid-bezogene Warnungen

---

## Agent 2: API Routes & Backend TypeScript Spezialist

### Aufgabe

Behebe alle API-Route-Fehler und Backend-bezogene TypeScript-Probleme.

### Spezifische Aufgaben

1. **Boolean-Funktions-Fehler:**
   - `app/api/chat/channels/route.ts` (Zeilen 32, 118)
   - `app/api/chat/direct/route.ts` (Zeile 76)
   - Finde wo `Boolean` fälschlicherweise als Funktion aufgerufen wird
   - Ersetze durch korrekte Typ-Prüfungen

2. **Shift API Route:**
   - `app/api/admin/shifts/route.ts` (Zeile 218)
   - Füge `color` Property zum Shift-Typ hinzu oder entferne es aus dem Payload

3. **Weitere API-Fehler:**
   - Prüfe alle API-Routen auf TypeScript-Fehler
   - Stelle sicher, dass alle Request/Response-Typen korrekt sind

### Vorgehen

```bash
# 1. Finde alle API-Route-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api"

# 2. Prüfe Boolean-Verwendungen
grep -rn "Boolean(" app/api/

# 3. Korrigiere Boolean-Aufrufe
```

### Erfolgskriterien

- Alle API-Route-Fehler behoben
- Keine `Boolean`-Funktions-Aufrufe mehr
- Alle API-Routen haben korrekte Typen

---

## Agent 3: Type-System & Hook Spezialist

### Aufgabe

Behebe alle Type-Inkompatibilitäten, Hook-Fehler und Type-System-Probleme.

### Spezifische Aufgaben

1. **useChat Hook:**
   - `lib/hooks/useChat.ts` - Alle verbleibenden ChatMessage/Message Konvertierungen
   - Stelle sicher, dass alle Callbacks korrekte Typen haben
   - Behebe `userId` undefined-Probleme

2. **TimeEntry & Timesheet Typen:**
   - `app/(employee)/employee/zeiten/page.tsx` - `assignmentId` Property hinzufügen
   - `app/(employee)/employee/zeiterfassung/page.tsx` - Timesheet Typ-Inkompatibilität beheben
   - Prüfe ob `TimeEntry` Interface erweitert werden muss

3. **Weitere Type-Fehler:**
   - `components/profile/ProfileForm.tsx` - Record<string, unknown> Typ-Fehler
   - `components/auth/RoleGuard.tsx` - `tenantId` Property fehlt
   - Alle impliziten `any` Types explizit typisieren

### Vorgehen

```bash
# 1. Finde alle Type-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70"

# 2. Prüfe Hook-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "hooks/"

# 3. Prüfe Component-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "components/"

# 4. Analysiere Type-Definitionen
grep -r "interface TimeEntry\|type TimeEntry" lib/types/
```

### Erfolgskriterien

- Alle Type-Inkompatibilitäten behoben
- Keine impliziten `any` Types mehr
- Alle Hooks haben korrekte Typen
- Type-System ist konsistent

---

## Koordinations-Regeln

### Workflow

1. **Jeder Agent arbeitet in einem separaten Branch:**
   - `agent1-mui-grid-fixes`
   - `agent2-api-routes-fixes`
   - `agent3-type-system-fixes`

2. **Vor jeder Änderung:**

   ```bash
   # Aktuellen Fehlerstand dokumentieren
   npx tsc --noEmit --skipLibCheck 2>&1 | wc -l > errors-before.txt

   # Spezifische Fehler für diesen Agent
   npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "[RELEVANTE_PATTERNS]" > agent-errors.txt
   ```

3. **Nach jeder Änderung:**

   ```bash
   # Fehlerstand nach Änderung
   npx tsc --noEmit --skipLibCheck 2>&1 | wc -l > errors-after.txt

   # Build-Test
   npm run build 2>&1 | head -50
   ```

4. **Konflikte vermeiden:**
   - Agent 1: Arbeitet nur an UI-Komponenten
   - Agent 2: Arbeitet nur an API-Routen
   - Agent 3: Arbeitet nur an Types/Hooks
   - Bei Überschneidungen: Koordination erforderlich

### Kommunikation

- Jeder Agent dokumentiert seine Änderungen in `AGENT[X]-CHANGES.md`
- Kritische Änderungen werden vorher besprochen
- Merge-Konflikte werden sofort gemeldet

---

## Finale Validierung

Nach Abschluss aller drei Agenten:

```bash
# 1. Finale Fehlerprüfung
npx tsc --noEmit --skipLibCheck 2>&1 | wc -l

# 2. Build-Test
npm run build

# 3. Linter-Check
npm run lint 2>&1 | head -50

# 4. Kritische Dateien prüfen
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS" | head -20
```

## Ziel

- **Ziel:** < 100 TypeScript-Fehler (aktuell ~1501)
- **Priorität:** Kritische Fehler zuerst (Build-Blocker)
- **Qualität:** Keine neuen Fehler einführen

---

## Wichtige Dateien für Referenz

### Type-Definitionen

- `lib/types/index.ts` - Haupt-Type-Definitionen
- `lib/types/chat.ts` - Chat-Types
- `lib/types/chatChannels.ts` - ChatChannel-Types

### Services

- `lib/services/_chatService.impl.ts` - Chat-Service Implementation
- `lib/services/index.ts` - Service-Exports

### Hooks

- `lib/hooks/useChat.ts` - Chat-Hooks

### Komponenten

- `components/admin/TemplateManager.tsx` - Template-Manager
- `app/(employee)/employee/dashboard/page.tsx` - Dashboard

### API Routes

- `app/api/chat/channels/route.ts` - Chat-Channels API
- `app/api/chat/direct/route.ts` - Direct-Chat API
- `app/api/admin/shifts/route.ts` - Shifts API

---

## Start-Befehl für jeden Agenten

```bash
# Agent 1
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent1-mui-grid-fixes
# Beginne mit: npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid\|mui" | head -30

# Agent 2
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent2-api-routes-fixes
# Beginne mit: npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | head -30

# Agent 3
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent3-type-system-fixes
# Beginne mit: npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70" | head -50
```

---

**Viel Erfolg! 🚀**



---

## Quelle: .github/PULL_REQUEST_TEMPLATE.md

# Pull Request

## Beschreibung

<!-- Beschreibe kurz, was dieser PR ändert -->

## Design-System-Checkliste

<!-- Bitte alle zutreffenden Punkte abhaken -->

### Framework & Architektur

- [ ] Es werden ausschließlich MUI-Komponenten verwendet (`@mui/material`, `@mui/x-*`)
- [ ] Keine neuen Tailwind-Klassen (`className="..."`) hinzugefügt
- [ ] Seite nutzt `AppLayout` als äußere Hülle (falls zutreffend)
- [ ] Seite nutzt `PageHeader` für Titel/Aktionen (falls zutreffend)

### Farben & Theme-Tokens

- [ ] Keine rohen Hex-/RGBA-Farben (`#...`, `rgb(...)`, `rgba(...)`) in Komponenten
- [ ] Farben verwenden `theme.palette.*` oder `THEME_CONSTANTS`
- [ ] Statusfarben nutzen `theme.palette.success|warning|info|error`

### Typografie & Abstände

- [ ] Typografie nutzt `Typography`-Varianten (`h1-h6`, `body1/2`, `button`, `caption`)
- [ ] Abstände sind Vielfache von `theme.spacing(1)` (8px-Grid)

### Layout-Pattern

- [ ] `PageHeader` wird für Titel/Aktionen verwendet (falls zutreffend)
- [ ] Keine eigenen Topbar/BottomBar-Implementierungen

### Tabellen & Listen

- [ ] Tabellen nutzen MUI `Table`/`DataGrid`
- [ ] Filter-/Suchleisten sind vorhanden (falls zutreffend)

### Formulare & Validierung

- [ ] Formulare nutzen `react-hook-form` + `zod` (falls vorhanden)
- [ ] MUI `TextField`/`Select` etc. werden verwendet
- [ ] Layout ist responsiv (1 Spalte XS/SM, 2 Spalten ab MD)

### Feedback & Interaktion

- [ ] Dialoge nutzen MUI `Dialog`/`Drawer`
- [ ] Snackbar für Feedback verwendet (zentrale Lösung)
- [ ] Loading-States nutzen `LoadingSpinner`/`Skeleton`

### A11y & Usability

- [ ] Alle `IconButton`s haben `aria-label`
- [ ] Interaktive Elemente sind per Tab erreichbar
- [ ] Fokuszustände sind sichtbar
- [ ] Interaktive Flächen mind. 40x40px

## Testing

- [ ] Manuell getestet
- [ ] Responsive Verhalten geprüft
- [ ] Tastatur-Navigation getestet

## Screenshots (falls UI-Änderungen)

<!-- Optional: Screenshots der Änderungen -->

## Weitere Hinweise

<!-- Zusätzliche Informationen für Reviewer -->



---

## Quelle: APP_ZUSAMMENFASSUNG.md

# JobFlow - Vollständige App-Zusammenfassung

**Stand:** 2025-01-27  
**Version:** 0.1.0  
**Status:** Production-Ready

---

## 📋 Übersicht

**JobFlow** ist eine moderne, DSGVO-konforme Webanwendung für die Verwaltung von Zeitarbeitsfirmen im medizinischen Bereich. Die App ermöglicht die vollständige Verwaltung von Personal, Schichten, Zeiterfassung, Lohnabrechnung und Kommunikation.

### Kernzweck

- **Personalplanung** für medizinisches Personal (Pflegekräfte, Ärzte, etc.)
- **Zeiterfassung** mit GPS-Tracking und ArbZG-Compliance
- **Lohnabrechnung** nach deutschem Steuerrecht (BMF-Lohnsteuertabelle 2025)
- **Schichtverwaltung** mit Konfliktprüfung und Verfügbarkeitsmanagement
- **Dokumentenverwaltung** für Qualifikationen und Nachweise

---

## 🛠️ Technologie-Stack

### Frontend

- **Framework:** Next.js 15.5.6 (App Router)
- **UI-Library:** React 18.3.1
- **Styling:** Material-UI (MUI) 7.3.4 + Tailwind CSS 4.1.17
- **Design:** Glasmorphism mit Dark Mode Support
- **State Management:** TanStack Query (React Query) 5.90.5
- **Formulare:** React Hook Form 7.65.0 + Zod 4.1.12
- **TypeScript:** 5.0.0 (strict mode)

### Backend & Services

- **Backend:** Firebase (Firestore, Auth, Storage, Functions)
- **Runtime:** Node.js 20
- **Cloud Functions:** Firebase Functions (Node.js 20)
- **Database:** Firestore (NoSQL)
- **Storage:** Firebase Storage
- **Authentication:** Firebase Auth (E-Mail/Passwort, optional OIDC-SSO)

### Entwicklung & Testing

- **Testing:** Playwright 1.56.1 (E2E-Tests)
- **Linting:** ESLint 8.57.1
- **Formatting:** Prettier 3.3.3
- **Error Tracking:** Sentry 8.30.0 (optional)
- **Monitoring:** Custom API-Monitoring

### PWA & Offline

- **PWA:** Service Worker + Manifest
- **Offline-Support:** Lokale Zwischenspeicherung mit Synchronisation
