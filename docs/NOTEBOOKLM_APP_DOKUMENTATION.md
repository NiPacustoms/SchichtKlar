# JobFlow - Vollständige App-Dokumentation für NotebookLM

**Stand:** 2025-01-27  
**Version:** 0.1.0  
**Status:** Production-Ready

---

## 1. PROJEKTÜBERSICHT

### 1.1 Was ist JobFlow?

JobFlow ist eine moderne, DSGVO-konforme Webanwendung für die Verwaltung von Zeitarbeitsfirmen im medizinischen Bereich. Die App ermöglicht die vollständige Verwaltung von Personal, Schichten, Zeiterfassung, Lohnabrechnung und Kommunikation.

### 1.2 Kernzweck

- **Personalplanung** für medizinisches Personal (Pflegekräfte, Ärzte, etc.)
- **Zeiterfassung** mit GPS-Tracking und ArbZG-Compliance
- **Lohnabrechnung** nach deutschem Steuerrecht (BMF-Lohnsteuertabelle 2025)
- **Schichtverwaltung** mit Konfliktprüfung und Verfügbarkeitsmanagement
- **Dokumentenverwaltung** für Qualifikationen und Nachweise

### 1.3 Zielgruppe

- **Administratoren:** Vollzugriff auf alle Funktionen
- **Disponenten:** Eingeschränkter Admin-Zugriff
- **Mitarbeiter (Nurse):** Zeiterfassung, Dokumente, eigene Daten

---

## 2. TECHNOLOGIE-STACK

### 2.1 Frontend-Technologien

**Framework & Core:**
- Next.js 15.5.6 (App Router) - React-Framework mit Server-Side Rendering
- React 18.3.1 - UI-Library
- TypeScript 5.0.0 (strict mode) - Typsichere Entwicklung

**UI & Styling:**
- Material-UI (MUI) 7.3.4 - Komponenten-Bibliothek
- Tailwind CSS 4.1.17 - Utility-First CSS
- Glasmorphism Design - Moderne UI-Ästhetik
- Dark Mode Support - Vollständiger Dark Mode

**State Management & Daten:**
- TanStack Query (React Query) 5.90.5 - Server-State Management
- React Hook Form 7.65.0 - Formular-Handling
- Zod 4.1.12 - Schema-Validierung

### 2.2 Backend & Services

**Firebase-Services:**
- Firestore (NoSQL-Datenbank) - Hauptdatenbank
- Firebase Auth - Authentifizierung
- Firebase Storage - Datei-Speicherung
- Firebase Functions (Node.js 20) - Serverless Functions
- Firebase Cloud Messaging (FCM) - Push-Notifications

**Runtime:**
- Node.js 20 - Server-Runtime

### 2.3 Entwicklung & Testing

- Playwright 1.56.1 - E2E-Testing
- ESLint 8.57.1 - Code-Linting
- Prettier 3.3.3 - Code-Formatierung
- Sentry 8.30.0 (optional) - Error-Tracking

### 2.4 PWA & Offline

- Service Worker - Offline-Funktionalität
- PWA Manifest - Installierbare App
- Lokale Zwischenspeicherung - Offline-Support

---

## 3. ROLLEN & BERECHTIGUNGEN

### 3.1 Admin (Administrator)

**Vollzugriff auf alle Funktionen:**
- Mitarbeiterverwaltung (CRUD)
- Einrichtungsverwaltung (CRUD)
- Schichtverwaltung (Erstellen, Zuweisen, Verwalten)
- Lohnabrechnung (Berechnung, Genehmigung, Export)
- Berichte & Exporte (PDF, Excel, DATEV)
- Systemeinstellungen (Firmendaten, Branding, Feature-Flags)
- Audit-Logs (Vollständige Protokollierung)
- Dokumentenverwaltung (Verifizierung, Ablaufverfolgung)

**Zugriffspfade:**
- `/admin/uebersicht` - Dashboard
- `/admin/mitarbeiter` - Mitarbeiterverwaltung
- `/admin/einrichtungen` - Einrichtungsverwaltung
- `/admin/schichten` - Schichtverwaltung
- `/admin/dienstplan` - Dienstplan
- `/admin/stunden` - Stundenübersicht
- `/admin/lohnabrechnung` - Lohnabrechnung
- `/admin/berichte` - Berichte
- `/admin/einstellungen` - Systemeinstellungen
- `/admin/audit-logs` - Audit-Logs

### 3.2 Dispatcher (Disponent)

**Eingeschränkter Admin-Zugriff:**
- Schichtverwaltung (Erstellen, Zuweisen)
- Mitarbeiterübersicht (Lesen)
- Stundenübersicht (Lesen, Export)
- Dokumentenverwaltung (Verifizierung)
- **KEIN Zugriff auf:**
  - Lohnabrechnung
  - Systemeinstellungen
  - Audit-Logs (nur Lesen)

