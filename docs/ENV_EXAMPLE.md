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
