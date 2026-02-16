# JobFlow – Dokumentation Teil 8

*Zeichen 139169–159008 von 2862906*

---

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
  - `NEXT_PUBLIC_SECURITY_WEBHOOK_URL`/`SECURITY_WEBHOOK_URL` gesetzt (optional)
  - Error-Tracking/Analytics (optional) konfiguriert
- Backups & Recovery (optional)
  - Firestore/Storage Backup-Strategie dokumentiert

Eine moderne, DSGVO-konforme Zeitarbeits-App für medizinisches Personal mit Fokus auf Desktop-First Design und robuste Arbeitszeiterfassung.

## 🚀 Features

### 🔐 Authentifizierung & RBAC

- **Sichere Anmeldung** mit E-Mail/Passwort
- **Rollenbasierte Zugriffskontrolle** (Admin/Mitarbeiter)
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

**JobFlow** - Sichere, DSGVO-konforme Zeitarbeits-App für medizinisches Personal



---

## Quelle: SECURITY.md

# Sicherheit – JobFlow

## Git & Secrets (Best Practice)

### Was wir umsetzen

- **Keine Secrets im Repository**  
  API Keys, Passwörter, Tokens und Service-Account-Dateien gehören **nicht** in Git. Sie stehen in `.env`, `.env.local`, `.env.e2e` o. Ä. – diese Dateien sind in `.gitignore`.

- **Nur Platzhalter committen**  
  Erlaubt sind z. B. `.env.example` und `.env.e2e.example` mit Werten wie `your_api_key_here` oder `your_password`. Echte Werte nur lokal/CI setzen.

- **Pre-Commit Secret-Scan (Gitleaks)**  
  Vor jedem Commit prüft ein Hook, ob gestagte Dateien bekannte Secret-Muster enthalten. Wenn **Gitleaks** installiert ist (`brew install gitleaks`), blockiert der Hook den Commit bei Fund. Ohne Gitleaks wird nur ein Hinweis ausgegeben.

- **Manueller Scan**  
  `npm run secret-scan` (bzw. `bash scripts/secret-scan.sh`) – sinnvoll vor Push oder in CI.

### Wenn ein Secret versehentlich committet wurde

1. **Sofort rotieren**  
   Betroffenen Key/Token/Passwort in der jeweiligen Plattform (Firebase, Google Cloud, etc.) widerrufen oder neu erzeugen.

2. **Aus der Historie entfernen**  
   Mit `git filter-repo` oder `git filter-branch` den Wert aus der Historie löschen (Vorsicht: Rewrite, Abstimmung im Team nötig). Alternativ: neues Repo ohne Historie und Keys überall rotieren.

3. **Nie nur den Key aus der letzten Version löschen**  
   Alte Commits bleiben in der Historie und in Forks/Clones sichtbar.

### Empfohlene Tools

- **Gitleaks** – Secret-Scanning: [github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks)  
  Install: `brew install gitleaks`
- **Git** – Signed commits (optional): `git config commit.gpgsign true` + GPG-Key

### Branch-Protection (GitHub/GitLab)

- `main` schützen: Mindestens 1 Review, Status-Checks (z. B. CI inkl. Secret-Scan), keine Force-Pushes.
- Optional: „Require signed commits“ aktivieren.

### Historie-Bereinigung (durchgeführt)

Die Git-Historie wurde mit `git filter-repo` bereinigt:

- **`.env.e2e`** wurde aus der gesamten Historie entfernt (Datei existiert in keinem Commit mehr).
- **Firebase-Konfiguration** in alten Commits (`src/config/firebase.ts`): API Key, Projekt-ID, App-ID etc. wurden durch Platzhalter `__REDACTED__` ersetzt.

**Wichtig nach der Bereinigung:** Die Historie wurde umgeschrieben (neue Commit-Hashes). Damit die bereinigte Historie für alle gilt, muss **einmalig** ein Force-Push erfolgen:

```bash
git push origin main --force
```

Alle, die das Repo bereits geklont haben, sollten danach neu klonen oder `git fetch origin && git reset --hard origin/main` ausführen. Andere Branches (z. B. `fix/hosting-build`) müssen ggf. neu aufgesetzt oder mit der neuen `main` rebased werden.

---

*Bei Sicherheitsvorfällen: Verantwortliche Person bzw. Team intern kontaktieren.*



---

## Quelle: SOTA_ANALYSE.md

# SOTA-Analyse: JobFlow Codebase

## Executive Summary

Die JobFlow-App zeigt bereits gute Grundlagen, hat aber noch Verbesserungspotenzial in mehreren Bereichen, um State-of-the-Art (SOTA) Standards zu erreichen.

**Gesamtbewertung: 7/10**

### Stärken ✅
- Gutes Error Handling System vorhanden (AppError, ErrorHandler)
- API Routes haben strukturiertes Error Handling
- React Query wird verwendet
- Rate Limiting implementiert
- TypeScript wird verwendet

### Verbesserungsbereiche 🔧
- Services verwenden noch `throw new Error()` statt AppError
- Hooks haben viele `any` Types (96 matches)
- Console Statements in Hooks (9 Dateien)
- Fehlende Konsistenz im Error Handling
- Keine einheitliche Retry-Logik

---

## 1. API Routes (Bewertung: 8/10)

### ✅ Gut implementiert:
- Strukturiertes Error Handling mit try-catch
- Rate Limiting vorhanden
- Request Validation mit Zod
- Logger wird verwendet
- Proper HTTP Status Codes

### 🔧 Verbesserungen:

#### 1.1 Konsistentes Error Handling
**Problem:** API Routes verwenden unterschiedliche Error-Response-Formate