**Zugriffspfade:**
- `/admin/schichten` - Schichtverwaltung
- `/admin/mitarbeiter` - Mitarbeiterübersicht (nur Lesen)
- `/admin/stunden` - Stundenübersicht
- `/admin/dokumenttypen` - Dokumentenverwaltung

### 3.3 Nurse (Mitarbeiter)

**Eingeschränkter Zugriff:**
- Eigene Zeiterfassung (Start/Stop/Pause)
- Eigene Schichten einsehen
- Eigene Dokumente hochladen
- Eigene Berichte anzeigen
- Profil verwalten
- Gehaltsabrechnungen anzeigen

**Zugriffspfade:**
- `/employee/arbeitsplatz` - Dashboard
- `/employee/dienstplan` - Dienstplan
- `/employee/zeiterfassung` - Zeiterfassung
- `/employee/zeiten` - Zeiten-Historie
- `/employee/dokumente` - Dokumente
- `/employee/einsaetze` - Einsätze
- `/employee/berichte` - Berichte
- `/employee/profil` - Profil
- `/employee/gehaltsabrechnungen` - Gehaltsabrechnungen

---

## 4. AUTHENTIFIZIERUNG & SICHERHEIT

### 4.1 Authentifizierung

**Login-Methoden:**
- E-Mail/Passwort-Login (Firebase Auth)
- Optional: OIDC-SSO (wenn `NEXT_PUBLIC_OIDC_PROVIDER_ID` konfiguriert)

**Features:**
- Session-Persistierung mit automatischer Weiterleitung
- Passwort-Reset per E-Mail
- E-Mail-Verifizierung
- Account-Deaktivierung für inaktive Benutzer

**Implementierung:**
- `contexts/AuthContext.tsx` - Authentifizierungs-Context
- `lib/services/authService.ts` - Auth-Service
- `app/api/auth/` - Auth-API-Endpunkte

### 4.2 Sicherheitsfeatures

**RBAC (Role-Based Access Control):**
- Rollenbasierte Navigation
- Route-Guards (`components/auth/RoleGuard.tsx`)
- Server-seitige Validierung

**Mandanten-Isolation:**
- `companyId` - Mandantenzugehörigkeit
- `tenantId` - Tenant-Isolation
- Firestore Security Rules mit Mandanten-Prüfung

**Sicherheitsregeln:**
- Firestore Security Rules (`firestore.rules`)
- Storage Security Rules (`storage.rules`)
- Rate Limiting für API-Endpunkte
- Security Headers (CSP, HSTS, etc.)

**Verschlüsselung:**
- Sensible Daten (Steuer-ID, IBAN, etc.) werden verschlüsselt gespeichert
- `lib/services/encryption/` - Verschlüsselungs-Service

**Audit-Logging:**
- Vollständige Protokollierung aller kritischen Aktionen
- `/admin/audit-logs` - Audit-Log-Viewer
- `lib/services/auditLogService.ts` - Audit-Log-Service

---

## 5. ADMIN-FUNKTIONEN (DETAILIERT)

### 5.1 Dashboard (`/admin/uebersicht`)

**Komponenten:**
- KPIs: Mitarbeiter, Schichten, Stunden, Auslastung
- Alerts: Fehlende Dokumente, Konflikte, Warnungen
- Aktuelle Aktivitäten: Live-Überblick über laufende Sessions
- Quick Actions: Schnellzugriff auf häufig genutzte Funktionen
- Charts: Wöchentliche/Monatliche Stunden, Auslastung

**Implementierung:**
- `app/(admin)/admin/uebersicht/page.tsx`
- `lib/hooks/useAdminDashboard.ts`
- `components/dashboard/` - Dashboard-Komponenten

### 5.2 Mitarbeiterverwaltung (`/admin/mitarbeiter`)

**Funktionen:**
- **Übersicht:** Liste aller Mitarbeiter mit Filtern (Name, E-Mail, Rolle, Status)
- **Detailansicht:** Vollständiges Profil mit allen Daten
- **Stammdaten:** Name, E-Mail, Telefon, Adresse
- **Qualifikationen:** Verwaltung von Zertifikaten und Nachweisen
- **Dokumente:** Upload, Preview, Ablaufverfolgung
- **Gehaltsdaten:** Mehrstufiges Formular:
  - Schritt 1: Vertragsdaten (Beschäftigungsart, Arbeitsstunden)
  - Schritt 2: Gehaltsdaten (Zahlungsart, Grundgehalt, Stundensatz)
  - Schritt 3: Steuerdaten (Steuer-ID, Steuerklasse, Kirchensteuer)
  - Schritt 4: Sozialversicherung (SV-Nummer, Krankenkasse)
  - Schritt 5: Bankdaten (IBAN, BIC - verschlüsselt)
  - Schritt 6: Zuschläge (Nacht, Wochenende, Feiertag)
- **Aktivitätsstatus:** Aktiv/Inaktiv, Urlaub, Krank
- **Berechtigungen:** Rollen, Facility-Zugriffe

