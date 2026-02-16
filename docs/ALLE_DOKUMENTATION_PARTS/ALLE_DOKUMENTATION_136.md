# JobFlow – Dokumentation Teil 136

*Zeichen 2682282–2702152 von 2862906*

---

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




---

## Quelle: docs/NOTIFICATION_BELL_VARIANTS.md

# 🔔 NotificationBell - Vollständige Varianten-Analyse

