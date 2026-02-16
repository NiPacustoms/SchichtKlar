<!-- 1bf43c8e-4bdb-4e26-a86a-8365163d85cf 0791e841-8338-4515-a3de-7801bc74b0dd -->

# JobFlow - Aurora Glasmorphism Design Implementation

## Architektur-Ansatz

Implementierung in bestehender Feature-Struktur unter `/src/features/` mit:

- **Design**: Aurora Glasmorphism (Tailwind CSS, GlassCard-Komponenten)
- **Parallel zu MUI**: Neue Features mit Aurora-Design, bestehende MUI-Features bleiben
- **Wiederverwendbare UI**: Neue Komponenten unter `/src/components/ui/`

## Phase 1: UI-Foundation & Typsystem (Priorität: KRITISCH)

### 1.1 Aurora UI-Komponenten erstellen

- `src/components/ui/GlassCard.tsx` - Glasmorphism Card mit backdrop-blur
- `src/components/ui/PrimaryButton.tsx` - Petrol-farbiger Button
- `src/components/ui/Modal.tsx` - Glasmorphism Modal/Dialog
- `src/components/ui/Input.tsx` - Styled Input-Felder
- Tailwind-Config erweitern: Petrol-Farben, Glasmorphism-Utilities

### 1.2 Typsystem & Zod-Schemas

- `src/types/jobflow.ts` - Alle Interfaces: Timesheet, Shift, UserProfile, Document, Message, Notification, Assignment, AuditLog
- Zod-Schemas für Laufzeit-Validierung
- Custom Claims Types für Rollen

### 1.3 Base Services

- `src/services/assignmentsService.ts` - CRUD für Assignments
- `src/services/notificationsService.ts` - CRUD für Notifications
- `src/services/auditLogService.ts` - Audit-Logging
- `src/services/documentsService.ts` - Dokument-Upload zu Firebase Storage

## Phase 2: Firebase Backend (Priorität: KRITISCH)

### 2.1 Firebase Functions Setup

- `functions/src/auth.ts` - setUserRole, Custom Claims
- `functions/src/userTriggers.ts` - onCreate User → default role
- `functions/src/auditLog.ts` - Auto-Logging bei Änderungen
- `functions/src/notifications.ts` - Push-Notifications
- `functions/src/index.ts` - Export aller Functions

### 2.2 Firestore Security Rules

- `firestore.rules` - Custom Claims Integration, Rollenprüfung
- Assignment/Notification/Document Rules
- Channel-Access basierend auf Assignments
- Dokumentenvalidierung (Größe, Typ)

## Phase 3: Auth & Rollen (Priorität: HOCH)

### 3.1 Auth-Integration

- `src/features/auth/hooks/useAuth.ts` erweitern mit Firebase Auth
- Custom Claims auslesen, hasRole() Helper
- Token Refresh, Persistenz

### 3.2 Admin Rollenverwaltung

- `src/features/admin/pages/UserRolesPage.tsx` - Neue Seite
- `src/features/admin/components/UserRoleManagement.tsx` - Liste + Rollen-Editor
- Cloud Function Integration für setUserRole

## Phase 4: Dienstplan (Priorität: HOCH)

### 4.1 User-Funktionen

- `src/features/schedule/components/ScheduleView.tsx` erweitern
- acceptShift/rejectShift implementieren mit Assignments
- Konflikterkennung, Benachrichtigungen

### 4.2 Admin-Verwaltung

- `src/features/admin/pages/ShiftManagementPage.tsx` - Neue Seite
- `src/features/admin/components/ShiftManager.tsx` - CRUD, Zuweisung
- Qualifikationsprüfung, Konfliktwarnung, Bulk-Import

### 4.3 Validation Utils

- `src/utils/scheduleUtils.ts` - validateShift, checkQualifications, calculateAvailability

## Phase 5: Einrichtungen & Mitarbeiter (Priorität: MITTEL)

### 5.1 Einrichtungsverwaltung

- `src/features/facilities/pages/FacilityManagementPage.tsx`
- `src/features/facilities/components/FacilityEditor.tsx` - CRUD für Facilities + Stationen

### 5.2 Mitarbeiterverwaltung

- `src/features/employees/pages/EmployeeManagementPage.tsx` erweitern
- Filter, Qualifikationen, Urlaubskonto, Dokumentenstatus

### 5.3 User-Profile

- `src/features/auth/pages/ProfilePage.tsx` erweitern
- Stammdaten, Passwort ändern, Notifications-Settings