**Implementierung:**
- `app/(admin)/admin/mitarbeiter/page.tsx`
- `app/(admin)/admin/mitarbeiter/[uid]/page.tsx`
- `app/(admin)/admin/mitarbeiter/[uid]/gehalt/page.tsx`
- `lib/services/users.ts`
- `lib/services/payroll.ts`

### 5.3 Einrichtungsverwaltung (`/admin/einrichtungen`)

**Funktionen:**
- CRUD-Operationen: Anlegen, Bearbeiten, Löschen
- Standortverwaltung: Vollständige Adressdaten
- Kontaktpersonen: Name, E-Mail, Telefon
- Stationen: Verwaltung von Stationen pro Einrichtung
- Abrechnungsdaten: Debitornummer, Rechnungsadresse, Steuernummer
- Status: Aktiv/Inaktiv mit Konfliktprüfung

**Implementierung:**
- `app/(admin)/admin/einrichtungen/page.tsx`
- `app/(admin)/admin/einrichtungen/[id]/page.tsx`
- `lib/services/facilities.ts`

### 5.4 Schichtverwaltung (`/admin/schichten`)

**Funktionen:**
- Schicht-Erstellung: Datum, Zeit, Typ (Früh/Spät/Nacht/On-call)
- Kapazitätsverwaltung: Max. Mitarbeiter pro Schicht
- Qualifikationsanforderungen: Erforderliche Qualifikationen
- Zuweisungen: Mitarbeiter zu Schichten zuweisen
- Konfliktprüfung: Automatische Prüfung auf Überlappungen
- Status-Workflow: Offen → Zugewiesen → Bestätigt/Abgelehnt
- Bulk-Aktionen: Mehrere Schichten gleichzeitig verwalten

**Implementierung:**
- `app/(admin)/admin/schichten/page.tsx`
- `lib/services/shifts.ts`
- `lib/services/assignments.ts`
- `components/schedule/` - Schicht-Komponenten

### 5.5 Dienstplan (`/admin/dienstplan`)

**Funktionen:**
- Kalenderansicht: Monats-/Wochenansicht
- Schichtübersicht: Alle Schichten mit Zuweisungen
- Drag & Drop: Zuweisungen per Drag & Drop verschieben
- Filter: Nach Einrichtung, Station, Mitarbeiter
- Export: PDF/Excel-Export

**Implementierung:**
- `app/(admin)/admin/dienstplan/page.tsx`
- `components/schedule/` - Kalender-Komponenten

### 5.6 Stundenübersicht (`/admin/stunden`)

**Funktionen:**
- Live-Überwachung: Aktuelle laufende Sessions
- ArbZG-Compliance: Automatische Prüfung von:
  - Pausenzeiten (30min nach 6h, 45min nach 9h)
  - Arbeitszeitgrenzen (max. 10h/Tag)
  - Ruhezeiten (11h zwischen Schichten)
- Warnungen: Fehlende GPS-Daten, fehlende Pausen, Überlappungen
- Historie: Alle erfassten Zeiten mit Filtern
- Export: PDF/Excel für Abrechnungen

**Implementierung:**
- `app/(admin)/admin/stunden/page.tsx`
- `lib/services/timesheets.ts`
- `lib/services/payroll/arbzgValidation.ts`

### 5.7 Lohnabrechnung (`/admin/lohnabrechnung`)

**Funktionen:**
- Abrechnungsperioden: Monatliche Abrechnungsperioden
- Automatische Berechnung: Basierend auf approved Timesheets
- BMF-Lohnsteuertabelle 2025: Korrekte Steuerberechnung
- Sozialversicherung: Mit Beitragsbemessungsgrenzen 2025
- Kirchensteuer: 8%/9% je nach Bundesland
- Solidaritätszuschlag: 5,5%
- MiLoG-Compliance: Mindestlohn-Prüfung (12,82 €/h)
- ArbZG-Validierung: Arbeitszeiten, Ruhezeiten, Pausen
- Minijob/Midijob: Unterstützung für 556 € / 556,01-2000 €
- Status-Workflow: Open → Calculating → Ready → Approved → Paid → Locked
- PDF-Export: Mit §108 GewO Pflichtangaben
- DATEV-Export: Für Buchhaltung
- Lohnnebenkosten-Report: AG-Anteile, Unfallversicherung, Insolvenzgeldumlage
- GoBD-konform: Unveränderliche Berechnungen, Audit-Logging

**Performance:**
- Client-seitige Berechnung für < 50 Mitarbeiter (< 30s)
- Cloud Function für ≥ 50 Mitarbeiter (< 5min)
- Batch-Processing für Firestore-Writes (max 500 pro Batch)

**Implementierung:**
- `app/(admin)/admin/lohnabrechnung/page.tsx`
- `lib/services/payroll/` - Lohnabrechnungs-Services:
  - `payrollCalculation.ts` - Hauptberechnung
  - `taxCalculation.ts` - Steuerberechnung
  - `socialSecurityCalculation.ts` - Sozialversicherung
  - `arbzgValidation.ts` - ArbZG-Validierung
  - `pdfGeneration.tsx` - PDF-Generierung
  - `datevExport.ts` - DATEV-Export

