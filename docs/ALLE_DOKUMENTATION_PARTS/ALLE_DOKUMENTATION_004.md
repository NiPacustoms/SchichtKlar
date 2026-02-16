# JobFlow – Dokumentation Teil 4

*Zeichen 59638–79526 von 2862906*

---

- **Push-Notifications:** Firebase Cloud Messaging (FCM)

---

## 👥 Rollen & Berechtigungen

### 1. **Admin** (Administrator)

Vollzugriff auf alle Funktionen:

- Mitarbeiterverwaltung
- Einrichtungsverwaltung
- Schichtverwaltung
- Lohnabrechnung
- Berichte & Exporte
- Systemeinstellungen
- Audit-Logs

### 2. **Dispatcher** (Disponent)

Eingeschränkter Admin-Zugriff:

- Schichtverwaltung
- Mitarbeiterübersicht
- Stundenübersicht
- Dokumentenverwaltung
- Keine Lohnabrechnung
- Keine Systemeinstellungen

### 3. **Nurse** (Mitarbeiter)

Eingeschränkter Zugriff:

- Eigene Zeiterfassung
- Eigene Schichten einsehen
- Eigene Dokumente hochladen
- Eigene Berichte
- Profil verwalten

---

## 🚀 Hauptfunktionen

### 1. Authentifizierung & Sicherheit

#### Authentifizierung

- **E-Mail/Passwort-Login** mit Firebase Auth
- **Optional:** OIDC-SSO (wenn `NEXT_PUBLIC_OIDC_PROVIDER_ID` konfiguriert)
- **Session-Persistierung** mit automatischer Weiterleitung
- **Passwort-Reset** per E-Mail
- **E-Mail-Verifizierung**

#### Sicherheitsfeatures

- **RBAC (Role-Based Access Control)** mit rollenbasierter Navigation
- **Mandanten-Isolation** über `companyId` und `tenantId`
- **Firestore Security Rules** mit strikter Zugriffskontrolle
- **Rate Limiting** für API-Endpunkte
- **Security Headers** (CSP, HSTS, etc.)
- **Verschlüsselung** für sensible Daten (Steuer-ID, IBAN, etc.)
- **Audit-Logging** für alle kritischen Aktionen

---

### 2. Admin-Funktionen

#### 2.1 Dashboard (`/admin/uebersicht`)

- **KPIs:** Mitarbeiter, Schichten, Stunden, Auslastung
- **Alerts:** Fehlende Dokumente, Konflikte, Warnungen
- **Aktuelle Aktivitäten:** Live-Überblick über laufende Sessions
- **Quick Actions:** Schnellzugriff auf häufig genutzte Funktionen
- **Charts:** Wöchentliche/Monatliche Stunden, Auslastung

#### 2.2 Mitarbeiterverwaltung (`/admin/mitarbeiter`)

- **Übersicht:** Liste aller Mitarbeiter mit Filtern
- **Detailansicht:** Vollständiges Profil mit allen Daten
- **Stammdaten:** Name, E-Mail, Telefon, Adresse
- **Qualifikationen:** Verwaltung von Zertifikaten und Nachweisen
- **Dokumente:** Upload, Preview, Ablaufverfolgung
- **Gehaltsdaten:** Mehrstufiges Formular für:
  - Vertragsdaten (Beschäftigungsart, Arbeitsstunden)
  - Gehaltsdaten (Zahlungsart, Grundgehalt, Stundensatz)
  - Steuerdaten (Steuer-ID, Steuerklasse, Kirchensteuer)
  - Sozialversicherung (SV-Nummer, Krankenkasse)
  - Bankdaten (IBAN, BIC - verschlüsselt)
  - Zuschläge (Nacht, Wochenende, Feiertag)
- **Aktivitätsstatus:** Aktiv/Inaktiv, Urlaub, Krank
- **Berechtigungen:** Rollen, Facility-Zugriffe

#### 2.3 Einrichtungsverwaltung (`/admin/einrichtungen`)

