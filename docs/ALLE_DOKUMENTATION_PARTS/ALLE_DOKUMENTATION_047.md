# JobFlow – Dokumentation Teil 47

*Zeichen 913969–933844 von 2862906*

---

#### Problem: Fehlende Bulk-Aktionen

**Admin-Shifts-Seite:**
- Keine Möglichkeit, mehrere Schichten gleichzeitig zu bearbeiten
- Keine Bulk-Delete-Funktion

**Empfehlung:** Multi-Select und Bulk-Aktionen hinzufügen.

#### Problem: Fehlende Export-Funktionen

**Viele Listen-Seiten:**
- Keine CSV/Excel-Export-Funktion
- Daten müssen manuell kopiert werden

**Code-Referenz:**
```262:274:app/(admin)/admin/shifts/page.tsx
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateShift}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Neue Schicht
              </Button>
              <IconButton onClick={() => refetch()} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                <Refresh />
              </IconButton>
            </Stack>
```

**Empfehlung:** Export-Button zu Listen-Seiten hinzufügen.

### 5. Fehlende Bestätigungsdialoge

#### Problem: Kritische Aktionen ohne Bestätigung

**Beispiele:**
- Schicht-Zuweisung ohne Bestätigung
- Status-Änderungen ohne Bestätigung
- Bulk-Operationen ohne Bestätigung

**Empfehlung:** Bestätigungsdialoge für alle kritischen Aktionen.

### 6. Fehlende Fehlerbehandlung

#### Problem: Keine sichtbare Fehlerbehandlung in Formularen

**Viele Formulare:**
- Zeigen Fehler nur als Toast
- Keine Inline-Fehleranzeige
- Nutzer muss Toast abwarten

**Empfehlung:** Inline-Fehleranzeige in Formularen.

### 7. Accessibility-Probleme

#### Problem: Fehlende ARIA-Labels

**Viele IconButtons:**
- Keine `aria-label` Attribute
- Screen-Reader können Buttons nicht identifizieren

**Code-Referenz:**
```271:273:app/(admin)/admin/shifts/page.tsx
              <IconButton onClick={() => refetch()} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                <Refresh />
              </IconButton>
```

**Empfehlung:** Alle IconButtons sollten `aria-label` haben.

#### Problem: Fehlende Keyboard-Navigation

**Viele Dialoge:**
- Keine Tab-Navigation dokumentiert
- Escape-Taste funktioniert, aber nicht dokumentiert

**Empfehlung:** Keyboard-Navigation dokumentieren und testen.

### 8. Button-Platzierung

#### Problem: Inkonsistente Button-Platzierung

**Verschiedene Seiten:**
- Buttons mal links, mal rechts
- Keine einheitliche Regelung

**Empfehlung:** Design-System für Button-Platzierung definieren.

## Verbesserungsvorschläge

### Priorität 1: Hoch (Kritisch für UX)

1. **Einheitliche Delete-Bestätigungen**
   - Alle `confirm()` durch `ConfirmDestructiveDialog` ersetzen
   - Dateien: `app/(admin)/admin/shifts/page.tsx`, weitere betroffene Dateien

2. **Loading-States für alle Buttons**
   - Loading-Indikatoren für alle API-Calls
   - Disabled-State während Verarbeitung

3. **Fehlende Funktionen implementieren**
   - Bearbeiten-Button in Assignments implementieren
   - Oder Button entfernen, wenn nicht benötigt

4. **Erweiterte Formular-Validierung**
   - Zeit-Logik-Validierung (Endzeit > Startzeit)
   - Pausenzeit < Arbeitszeit
   - Datum-Validierung (nicht in Zukunft)

### Priorität 2: Mittel (Verbesserung der Konsistenz)

5. **Einheitliche Button-Größen**
   - Design-System für Button-Größen definieren
   - Konsistente Anwendung

6. **Dialog-Konsistenz**
   - Einheitliche maxWidth-Werte
   - Konsistente Animationen

7. **Export-Funktionen**
   - CSV/Excel-Export für Listen-Seiten
   - PDF-Export für Berichte

8. **Bulk-Aktionen**
   - Multi-Select für Listen
   - Bulk-Delete, Bulk-Edit

### Priorität 3: Niedrig (Nice-to-have)

9. **Echtzeit-Validierung**
   - Validierung während Eingabe
   - Sofortiges Feedback

10. **Erweiterte Accessibility**
    - ARIA-Labels für alle Buttons
    - Keyboard-Navigation dokumentieren

11. **Button-Platzierung**
    - Design-System definieren
    - Konsistente Anwendung

## Code-Referenzen

### Wichtige Dateien für Änderungen