### 5.8 Berichte (`/admin/berichte`)

**Funktionen:**
- Statistiken: Mitarbeiter, Schichten, Stunden, Kosten
- Charts: Wöchentliche/Monatliche Trends
- Export: PDF, Excel, CSV
- Filter: Nach Zeitraum, Einrichtung, Mitarbeiter
- Scheduled Reports: Automatisierte Berichte (geplant)

**Implementierung:**
- `app/(admin)/admin/berichte/page.tsx`
- `lib/services/reports.ts`
- `lib/services/exportService.ts`

### 5.9 Dokumentenverwaltung (`/admin/dokumenttypen`)

**Funktionen:**
- Dokumenttypen: Verwaltung von Dokumentenkategorien
- Ablaufverfolgung: Automatische Warnung bei ablaufenden Dokumenten
- Verifizierung: Admin-Verifizierung von Dokumenten
- Templates: Vorlagen für Dokumente

**Implementierung:**
- `app/(admin)/admin/dokumenttypen/page.tsx`
- `lib/services/documentTypes.ts`
- `lib/services/documents.ts`

### 5.10 Einstellungen (`/admin/einstellungen`)

**Funktionen:**
- Firmendaten: Name, Logo, Kontaktdaten
- Branding: Logo-Upload, Farben
- Benachrichtigungen: E-Mail/Push-Einstellungen
- Feature-Flags: Aktivierung/Deaktivierung von Features
- Templates: Nachrichten-Templates
- Backup-Einstellungen: Automatische Backups

**Implementierung:**
- `app/(admin)/admin/einstellungen/page.tsx`
- `lib/services/settings.ts`
- `lib/services/adminSettings.ts`

### 5.11 Audit-Logs (`/admin/audit-logs`)

**Funktionen:**
- Vollständige Protokollierung: Alle kritischen Aktionen
- Filter: Nach Aktion, Benutzer, Zeitraum
- Export: CSV-Export für Compliance

**Implementierung:**
- `app/(admin)/admin/audit-logs/page.tsx`
- `lib/services/auditLogService.ts`
- `app/api/audit/logs/route.ts`

---

## 6. MITARBEITER-FUNKTIONEN (DETAILIERT)

### 6.1 Dashboard (`/employee/arbeitsplatz`)

**Funktionen:**
- Übersicht: Eigene Schichten, Zeiten, Dokumente
- Schnellzugriff: Häufig genutzte Funktionen
- Benachrichtigungen: Ungelesene Nachrichten, Warnungen

**Implementierung:**
- `app/(employee)/employee/arbeitsplatz/page.tsx`
- `lib/hooks/useEmployeeDashboard.ts`

### 6.2 Dienstplan (`/employee/dienstplan`)

**Funktionen:**
- Kalenderansicht: Eigene Schichten
- Details: Schicht-Informationen, Einrichtung, Station
- Status: Zugewiesen, Bestätigt, Abgelehnt

**Implementierung:**
- `app/(employee)/employee/dienstplan/page.tsx`
- `components/schedule/` - Kalender-Komponenten

### 6.3 Zeiterfassung (`/employee/zeiterfassung`)

**Funktionen:**
- Start/Stop: Arbeitszeit starten/stoppen
- Pause: Pausen erfassen
- GPS-Tracking: Automatische Standorterfassung (Start/Ende)
- ArbZG-konforme Pausen:
  - 30 Minuten nach 6 Stunden
  - 45 Minuten nach 9 Stunden
- Nettozeit-Berechnung: Automatischer Pausenabzug
- Offline-Support: Lokale Zwischenspeicherung
- Synchronisation: Automatische Synchronisation bei Online-Wiederkehr

**Workflow:**
1. Schicht starten → GPS-Tracking aktiviert
2. Pause → Automatische Pausenprüfung (ArbZG)
3. Schicht beenden → GPS-Tracking beendet
4. Nettozeit → Automatische Berechnung mit Pausenabzug
5. Signatur → Digitale Unterschrift erforderlich
6. Genehmigung → Admin-Genehmigung

**Implementierung:**
- `app/(employee)/employee/zeiterfassung/page.tsx`
- `lib/services/timesheets.ts`
- `lib/services/times.ts`
- `lib/hooks/useTimeTracking.ts`
- `components/time/` - Zeit-Komponenten

### 6.4 Zeiten (`/employee/zeiten`)

**Funktionen:**
- Historie: Alle erfassten Zeiten
- Kalenderansicht: Monats-/Wochenansicht
- Details: Start, Ende, Pausen, Nettozeit
- Status: Draft, Submitted, Approved, Rejected
- Export: PDF/Excel

**Implementierung:**
- `app/(employee)/employee/zeiten/page.tsx`
- `lib/services/timesheets.ts`

