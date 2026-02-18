# Production Environment Setup

Diese Dokumentation beschreibt die Konfiguration der Environment-Variablen für Production.

## Übersicht

Alle Environment-Variablen müssen in der Production-Umgebung (Firebase Hosting / Vercel / etc.) gesetzt werden.

## Required Variables (MUSS gesetzt werden)

### Firebase Configuration

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Wo finden?** Firebase Console > Project Settings > General > Your apps

### Application Configuration

```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_USE_EMULATOR=false
```

**WICHTIG:** `NEXT_PUBLIC_USE_EMULATOR` muss in Production **IMMER** auf `false` sein!

### Legal/Impressum Configuration (REQUIRED)

```env
NEXT_PUBLIC_COMPANY_NAME=AufAbruf GmbH
NEXT_PUBLIC_LEGAL_FORM=GmbH
NEXT_PUBLIC_COMPANY_STREET=Herner Straße 134
NEXT_PUBLIC_COMPANY_CITY=Herten
NEXT_PUBLIC_COMPANY_ZIP=45699
NEXT_PUBLIC_COMPANY_COUNTRY=Deutschland
NEXT_PUBLIC_COMPANY_EMAIL=info@aufabruf.eu
NEXT_PUBLIC_COMPANY_PHONE=02366 58 292 58
NEXT_PUBLIC_COMPANY_WEBSITE=www.aufabruf.eu
NEXT_PUBLIC_REGISTER_NUMBER=HRB 9754
NEXT_PUBLIC_REGISTER_COURT=Amtsgericht Recklinghausen
NEXT_PUBLIC_VAT_ID=DE369 553 099
NEXT_PUBLIC_RESPONSIBLE_NAME=Christian Zak
NEXT_PUBLIC_RESPONSIBLE_POSITION=Geschäftsführer
```

**WICHTIG:** Diese Werte werden im Impressum und in der Datenschutzerklärung verwendet. Sie müssen korrekt sein!

## Optional but Recommended

### Sentry Error Tracking

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Empfohlen für Production:** Error-Tracking aktivieren für besseres Monitoring.

**Wo finden?** Sentry Dashboard > Settings > Projects > Client Keys (DSN)

### Feature Flags (Production)

```env
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REALTIME=true
```

**WICHTIG:** Mock-Features müssen in Production **IMMER** auf `false` sein!

## Server-side Variables (Optional)

Diese Variablen sind nur auf dem Server verfügbar (nicht `NEXT_PUBLIC_`):

### Firebase Admin SDK

Server-seitige APIs (z. B. `/api/auth/sync-claims`) benötigen ein Service-Account-JSON. Hinterlege dieses sicher in der Umgebung:

```env
# Bevorzugt: Base64-kodiertes JSON
FIREBASE_ADMIN_CREDENTIALS_BASE64=PASTE_BASE64_JSON_HERE

# Optional (nur lokal): Direktes JSON
# FIREBASE_ADMIN_CREDENTIALS={"type":"service_account",...}
```

**Empfehlung:** JSON lokal in einer Datei speichern und mit `cat serviceAccount.json | base64` kodieren. Den Base64-String anschließend als Secret in Firebase Hosting bzw. Functions setzen.

### Security Webhook (Optional)

```env
SECURITY_WEBHOOK_URL=https://your-webhook-url.com
```

Für Security-Alerts und Monitoring.

## Setup in Firebase Hosting

### Via Firebase Console

1. Firebase Console öffnen
2. Project Settings > Environment Configuration
3. Alle Variablen hinzufügen

### Via Firebase CLI

```bash
# Setze einzelne Variable
firebase functions:config:set app.env="production"

# Oder verwende .env.local (wird beim Deploy automatisch geladen)
```

### Via Vercel / Other Platforms

1. Platform Dashboard öffnen
2. Project Settings > Environment Variables
3. Alle Variablen hinzufügen
4. **WICHTIG:** Für Production-Environment setzen

## Validierung

Nach dem Setzen der Variablen:

```bash
# Validiere Environment-Variablen
npm run validate-env

# Oder manuell prüfen
node scripts/validate-env.js
```

## Checkliste vor Go-Live

- [ ] Alle `NEXT_PUBLIC_FIREBASE_*` Variablen gesetzt
- [ ] `NEXT_PUBLIC_USE_EMULATOR=false`
- [ ] `NEXT_PUBLIC_APP_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` mit Production-URL gesetzt
- [ ] Alle `NEXT_PUBLIC_COMPANY_*` Variablen mit echten Firmendaten gefüllt
- [ ] `NEXT_PUBLIC_ENABLE_MOCK_AUTH=false`
- [ ] `NEXT_PUBLIC_ENABLE_MOCK_DATA=false`
- [ ] `NEXT_PUBLIC_SENTRY_DSN` gesetzt (empfohlen)
- [ ] Environment-Variablen validiert

## Troubleshooting

### Problem: "Firebase Admin ist nicht konfiguriert"

**Lösung:** Service Account JSON-Datei muss vorhanden sein oder Environment-Variablen gesetzt werden.

### Problem: "Mock-Daten in Production"

**Lösung:** `NEXT_PUBLIC_ENABLE_MOCK_AUTH` und `NEXT_PUBLIC_ENABLE_MOCK_DATA` auf `false` setzen.

### Problem: "Legal Config Validation Failed"

**Lösung:** Alle `NEXT_PUBLIC_COMPANY_*` Variablen müssen gesetzt sein.

## Weitere Informationen

- Siehe auch: `.env.example` für vollständige Liste
- Siehe auch: `docs/ENV_EXAMPLE.md` für detaillierte Beschreibungen
- Siehe auch: `docs/ENVIRONMENT_SETUP.md` für Setup-Anleitung

