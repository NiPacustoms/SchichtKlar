# JobFlow – Dokumentation Teil 14

*Zeichen 258250–278137 von 2862906*

---

- Transport-/Speichersicherheit: HTTPS/HSTS, Firebase-Verschlüsselung at-rest
- Härtung: CSP, Sicherheitsheader, Rate Limiting, Secret-Management
- Protokollierung: Unveränderliche Audit-Logs für Admin-Aktionen
- Backup & DR: Tägliche Backups, RTO ≤ 2h, RPO ≤ 24h (siehe DR-Runbook)
- Schwachstellenmanagement: Regelmäßige Updates, Pen-Test/ASVS-Checklisten
- Verfügbarkeit: Monitoring/Alerts, Status-Kommunikation

## 3. Datenfluss (vereinfacht)

- Web/App → Next.js (App Router)
- Auth → Firebase Auth (OIDC)
- Datenhaltung → Firestore (EU Region), Storage für Dokumente
- Cloud Functions → Datenexport/-löschung, Benachrichtigungen
- Monitoring → strukturierte Logs, Security-Events Webhook

## 4. Betroffenenrechte: Export & Löschung

- Export: Callable Function `exportUserData` aggregiert Nutzer-bezogene Daten (Users, Assignments, Timesheets, Documents, Notifications, Messages) gefiltert per `tenantId`
- Löschung: Callable Function `deleteUserData` (Soft-/Hard-Delete je Operation) mit `tenantId`-Sicherung; personenbezogene Felder werden entfernt
- Self-Service: Admin-UI Trigger und Statusanzeige (geplant)

## 5. Löschkonzept & Aufbewahrung

- Operative Daten: Löschung auf Anfrage oder bei Beendigung der Nutzung
- Aufbewahrungsfristen: Geschäftsrelevante Nachweise gemäß rechtlicher Vorgaben (Mandantenverantwortung); Export zur Archivierung möglich
- Backups: Rotationsstrategie; Restore-Drills dokumentiert

## 6. Verantwortlichkeiten

- Datenschutzkoordination: Produkt/Legal
- Technische Umsetzung: Engineering (Security/Infra)
- Support: Helpdesk (Anfragen zu Auskunft/Löschung)

## 7. Nachweise/Dokumentation

- `docs/DISASTER_RECOVERY.md` – DR-Runbook
- `firestore.rules` – Mandantenisolation
- Middleware/Config – CSP & Security-Header
- Audit-Logs – Admin-Aktionen nachvollziehbar (Viewer vorhanden)



---

## Quelle: docs/ENVIRONMENT_SETUP.md

# JobFlow Environment Configuration

## Development Setup (Mock Mode)

```env
# Firebase Configuration (Development)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Emulator Configuration (Development)
NEXT_PUBLIC_USE_EMULATOR=false

# Application Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags - DEVELOPMENT (Mock Mode)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_REALTIME=false
```

## Staging Setup (Partial Migration)

```env
# Firebase Configuration (Staging)
NEXT_PUBLIC_FIREBASE_API_KEY=your_staging_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_staging_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_staging_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_staging_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_staging_app_id

# Firebase Emulator Configuration (Staging)
NEXT_PUBLIC_USE_EMULATOR=false

# Application Configuration
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.jobflow.app

# Feature Flags - STAGING (Partial Migration)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REALTIME=true
```

## Production Setup (Full Migration)

```env
# Firebase Configuration (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id

# Firebase Emulator Configuration (Production)
NEXT_PUBLIC_USE_EMULATOR=false

# Application Configuration
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://jobflow.app

# Feature Flags - PRODUCTION (Full Migration)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REALTIME=true

# Legal/Impressum Configuration (REQUIRED for Production)
NEXT_PUBLIC_COMPANY_NAME=AufAbruf GmbH
NEXT_PUBLIC_LEGAL_FORM=GmbH
NEXT_PUBLIC_COMPANY_STREET=Herner Straße 134
NEXT_PUBLIC_COMPANY_CITY=Herten
NEXT_PUBLIC_COMPANY_ZIP=45699
NEXT_PUBLIC_COMPANY_COUNTRY=Deutschland
NEXT_PUBLIC_COMPANY_EMAIL=info@aufabruf.eu
NEXT_PUBLIC_COMPANY_PHONE=02366 58 292 58
NEXT_PUBLIC_COMPANY_WEBSITE=www.aufabruf.eu

# Register Information
NEXT_PUBLIC_REGISTER_NUMBER=HRB 9754
NEXT_PUBLIC_REGISTER_COURT=Amtsgericht Recklinghausen
NEXT_PUBLIC_VAT_ID=DE369 553 099

# Responsible Person
NEXT_PUBLIC_RESPONSIBLE_NAME=Christian Zak
NEXT_PUBLIC_RESPONSIBLE_POSITION=Geschäftsführer

# Sentry Error Tracking (Optional but recommended)
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Migration Commands

### Development → Staging

```bash
# Copy staging environment
cp .env.local .env.staging