### 6.5 Dokumente (`/employee/dokumente`)

**Funktionen:**
- Upload: Dokumente hochladen (Gesundheit, Impfung, Qualifikation)
- Preview: Dokumente anzeigen
- Ablaufverfolgung: Warnung bei ablaufenden Dokumenten
- Status: Verifiziert, Ausstehend, Abgelehnt

**Implementierung:**
- `app/(employee)/employee/dokumente/page.tsx`
- `lib/services/documents.ts`
- `components/documents/` - Dokumenten-Komponenten

### 6.6 Einsätze (`/employee/einsaetze`)

**Funktionen:**
- Übersicht: Alle zugewiesenen Einsätze
- Details: Einrichtung, Station, Zeit, Status
- Signatur: Digitale Unterschrift für Arbeitszeiten
- Mehrtage-Einsätze: Sammelsignatur (>7 Tage)

**Implementierung:**
- `app/(employee)/employee/einsaetze/page.tsx`
- `lib/services/assignments.ts`
- `lib/services/timesheetProof.ts`

### 6.7 Berichte (`/employee/berichte`)

**Funktionen:**
- Persönliche Berichte: Eigene Arbeitszeiten
- Charts: Wöchentliche/Monatliche Trends
- Export: PDF/Excel

**Implementierung:**
- `app/(employee)/employee/berichte/page.tsx`
- `lib/services/employeeReports.ts`

### 6.8 Profil (`/employee/profil`)

**Funktionen:**
- Stammdaten: Name, E-Mail, Telefon, Adresse
- Notfallkontakt: Name, Telefon, E-Mail
- Bankdaten: IBAN, BIC (verschlüsselt)
- Bildung: Ausbildung, Zertifikate
- Führerschein: Klassen, eigenes Auto
- Benachrichtigungseinstellungen: E-Mail/Push

**Implementierung:**
- `app/(employee)/employee/profil/page.tsx`
- `components/profile/` - Profil-Komponenten

### 6.9 Gehaltsabrechnungen (`/employee/gehaltsabrechnungen`)

**Funktionen:**
- Übersicht: Alle Abrechnungsperioden
- PDF-Ansicht: Abrechnung anzeigen
- Download: PDF herunterladen

**Implementierung:**
- `app/(employee)/employee/gehaltsabrechnungen/page.tsx`
- `lib/services/employeePayslips.ts`

### 6.10 Benachrichtigungen (`/employee/benachrichtigungen`)

**Funktionen:**
- Übersicht: Alle Benachrichtigungen
- Typen: Schicht-Zuweisung, Erinnerung, Dokument-Ablauf, System
- Lesestatus: Gelesen/Ungelesen
- Filter: Nach Typ, Zeitraum

**Implementierung:**
- `app/(employee)/employee/benachrichtigungen/page.tsx`
- `lib/services/notifications.ts`
- `lib/services/employeeNotifications.ts`

---

## 7. ZEITERFASSUNG & SIGNATUREN

### 7.1 Zeiterfassung-Workflow

1. **Schicht starten:** GPS-Tracking aktiviert
2. **Pause:** Automatische Pausenprüfung (ArbZG)
3. **Schicht beenden:** GPS-Tracking beendet
4. **Nettozeit:** Automatische Berechnung mit Pausenabzug
5. **Signatur:** Digitale Unterschrift erforderlich
6. **Genehmigung:** Admin-Genehmigung

### 7.2 Signatur-Workflow

- **Digitale Unterschrift:** Canvas-basierte Signatur
- **Mehrtage-Einsätze:** Sammelsignatur nach >7 Tagen
- **Rechtssichere Speicherung:** Mit Audit-Trail
- **Entsperrung:** Nur durch Admin mit Pflicht-Kommentar
- **PDF-Generierung:** Automatische PDF-Erstellung mit Signaturen

**Implementierung:**
- `lib/services/timesheetProof.ts`
- `lib/services/documentGeneration.ts`

### 7.3 ArbZG-Compliance

**Pausenzeiten:**
- 30 Minuten nach 6 Stunden
- 45 Minuten nach 9 Stunden

**Arbeitszeitgrenzen:**
- Max. 10 Stunden pro Tag
- Max. 48 Stunden pro Woche (Durchschnitt)

**Ruhezeiten:**
- 11 Stunden zwischen Schichten

**Automatische Warnungen:** Bei Verstößen

**Implementierung:**
- `lib/services/payroll/arbzgValidation.ts`

---

## 8. LOHNABRECHNUNG (DETAILIERT)

### 8.1 Berechnungslogik

**Grundlage:** Approved Timesheets

**Steuerberechnung:**
- BMF-Lohnsteuertabelle 2025
- Steuerklassen 1-6
- Kinderfreibetrag
- Kirchensteuer (8%/9% je nach Bundesland)
- Solidaritätszuschlag (5,5%)

**Sozialversicherung:**
- Beitragsbemessungsgrenzen 2025
- Krankenversicherung
- Rentenversicherung
- Arbeitslosenversicherung
- Pflegeversicherung