1. **Button-Komponenten:**
   - `components/common/ConfirmDialog.tsx` - Standard-Bestätigungsdialog
   - `components/ui/ConfirmDestructiveDialog.tsx` - Destruktive Aktionen

2. **Formulare:**
   - `components/time/TimesheetForm.tsx` - Zeiterfassungsformular
   - `components/admin/ShiftCreateDialog.tsx` - Schicht-Erstellung
   - `components/admin/ShiftEditDialog.tsx` - Schicht-Bearbeitung
   - `components/admin/StaffCreateDialog.tsx` - Mitarbeiter-Erstellung
   - `components/admin/StaffEditDialog.tsx` - Mitarbeiter-Bearbeitung

3. **Seiten mit Buttons:**
   - `app/(admin)/admin/shifts/page.tsx` - Schichtverwaltung
   - `app/(admin)/admin/assignments/page.tsx` - Einsatzverwaltung
   - `app/(admin)/admin/mitarbeiter/page.tsx` - Mitarbeiterverwaltung
   - `app/(employee)/employee/zeiterfassung/page.tsx` - Zeiterfassung

4. **Admin-Komponenten:**
   - `components/admin/QuickActions.tsx` - Schnellaktionen
   - `components/admin/ShiftManagementCard.tsx` - Schicht-Karte

## Zusammenfassung der gefundenen Probleme

| Problem | Priorität | Aufwand | Dateien |
|---------|-----------|---------|---------|
| Delete ohne Bestätigung | Hoch | Niedrig | `app/(admin)/admin/shifts/page.tsx` |
| Fehlende Loading-States | Hoch | Mittel | Alle Seiten mit Buttons |
| Unvollständige Validierung | Hoch | Mittel | `components/time/TimesheetForm.tsx` |
| Bearbeiten ohne Funktion | Hoch | Mittel | `app/(admin)/admin/assignments/page.tsx` |
| Fehlende Export-Funktionen | Mittel | Mittel | Listen-Seiten |
| Inkonsistente Button-Größen | Mittel | Niedrig | Alle Seiten |
| Fehlende ARIA-Labels | Mittel | Niedrig | Alle IconButtons |
| Fehlende Bulk-Aktionen | Niedrig | Hoch | Admin-Seiten |

## Nächste Schritte

1. ✅ Alle `confirm()` durch `ConfirmDestructiveDialog` ersetzen
2. ✅ Loading-States für alle Buttons hinzufügen
3. ✅ Erweiterte Formular-Validierung implementieren
4. ✅ Fehlende Funktionen implementieren oder entfernen
5. ✅ Export-Funktionen hinzufügen
6. ✅ Button-Konsistenz verbessern
7. ✅ Accessibility verbessern


```

---

## Implementation Guides

*10 Dateien*

### 📄 ADMIN_GUIDE.md

```markdown
# Admin Guide

Dieser Leitfaden beschreibt die wichtigsten Admin-Workflows in JobFlow.

## Anmeldung
- Klassisch mit E-Mail/Passwort
- Optional SSO (OIDC), wenn `NEXT_PUBLIC_OIDC_PROVIDER_ID` konfiguriert ist

## Rollen & Berechtigungen
- Rollen: Admin, Dispatcher, Nurse
- Mandanten & Scopes:
  - Mandant wird über `tenantId` gesteuert (Server-Regeln + Client-Guards)
  - Zugriffe auf Einrichtungen über `facilityIds` (Client-Guards)

## Audit Logs
- Ansicht: Admin → Audit Logs (`/admin/audit-logs`)
- Enthält: Actor, Aktion, Ziel, Zeitstempel
- Filterbar nach Aktion und Actor

## Sicherheit & Stabilität
- Sicherheits-Header & CSP aktiv
- Rate Limiting für `/api` & `/auth`
- Health-Check: `/api/health`, Status-Seite: `/status`

## DSGVO
- Datenexport (Callable): `exportUserData`
- Datenlöschung (Callable): `deleteUserData` (Soft-/Hard-Delete)
- Prozesse: siehe `docs/DSGVO_PROZESSE.md`

## Backups & Wiederherstellung
- Firestore-Backup: `scripts/firestore-backup.sh`
- Storage-Backup: `scripts/storage-backup.sh`
- Runbook: `docs/DISASTER_RECOVERY.md`

## Häufige Admin-Operationen
- Einrichtungen verwalten (Anlegen, Bearbeiten, Löschen)
- Schichten verwalten (Kapazität, Status, Zuweisungen)
- Nutzer verwalten (Rollen, Aktivierung, Profile)

Hinweis: Änderungen werden in Audit-Logs protokolliert.

```

---

### 📄 ENVIRONMENT_SETUP.md

```markdown
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

```

---

### 📄 FCM_SETUP.md

```markdown
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

