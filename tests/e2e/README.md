# E2E-Tests für JobFlow

Umfassende End-to-End-Tests mit Playwright, die Admin- und Mitarbeiter-Rollen (admin, nurse) und ihre kritischen User Flows abdecken.

## Setup

### 1. Environment-Variablen konfigurieren

Erstelle eine `.env.e2e` Datei im Projektwurzelverzeichnis (nicht in Git einchecken):

```bash
# Base URL für Tests (Standard: http://localhost:3000)
BASE_URL=http://localhost:3000

# E2E Test Mode aktivieren (Mock-Auth verwenden)
NEXT_PUBLIC_E2E_TEST=true

# Admin-Account (Rolle: admin)
E2E_ADMIN_EMAIL=admin@test.jobflow.local
E2E_ADMIN_PASSWORD=test-admin-password

# Mitarbeiter-Account (Rolle: nurse)
E2E_EMPLOYEE_EMAIL=nurse@test.jobflow.local
E2E_EMPLOYEE_PASSWORD=test-nurse-password
```

### 2. Playwright Browser installieren

```bash
npx playwright install --with-deps chromium
```

## Test-Struktur

```
tests/e2e/
├── fixtures/
│   ├── auth.ts          # Login-Helper für alle Rollen
│   └── test-data.ts     # Test-Daten-Generatoren
├── admin/               # Admin-Tests
│   ├── admin-dashboard.spec.ts
│   ├── admin-schichten-dashboard.spec.ts
│   ├── admin-dokumente-verwaltung.spec.ts
│   ├── admin-shifts-zuweisung.spec.ts
│   ├── mitarbeiter-verwaltung.spec.ts
│   ├── einrichtungen-verwaltung.spec.ts
│   ├── shifts-verwaltung.spec.ts
│   ├── berichte-export.spec.ts
│   ├── chat-system.spec.ts
│   └── lohnabrechnung.spec.ts
├── nurse/               # Nurse-Tests
│   ├── nurse-dashboard.spec.ts
│   ├── zeiterfassung.spec.ts
│   ├── dienstplan.spec.ts
│   ├── dokumente-upload.spec.ts
│   ├── assignments.spec.ts
│   └── chat.spec.ts
└── shared/              # Shared-Tests
    ├── auth-flow.spec.ts
    └── navigation.spec.ts
```

## Test-Ausführung

### Voraussetzungen

Stelle sicher, dass der Dev-Server läuft:

```bash
npm run dev
```

Oder setze `E2E_SKIP_SERVER=true` wenn der Server bereits läuft:

```bash
E2E_SKIP_SERVER=true npm run test:e2e
```

### Alle Tests ausführen

```bash
npm run test:e2e
```

### Tests im UI-Modus (interaktiv)

```bash
npm run test:e2e:ui
```

### Tests im Headed-Mode (Browser sichtbar)

```bash
npm run test:e2e:headed
```

### Spezifische Test-Suites

```bash
# Nur Admin-Tests
npm run test:e2e:admin

# Nur Nurse-Tests
npm run test:e2e:nurse

# Nur Shared-Tests
npm run test:e2e:shared
```

### Debug-Modus

```bash
npm run test:e2e:debug
```

### Code-Generator (für neue Tests)

```bash
npm run test:e2e:codegen
```

## Test-Abdeckung

### Admin-Tests
- Dashboard-Übersicht
- Mitarbeiterverwaltung (CRUD)
- Einrichtungsverwaltung (CRUD)
- Schichtverwaltung (CRUD)
- Berichte & Export (PDF/Excel)
- Chat-System
- Lohnabrechnung

### Nurse-Tests
- Dashboard-Übersicht
- Zeiterfassung (Start/Stop/Pause)
- Dienstplan-Anzeige
- Dokumente-Upload
- Assignments (Akzeptieren/Ablehnen)
- Chat

### Shared-Tests
- Authentifizierung (Login/Logout)
- Session-Persistierung
- Rollenbasierte Navigation
- Route-Guards
- 404-Seite

## Konfiguration

Die Playwright-Konfiguration befindet sich in `playwright.config.ts`:

- **Viewport**: 1440x900 (Desktop-First)
- **Browser**: Chromium, Firefox, WebKit
- **Retry**: 2x auf CI, 0x lokal
- **Screenshots/Video**: Bei Fehlern
- **Base URL**: Aus `.env.e2e` oder `http://localhost:3000`

## Best Practices

1. **Test-Isolation**: Jeder Test sollte unabhängig sein
2. **Wartezeiten**: Verwende `waitForLoadState('networkidle')` für stabile Tests
3. **Selektoren**: Bevorzuge `data-testid` Attribute
4. **Fehlerbehandlung**: Verwende `.catch(() => false)` für optionale Elemente
5. **Test-Daten**: Nutze `fixtures/test-data.ts` für generierte Daten

## Troubleshooting

### Tests schlagen fehl wegen Timeout

- Erhöhe `timeout` in `playwright.config.ts`
- Prüfe, ob der Dev-Server läuft (`npm run dev`)

### Login funktioniert nicht

- Prüfe `.env.e2e` Konfiguration
- Stelle sicher, dass `NEXT_PUBLIC_E2E_TEST=true` gesetzt ist
- Prüfe, ob Mock-Auth im Code aktiviert ist

### Elemente werden nicht gefunden

- Verwende Playwright Inspector: `npm run test:e2e:debug`
- Prüfe, ob die Seite vollständig geladen ist
- Verwende `page.waitForSelector()` für dynamische Elemente

## CI/CD Integration

Die Tests können in CI/CD-Pipelines integriert werden:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    BASE_URL: ${{ secrets.E2E_BASE_URL }}
    E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
    # ... weitere Credentials
```