# Update feature flags for staging
sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.staging
sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.staging
sed -i 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.staging

# Deploy to staging
npm run deploy:staging
```

### Staging → Production

```bash
# Copy production environment
cp .env.staging .env.production

# Update URLs and project IDs for production
sed -i 's/staging.jobflow.app/jobflow.app/' .env.production
sed -i 's/your_staging_project/your_production_project/' .env.production

# Deploy to production
npm run deploy:production
```

## Quick Migration Script

Create `scripts/migrate-to-production.sh`:

```bash
#!/bin/bash

echo "🚀 JobFlow Migration Script"
echo "=========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please create it first."
    exit 1
fi

# Backup current environment
cp .env.local .env.backup
echo "✅ Backup created: .env.backup"

# Migration options
echo ""
echo "Select migration target:"
echo "1) Staging (Partial Migration)"
echo "2) Production (Full Migration)"
echo "3) Development (Mock Mode)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🔄 Migrating to Staging..."
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.local
        echo "✅ Staging migration complete"
        ;;
    2)
        echo "🔄 Migrating to Production..."
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.local
        echo "✅ Production migration complete"
        ;;
    3)
        echo "🔄 Reverting to Development..."
        cp .env.backup .env.local
        echo "✅ Development mode restored"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Migration completed!"
echo "Current feature flags:"
grep "NEXT_PUBLIC_ENABLE" .env.local

echo ""
echo "Next steps:"
echo "1. Test the application"
echo "2. Run: npm run build"
echo "3. Deploy if ready"
```

## Environment Validation

Create `scripts/validate-env.js`:

```javascript
const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_ENABLE_MOCK_AUTH',
    'NEXT_PUBLIC_ENABLE_MOCK_DATA',
    'NEXT_PUBLIC_ENABLE_REALTIME',
  ];

  const missing = requiredVars.filter(varName => !envVars[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    process.exit(1);
  }

  // Validate feature flags
  const mockAuth = envVars['NEXT_PUBLIC_ENABLE_MOCK_AUTH'] === 'true';
  const mockData = envVars['NEXT_PUBLIC_ENABLE_MOCK_DATA'] === 'true';
  const realtime = envVars['NEXT_PUBLIC_ENABLE_REALTIME'] === 'true';

  console.log('✅ Environment validation passed');
  console.log('📊 Current configuration:');
  console.log(`   Mock Auth: ${mockAuth}`);
  console.log(`   Mock Data: ${mockData}`);
  console.log(`   Realtime: ${realtime}`);

  // Production validation
  if (process.env.NODE_ENV === 'production') {
    if (mockAuth || mockData) {
      console.error('❌ Production mode with Mock features is not allowed');
      process.exit(1);
    }
    console.log('✅ Production configuration valid');
  }
}

validateEnvironment();
```

## Usage Instructions

1. **Create `.env.local`** with your Firebase credentials
2. **Run validation**: `node scripts/validate-env.js`
3. **Migrate**: `bash scripts/migrate-to-production.sh`
4. **Test**: `npm run build && npm run dev`
5. **Deploy**: `npm run deploy:production`

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check Firebase credentials in `.env.local`
   - Verify project ID matches Firebase Console

2. **"Permission denied"**
   - Deploy Firestore Rules: `firebase deploy --only firestore:rules`
   - Check user roles in Firebase Auth

3. **"Mock data still showing"**
   - Verify feature flags: `grep NEXT_PUBLIC_ENABLE .env.local`
   - Restart development server

4. **"Realtime not working"**
   - Check Firestore indexes: `firebase deploy --only firestore:indexes`
   - Verify user authentication

### Support Commands

```bash
# Check current configuration
grep "NEXT_PUBLIC_ENABLE" .env.local

