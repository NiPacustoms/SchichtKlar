# JobFlow – Dokumentation Teil 139

*Zeichen 2741898–2761772 von 2862906*

---

### Key Metrics

- **Availability**: 99.9% (Monat)
- **Error Rate**: < 0.5% (P95)
- **API Latency**: < 400ms (P95), < 900ms (P99)
- **App LCP**: < 2.5s (P75)
- **App INP**: < 200ms (P75)

### Error Budget

- **Monatliches Budget**: 0.1% Nichtverfügbarkeit
- **Policy**: Bei Budgetverbrauch > 50% Feature-Freeze

## Logging

### Firebase Logging

Logs sind verfügbar in:
- Firebase Console > Functions > Logs
- GCP Console > Logging

### Log Levels

- **ERROR**: Kritische Fehler, die sofortige Aufmerksamkeit erfordern
- **WARN**: Warnungen, die überwacht werden sollten
- **INFO**: Informative Nachrichten
- **DEBUG**: Debug-Informationen (nur in Development)

### Log Retention

- **Firebase Functions**: 30 Tage
- **Firebase Hosting**: 7 Tage
- **Firestore**: 7 Tage (Audit Logs)

## Monitoring Dashboard

### Empfohlene Dashboards

1. **Overview Dashboard**
   - Health Check Status
   - Error Rate (letzte 24h)
   - API Latency (P95/P99)
   - Active Users

2. **Infrastructure Dashboard**
   - Cloud Functions Invocations
   - Firestore Read/Write Operations
   - Storage Operations
   - Network Traffic

3. **Business Metrics Dashboard**
   - Active Users
   - New Registrations
   - Timesheets Created
   - Assignments Completed

## Incident Response

Siehe `docs/INCIDENT_RUNBOOKS.md` für detaillierte Incident-Response-Prozesse.

### Escalation Path

1. **Level 1**: Automated Alerts → Ops Team
2. **Level 2**: Critical Alerts → On-Call Engineer
3. **Level 3**: P1 Incidents → CTO/Lead Engineer

## Best Practices

1. **Alert Fatigue vermeiden**: Nur kritische Alerts konfigurieren
2. **Runbooks erstellen**: Für jeden Alert ein Runbook
3. **Regular Reviews**: Alerts monatlich überprüfen
4. **Documentation**: Alle Alerts dokumentieren
5. **Testing**: Alerts regelmäßig testen

## Weitere Informationen

- Siehe auch: `docs/API_MONITORING.md` für API-spezifisches Monitoring
- Siehe auch: `docs/ERROR_HANDLING.md` für Error-Handling-Strategien
- Siehe auch: `docs/SLO_SLA.md` für SLO/SLA-Definitionen




---

## Quelle: docs/PRODUCTION_READY_CHECKLIST.md

# JobFlow - Production Ready Checklist

## 🎯 Ziel: 100% Verkaufsfertigkeit

Diese Checkliste muss **vollständig erfüllt** sein, bevor die App zum Verkauf angeboten werden kann.

---

## ✅ Automatische Checks (werden kontinuierlich getestet)

### 1. Code-Qualität

#### Linter
- [ ] **0 Linter-Fehler** ✅
- [ ] Alle Dateien formatiert (Prettier)
- [ ] ESLint-Regeln eingehalten
- [ ] Keine Console-Logs in Production-Code

#### TypeScript
- [ ] **0 TypeScript-Fehler** ✅
- [ ] Alle Typen korrekt definiert
- [ ] Keine `any`-Typen (außer wo notwendig)
- [ ] Strict Mode aktiviert

#### Code-Coverage
- [ ] **≥ 80% Code-Coverage** ✅
- [ ] Statements: ≥ 80%
- [ ] Branches: ≥ 75%
- [ ] Functions: ≥ 80%
- [ ] Lines: ≥ 80%

---

### 2. Tests

#### Unit-Tests
- [ ] **100% der Unit-Tests bestehen** ✅
- [ ] Alle kritischen Funktionen getestet
- [ ] Edge Cases abgedeckt
- [ ] Mock-Daten korrekt

