# Deployment

**Stand:** 10.07.2026 · Schichtklar

Kanonische Deployment-Übersicht. Ausführliche Detailanleitungen: `docs/DEPLOY.md`, `docs/FIREBASE_SETUP.md`.

## Voraussetzungen
- Node.js 20, npm
- Firebase-Projekt (Region `europe-west1`), Firebase CLI (`firebase-tools`)
- Vollständige ENV (siehe `docs/ENVIRONMENT_VARIABLES.md`), inkl. echter Impressumsdaten (Build-Guard)

## Ablauf

```bash
# 1. Abhängigkeiten
npm ci

# 2. Qualität (empfohlen vor Deploy)
npm run typecheck
npm run lint
npm run test:rules        # Firestore-Rules (Java für Emulator nötig)

# 3. Rules & Indizes
firebase deploy --only firestore:rules,firestore:indexes,storage

# 4. Cloud Functions
firebase deploy --only functions

# 5. App (SSR via frameworksBackend) bauen & deployen
npm run build
firebase deploy --only hosting
# oder gebündelt:
npm run deploy
```

## Hosting-Modell
Next.js (App Router, SSR) läuft über Firebase Hosting `frameworksBackend` in `europe-west1` (siehe `firebase.json`). Sicherheits-Header und CSP kommen aus `next.config.js`.

## CI/CD
- Workflows: `.github/workflows/firebase-hosting.yml` (Deploy), `quality.yml` (Lint/Typecheck), `ci.yml`.
- **Hinweis:** GitHub Actions war zuletzt repo-weit inaktiv (siehe `KNOWN_LIMITATIONS.md` A5) – vor Verlass auf CI reaktivieren.
- Deploy-Secret: `FIREBASE_SERVICE_ACCOUNT_*` (GitHub-Secret; bei Übergabe rotieren).

## Nach dem Deploy
- Admin-Konto anlegen (`/admin-registrieren` oder Bootstrap; danach Bootstrap deaktivieren).
- `NEXT_PUBLIC_USE_EMULATOR` in Produktion **nicht** setzen.
- Rollback: vorherige Hosting-Version in der Firebase-Konsole reaktivieren.