# Reset to development
cp .env.backup .env.local

# Validate environment
node scripts/validate-env.js

# Check Firebase connection
npm run test:firebase
```



---

## Quelle: docs/ENV_EXAMPLE.md

# Environment Variables Template

Create a `.env.local` file in the root directory with these variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Emulator Configuration (Development)
NEXT_PUBLIC_USE_EMULATOR=false

# Application Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WebSocket Configuration (für Realtime Updates)
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com

# Feature Flags
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_REALTIME=false

# Legal/Impressum Configuration (REQUIRED for Production)
NEXT_PUBLIC_COMPANY_NAME=AufAbruf GmbH
NEXT_PUBLIC_LEGAL_FORM=GmbH
NEXT_PUBLIC_COMPANY_STREET=Herner Straße 134
NEXT_PUBLIC_COMPANY_CITY=Herten
NEXT_PUBLIC_COMPANY_ZIP=45699
NEXT_PUBLIC_COMPANY_COUNTRY=Deutschland
NEXT_PUBLIC_COMPANY_EMAIL=info@aufabruf.eu
NEXT_PUBLIC_COMPANY_PHONE=02366 58 292 58
NEXT_PUBLIC_COMPANY_WEBSITE=www.aufabruf.eu

# Register Information
NEXT_PUBLIC_REGISTER_NUMBER=HRB 9754
NEXT_PUBLIC_REGISTER_COURT=Amtsgericht Recklinghausen
NEXT_PUBLIC_VAT_ID=DE369 553 099

# Responsible Person
NEXT_PUBLIC_RESPONSIBLE_NAME=Christian Zak
NEXT_PUBLIC_RESPONSIBLE_POSITION=Geschäftsführer

# Sentry Error Tracking (Optional but recommended)
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Server-seitige Secrets

```env
# Firebase Admin Service Account (als Base64, nicht ins Repo einchecken!)
FIREBASE_ADMIN_CREDENTIALS_BASE64=PASTE_BASE64_JSON_HERE
```

**Hinweis:** Service-Account lokal als `serviceAccount.json` speichern, dann mit `cat serviceAccount.json | base64` kodieren. Den Base64-String als Secret hinterlegen (`firebase functions:secrets:set FIREBASE_ADMIN_CREDENTIALS_BASE64="…"`) oder in der Firebase Console (Environment Configuration). Anschließend Next.js/Hosting erneut deployen, damit das Secret in der SSR-Funktion landet. Nach dem Deploy einmal aus- und wieder einloggen (alternativ `/api/auth/sync-claims` aufrufen) und die betroffene Seite in Production neu öffnen, damit alle Aggregationsabfragen die neuen Claims verwenden.



---

## Quelle: docs/ERROR_HANDLING.md

# Error Handling Guide - JobFlow Application

## Overview

This guide provides comprehensive documentation for the error handling system implemented in the JobFlow application. The system follows State-of-the-Art (SOTA) practices and provides robust error management, user-friendly error messages, and comprehensive monitoring capabilities.

## Architecture

### Error Management System

The error handling system consists of three main components:

1. **Error Types & Classes** (`lib/errors/ErrorTypes.ts`)
2. **Error Handler** (`lib/errors/ErrorHandler.ts`)
3. **Error Logger** (`lib/errors/ErrorLogger.ts`)

### Error Boundary Hierarchy

The application uses a 3-tier error boundary system:

1. **Global Error Boundary** - Catches all unhandled errors
2. **Route Error Boundary** - Catches route-specific errors
3. **Component Error Boundary** - Catches component-level errors

## Error Types

### AppError Base Class

All errors in the application extend the `AppError` base class:

```typescript
import { AppError, ErrorCode, ErrorSeverity } from '@/lib/errors';

// Create a new error
const error = new AppError(
  ErrorCode.VALIDATION_REQUIRED_FIELD,
  'Email field is required',
  ErrorSeverity.WARNING,
  { component: 'UserForm', userId: '123' },
  { retryable: true }
);
```

### Error Codes

The system uses typed error codes for consistent error handling:

```typescript
enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation Errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',

  // Network & Service Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Firebase Specific
  FIREBASE_PERMISSION_DENIED = 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_NOT_FOUND = 'FIREBASE_NOT_FOUND',

  // Business Logic
  SHIFT_CONFLICT = 'SHIFT_CONFLICT',
  QUALIFICATION_MISSING = 'QUALIFICATION_MISSING',

  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Error Severity Levels