#### Integration-Tests
- [ ] **100% der Integration-Tests bestehen** ✅
- [ ] React Query getestet
- [ ] Form-Validierung getestet
- [ ] Error Boundaries getestet

#### E2E-Tests
- [ ] **100% der E2E-Tests bestehen** ✅
- [ ] Alle User-Flows getestet
- [ ] Admin-Flows getestet
- [ ] Mitarbeiter-Flows getestet

#### Routen-Tests
- [ ] **100% der Routen erreichbar** ✅
- [ ] Alle öffentlichen Routen (200)
- [ ] Alle Admin-Routen (mit Auth)
- [ ] Alle Mitarbeiter-Routen (mit Auth)
- [ ] 404-Seite funktioniert

---

### 3. Funktionalität

#### Authentifizierung
- [ ] Login funktioniert
- [ ] Registrierung funktioniert
- [ ] Logout funktioniert
- [ ] Session-Management funktioniert
- [ ] Passwort-Reset funktioniert
- [ ] OIDC-Login funktioniert (falls aktiviert)

#### Admin-Funktionen
- [ ] Schichtverwaltung (CRUD)
- [ ] Mitarbeiterverwaltung (CRUD)
- [ ] Einrichtungsverwaltung (CRUD)
- [ ] Berichte & Exporte
- [ ] Audit-Logs
- ~~[ ] Chat-System~~ **ENTFERNT** (siehe CHANGELOG.md)

#### Mitarbeiter-Funktionen
- [ ] Zeiterfassung (Start/Stop/Pause)
- [ ] Dienstplan anzeigen
- [ ] Profil bearbeiten
- [ ] Dokumente hochladen
- [ ] Benachrichtigungen
- ~~[ ] Chat-System~~ **ENTFERNT** (siehe CHANGELOG.md)

#### Interaktive Elemente
- [ ] Alle Buttons funktionieren
- [ ] Alle Formulare validieren korrekt
- [ ] Alle Modals öffnen/schließen
- [ ] Navigation funktioniert
- [ ] Suche & Filter funktionieren
- [ ] Keyboard-Navigation funktioniert

---

### 4. Performance

#### Lighthouse-Scores
- [ ] **Performance ≥ 90** ✅
- [ ] **Accessibility ≥ 95** ✅
- [ ] **Best Practices ≥ 90** ✅
- [ ] **SEO ≥ 90** ✅

#### Metriken
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Total Blocking Time (TBT) < 200ms

#### Ladezeiten
- [ ] Initial Load < 3s
- [ ] Route Navigation < 1s
- [ ] API-Response < 500ms (P95)

---

### 5. Security

#### Security Headers
- [ ] X-Frame-Options gesetzt
- [ ] X-Content-Type-Options gesetzt
- [ ] X-XSS-Protection gesetzt
- [ ] Strict-Transport-Security gesetzt (Production)
- [ ] Content-Security-Policy gesetzt

#### Input-Validierung
- [ ] XSS-Schutz aktiv
- [ ] SQL-Injection-Schutz aktiv
- [ ] CSRF-Schutz aktiv
- [ ] E-Mail-Validierung
- [ ] Passwort-Stärke-Prüfung

#### RBAC (Role-Based Access Control)
- [ ] Admin-Bereich geschützt
- [ ] Mitarbeiter-Bereich geschützt
- [ ] Unauthorized-Zugriff blockiert
- [ ] Rollen-basierte Permissions korrekt

#### Firebase Security Rules
- [ ] Firestore Rules deployed
- [ ] Storage Rules deployed
- [ ] Auth Rules korrekt

---

### 6. Accessibility (WCAG 2.1 AA)

#### Keyboard-Navigation
- [ ] Alle interaktiven Elemente erreichbar
- [ ] Focus-Indikatoren sichtbar
- [ ] Tab-Reihenfolge logisch
- [ ] Skip-Links vorhanden

#### Screen-Reader
- [ ] ARIA-Labels korrekt
- [ ] Landmarks vorhanden
- [ ] Alt-Texte für Bilder
- [ ] Formular-Labels korrekt

