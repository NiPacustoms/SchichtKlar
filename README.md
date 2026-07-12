# Schichtklar - Zeitarbeits-App für medizinisches Personal

## Deployment & Emulator

### Lokale Entwicklung

1. Umgebungsvariablen in `.env.local` setzen:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_USE_EMULATOR=true
```

2. Firebase Emulator starten:

```bash
firebase emulators:start
```

3. App starten:

```bash
npm run dev
```

Hinweis: In Dev verbindet sich die App bei `NEXT_PUBLIC_USE_EMULATOR=true` automatisch mit Auth/Firestore/Functions/Storage-Emulatoren.

### Firebase Hosting (SSR via Frameworks Backend)

1. Login/Projekt wählen:

```bash
firebase login
firebase use <PROJECT_ID>
```

2. Build & Deploy:

```bash
npm run build
firebase deploy
```

Konfiguration: `firebase.json` nutzt `frameworksBackend` (Region `europe-west1`) für SSR. Sicherheits-Header und CSP werden zentral in `middleware.ts` gesetzt.

## Go-Live Checkliste

- ENV geprüft
  - `NEXT_PUBLIC_FIREBASE_*` vollständig und korrekt (keine Fallbacks)
  - `NEXT_PUBLIC_USE_EMULATOR` in Produktion NICHT gesetzt
- Domains & HTTPS
  - Produktiv-Domain verknüpft (Firebase Hosting) und TLS aktiv
  - HSTS aktiv (via `middleware.ts` bei HTTPS), optional Preload geprüft
- Sicherheit
  - CSP Prod ohne `'unsafe-eval'/'unsafe-inline'`
  - Security-Header nur über `middleware.ts`
  - Admin-Bereich-Redirect greift ohne Session (`/admin` → `/login`)
- Firestore/Storage
  - `firestore.rules` und `firestore.indexes.json` deployed
  - `storage.rules` deployed
- SSR/Region
  - `firebase.json` `frameworksBackend.region=europe-west1`
  - Build erfolgreich: `npm run build`
- Monitoring & Logs
  - `SECURITY_WEBHOOK_URL` gesetzt (optional, nur serverseitig)
  - Error-Tracking/Analytics (optional) konfiguriert
- Backups & Recovery (optional)
  - Firestore/Storage Backup-Strategie dokumentiert

Eine moderne, DSGVO-konforme Zeitarbeits-App für medizinisches Personal mit Fokus auf Desktop-First Design und robuste Arbeitszeiterfassung.

## Architektur

Die App folgt einer **Domain-Driven-Design / Hexagonal-Architektur** (L8):

- **Domain/Application/Infrastructure** unter `src/` (Entities, Use Cases, Repositories, EventBus, Plugins)
- **Composition Root:** `src/composition.ts` – zentrale Verdrahtung aller Use Cases
- **App-Anbindung:** Plugins starten automatisch via `PluginInit`; Lese-Zugriffe z. B. über `useDomainAssignments` aus `lib/hooks/useDomainAssignments`

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [ARCHITECTURE-HEALTH.md](ARCHITECTURE-HEALTH.md).

## 🚀 Features

### 🔐 Authentifizierung & RBAC

- **Sichere Anmeldung** mit E-Mail/Passwort
- **Rollenbasierte Zugriffskontrolle** (Admin/Mitarbeiter). Betriebsmodell: Admin registriert Firma, lädt Mitarbeiter ein → Admin = admin, Mitarbeiter = nurse ([docs/ROLLEN-UND-EINLADUNGEN.md](docs/ROLLEN-UND-EINLADUNGEN.md))
- **Session-Persistierung** und automatische Weiterleitung
- **Account-Deaktivierung** für inaktive Benutzer

### 👥 Kundenverwaltung (Admin)

- **CRUD-Operationen** für Kunden und Einrichtungen
- **Standortverwaltung** mit vollständigen Adressdaten
- **Kontaktpersonen** und Kommunikationsdaten
- **Aktiv/Inaktiv-Status** mit Konfliktprüfung

### 👨‍⚕️ Mitarbeiterverwaltung (Admin)

- **Stammdaten** und Qualifikationen
- **Stundensatz** und Beschäftigungsart
- **Dokumentenverwaltung** mit Upload/Preview
- **Aktivitätsstatus** und Berechtigungen

### 📋 Auftragsverwaltung

- **Auftragserstellung** mit Kunden- und Mitarbeiterzuweisung
- **Verfügbarkeitsprüfung** und Konfliktvermeidung
- **Status-Workflow** (offen → zugewiesen → bestätigt/abgelehnt)
- **Benachrichtigungen** an zugewiesene Mitarbeiter

### ⏱️ Arbeitszeiterfassung (Mitarbeiter)

- **Start/Stop/Pause** mit GPS-Tracking
- **ArbZG-konforme Pausen** (30min nach 6h, 45min nach 9h)
- **Nettozeit-Berechnung** mit Pausenabzug
- **Offline-Support** mit lokaler Zwischenspeicherung

### ✍️ Signatur-Workflow

- **Digitale Unterschriften** für Arbeitszeiten
- **Mehrtage-Einsätze** mit Sammelsignatur (>7 Tage)
- **Rechtssichere Speicherung** mit Audit-Trail
- **Entsperrung** nur durch Admin mit Pflicht-Kommentar

### 📊 Live-Überwachung (Admin)

- **Tagesüberblick** mit laufenden Sessions
- **Automatische Prüfung** von ArbZG-Compliance
- **Warnungen** für fehlende GPS-Daten, Pausen, Überlappungen
- **Export-Funktionen** für Berichte und Abrechnungen

### 💰 Lohnabrechnung (Payroll)

- **Automatische Berechnung** basierend auf approved Timesheets
- **BMF-Lohnsteuertabelle 2025** mit korrekter Steuerberechnung
- **Kirchensteuer** und Solidaritätszuschlag (8%/9% bzw. 5,5%)
- **Sozialversicherung** mit Beitragsbemessungsgrenzen 2025
- **Lohnnebenkosten** (AG-Anteile, Unfallversicherung, Insolvenzgeldumlage)
- **MiLoG-Compliance** (Mindestlohn-Prüfung: 12,82 €/h)
- **ArbZG-Validierung** (Arbeitszeiten, Ruhezeiten, Pausen)
- **Minijob/Midijob-Unterstützung** (556 € / 556,01-2000 €)
- **Status-Workflow** (open → calculating → ready → approved → paid → locked)
- **PDF-Export** mit §108 GewO Pflichtangaben
- **DATEV-Export** für Buchhaltung
- **Lohnnebenkosten-Report** (nur Admin)
- **GoBD-konform**: Unveränderliche Berechnungen, Audit-Logging

**Performance:**
- Client-seitige Berechnung für < 50 Mitarbeiter (< 30s)
- Cloud Function für ≥ 50 Mitarbeiter (< 5min)
- Batch-Processing für Firestore-Writes (max 500 pro Batch)

**Sicherheit:**
- Firestore Security Rules mit Status-Validierung
- Gesperrte Perioden sind unveränderlich (GoBD)
- Nur Admin/Dispatcher können Perioden verwalten
- Audit-Logging für alle Aktionen

### 📱 PWA & Offline-Support

- **Progressive Web App** mit Install-Prompt
- **Offline-Funktionalität** für kritische Features
- **Automatische Synchronisation** bei Online-Wiederkehr
- **Konfliktbehandlung** für gleichzeitige Änderungen

## 🛠️ Technologie-Stack

- **Frontend**: React 18 + TypeScript + Webpack
- **UI Framework**: Material-UI (MUI) 5 mit Glasmorphism-Design
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **State Management**: React Query (TanStack Query)
- **Formulare**: React Hook Form + Zod Validierung
- **Routing**: React Router v6 mit RBAC-Guards
- **PWA**: Service Worker + Manifest
- **GPS**: Browser Geolocation API
- **Build**: Webpack 5 mit Code-Splitting und Optimierung

## 🎨 Design-System

### Farbpalette

- **Primary**: Petrol `#005f73`
- **Secondary**: Mustard `#e8aa42`
- **Background**: Dark `#252422`
- **Cards**: Glasmorphism `rgba(255,255,255,0.08)`