- **CRUD-Operationen:** Anlegen, Bearbeiten, Löschen
- **Standortverwaltung:** Vollständige Adressdaten
- **Kontaktpersonen:** Name, E-Mail, Telefon
- **Stationen:** Verwaltung von Stationen pro Einrichtung
- **Abrechnungsdaten:** Debitornummer, Rechnungsadresse, Steuernummer
- **Status:** Aktiv/Inaktiv mit Konfliktprüfung

#### 2.4 Schichtverwaltung (`/admin/schichten`)

- **Schicht-Erstellung:** Datum, Zeit, Typ (Früh/Spät/Nacht/On-call)
- **Kapazitätsverwaltung:** Max. Mitarbeiter pro Schicht
- **Qualifikationsanforderungen:** Erforderliche Qualifikationen
- **Zuweisungen:** Mitarbeiter zu Schichten zuweisen
- **Konfliktprüfung:** Automatische Prüfung auf Überlappungen
- **Status-Workflow:** Offen → Zugewiesen → Bestätigt/Abgelehnt
- **Bulk-Aktionen:** Mehrere Schichten gleichzeitig verwalten

#### 2.5 Dienstplan (`/admin/dienstplan`)

- **Kalenderansicht:** Monats-/Wochenansicht
- **Schichtübersicht:** Alle Schichten mit Zuweisungen
- **Drag & Drop:** Zuweisungen per Drag & Drop verschieben
- **Filter:** Nach Einrichtung, Station, Mitarbeiter
- **Export:** PDF/Excel-Export

#### 2.6 Stundenübersicht (`/admin/stunden`)

- **Live-Überwachung:** Aktuelle laufende Sessions
- **ArbZG-Compliance:** Automatische Prüfung von:
  - Pausenzeiten (30min nach 6h, 45min nach 9h)
  - Arbeitszeitgrenzen (max. 10h/Tag)
  - Ruhezeiten (11h zwischen Schichten)
- **Warnungen:** Fehlende GPS-Daten, fehlende Pausen, Überlappungen
- **Historie:** Alle erfassten Zeiten mit Filtern
- **Export:** PDF/Excel für Abrechnungen

#### 2.7 Lohnabrechnung (`/admin/lohnabrechnung`)

- **Abrechnungsperioden:** Monatliche Abrechnungsperioden
- **Automatische Berechnung:** Basierend auf approved Timesheets
- **BMF-Lohnsteuertabelle 2025:** Korrekte Steuerberechnung
- **Sozialversicherung:** Mit Beitragsbemessungsgrenzen 2025
- **Kirchensteuer:** 8%/9% je nach Bundesland
- **Solidaritätszuschlag:** 5,5%
- **MiLoG-Compliance:** Mindestlohn-Prüfung (12,82 €/h)
- **ArbZG-Validierung:** Arbeitszeiten, Ruhezeiten, Pausen
- **Minijob/Midijob:** Unterstützung für 556 € / 556,01-2000 €
- **Status-Workflow:** Open → Calculating → Ready → Approved → Paid → Locked
- **PDF-Export:** Mit §108 GewO Pflichtangaben
- **DATEV-Export:** Für Buchhaltung
- **Lohnnebenkosten-Report:** AG-Anteile, Unfallversicherung, Insolvenzgeldumlage
- **GoBD-konform:** Unveränderliche Berechnungen, Audit-Logging

**Performance:**

- Client-seitige Berechnung für < 50 Mitarbeiter (< 30s)
- Cloud Function für ≥ 50 Mitarbeiter (< 5min)
- Batch-Processing für Firestore-Writes (max 500 pro Batch)

#### 2.8 Berichte (`/admin/berichte`)

- **Statistiken:** Mitarbeiter, Schichten, Stunden, Kosten
- **Charts:** Wöchentliche/Monatliche Trends
- **Export:** PDF, Excel, CSV
- **Filter:** Nach Zeitraum, Einrichtung, Mitarbeiter
- **Scheduled Reports:** Automatisierte Berichte (geplant)

#### 2.9 Dokumentenverwaltung (`/admin/dokumenttypen`)