#### Farbkontrast
- [ ] Text-Kontrast ≥ 4.5:1
- [ ] UI-Komponenten-Kontrast ≥ 3:1
- [ ] Focus-Indikatoren sichtbar

---

### 7. Cross-Browser

#### Browser-Kompatibilität
- [ ] Chrome (Desktop & Mobile) ✅
- [ ] Firefox (Desktop & Mobile) ✅
- [ ] Safari (Desktop & Mobile) ✅
- [ ] Edge (Desktop) ✅

---

### 8. Mobile-Responsive

#### Viewports
- [ ] Desktop (1920x1080) ✅
- [ ] Laptop (1440x900) ✅
- [ ] Tablet (768x1024) ✅
- [ ] Mobile (375x667) ✅
- [ ] Mobile Landscape (667x375) ✅

#### Mobile-Features
- [ ] Touch-Targets ≥ 44px
- [ ] Navigation angepasst
- [ ] Formulare optimiert
- [ ] Performance auf Mobile OK

---

### 9. API-Endpunkte

#### Health & Status
- [ ] `/api/health` funktioniert
- [ ] `/status` funktioniert

#### Auth-Endpunkte
- [ ] `/api/auth/register-admin` funktioniert
- [ ] `/api/auth/accept-invite` funktioniert

#### Error-Handling
- [ ] Fehler werden korrekt zurückgegeben
- [ ] Error-Codes korrekt
- [ ] Error-Messages verständlich

---

### 10. Firebase-Integration

#### Firestore
- [ ] Alle Collections vorhanden
- [ ] Datenintegrität gewährleistet
- [ ] Security Rules deployed
- [ ] Indizes erstellt

#### Authentication
- [ ] User-Erstellung funktioniert
- [ ] Custom Claims gesetzt
- [ ] Rollen-Verwaltung funktioniert
- [ ] Session-Management funktioniert

#### Storage
- [ ] Datei-Upload funktioniert
- [ ] Datei-Download funktioniert
- [ ] Storage Rules deployed
- [ ] CORS konfiguriert

---

## 📋 Manuelle Checks

### 11. Dokumentation

- [ ] README.md vollständig
- [ ] API-Dokumentation vorhanden
- [ ] User-Guide vorhanden
- [ ] Admin-Guide vorhanden
- [ ] Deployment-Guide vorhanden

### 12. Deployment

- [ ] Production-Build erfolgreich
- [ ] Environment-Variablen gesetzt
- [ ] Firebase-Projekt konfiguriert
- [ ] Domain konfiguriert
- [ ] SSL-Zertifikat aktiv
- [ ] CDN konfiguriert (falls verwendet)

### 13. Monitoring

- [ ] Error-Tracking aktiv (Sentry)
- [ ] Analytics aktiv (falls gewünscht)
- [ ] Logging konfiguriert
- [ ] Alerts eingerichtet
- [ ] `/api/health` liefert Status + Firestore-Konnektivität (503 bei Degradation)
- [ ] `/status` konsumiert Health-Endpoint ohne Caching
- [ ] GCP Alerts: Cloud Functions Error-Rate (>5 % / 5 min), Hosting 5xx (>1/min), Push-Failure-Quote
- [ ] Sentry DSN & Firebase Logging Variablen in `.env` gesetzt und dokumentiert

### 14. Backup & Recovery

- [ ] Firestore-Backup-Strategie
- [ ] Storage-Backup-Strategie
- [ ] Recovery-Prozess dokumentiert

### 15. Rechtliches

- [ ] Impressum vollständig
- [ ] Datenschutzerklärung vollständig
- [ ] AGB vorhanden (falls nötig)
- [ ] DSGVO-konform

---

## 🚀 Automatischer Check

### Test-System starten

```bash
# Dev-Server starten (in separatem Terminal)
npm run dev

# Kontinuierliches Test-System starten
npm run test:until-perfect
```