**Beispiel aus `app/api/admin/shifts/route.ts`:**
```typescript
// Aktuell: Unterschiedliche Formate
return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
return NextResponse.json({ success: false, error: '...', code: 'UNAUTHENTICATED' }, { status: 401 });
```

**SOTA Lösung:**
```typescript
// Einheitliches Error-Response-Format
interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    userMessage: string;
    details?: Record<string, unknown>;
  };
}

// Helper-Funktion
function createErrorResponse(error: AppError, status: number): NextResponse {
  return NextResponse.json({
    success: false,
    error: {
      code: error.code,
      message: error.technicalMessage,
      userMessage: error.userMessage,
      details: error.metadata.additionalData,
    }
  }, { status });
}
```

#### 1.2 AppError Integration
**Problem:** API Routes transformieren Errors manuell statt AppError zu verwenden

**SOTA Lösung:**
```typescript
import { errorHandler } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // ... logic
  } catch (error: unknown) {
    const appError = errorHandler.handleFirebaseError(error, {
      component: 'GET /api/admin/shifts',
      route: '/api/admin/shifts'
    });
    
    logger.error('Error in GET /api/admin/shifts', appError);
    return createErrorResponse(appError, getHttpStatusFromError(appError));
  }
}
```

---

## 2. Services (Bewertung: 6/10)

### ❌ Kritische Probleme:

#### 2.1 Fehlende AppError Verwendung
**Problem:** Services verwenden `throw new Error()` statt AppError

**Statistik:**
- `lib/services/shifts.ts`: 19 `throw` Statements, 0 AppError Verwendungen
- `lib/services/assignments.ts`: 15 `throw` Statements
- Gesamt: 577 `throw` Statements in Services

**Beispiel aus `lib/services/shifts.ts`:**
```typescript
// ❌ NICHT SOTA
if (!companyId) {
  throw new Error('No companyId found for shift');
}

// ✅ SOTA
if (!companyId) {
  throw createAppError(
    new Error('No companyId found for shift'),
    ErrorCode.VALIDATION_REQUIRED_FIELD,
    { component: 'shiftService', action: 'create' }
  );
}
```

#### 2.2 Inconsistent Error Handling
**Problem:** Manche Services verwenden Logger, andere nicht

**SOTA Lösung:**
```typescript
import { errorHandler, logger, createAppError, ErrorCode } from '@/lib/errors';

export const shiftService = {
  async create(data: ShiftCreateInput): Promise<string> {
    try {
      // ... logic
    } catch (error: unknown) {
      const appError = errorHandler.handleFirebaseError(error, {
        component: 'shiftService',
        action: 'create'
      });
      
      logger.error('Failed to create shift', appError, { shiftData: data });
      throw appError;
    }
  }
}
```

#### 2.3 Fehlende Retry-Logik
**Problem:** Keine automatische Retry-Logik für transient errors

**SOTA Lösung:**
```typescript
import { retry } from '@/lib/retry';

export const shiftService = {
  async getAll(filters: ShiftFilters): Promise<Shift[]> {
    return retry(
      async () => {
        // ... Firestore query
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
        retryableErrors: ['unavailable', 'deadline-exceeded']
      }
    );
  }
}
```

---

## 3. React Hooks (Bewertung: 6.5/10)

### ❌ Probleme:

#### 3.1 Type Safety
**Problem:** 96 `any` Types in 14 Hook-Dateien

**Beispiel aus `lib/hooks/useChat.ts`:**
```typescript
// ❌ NICHT SOTA
/* eslint-disable @typescript-eslint/no-explicit-any */
const convertedNewMessages = (newMessages as ChatMessage[]).map(m => convertChatMessage(m, channelId));
lastMessageAt: ch.lastMessage?.createdAt instanceof Date ? ch.lastMessage.createdAt : (ch.lastMessage?.createdAt as any)?.toDate(),

// ✅ SOTA
interface TimestampLike {
  toDate(): Date;
}

function isTimestamp(value: unknown): value is TimestampLike {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as TimestampLike).toDate === 'function';
}

const lastMessageAt = isTimestamp(ch.lastMessage?.createdAt) 
  ? ch.lastMessage.createdAt.toDate()
  : ch.lastMessage?.createdAt instanceof Date 
    ? ch.lastMessage.createdAt 
    : undefined;
```

#### 3.2 Console Statements
**Problem:** 9 Hook-Dateien verwenden noch `console.error/log`

**Betroffene Dateien:**
- `lib/hooks/useShifts.ts` (Zeile 42)
- `lib/hooks/useChat.ts`
- `lib/hooks/useReports.ts`
- `lib/hooks/usePushNotifications.ts`
- `lib/hooks/usePerformanceMonitoring.ts`
- `lib/hooks/usePerformance.ts`
- `lib/hooks/useFCM.ts`
- `lib/hooks/useChatChannels.ts`
- `lib/hooks/useAdminChatMessages.ts`

**SOTA Lösung:**
```typescript
// ❌ NICHT SOTA
catch (err) {
  console.error('Error fetching shifts:', err);
  return [];
}

// ✅ SOTA
import { logger } from '@/lib/logging';

catch (err) {
  logger.error('Error fetching shifts', err instanceof Error ? err : new Error(String(err)), {
    component: 'useShifts',
    action: 'fetchShifts'
  });
  return [];
}
```

#### 3.3 React Query Best Practices
**Problem:** Fehlende Error Transformation in React Query

**Beispiel aus `lib/hooks/useShifts.ts`:**
```typescript
// ❌ NICHT SOTA
const { data: shifts = [], isLoading, error } = useQuery<Shift[]>({
  queryKey: ['shifts', filtersWithCompanyId],
  queryFn: async () => {
    try {
      return await shiftService.getAll(filtersWithCompanyId);
    } catch (err) {