- **Dokumenttypen:** Verwaltung von Dokumentenkategorien
- **Ablaufverfolgung:** Automatische Warnung bei ablaufenden Dokumenten
- **Verifizierung:** Admin-Verifizierung von Dokumenten
- **Templates:** Vorlagen für Dokumente

#### 2.10 Einstellungen (`/admin/einstellungen`)

- **Firmendaten:** Name, Logo, Kontaktdaten
- **Branding:** Logo-Upload, Farben
- **Benachrichtigungen:** E-Mail/Push-Einstellungen
- **Feature-Flags:** Aktivierung/Deaktivierung von Features
- **Templates:** Nachrichten-Templates
- **Backup-Einstellungen:** Automatische Backups

#### 2.11 Audit-Logs (`/admin/audit-logs`)

- **Vollständige Protokollierung:** Alle kritischen Aktionen
- **Filter:** Nach Aktion, Benutzer, Zeitraum
- **Export:** CSV-Export für Compliance

---

### 3. Mitarbeiter-Funktionen

#### 3.1 Dashboard (`/employee/arbeitsplatz`)

- **Übersicht:** Eigene Schichten, Zeiten, Dokumente
- **Schnellzugriff:** Häufig genutzte Funktionen
- **Benachrichtigungen:** Ungelesene Nachrichten, Warnungen

#### 3.2 Dienstplan (`/employee/dienstplan`)

- **Kalenderansicht:** Eigene Schichten
- **Details:** Schicht-Informationen, Einrichtung, Station
- **Status:** Zugewiesen, Bestätigt, Abgelehnt

#### 3.3 Zeiterfassung (`/employee/zeiterfassung`)

- **Start/Stop:** Arbeitszeit starten/stoppen
- **Pause:** Pausen erfassen
- **GPS-Tracking:** Automatische Standorterfassung (Start/Ende)
- **ArbZG-konforme Pausen:**
  - 30 Minuten nach 6 Stunden
  - 45 Minuten nach 9 Stunden
- **Nettozeit-Berechnung:** Automatischer Pausenabzug
- **Offline-Support:** Lokale Zwischenspeicherung
- **Synchronisation:** Automatische Synchronisation bei Online-Wiederkehr

#### 3.4 Zeiten (`/employee/zeiten`)

- **Historie:** Alle erfassten Zeiten
- **Kalenderansicht:** Monats-/Wochenansicht
- **Details:** Start, Ende, Pausen, Nettozeit
- **Status:** Draft, Submitted, Approved, Rejected
- **Export:** PDF/Excel

#### 3.5 Dokumente (`/employee/dokumente`)

- **Upload:** Dokumente hochladen (Gesundheit, Impfung, Qualifikation)
- **Preview:** Dokumente anzeigen
- **Ablaufverfolgung:** Warnung bei ablaufenden Dokumenten
- **Status:** Verifiziert, Ausstehend, Abgelehnt

#### 3.6 Einsätze (`/employee/einsaetze`)

- **Übersicht:** Alle zugewiesenen Einsätze
- **Details:** Einrichtung, Station, Zeit, Status
- **Signatur:** Digitale Unterschrift für Arbeitszeiten
- **Mehrtage-Einsätze:** Sammelsignatur (>7 Tage)

#### 3.7 Berichte (`/employee/berichte`)

- **Persönliche Berichte:** Eigene Arbeitszeiten
- **Charts:** Wöchentliche/Monatliche Trends
- **Export:** PDF/Excel

#### 3.8 Profil (`/employee/profil`)

- **Stammdaten:** Name, E-Mail, Telefon, Adresse
- **Notfallkontakt:** Name, Telefon, E-Mail
- **Bankdaten:** IBAN, BIC (verschlüsselt)
- **Bildung:** Ausbildung, Zertifikate
- **Führerschein:** Klassen, eigenes Auto
- **Benachrichtigungseinstellungen:** E-Mail/Push

#### 3.9 Gehaltsabrechnungen (`/employee/gehaltsabrechnungen`)