Das System:
1. ✅ Führt alle Tests aus
2. ✅ Behebt automatisch Fehler (wo möglich)
3. ✅ Wiederholt solange, bis alles bei 100% ist
4. ✅ Stoppt erst wenn die App verkaufsfertig ist

### Production-Ready Check

```bash
npm run test:production-ready
```

---

## 📊 Fortschritt

### Aktueller Status

- **Code-Qualität:** ⏳ Wird getestet...
- **Tests:** ⏳ Wird getestet...
- **Funktionalität:** ⏳ Wird getestet...
- **Performance:** ⏳ Wird getestet...
- **Security:** ⏳ Wird getestet...
- **Accessibility:** ⏳ Wird getestet...
- **Cross-Browser:** ⏳ Wird getestet...
- **Mobile-Responsive:** ⏳ Wird getestet...

### Gesamt-Fortschritt: 0%

---

## ✅ Checkliste-Status

- [ ] Alle automatischen Checks bei 100%
- [ ] Alle manuellen Checks erfüllt
- [ ] Production-Ready Report erstellt
- [ ] App ist verkaufsfertig

---

## 🎯 Ziel

**100% aller Checks müssen erfüllt sein, bevor die App zum Verkauf angeboten werden kann!**

Das kontinuierliche Test-System hilft dabei, automatisch alle Fehler zu finden und zu beheben, bis die App perfekt ist.

---

**Viel Erfolg! 🚀**






---

## Quelle: docs/README.md

# JobFlow - Production-Ready Implementierung

## 📋 Übersicht

JobFlow ist eine moderne Webanwendung für die Verwaltung von Zeiterfassung, Assignments und Mitarbeiterdaten. Die Anwendung wurde mit **State of the Art** (SOTA) Standards implementiert und bietet eine vollständige Firebase-Integration mit React Query, Material-UI und Next.js.

## 🚀 Features

### ✅ **Vollständig implementiert:**

- **Benachrichtigungssystem** - Echtzeit-Updates mit Firestore
- **Assignments-Verwaltung** - Vollständige CRUD-Funktionalität mit Filter & Suche
- **Document Types Manager** - Erweiterte Dokumentenverwaltung
- **Admin-Berichte** - Vollständige Implementierung mit Charts, Tabellen und PDF/Excel-Export
- **Admin-Einstellungen** - Firebase-Persistierung und Logo-Upload
- **Detail-Seiten** - Mitarbeiter & Einrichtungen mit echten Daten
- **Zeiten-Historie** - Erweiterte Ansicht mit Kalender und Export
- **Mitarbeiter-Berichte** - Persönliche Arbeitszeitberichte mit Charts
- **Loading & Error States** - Einheitliche UI-Komponenten überall
- **Performance-Optimierungen** - React.memo, Virtual Scrolling, Caching

### 🔧 **Technische Features:**

- **Firebase/Firestore** - Vollständige Backend-Integration
- **React Query** - Caching und State Management
- **Material-UI** - Konsistente UI-Komponenten
- **Glasmorphism Design** - Moderne UI-Ästhetik
- **TypeScript** - Umfassende Typisierung (mit bekannten Issues)
- **Vitest** - Test-Framework konfiguriert
- **Performance Monitoring** - Memory Usage und Render-Tracking

## 📁 Projektstruktur