### Typografie

- **Font**: Inter (System-Fallback)
- **Hierarchie**: H1 32/40, H2 24/32, H3 20/28
- **Body**: 14/20, Button 14/20 semibold

### Layout

- **Desktop-First**: Optimiert für ≥1280px
- **Responsive**: Mobile als Fallback
- **Grid**: 8px-Basis mit 16/24/32 Multiplikatoren
- **Container**: max-width 1440px, Ziel 1200px

## 🔧 Setup & Installation

### Voraussetzungen

- Node.js 18+ und npm
- Firebase-Projekt mit aktivierten Services
- Git

### 1. Repository klonen

```bash
git clone https://github.com/your-org/jobflow.git
cd jobflow
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp env.example .env.local
```

Bearbeiten Sie `.env.local`:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 4. Firebase-Konfiguration

1. **Firestore Database** erstellen
2. **Authentication** mit E-Mail/Passwort aktivieren
3. **Storage** für Dokumente und Signaturen
4. **Security Rules** deployen:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die App ist unter `http://localhost:5173` verfügbar.

## 🏗️ Projektstruktur

```
src/
├── app/                    # App-Konfiguration
│   ├── layouts/           # Layout-Komponenten
│   ├── providers/         # Context Provider
│   └── router.tsx         # Routing-Konfiguration
├── components/            # Wiederverwendbare Komponenten
│   ├── auth/             # Authentifizierung
│   ├── feedback/         # Dialoge, Snackbars
│   ├── forms/            # Formular-Komponenten
│   ├── layout/           # Layout-Komponenten
│   └── tables/           # Tabellen-Komponenten
├── features/             # Feature-basierte Module
│   ├── auth/             # Authentifizierung
│   ├── customers/        # Kundenverwaltung
│   ├── employees/        # Mitarbeiterverwaltung
│   ├── orders/           # Auftragsverwaltung
│   ├── worktimes/        # Arbeitszeiterfassung
│   ├── documents/        # Dokumentenverwaltung
│   └── reports/          # Berichte & Exporte
├── hooks/                # Custom Hooks
├── services/             # Firebase Services
├── types/                # TypeScript-Definitionen
├── utils/                # Utility-Funktionen
└── theme/                # MUI Theme-Konfiguration
```