- **Übersicht:** Alle Abrechnungsperioden
- **PDF-Ansicht:** Abrechnung anzeigen
- **Download:** PDF herunterladen

#### 3.10 Benachrichtigungen (`/employee/benachrichtigungen`)

- **Übersicht:** Alle Benachrichtigungen
- **Typen:** Schicht-Zuweisung, Erinnerung, Dokument-Ablauf, System
- **Lesestatus:** Gelesen/Ungelesen
- **Filter:** Nach Typ, Zeitraum

---

### 4. Zeiterfassung & Signaturen

#### 4.1 Zeiterfassung-Workflow

1. **Schicht starten:** GPS-Tracking aktiviert
2. **Pause:** Automatische Pausenprüfung (ArbZG)
3. **Schicht beenden:** GPS-Tracking beendet
4. **Nettozeit:** Automatische Berechnung mit Pausenabzug
5. **Signatur:** Digitale Unterschrift erforderlich
6. **Genehmigung:** Admin-Genehmigung

#### 4.2 Signatur-Workflow

- **Digitale Unterschrift:** Canvas-basierte Signatur
- **Mehrtage-Einsätze:** Sammelsignatur nach >7 Tagen
- **Rechtssichere Speicherung:** Mit Audit-Trail
- **Entsperrung:** Nur durch Admin mit Pflicht-Kommentar
- **PDF-Generierung:** Automatische PDF-Erstellung mit Signaturen

#### 4.3 ArbZG-Compliance

- **Pausenzeiten:**
  - 30 Minuten nach 6 Stunden
  - 45 Minuten nach 9 Stunden
- **Arbeitszeitgrenzen:**
  - Max. 10 Stunden pro Tag
  - Max. 48 Stunden pro Woche (Durchschnitt)
- **Ruhezeiten:**
  - 11 Stunden zwischen Schichten
- **Automatische Warnungen:** Bei Verstößen

---

### 5. Lohnabrechnung

#### 5.1 Berechnungslogik

- **Grundlage:** Approved Timesheets
- **Steuerberechnung:** BMF-Lohnsteuertabelle 2025
- **Sozialversicherung:** Mit Beitragsbemessungsgrenzen 2025
- **Kirchensteuer:** 8%/9% je nach Bundesland
- **Solidaritätszuschlag:** 5,5%
- **Zuschläge:** Nacht, Wochenende, Feiertag
- **Minijob/Midijob:** Spezielle Berechnung

#### 5.2 Compliance

- **MiLoG:** Mindestlohn-Prüfung (12,82 €/h)
- **ArbZG:** Arbeitszeiten, Ruhezeiten, Pausen
- **GoBD:** Unveränderliche Berechnungen, Audit-Logging
- **§108 GewO:** Pflichtangaben in PDF

#### 5.3 Export-Funktionen

- **PDF:** Vollständige Abrechnung mit allen Angaben
- **DATEV:** Export für Buchhaltung
- **Excel:** Für weitere Verarbeitung

---

### 6. Kommunikation

#### 6.1 Chat-System

**⚠️ HINWEIS:** Das Chat-System wurde aus der UI entfernt (2025-01-XX). Die API-Endpunkte bleiben bestehen, sind aber nicht mehr über die UI erreichbar.

**Ehemalige Funktionen:**

- 1:1-Chat und Gruppenchat
- Live-Updates (onSnapshot)
- Lesebestätigungen
- Datei-Uploads (Bilder/PDF)
- Suche/Filter in Channel-Liste

#### 6.2 Benachrichtigungen

- **Push-Notifications:** Firebase Cloud Messaging (FCM)
- **E-Mail-Benachrichtigungen:** Für wichtige Events
- **In-App-Benachrichtigungen:** Echtzeit-Updates
- **Typen:**
  - Schicht-Zuweisung
  - Schicht-Erinnerung
  - Dokument-Ablauf
  - System-Ankündigungen
  - Signatur-Erforderlich

---

### 7. Dokumentenverwaltung