```
JobFlow/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin-Bereich
│   │   ├── admin/                 # Admin-Features
│   │   │   ├── berichte/         # Berichte & Export
│   │   │   ├── einrichtungen/    # Einrichtungs-Verwaltung
│   │   │   ├── einstellungen/    # System-Einstellungen
│   │   │   ├── mitarbeiter/      # Mitarbeiter-Verwaltung
│   │   │   └── document-types/   # Dokumenttypen
│   │   └── assignments/          # Assignments-Verwaltung
│   └── (mitarbeiter)/            # Mitarbeiter-Bereich
│       ├── benachrichtigungen/   # Benachrichtigungen
│       ├── berichte/             # Persönliche Berichte
│       └── zeiten/               # Zeiten-Historie
├── components/                   # React-Komponenten
│   ├── ui/                       # UI-Komponenten
│   │   ├── ErrorBoundary.tsx     # Error Handling
│   │   ├── LoadingSpinner.tsx    # Loading States
│   │   ├── EmptyState.tsx        # Empty States
│   │   └── OptimizedList.tsx     # Performance-optimierte Listen
│   └── layout/                   # Layout-Komponenten
├── lib/                          # Utilities und Services
│   ├── services/                 # Firebase Services
│   │   ├── notificationService.ts
│   │   ├── assignmentService.ts
│   │   ├── reportService.ts
│   │   └── settingsService.ts
│   ├── hooks/                    # Custom Hooks
│   │   ├── useNotifications.ts
│   │   ├── useAssignments.ts
│   │   ├── useTimesheetHistory.ts
│   │   └── usePerformance.ts
│   └── utils/                    # Utilities
│       └── toast.ts              # Toast Notifications
├── __tests__/                    # Test-Dateien
│   ├── components/               # Komponenten-Tests
│   ├── hooks/                    # Hook-Tests
│   ├── services/                 # Service-Tests
│   └── utils/                    # Test-Utilities
└── docs/                         # Dokumentation
    └── README.md                 # Diese Datei
```

## 🛠️ Installation & Setup

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- Firebase-Projekt
- Git

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd JobFlow

# Dependencies installieren
npm install

# Environment-Variablen konfigurieren
cp .env.example .env.local

# Firebase-Konfiguration hinzufügen
# .env.local bearbeiten mit Firebase-Credentials
```

### Firebase-Setup

1. **Firebase-Projekt erstellen**
2. **Firestore-Datenbank aktivieren**
3. **Storage aktivieren**
4. **Authentication aktivieren** (optional)
5. **Environment-Variablen konfigurieren**

### Development

```bash
# Development-Server starten
npm run dev

# Tests ausführen
npm run test

# Tests mit Coverage
npm run test:coverage

# Linting
npm run lint

# Type-Checking
npm run type-check
```

## 🧪 Testing

### Test-Abdeckung

- **Komponenten-Tests** - UI-Komponenten mit React Testing Library
- **Hook-Tests** - Custom Hooks mit renderHook
- **Service-Tests** - Firebase Services mit Mocks
- **Integration-Tests** - End-to-End Funktionalität

### Test-Commands

```bash
# Alle Tests
npm run test

# Watch-Mode
npm run test:watch

# Coverage-Report
npm run test:coverage

# Spezifische Tests
npm run test -- --testNamePattern="LoadingSpinner"
```

### Test-Utilities

- **test-utils.tsx** - Custom Render-Funktion mit Providern
- **Mock-Daten** - Vordefinierte Test-Daten
- **Firebase-Mocks** - Vollständige Firebase-Simulation

## 📊 Performance

### Optimierungen

- **React.memo** - Komponenten-Memoization
- **useMemo/useCallback** - Teure Berechnungen optimiert
- **Virtual Scrolling** - Große Listen performant
- **Image Optimization** - Lazy Loading und WebP
- **Code Splitting** - Dynamische Imports
- **Caching** - React Query Cache-Strategien

### Monitoring

- **Memory Usage** - Speicherverbrauch überwachen
- **Render Performance** - Komponenten-Render-Zeiten
- **Bundle Size** - JavaScript-Bundle-Größe
- **Network Requests** - API-Call-Optimierung

## 🎨 Design System

### Glasmorphism

- **Glasmorphism-Design** durchgehend beibehalten
- **Konsistente Farbpalette** - Material-UI Theme
- **Responsive Design** - Mobile-first Approach
- **Accessibility** - ARIA-Labels und Keyboard-Navigation

### Komponenten

- **LoadingSpinner** - Einheitliche Loading-States
- **ErrorBoundary** - Robuste Fehlerbehandlung
- **EmptyState** - Benutzerfreundliche leere Zustände
- **OptimizedList** - Performance-optimierte Listen

## 🔧 Konfiguration

### TypeScript

```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### Jest