## Phase 6: Dokumente (Priorität: HOCH)

### 6.1 Upload & Verwaltung

- `src/features/documents/components/DocumentUploadDialog.tsx` - Upload mit Progress
- Firebase Storage Integration, Metadaten, Preview

### 6.2 Admin-Verifizierung

- `src/features/admin/pages/DocumentVerificationPage.tsx`
- `src/features/admin/components/DocumentVerifier.tsx` - Verifizieren/Ablehnen, Filter

## Phase 7: Chat & Notifications (Priorität: MITTEL)

### 7.1 Realtime Chat

- `src/features/messenger/components/ChatView.tsx` erweitern mit onSnapshot
- Typing-Indicator, Online-Status
- Channel-basiert (Station/Schicht/Direkt/Broadcast)

### 7.2 Push-Notifications

- Service Worker für FCM
- Cloud Function Trigger für Events
- In-App Notification Center

### 7.3 Notification Center

- `src/features/notifications/components/NotificationCenter.tsx`
- Badge, Dropdown, Archiv

## Phase 8: Dashboard & Reports (Priorität: MITTEL)

### 8.1 Admin-Dashboard

- `src/features/dashboard/pages/AdminDashboardPage.tsx` erweitern
- KPIs, Einrichtungsübersicht, Kommende Schichten, Ablaufende Docs, Quick Actions

### 8.2 Reports

- `src/features/reports/pages/ReportsPage.tsx` erweitern
- Stundenauswertung, Einsatzübersicht, Kostenrechnung, Urlaub
- PDF/Excel Export

### 8.3 Audit-Log-Viewer

- `src/features/admin/pages/AuditLogPage.tsx`
- Filter, Details, CSV-Export

## Phase 9: Zeiterfassung Extended (Priorität: NIEDRIG)

### 9.1 PDF-Export & Signatur

- `src/services/pdfExportService.ts` - PDF-Generierung
- `src/features/worktimes/components/SignatureModal.tsx` - Canvas-Signatur

### 9.2 Stunden-Statistiken

- `src/features/worktimes/components/TimeStatistics.tsx`
- Charts, Aggregationen

## Phase 10: Testing (Priorität: MITTEL)

### 10.1 Unit Tests

- `src/test/unit/` - Utils, Services, Hooks, Schemas

### 10.2 Integration Tests

- `src/test/integration/` - Auth, Zeiterfassung, Dienstplan, Upload

### 10.3 E2E Tests

- `src/test/e2e/` - Playwright/Cypress für User-Flows

### 10.4 Firebase Emulator Tests

- Seed-Daten, Security Rules, Functions lokal

### 10.5 CI/CD

- `.github/workflows/ci.yml` - Linting, Tests, Build
- `.github/workflows/deploy.yml` - Preview Channels, Production

## Phase 11: Performance (Priorität: NIEDRIG)

### 11.1 Code-Splitting

- Dynamic Imports für große Komponenten

### 11.2 Firestore Optimierung

- Indizes, Pagination, Caching

### 11.3 Assets

- Image-Optimierung, WebP, CDN

## Phase 12: Production (Priorität: NIEDRIG)

### 12.1 Environment

- `.env` Files, Feature-Flags

### 12.2 Monitoring

- Firebase Analytics, Crashlytics, Performance

### 12.3 Backup

- Firestore-Backups, Restore-Prozedur

### 12.4 DSGVO

- Cookie-Banner, Datenschutz, Datenexport, Löschfunktion

## Implementierungsreihenfolge

1. Phase 1 (UI + Types) - Foundation
2. Phase 2 (Firebase) - Backend
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
- [ ] Unit Tests: Utils, Services, Hooks, Zod-Schemas testen mit Jest
- [ ] Integration Tests: Auth-Flow, Zeiterfassung, Dienstplan, Dokument-Upload testen
- [ ] E2E Tests: Playwright/Cypress für Pflegekraft-, Admin-, Dispatcher-Szenarien
- [ ] Firebase Emulator Tests: Seed-Daten, Security Rules, Cloud Functions lokal testen
- [ ] CI/CD Pipeline: GitHub Actions für Linting, Tests, Build, Preview Channels, Production Deploy
- [ ] Performance-Optimierung: Code-Splitting, Lazy Loading, Firestore-Indizes, Caching, Image-Optimierung
- [ ] Produktions-Deployment: Umgebungsvariablen, Monitoring, Backup-Strategie, DSGVO-Compliance