## 🔒 Sicherheit & DSGVO

### Datenschutz

- **Minimale Datenerfassung**: Nur notwendige GPS-Daten (Start/Ende)
- **Löschung**: Automatische Löschung nach gesetzlichen Fristen
- **Verschlüsselung**: Ende-zu-Ende-Verschlüsselung für sensible Daten
- **Audit-Trail**: Vollständige Protokollierung aller Änderungen

### Sicherheitsregeln

- **RBAC**: Strikte rollenbasierte Zugriffskontrolle
- **Validierung**: Server-seitige Validierung aller Eingaben
- **Rate Limiting**: Schutz vor Brute-Force-Angriffen
- **HTTPS**: Erzwungene HTTPS-Verbindung

### ArbZG-Compliance

- **Pausenzeiten**: Automatische Überprüfung der gesetzlichen Pausen
- **Arbeitszeitgrenzen**: Warnungen bei Überschreitung
- **Dokumentation**: Vollständige Protokollierung für Behörden

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Firebase Deploy

```bash
firebase deploy
```

### CI/CD Pipeline

Die GitHub Actions Pipeline automatisiert:

- Linting und TypeScript-Prüfung
- Production Build
- Firebase Deploy bei Push auf main

## 📱 PWA-Features

### Installation

- **Install-Prompt** für Desktop und Mobile
- **Offline-Funktionalität** für kritische Features
- **Push-Benachrichtigungen** für wichtige Events

### Offline-Support

- **Lokale Zwischenspeicherung** von Arbeitszeiten
- **Queue-System** für Offline-Änderungen
- **Automatische Synchronisation** bei Online-Wiederkehr

## 📊 Monitoring & Analytics

### Performance

- **Bundle-Analyse** mit Webpack Bundle Analyzer
- **Lighthouse CI** für Performance-Monitoring
- **Error Tracking** mit Sentry (optional)

### Logging

- **Strukturierte Logs** für Debugging
- **Error Boundaries** für Graceful Degradation
- **User Analytics** (anonymisiert)

## 🤝 Beitragen

### Development Workflow

1. **Feature Branch** erstellen: `git checkout -b feature/name`
2. **Änderungen** implementieren und testen
3. **Pull Request** mit Beschreibung erstellen
4. **Code Review** durchführen
5. **Merge** nach Approval

### Coding Standards

- **TypeScript strict mode**
- **ESLint + Prettier** für Code-Formatierung
- **Conventional Commits** für Git-Messages
- **Component Storybook** für UI-Komponenten

## 📄 Lizenz

Dieses Projekt ist proprietär und für den internen Gebrauch bestimmt.

## 🆘 Support

Bei Fragen oder Problemen:

- **Issues**: GitHub Issues für Bug-Reports
- **Documentation**: Inline-Kommentare und JSDoc
- **Team**: Interne Entwickler-Dokumentation

---

**Schichtklar** - Sichere, DSGVO-konforme Zeitarbeits-App für medizinisches Personal