**Zuschläge:**
- Nachtzuschlag
- Wochenendzuschlag
- Feiertagszuschlag
- On-Call-Zuschlag

**Minijob/Midijob:**
- Minijob: 556 €
- Midijob: 556,01-2000 €

**Implementierung:**
- `lib/services/payroll/payrollCalculation.ts`
- `lib/services/payroll/taxCalculation.ts`
- `lib/services/payroll/socialSecurityCalculation.ts`

### 8.2 Compliance

**MiLoG:** Mindestlohn-Prüfung (12,82 €/h)

**ArbZG:** Arbeitszeiten, Ruhezeiten, Pausen

**GoBD:** Unveränderliche Berechnungen, Audit-Logging

**§108 GewO:** Pflichtangaben in PDF

### 8.3 Export-Funktionen

- **PDF:** Vollständige Abrechnung mit allen Angaben
- **DATEV:** Export für Buchhaltung
- **Excel:** Für weitere Verarbeitung

**Implementierung:**
- `lib/services/payroll/pdfGeneration.tsx`
- `lib/services/payroll/datevExport.ts`

---

## 9. API-ENDPUNKTE

### 9.1 Authentifizierung

- `POST /api/auth/register-admin` - Admin-Registrierung
- `POST /api/auth/sync-claims` - Claims synchronisieren
- `POST /api/auth/accept-invite` - Einladung annehmen

### 9.2 Benutzer

- `GET /api/users/[userId]` - Benutzer abrufen
- `POST /api/user/data-export` - Datenexport (DSGVO)
- `POST /api/user/data-deletion` - Datenlöschung (DSGVO)

### 9.3 Chat (API vorhanden, UI entfernt)

- `GET /api/chat/channels` - Channels abrufen
- `POST /api/chat/channels` - Channel erstellen
- `GET /api/chat/messages` - Nachrichten abrufen
- `POST /api/chat/messages` - Nachricht senden
- `POST /api/chat/upload` - Datei-Upload

### 9.4 Lohnabrechnung

- `GET /api/payroll/items/[itemId]` - Abrechnung abrufen

### 9.5 Templates

- `GET /api/templates` - Templates abrufen
- `POST /api/templates` - Template erstellen
- `PUT /api/templates/[templateId]` - Template aktualisieren

### 9.6 Einladungen

- `GET /api/invitations` - Einladungen abrufen
- `POST /api/invitations` - Einladung erstellen
- `GET /api/invitations/[token]` - Einladung validieren

### 9.7 Audit

- `GET /api/audit/logs` - Audit-Logs abrufen

### 9.8 Health & Debug

- `GET /api/health` - Health-Check
- `GET /api/debug/whoami` - Aktueller Benutzer
- `GET /api/debug/admin-status` - Admin-Status

---

## 10. DATENMODELL (TYPESCRIPT-TYPEN)