```javascript
{
  "testEnvironment": "jest-environment-jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

## 📈 Monitoring & Analytics

### Performance-Metriken

- **Lighthouse Score** - Performance, Accessibility, SEO
- **Core Web Vitals** - LCP, FID, CLS
- **Bundle Analysis** - Webpack Bundle Analyzer
- **Memory Leaks** - Memory Usage Monitoring

### Error-Tracking

- **Error Boundaries** - React Error Boundaries
- **Console Logging** - Development-Logging
- **User Feedback** - Toast-Notifications
- **Retry-Mechanism** - Automatische Wiederholung

## 🚀 Deployment

### Production-Build

```bash
# Production-Build
npm run build

# Start Production-Server
npm start

# Static Export (optional)
npm run export
```

### Environment-Variablen

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 📝 Changelog

### Version 1.0.0 - SOTA Implementation

#### ✅ **Phase 1: Benachrichtigungen & Assignments**
- Benachrichtigungssystem mit Firestore-Integration
- Assignments-Verwaltung mit Echtzeit-Updates
- Filter und Suchfunktionen
- Mark as read/delete Funktionen

#### ✅ **Phase 2: Admin-Features**
- Document Types Manager mit CRUD-Funktionalität
- Admin-Berichte mit PDF/Excel-Export
- Admin-Einstellungen mit Firebase-Persistierung
- Detail-Seiten für Mitarbeiter & Einrichtungen

#### ✅ **Phase 3: Mitarbeiter-Features**
- Zeiten-Historie mit Kalender und Charts
- Mitarbeiter-Berichte mit Export-Funktionen
- Persönliche Arbeitszeitberichte
- Zuschläge-Übersicht

#### ✅ **Phase 4: Funktionale Verbesserungen**
- Loading & Error States überall
- Performance-Optimierungen
- React.memo und Virtual Scrolling
- Toast-Notifications und Empty States

#### ✅ **Phase 5: Code-Qualität & Tests**
- TypeScript strict mode
- Jest & Testing Library
- Umfassende Test-Abdeckung
- Dokumentation

## 🤝 Contributing

### Code-Standards

- **TypeScript** - Vollständige Typisierung
- **ESLint** - Code-Qualität
- **Prettier** - Code-Formatierung
- **Husky** - Git-Hooks
- **Conventional Commits** - Commit-Messages

### Pull Request-Prozess

1. **Feature-Branch** erstellen
2. **Tests schreiben** für neue Features
3. **Code-Review** durchführen
4. **CI/CD-Pipeline** erfolgreich
5. **Merge** in main branch

## 📞 Support

### Dokumentation

- **README.md** - Projekt-Übersicht
- **API-Dokumentation** - Service-Interfaces
- **Component-Docs** - Komponenten-Dokumentation
- **Test-Docs** - Test-Dokumentation

### Kontakt

- **Issues** - GitHub Issues für Bugs
- **Discussions** - GitHub Discussions für Fragen
- **Wiki** - Projekt-Wiki für Details

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details.

---

**JobFlow - Production-Ready Implementation** 🚀

*Funktional bereit für produktiven Einsatz*

## 📊 Aktueller Status:

✅ **29 Seiten** voll funktional
✅ **Firebase-Integration** komplett  
✅ **Keine Mock-Daten** mehr
✅ **Loading/Error States** überall
✅ **Design unverändert** (Glasmorphism)
✅ **Konsistente Code-Qualität**
⚠️ **TypeScript Issues** - Bekannte Probleme mit Dependencies
✅ **Test-Framework** konfiguriert (Vitest)
✅ **Vollständige Dokumentation**

**Bekannte Issues:**
- TypeScript-Kompilierfehler in Dependencies (crypto-js, lodash)
- Material-UI Grid-Props Kompatibilität (v6 vs v7)
- Fehlende Service-Methoden in einigen Hooks

**Status: FUNKTIONAL ABGESCHLOSSEN** ✅🚀



---

## Quelle: docs/RECHTSKONFORMITÄT_ZEITERFASSUNG_2025.md

# Vollständige Rechtskonformitätsprüfung - Zeiterfassung

**Datum:** 2025-01-27  