#### 7.1 Dokumenttypen

- **Gesundheit:** Gesundheitszeugnisse, Impfungen
- **Qualifikation:** Zertifikate, Weiterbildungen
- **Sonstiges:** Weitere Dokumente

#### 7.2 Features

- **Upload:** Datei-Upload mit Validierung
- **Preview:** Dokumente anzeigen
- **Ablaufverfolgung:** Automatische Warnung
- **Verifizierung:** Admin-Verifizierung
- **Verschlüsselung:** Sichere Speicherung

---

### 8. Berichte & Exporte

#### 8.1 Admin-Berichte

- **Statistiken:** Mitarbeiter, Schichten, Stunden, Kosten
- **Charts:** Wöchentliche/Monatliche Trends
- **Export:** PDF, Excel, CSV
- **Filter:** Nach Zeitraum, Einrichtung, Mitarbeiter

#### 8.2 Mitarbeiter-Berichte

- **Persönliche Berichte:** Eigene Arbeitszeiten
- **Charts:** Wöchentliche/Monatliche Trends
- **Export:** PDF, Excel

#### 8.3 Export-Formate

- **PDF:** Für Abrechnungen und Berichte
- **Excel:** Für weitere Verarbeitung
- **CSV:** Für Datenimport
- **DATEV:** Für Buchhaltung

---

## 🎨 Design-System

### Farbpalette

- **Primary:** Petrol `#005f73`
- **Secondary:** Mustard `#e8aa42`
- **Background:** Dark `#252422`
- **Cards:** Glasmorphism `rgba(255,255,255,0.08)`

### Typografie

- **Font:** Inter (System-Fallback)
- **Hierarchie:**
  - H1: 32/40
  - H2: 24/32
  - H3: 20/28
- **Body:** 14/20
- **Button:** 14/20 semibold

### Layout

- **Desktop-First:** Optimiert für ≥1280px
- **Responsive:** Mobile als Fallback
- **Grid:** 8px-Basis mit 16/24/32 Multiplikatoren
- **Container:** max-width 1440px, Ziel 1200px

### Komponenten

- **Glasmorphism:** Moderne UI-Ästhetik
- **Dark Mode:** Vollständiger Dark Mode Support
- **Material-UI:** Konsistente UI-Komponenten

---

## 🔒 Sicherheit & DSGVO

### Datenschutz

- **Minimale Datenerfassung:** Nur notwendige GPS-Daten (Start/Ende)
- **Löschung:** Automatische Löschung nach gesetzlichen Fristen
- **Verschlüsselung:** Ende-zu-Ende-Verschlüsselung für sensible Daten
- **Audit-Trail:** Vollständige Protokollierung aller Änderungen

### Sicherheitsregeln

- **RBAC:** Strikte rollenbasierte Zugriffskontrolle
- **Validierung:** Server-seitige Validierung aller Eingaben
- **Rate Limiting:** Schutz vor Brute-Force-Angriffen
- **HTTPS:** Erzwungene HTTPS-Verbindung
- **Security Headers:** CSP, HSTS, etc.

### DSGVO-Compliance

- **Datenexport:** `exportUserData` (Callable Function)
- **Datenlöschung:** `deleteUserData` (Soft-/Hard-Delete)
- **Consent-Management:** Cookie-Banner
- **Datenschutzerklärung:** Vollständige Dokumentation

### ArbZG-Compliance

- **Pausenzeiten:** Automatische Überprüfung der gesetzlichen Pausen
- **Arbeitszeitgrenzen:** Warnungen bei Überschreitung
- **Dokumentation:** Vollständige Protokollierung für Behörden

---

## 📱 PWA & Offline-Support

### PWA-Features

- **Install-Prompt:** Für Desktop und Mobile
- **Offline-Funktionalität:** Für kritische Features
- **Push-Benachrichtigungen:** Für wichtige Events
- **Service Worker:** Für Offline-Caching

### Offline-Support