### 10.1 User

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'nurse' | 'admin' | 'dispatcher';
  companyId?: string;
  phone?: string;
  qualifications: string[];
  workingHoursPerWeek?: number;
  documents: string[];
  active: boolean;
  currentStatus?: 'active' | 'inactive' | 'on-leave' | 'sick';
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    shiftReminders: boolean;
    documentExpiry: boolean;
    systemAnnouncements: boolean;
  };
  address?: { ... };
  contact?: { ... };
  emergencyContact?: { ... };
  bankAccount?: { ... };
  education?: { ... };
  driversLicense?: { ... };
  createdAt: Date;
  updatedAt: Date;
}
```

### 10.2 Facility

```typescript
interface Facility {
  id: string;
  companyId?: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  stations: Station[];
  colorCode: string;
  debtorNumber: string;
  billingAddress?: string;
  taxId?: string;
  vatId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 10.3 Shift

```typescript
interface Shift {
  id: string;
  facilityId: string;
  stationId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'Frühdienst' | 'Spätdienst' | 'Nachtdienst' | 'On-call';
  requiredQualifications: string[];
  maxStaff: number;
  status: 'open' | 'filled' | 'cancelled';
  capacity: number;
  assignedCount: number;
  tz: string;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 10.4 Assignment

```typescript
interface Assignment {
  id: string;
  userId: string;
  shiftId: string;
  status: 'requested' | 'accepted' | 'declined' | 'assigned' | 'completed' | 'pending-signature' | 'pending' | 'done';
  assignedAt: Date;
  employeeSignatureUrl?: string;
  adminSignatureUrl?: string;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 10.5 Timesheet

```typescript
interface Timesheet {
  id: string;
  userId: string;
  companyId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  employeeSignatureUrl?: string;
  facilitySignatureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Vollständige Typen:** `lib/types/index.ts`

---

## 11. DESIGN-SYSTEM

### 11.1 Farbpalette

- **Primary:** Petrol `#005f73`
- **Secondary:** Mustard `#e8aa42`
- **Background:** Dark `#252422`
- **Cards:** Glasmorphism `rgba(255,255,255,0.08)`

### 11.2 Typografie

- **Font:** Inter (System-Fallback)
- **Hierarchie:**
  - H1: 32/40
  - H2: 24/32
  - H3: 20/28
- **Body:** 14/20
- **Button:** 14/20 semibold

### 11.3 Layout

- **Desktop-First:** Optimiert für ≥1280px
- **Responsive:** Mobile als Fallback
- **Grid:** 8px-Basis mit 16/24/32 Multiplikatoren
- **Container:** max-width 1440px, Ziel 1200px

### 11.4 Komponenten

- **Glasmorphism:** Moderne UI-Ästhetik
- **Dark Mode:** Vollständiger Dark Mode Support
- **Material-UI:** Konsistente UI-Komponenten

**Implementierung:**
- `lib/theme.ts` - Theme-Konfiguration
- `components/ThemeProvider.tsx` - Theme-Provider
- `components/ui/` - UI-Komponenten

---

## 12. SICHERHEIT & DSGVO

### 12.1 Datenschutz

- **Minimale Datenerfassung:** Nur notwendige GPS-Daten (Start/Ende)
- **Löschung:** Automatische Löschung nach gesetzlichen Fristen
- **Verschlüsselung:** Ende-zu-Ende-Verschlüsselung für sensible Daten
- **Audit-Trail:** Vollständige Protokollierung aller Änderungen

### 12.2 Sicherheitsregeln

- **RBAC:** Strikte rollenbasierte Zugriffskontrolle
- **Validierung:** Server-seitige Validierung aller Eingaben
- **Rate Limiting:** Schutz vor Brute-Force-Angriffen
- **HTTPS:** Erzwungene HTTPS-Verbindung
- **Security Headers:** CSP, HSTS, etc.

### 12.3 DSGVO-Compliance

- **Datenexport:** `exportUserData` (Callable Function)
- **Datenlöschung:** `deleteUserData` (Soft-/Hard-Delete)
- **Consent-Management:** Cookie-Banner
- **Datenschutzerklärung:** Vollständige Dokumentation

**Implementierung:**
- `app/api/user/data-export/route.ts`
- `app/api/user/data-deletion/route.ts`
- `components/legal/CookieBanner.tsx`

### 12.4 ArbZG-Compliance

- **Pausenzeiten:** Automatische Überprüfung der gesetzlichen Pausen
- **Arbeitszeitgrenzen:** Warnungen bei Überschreitung
- **Dokumentation:** Vollständige Protokollierung für Behörden

---

## 13. PWA & OFFLINE-SUPPORT

### 13.1 PWA-Features

- **Install-Prompt:** Für Desktop und Mobile
- **Offline-Funktionalität:** Für kritische Features
- **Push-Benachrichtigungen:** Für wichtige Events
- **Service Worker:** Für Offline-Caching

**Implementierung:**
- `public/manifest.webmanifest`
- `components/pwa/InstallPrompt.tsx`
- Service Worker in `app/layout.tsx`

### 13.2 Offline-Support

- **Lokale Zwischenspeicherung:** Von Arbeitszeiten
- **Queue-System:** Für Offline-Änderungen
- **Automatische Synchronisation:** Bei Online-Wiederkehr
- **Konfliktbehandlung:** Für gleichzeitige Änderungen

**Implementierung:**
- `lib/services/offlineQueue.ts`

---

## 14. DEPLOYMENT

### 14.1 Production Build

```bash
npm run build
```

### 14.2 Firebase Deploy

```bash
firebase deploy
```

### 14.3 Konfiguration

- **Region:** `europe-west1` (Firebase Functions)
- **SSR:** Via Frameworks Backend
- **Security Headers:** In `middleware.ts`
- **CSP:** Content Security Policy aktiv

### 14.4 Go-Live Checkliste

- ✅ ENV geprüft
- ✅ Domains & HTTPS
- ✅ Sicherheit (CSP, Security Headers)
- ✅ Firestore/Storage Rules deployed
- ✅ SSR/Region konfiguriert
- ✅ Monitoring & Logs
- ✅ Backups & Recovery

---

## 15. PROJEKTSTRUKTUR

```
JobFlow/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin-Bereich
│   │   └── admin/                 # Admin-Features
│   ├── (employee)/                # Mitarbeiter-Bereich
│   │   └── employee/             # Mitarbeiter-Features
│   ├── (auth)/                    # Authentifizierung
│   ├── (app)/                     # App-Bereich
│   ├── api/                       # API-Routes
│   └── layout.tsx                 # Root Layout
├── components/                    # React-Komponenten
│   ├── admin/                     # Admin-Komponenten
│   ├── chat/                      # Chat-Komponenten
│   ├── common/                    # Gemeinsame Komponenten
│   ├── dashboard/                 # Dashboard-Komponenten
│   ├── documents/                 # Dokumenten-Komponenten
│   ├── errors/                    # Error-Komponenten
│   ├── layout/                    # Layout-Komponenten
│   ├── schedule/                  # Schicht-Komponenten
│   ├── time/                      # Zeit-Komponenten
│   └── ui/                        # UI-Komponenten
├── contexts/                      # React Contexts
│   ├── AuthContext.tsx            # Authentifizierung
│   ├── RoleContext.tsx            # Rollen
│   └── ThemeContext.tsx          # Theme
├── lib/                           # Bibliotheken & Utilities
│   ├── config/                    # Konfiguration
│   ├── constants/                 # Konstanten
│   ├── errors/                    # Error-Handling
│   ├── hooks/                     # Custom Hooks
│   ├── services/                  # Services
│   │   ├── payroll/               # Lohnabrechnung
│   │   └── encryption/            # Verschlüsselung
│   ├── types/                     # TypeScript-Typen
│   ├── utils/                     # Utilities
│   └── validation/                # Validierung
├── functions/                     # Firebase Functions
│   └── src/                       # Function-Source
├── docs/                          # Dokumentation
├── scripts/                       # Scripts
├── tests/                         # Tests
│   └── e2e/                       # E2E-Tests
└── public/                        # Statische Dateien
```

---

## 16. ENTWICKLUNG

### 16.1 Setup

1. Repository klonen
2. Dependencies installieren: `npm install`
3. Umgebungsvariablen: `.env.local` konfigurieren
4. Firebase Emulator: `firebase emulators:start`
5. Development Server: `npm run dev`

### 16.2 Scripts

- `npm run dev` - Development Server
- `npm run build` - Production Build
- `npm run start` - Production Server
- `npm run lint` - Linting
- `npm run typecheck` - TypeScript-Prüfung
- `npm run test:e2e` - E2E-Tests

### 16.3 Coding Standards

- TypeScript strict mode
- ESLint + Prettier für Code-Formatierung
- Conventional Commits für Git-Messages

---

## 17. FEATURE-STATUS

### 17.1 ✅ Vollständig implementiert

- Authentifizierung & RBAC
- Mitarbeiterverwaltung
- Einrichtungsverwaltung
- Schichtverwaltung
- Zeiterfassung mit GPS
- Signatur-Workflow
- Lohnabrechnung
- Dokumentenverwaltung
- Berichte & Exporte
- PWA & Offline-Support
- Benachrichtigungen
- Audit-Logs

### 17.2 ⚠️ Teilweise implementiert

- Chat-System (aus UI entfernt, API bleibt)
- Erweiterte Reporting-Features
- Bulk-Import/Export

### 17.3 🔄 Geplant

- Automatisierte Reports (Scheduled)
- Custom Report Builder
- Erweiterte DSGVO-Features
- Performance-Optimierungen

---

## 18. WICHTIGE DATEIEN & ORTE

### 18.1 Authentifizierung

- `contexts/AuthContext.tsx` - Auth-Context
- `lib/services/authService.ts` - Auth-Service
- `components/auth/RoleGuard.tsx` - Route-Guard
- `app/api/auth/` - Auth-API

### 18.2 Lohnabrechnung

- `lib/services/payroll/` - Lohnabrechnungs-Services
- `app/(admin)/admin/lohnabrechnung/page.tsx` - Admin-UI
- `app/(employee)/employee/gehaltsabrechnungen/page.tsx` - Mitarbeiter-UI

### 18.3 Zeiterfassung

- `lib/services/timesheets.ts` - Timesheet-Service
- `lib/services/times.ts` - Time-Entry-Service
- `app/(employee)/employee/zeiterfassung/page.tsx` - Zeiterfassung-UI

### 18.4 Schichtverwaltung

- `lib/services/shifts.ts` - Shift-Service
- `lib/services/assignments.ts` - Assignment-Service
- `app/(admin)/admin/schichten/page.tsx` - Admin-UI

### 18.5 Dokumentation

- `docs/` - Vollständige Dokumentation
- `README.md` - Projekt-Übersicht
- `APP_ZUSAMMENFASSUNG.md` - App-Zusammenfassung

---

## 19. ZUSAMMENFASSUNG

JobFlow ist eine vollständige, production-ready Webanwendung für die Verwaltung von Zeitarbeitsfirmen im medizinischen Bereich. Die App bietet:

- **Vollständige Personalverwaltung** mit Rollen und Berechtigungen
- **Schichtverwaltung** mit Konfliktprüfung
- **Zeiterfassung** mit GPS-Tracking und ArbZG-Compliance
- **Lohnabrechnung** nach deutschem Steuerrecht
- **Dokumentenverwaltung** für Qualifikationen
- **Berichte & Exporte** für Abrechnungen
- **DSGVO-Compliance** mit Audit-Logging
- **PWA & Offline-Support** für mobile Nutzung

Die App ist in Next.js 15 mit TypeScript entwickelt, nutzt Firebase als Backend und Material-UI für die UI-Komponenten.

---

**Ende der Dokumentation**

*Letzte Aktualisierung: 2025-01-27*

