# JobFlow – Dokumentation Teil 15

*Zeichen 278138–297989 von 2862906*

---

  () => userService.getUser(id),
  { component: 'UserComponent' },
  { maxRetries: 3 }
);
```

### Manual Retry

Provide manual retry options in UI:

```typescript
import { ErrorDisplay } from '@/components/errors';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const loadUser = async () => {
    try {
      const userData = await userService.getUser(userId);
      setUser(userData);
      setError(null);
    } catch (err) {
      setError(err as AppError);
    }
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        retry={loadUser}
        variant="card"
      />
    );
  }

  return <UserProfileContent user={user} />;
}
```

## Best Practices

### 1. Error Handling in Services

✅ **Do:**

```typescript
try {
  const result = await firebaseOperation();
  return result;
} catch (error) {
  const appError = errorHandler.handleFirebaseError(error, {
    component: 'serviceName',
    action: 'methodName',
  });
  logger.error('Operation failed', appError);
  throw appError;
}
```

❌ **Don't:**

```typescript
try {
  const result = await firebaseOperation();
  return result;
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

### 2. Component Error Handling

✅ **Do:**

```typescript
function MyComponent() {
  const { captureError } = useErrorBoundary();

  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      captureError(error);
    }
  };
}
```

❌ **Don't:**

```typescript
function MyComponent() {
  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      console.error('Error:', error);
      // Error propagates and crashes the app
    }
  };
}
```

### 3. User Feedback

✅ **Do:**

```typescript
const { showSuccess, showError } = useToastManager();

try {
  await saveData();
  showSuccess('Daten erfolgreich gespeichert!');
} catch (error) {
  showError('Fehler beim Speichern der Daten');
}
```

❌ **Don't:**

```typescript
try {
  await saveData();
  alert('Success!');
} catch (error) {
  alert('Error!');
}
```

## Testing Error Scenarios

### Error Boundary Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentErrorBoundary } from '@/components/errors';

const ThrowError = () => {
  throw new Error('Test error');
};

test('Error boundary catches errors', () => {
  render(
    <ComponentErrorBoundary component="TestComponent">
      <ThrowError />
    </ComponentErrorBoundary>
  );

  expect(screen.getByText('Komponentenfehler')).toBeInTheDocument();
});
```

### Service Error Testing

```typescript
import { errorHandler } from '@/lib/errors';

test('Service handles Firebase errors', async () => {
  const mockError = { code: 'permission-denied', message: 'Access denied' };

  try {
    await userService.getUser('invalid-id');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('FIREBASE_PERMISSION_DENIED');
  }
});
```

## Monitoring and Analytics

### Error Reporting

The system is prepared for external error reporting services:

```typescript
// Sentry integration (feature-flagged)
if (process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true') {
  Sentry.captureException(error, {
    extra: errorReport,
    tags: {
      component: error.context.component,
      severity: error.severity,
    },
  });
}
```

### Error Metrics

Track error metrics for monitoring:

```typescript
// Error rates per route
logger.error('Route error', error, {
  route: '/users',
  errorRate: calculateErrorRate(),
});

// Performance impact
logger.performance('Error recovery', recoveryTime, {
  errorType: error.code,
  recoveryMethod: 'retry',
});
```

## Troubleshooting

### Common Issues

1. **Error not caught by boundary**
   - Ensure error is thrown, not returned
   - Check if component is wrapped in boundary

2. **Error messages not in German**
   - Use `AppError` with proper error codes
   - Check error code mapping in `ErrorTypes.ts`

3. **Logs not appearing**
   - Check log level configuration
   - Ensure logger is imported correctly

4. **Retry not working**
   - Check if error is retryable
   - Verify retry configuration

### Debug Mode

Enable debug mode for detailed error information:

```typescript
// In development
const logger = Logger.getInstance({
  logLevel: LogLevel.DEBUG,
  enableConsoleLogging: true,
});
```

## Migration Guide

### From Old Error Handling

1. **Replace console.error:**

   ```typescript
   // Old
   console.error('Error:', error);

   // New
   logger.error('Operation failed', error, { component: 'ServiceName' });
   ```

2. **Replace throw error:**

   ```typescript
   // Old
   throw error;

   // New
   const appError = errorHandler.handleError(error);
   throw appError;
   ```

3. **Add error boundaries:**

   ```typescript
   // Old
   <MyComponent />

   // New
   <ComponentErrorBoundary component="MyComponent">
     <MyComponent />
   </ComponentErrorBoundary>
   ```

## Conclusion

The JobFlow error handling system provides:

- **Robust Error Management**: Centralized, typed, and consistent
- **User-Friendly Experience**: Clear messages and recovery options
- **Developer Experience**: Structured logging and debugging tools
- **Production Readiness**: Monitoring and analytics integration
- **Maintainability**: Consistent patterns and best practices

Follow this guide to implement proper error handling throughout the application and maintain high code quality and user experience standards.

---

**Last Updated**: $(date)
**Version**: 1.0
**Status**: Production Ready



---

## Quelle: docs/ESSENTIELLE_DOKUMENTATION.md

# Essentielle Dokumentation für Betrieb und Entwicklung

_Stand: 2025-01-15_

## 🎯 Übersicht

Diese Datei listet die **essentiellen Dokumentationsdateien** auf, die für den **Betrieb** und die **weitere Entwicklung** von JobFlow benötigt werden.

---

## ✅ KRITISCH für Betrieb

### Setup & Konfiguration

- **`ENVIRONMENT_SETUP.md`** - Environment-Variablen Setup
- **`ENV_EXAMPLE.md`** - Beispiel-Konfiguration
- **`FIREBASE_SETUP.md`** - Firebase-Projekt Setup
- **`FIREBASE_SETUP_GUIDE.md`** - Detaillierter Firebase-Setup-Guide
- **`FCM_SETUP.md`** - Push-Notifications Setup

### Deployment & Operations

- **`GO_LIVE_CHECKLIST.md`** - Go-Live Checkliste
- **`PRODUCTION_READY_CHECKLIST.md`** - Production-Ready Checkliste
- **`DISASTER_RECOVERY.md`** - Disaster Recovery Runbook
- **`INCIDENT_RUNBOOKS.md`** - Incident Response Runbooks
- **`SLO_SLA.md`** - Service Level Objectives/Agreements

### Monitoring & Health

- **`API_MONITORING.md`** - API-Monitoring Setup
- **`ERROR_HANDLING.md`** - Error-Handling Strategien

### Security & Compliance

- **`ASVS_CHECKLIST.md`** - OWASP ASVS Checkliste
- **`DSGVO_PROZESSE.md`** - DSGVO-Prozesse
- **`docs/release/02_SECURITY_LEGAL_AUDIT.md`** - Security & Legal Audit

### Firebase Operations

- **`FIREBASE_SERVICE_ACCOUNT_PERMISSIONS.md`** - Service Account Berechtigungen
- **`FIREBASE_SERVICE_ACCOUNT_ROLES.md`** - Service Account Rollen
- **`FIREBASE_COSTS.md`** - Firebase-Kosten-Übersicht
- **`FIREBASE_CLEANUP_POLICY.md`** - Cleanup-Policies

---

## 🔧 WICHTIG für Entwicklung

### Guides & Dokumentation

- **`README.md`** - Projekt-Übersicht (Hauptdokumentation)
- **`ADMIN_GUIDE.md`** - Admin-Benutzerhandbuch
- **`LOHNABRECHNUNG_USER_GUIDE.md`** - Lohnabrechnung Benutzerhandbuch
- **`IMPLEMENTATION_GUIDE.md`** - Implementation Guide

### API & Services

- **`PAYROLL_API_KONFIGURATION.md`** - Payroll API Konfiguration
- **`SERVICE_INTEGRATION.md`** - Service-Integration Guide
- **`CHAT_REQUIREMENTS.md`** - Chat-System Anforderungen ⚠️ **ENTFERNT** (siehe CHANGELOG.md)

### Code-Qualität & Standards

- **`CHANGELOG.md`** - Änderungsprotokoll
- **`TESTS.md`** - Test-Dokumentation
- **`ERROR_HANDLING.md`** - Error-Handling Patterns

### Feature-Dokumentation

- **`ZEITERFASSUNG_IMPLEMENTIERUNG.md`** - Zeiterfassung Implementation
- **`LOHNABRECHNUNG_IMPLEMENTATION.md`** - Lohnabrechnung Implementation
- **`RECHTSKONFORMITÄT_ZEITERFASSUNG_2025.md`** - Rechtliche Anforderungen

### Release & Audit

- **`docs/release/PRODUCTION_READINESS_AUDIT_RE_RUN.md`** - Production Readiness Audit
- **`docs/release/SALES_READINESS_RE_AUDIT.md`** - Sales Readiness Audit
- **`docs/release/CONSOLE_LOG_CLEANUP_PLAN.md`** - Console Log Cleanup Plan

---

## 📦 OPTIONAL (Referenz)

### Analysen (historisch, aber nützlich)

- **`ANALYSE_14_SERVICES.md`** - Service-Analyse
- **`BESTANDSAUFNAHME.md`** - Bestandsaufnahme
- **`APP_OVERVIEW.md`** - App-Übersicht

### Firebase Troubleshooting

- **`FIREBASE_API_ERRORS_FIX.md`** - Firebase API Fehlerbehebung
- **`FIREBASE_DEPLOYMENT_FIX.md`** - Deployment-Fixes
- **`FIREBASE_SERVICE_ACCOUNT_FIX.md`** - Service Account Fixes

---

## 🗑️ ARCHIVIERBAR (veraltet/redundant)

### Alte Analysen (können archiviert werden)

- `ANALYSE_01_AUTH.md` bis `ANALYSE_15_HOOKS.md` - Detaillierte Feature-Analysen (veraltet)
- `ANALYSE_AGENT1_NAVIGATION.md` - Agent-Analysen (veraltet)
- `ANALYSE_AGENT2_FUNKTIONEN.md` - Agent-Analysen (veraltet)
- `ANALYSE_AGENT3_*` - Agent-Analysen (veraltet)
- `agent1-navigationsanalyse.md` - Duplikate
- `agent2-funktionsanalyse.md` - Duplikate
- `agent3-funktionsluecken.md` - Duplikate

### Fix-Dokumentationen (können archiviert werden)

- `*_FIX.md` - Fix-Dokumentationen (historisch)
- `*_FIXED.md` - Fix-Dokumentationen (historisch)
- `FIXES_APPLIED.md` - Fix-Liste (historisch)
- `QUICK_FIX_DEPLOYMENT.md` - Quick Fixes (historisch)

### Veraltete Audits & Checks

- `100_PERCENT_APP_CHECK_REPORT.md` - Veralteter Check
- `100_PERCENT_VERIFICATION.md` - Veraltete Verifikation
- `100_PROZENT_APP_CHECK_REPORT.md` - Duplikat
- `APP_100_PERCENT_CHECK_REPORT.md` - Duplikat
- `APP_CHECK_VERBESSERUNGEN.md` - Veraltete Verbesserungen
- `CHECK_SUMMARY.md` - Veraltete Zusammenfassung

### Veraltete Anforderungsdokumente

- `ANFORDERUNGEN_AKTUELLER_STAND.md` - Veralteter Stand
- `ANFORDERUNGEN_EHRLICHER_STAND.md` - Veralteter Stand
- `ANFORDERUNGEN_UMSETZUNGSSTATUS.md` - Veralteter Status
- `ANFORDERUNGS_ABGLEICH.md` - Veralteter Abgleich

### Header/Logo-Verifikationen (abgeschlossen)

- `HEADER_*` - Header-Verifikationen (abgeschlossen)
- `LOGO_VERIFICATION*.md` - Logo-Verifikationen (abgeschlossen)
- `GLOBAL_HEADER_VERIFICATION_*.md` - Header-Verifikationen (abgeschlossen)

### Login-Fixes (abgeschlossen)

- `LOGIN_FIXED_SUMMARY.md` - Abgeschlossen
- `LOGIN_REDIRECT_FIX.md` - Abgeschlossen
- `LOGIN_REDIRECT_FIXED.md` - Abgeschlossen

### Migration-Dokumentation (abgeschlossen)

- `MIGRATION_COMPLETE.md` - Abgeschlossen
- `MIGRATION_PLAN.md` - Abgeschlossen
- `MIGRATION_SUMMARY.md` - Abgeschlossen

### Veraltete Reports

- `ERROR_ANALYSIS_REPORT.md` - Veralteter Report
- `FEHLERANALYSE.md` - Veraltete Analyse
- `VERBESSERUNGEN_2025-01-27.md` - Veraltete Verbesserungen

### Veraltete TODOs

- `chat.todo.md` - Abgeschlossen
- `payroll.todo.md` - Abgeschlossen
- `LAUNCH_SALES_READINESS_TODO.md` - Abgeschlossen

### Veraltete Release-Dokumente

- `docs/release/00_REPO_MAP.md` - Veraltete Repo-Map
- `docs/release/01_STATIC_CHECKS.md` - Veraltete Checks
- `docs/release/03_FEATURE_COVERAGE.md` - Veraltete Coverage
- `docs/release/RE_AUDIT_ISSUE_LIST.md` - Veraltete Issue-Liste
- `docs/release/RE_AUDIT_STATIC_CHECKS.md` - Veraltete Checks

---

## 📋 Empfohlene Struktur

### Für Betrieb

```
docs/
├── README.md                          # Hauptdokumentation
├── ENVIRONMENT_SETUP.md               # Setup
├── ENV_EXAMPLE.md                     # Beispiel-Konfiguration
├── FIREBASE_SETUP.md                  # Firebase Setup
├── GO_LIVE_CHECKLIST.md               # Go-Live
├── PRODUCTION_READY_CHECKLIST.md      # Production Ready
├── DISASTER_RECOVERY.md               # Disaster Recovery
├── INCIDENT_RUNBOOKS.md               # Incident Response
├── SLO_SLA.md                         # SLO/SLA
├── API_MONITORING.md                  # Monitoring
├── ERROR_HANDLING.md                  # Error Handling
├── ASVS_CHECKLIST.md                  # Security
├── DSGVO_PROZESSE.md                  # Compliance
└── release/
    ├── PRODUCTION_READINESS_AUDIT_RE_RUN.md
    └── 02_SECURITY_LEGAL_AUDIT.md
```

### Für Entwicklung

```
docs/
├── README.md                          # Hauptdokumentation
├── ADMIN_GUIDE.md                     # Admin Guide
├── IMPLEMENTATION_GUIDE.md            # Implementation
├── CHANGELOG.md                       # Changelog
├── TESTS.md                           # Tests
├── PAYROLL_API_KONFIGURATION.md       # API Docs
├── SERVICE_INTEGRATION.md             # Service Integration
├── ZEITERFASSUNG_IMPLEMENTIERUNG.md   # Features
├── LOHNABRECHNUNG_IMPLEMENTATION.md   # Features
└── release/
    ├── PRODUCTION_READINESS_AUDIT_RE_RUN.md
    └── CONSOLE_LOG_CLEANUP_PLAN.md
```

---

## 🎯 Zusammenfassung

### Essentielle Dateien (ca. 25-30 Dateien)

- **Betrieb:** ~15 Dateien
- **Entwicklung:** ~15 Dateien
- **Optional/Referenz:** ~10 Dateien

### Archivierbare Dateien (ca. 100+ Dateien)

- Alte Analysen
- Abgeschlossene Fixes
- Veraltete Audits
- Duplikate

### Empfehlung

1. **Behalten:** Alle Dateien unter "KRITISCH" und "WICHTIG"
2. **Archivieren:** Alle Dateien unter "ARCHIVIERBAR" in `docs/_archived/`
3. **Optional:** Dateien unter "OPTIONAL" als Referenz behalten

---

_Letzte Aktualisierung: 2025-01-15_



---

## Quelle: docs/FCM_SETUP.md

# FCM (Firebase Cloud Messaging) Setup

**Datum:** 2025-01-27  
**Status:** ✅ **IMPLEMENTIERT**

---

## Übersicht

FCM-Integration für Push-Notifications im Chat-System wurde vollständig implementiert.

---

## 1. Implementierte Komponenten

### 1.1 FCM Service (`lib/services/fcmService.ts`)

**Funktionen:**

- `initMessaging()`: Initialisiert Firebase Messaging
- `requestNotificationPermission()`: Fragt nach Browser-Berechtigung und holt FCM-Token
- `saveFCMToken()`: Speichert Token im User-Dokument
- `removeFCMToken()`: Entfernt Token aus User-Dokument
- `onMessageReceived()`: Registriert Handler für eingehende Notifications

**Features:**

- Multi-Device-Support (bis zu 5 Tokens pro User)
- Automatische Token-Verwaltung
- Browser-Notification-Support

---

### 1.2 FCM Hook (`lib/hooks/useFCM.ts`)

**Funktionen:**

- Automatische Token-Anforderung bei Login
- Permission-Status-Tracking
- Message-Handler-Registrierung
- Browser-Notification-Anzeige

**Verwendung:**

```typescript
const { token, permission, requestToken, error } = useFCM();
```

---

### 1.3 Notification Settings Component (`components/chat/NotificationSettings.tsx`)

**Features:**

- Chat-Notification Toggle
- Permission-Status-Anzeige
- Token-Verwaltung
- Integration in Profil-Seite

---

## 2. Konfiguration

### 2.1 Environment Variables

**Erforderlich:**

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**VAPID Key generieren:**

1. Firebase Console öffnen
2. Project Settings → Cloud Messaging
3. Web Push certificates → Generate key pair
4. Key kopieren und in `.env.local` eintragen

---

### 2.2 Firebase Console Setup

1. **Cloud Messaging aktivieren:**
   - Firebase Console → Project Settings → Cloud Messaging
   - Web Push certificates konfigurieren

2. **Service Worker (Optional):**
   - Für Background-Notifications
   - Datei: `public/firebase-messaging-sw.js`

---

## 3. User-Dokument Struktur

**FCM-Token-Felder:**

```typescript
{
  fcmToken: string; // Haupt-Token (Rückwärtskompatibilität)
  fcmTokens: string[]; // Array aller Tokens (max. 5)
  fcmTokenUpdatedAt: Date;
  notificationSettings: {
    chatEnabled: boolean; // Default: true
    // ... andere Settings
  };
}
```

---

## 4. Notification-Einstellungen

**Speicherort:**

- `users/{userId}/notificationSettings.chatEnabled`

**Standard:**

- `chatEnabled: true` (aktiviert)

**Deaktivierung:**

- User kann in Profil → Einstellungen → Chat-Benachrichtigungen deaktivieren
- Cloud Function prüft diese Einstellung vor dem Senden

---

## 5. Cloud Function Integration

**`functions/src/chat/sendChatNotification.ts`:**

- Prüft `fcmToken` oder `fcmTokens[0]`
- Prüft `notificationSettings.chatEnabled`
- Sendet Notification an alle Teilnehmer außer Sender

---

## 6. Browser-Support

**Unterstützt:**

- Chrome/Edge (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Safari (iOS 16.4+)
- Opera

**Nicht unterstützt:**

- Safari Desktop (kein Web Push Support)

---

## 7. Testing

### 7.1 Manuelle Tests

1. **Permission anfordern:**
   - Profil → Einstellungen → Chat-Benachrichtigungen
   - "Berechtigung anfordern" klicken
   - Browser-Dialog bestätigen

2. **Token speichern:**
   - Token wird automatisch nach Permission-Erteilung gespeichert
   - Prüfe in Firestore: `users/{userId}/fcmToken`

3. **Notification senden:**
   - Chat-Nachricht senden
   - Notification sollte erscheinen (wenn App nicht im Vordergrund)

4. **Settings testen:**
   - Chat-Notifications deaktivieren
   - Neue Nachricht senden
   - Keine Notification sollte erscheinen

---

## 8. Troubleshooting

### Problem: Token wird nicht gespeichert

**Lösung:**

- Prüfe Browser-Konsole auf Fehler
- Prüfe Firestore Rules (User muss `users/{userId}` schreiben können)
- Prüfe VAPID Key in `.env.local`

### Problem: Notifications werden nicht empfangen

**Lösung:**

- Prüfe `notificationSettings.chatEnabled` (muss `true` sein)
- Prüfe `fcmToken` im User-Dokument
- Prüfe Browser-Notification-Berechtigung
- Prüfe Cloud Function Logs

### Problem: Permission wird nicht erteilt

**Lösung:**

- Browser-Einstellungen prüfen
- HTTPS erforderlich (nicht HTTP)
- Service Worker muss registriert sein (für Background-Notifications)

---

## 9. Nächste Schritte

### 9.1 Service Worker (Optional)

Für Background-Notifications:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  // Firebase Config
});

const messaging = firebase.messaging();
```

### 9.2 Notification Click Handler

```typescript
// In App-Komponente
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      const data = event.data;
      if (data.type === 'notification-click') {
        // Navigate to chat
        router.push(`/chat/${data.channelId}`);
      }
    });
  }
}, []);
```

---

**Erstellt:** 2025-01-27  
**Status:** ✅ **VOLLSTÄNDIG IMPLEMENTIERT**



---

## Quelle: docs/FEHLERANALYSE.md

# Fehleranalyse - JobFlow Projekt

**Datum:** 26. Januar 2026  
**Status:** Analyse abgeschlossen

---

## 🔴 Kritische Probleme

### 1. Fehlende Dependencies (KRITISCH)

**Problem:** `node_modules` Verzeichnis existiert nicht - Dependencies sind nicht installiert.

**Auswirkungen:**

- ❌ TypeScript-Kompilierung nicht möglich (`tsc` nicht verfügbar)
- ❌ ESLint nicht ausführbar
- ❌ Build-Prozess wird fehlschlagen
- ❌ Development-Server kann nicht gestartet werden

**Lösung:**

```bash
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
npm install
```

**Verifizierung:**

```bash
npm run typecheck
npm run lint
npm run build
```

---

## ⚠️ Code-Qualitätsprobleme

### 2. ESLint-Disable Kommentare

**Gefundene Stellen:**

- `app/(auth)/login/error.tsx:10` - `eslint-disable-next-line no-console`
- `app/(auth)/anmelden/error.tsx:10` - `eslint-disable-next-line no-console`
- `app/(admin)/admin/mitarbeiter/[uid]/gehalt/page.tsx:90` - `eslint-disable-next-line react-hooks/exhaustive-deps`

**Empfehlung:**

- Console-Logs durch Logger ersetzen (siehe `lib/logging`)
- React Hooks Dependencies prüfen und korrigieren

### 3. Potenzielle Type-Safety Probleme

**Gefundene Patterns:**