- **Lokale Zwischenspeicherung:** Von Arbeitszeiten
- **Queue-System:** Für Offline-Änderungen
- **Automatische Synchronisation:** Bei Online-Wiederkehr
- **Konfliktbehandlung:** Für gleichzeitige Änderungen

---

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Firebase Deploy

```bash
firebase deploy
```

### Konfiguration

- **Region:** `europe-west1` (Firebase Functions)
- **SSR:** Via Frameworks Backend
- **Security Headers:** In `middleware.ts`
- **CSP:** Content Security Policy aktiv

### Go-Live Checkliste

- ✅ ENV geprüft
- ✅ Domains & HTTPS
- ✅ Sicherheit (CSP, Security Headers)
- ✅ Firestore/Storage Rules deployed
- ✅ SSR/Region konfiguriert
- ✅ Monitoring & Logs
- ✅ Backups & Recovery

---

## 📊 Monitoring & Analytics

### Performance

- **Bundle-Analyse:** Mit Webpack Bundle Analyzer
- **Lighthouse CI:** Für Performance-Monitoring
- **Error Tracking:** Mit Sentry (optional)

### Logging

- **Strukturierte Logs:** Für Debugging
- **Error Boundaries:** Für Graceful Degradation
- **User Analytics:** Anonymisiert

### API-Monitoring

- **Health-Check:** `/api/health`
- **Status-Seite:** `/status`
- **Rate Limiting:** Für API-Endpunkte

---

## 📁 Projektstruktur

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
│   └── ThemeContext.tsx           # Theme
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

## 🔧 Entwicklung

### Setup

1. **Repository klonen**
2. **Dependencies installieren:** `npm install`
3. **Umgebungsvariablen:** `.env.local` konfigurieren
4. **Firebase Emulator:** `firebase emulators:start`
5. **Development Server:** `npm run dev`

### Scripts

- `npm run dev` - Development Server
- `npm run build` - Production Build
- `npm run start` - Production Server
- `npm run lint` - Linting
- `npm run typecheck` - TypeScript-Prüfung
- `npm run test:e2e` - E2E-Tests

### Coding Standards

- **TypeScript strict mode**
- **ESLint + Prettier** für Code-Formatierung
- **Conventional Commits** für Git-Messages

---

## 📚 Dokumentation

### Essentielle Dokumentation

- **README.md** - Projekt-Übersicht
- **ADMIN_GUIDE.md** - Admin-Benutzerhandbuch
- **LOHNABRECHNUNG_USER_GUIDE.md** - Lohnabrechnung Benutzerhandbuch
- **ENVIRONMENT_SETUP.md** - Environment-Variablen Setup
- **FIREBASE_SETUP.md** - Firebase-Projekt Setup
- **GO_LIVE_CHECKLIST.md** - Go-Live Checkliste
- **PRODUCTION_READY_CHECKLIST.md** - Production-Ready Checkliste
- **DISASTER_RECOVERY.md** - Disaster Recovery Runbook
- **DSGVO_PROZESSE.md** - DSGVO-Prozesse
- **CHANGELOG.md** - Änderungsprotokoll

### Weitere Dokumentation

Siehe `docs/ESSENTIELLE_DOKUMENTATION.md` für eine vollständige Liste.

---

## 🎯 Feature-Status

### ✅ Vollständig implementiert

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

### ⚠️ Teilweise implementiert

- Chat-System (aus UI entfernt, API bleibt)
- Erweiterte Reporting-Features
- Bulk-Import/Export

### 🔄 Geplant

- Automatisierte Reports (Scheduled)
- Custom Report Builder
- Erweiterte DSGVO-Features
- Performance-Optimierungen

---

## 📈 Performance

### Optimierungen

- **Code-Splitting:** Automatisches Code-Splitting
- **Caching:** React Query Caching
- **Lazy Loading:** Komponenten-Lazy-Loading
- **Bundle-Size:** Optimierte Bundle-Größe

### Metriken

- **Ladezeit:** < 3s (First Contentful Paint)
- **Interaktivität:** < 5s (Time to Interactive)
- **Bundle-Size:** < 500KB (initial)

---