```typescript
enum ErrorSeverity {
  CRITICAL = 'critical', // System-breaking errors
  ERROR = 'error', // User-facing errors
  WARNING = 'warning', // Warnings
  INFO = 'info', // Informational messages
}
```

## Error Handling Patterns

### Service Layer Error Handling

All service methods should use the error handler for consistent error processing:

```typescript
import { errorHandler, logger } from '@/lib/errors';

export const userService = {
  async getUserById(id: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) return null;

      return transformUserData(userDoc.data());
    } catch (error) {
      const appError = errorHandler.handleFirebaseError(error, {
        component: 'userService',
        action: 'getUserById',
      });
      logger.error('Failed to get user by ID', appError, {
        userId: id,
      });
      throw appError;
    }
  },
};
```

### Component Error Handling

Use error boundaries and the error display components:

```typescript
import { ErrorDisplay, ComponentErrorBoundary } from '@/components/errors';

function UserProfile({ userId }: { userId: string }) {
  return (
    <ComponentErrorBoundary component="UserProfile">
      <UserProfileContent userId={userId} />
    </ComponentErrorBoundary>
  );
}

// Or use the hook for programmatic error handling
function UserForm() {
  const { captureError } = useErrorBoundary();

  const handleSubmit = async (data: FormData) => {
    try {
      await userService.updateUser(data);
    } catch (error) {
      captureError(error);
    }
  };
}
```

### Toast Messages

Use the toast manager for user notifications:

```typescript
import { useToastManager } from '@/components/errors';

function UserActions() {
  const { showSuccess, showError, showAppError } = useToastManager();

  const handleSave = async () => {
    try {
      await userService.saveUser();
      showSuccess('Benutzer erfolgreich gespeichert!');
    } catch (error) {
      if (error instanceof AppError) {
        showAppError(error);
      } else {
        showError('Fehler beim Speichern des Benutzers');
      }
    }
  };
}
```

## Error Boundaries

### Global Error Boundary

Wrap your entire application:

```typescript
import { GlobalErrorBoundary } from '@/components/errors';

function App() {
  return (
    <GlobalErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling
        console.error('Global error:', error, errorInfo);
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <YourApp />
    </GlobalErrorBoundary>
  );
}
```

### Route Error Boundary

Wrap individual routes:

```typescript
import { RouteErrorBoundary } from '@/components/errors';

function UserRoute() {
  return (
    <RouteErrorBoundary route="/users">
      <UserPage />
    </RouteErrorBoundary>
  );
}
```

### Component Error Boundary

Wrap individual components:

```typescript
import { ComponentErrorBoundary } from '@/components/errors';

function UserCard({ user }: { user: User }) {
  return (
    <ComponentErrorBoundary component="UserCard">
      <UserCardContent user={user} />
    </ComponentErrorBoundary>
  );
}
```

## Logging

### Structured Logging

Use the logger for consistent logging:

```typescript
import { logger } from '@/lib/errors';

// Different log levels
logger.debug('Debug message', { component: 'UserService' });
logger.info('User action completed', { userId: '123', action: 'login' });
logger.warn('Deprecated API used', { api: 'old-endpoint' });
logger.error('Operation failed', error, { component: 'UserService' });
logger.critical('System failure', error, { component: 'Database' });

// Performance logging
logger.performance('Database query', 150, { query: 'getUsers' });

// User action logging
logger.userAction('user_login', { userId: '123' });

// API request logging
logger.apiRequest('GET', '/api/users', 200, 120, { userId: '123' });
```

### Component-Specific Logging

Create component-specific loggers:

```typescript
import { LogUtils } from '@/lib/errors';

const userLogger = LogUtils.createComponentLogger('UserService');

userLogger.info('User created', { userId: '123' });
userLogger.error('User creation failed', error, { userData: data });
```

## Error Recovery

### Retry Mechanisms

The error handler provides built-in retry logic:

```typescript
import { errorHandler } from '@/lib/errors';

// Execute with retry
const result = await errorHandler.executeWithRetry(
