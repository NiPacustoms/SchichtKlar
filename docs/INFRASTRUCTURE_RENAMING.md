# Infrastruktur-Migration: JobFlow → Schichtklar

**Stand:** 10.07.2026 · Branch `chore/rename-jobflow-to-schichtklar`

Der Rebrand ist **auch auf Infrastrukturebene vollzogen**: Ein neues Firebase-Projekt **`schichtklar`** wurde angelegt, und alle Deploy-/Projekt-Referenzen im Repository wurden vom alten Projekt `jobflow25` auf `schichtklar` umgestellt (Frischstart, keine Datenmigration – `jobflow25` war Test/Entwicklung).

## 1. Firebase-Projekt `schichtklar` (neu, aktiv)

**Umgestellt in:** `.firebaserc` (`default: schichtklar`), `.github/workflows/firebase-hosting.yml` und `configure-storage-cors.yml` (`--project schichtklar`), alle Infra-Skripte unter `scripts/`, `.env.production.example` (Kommentare).

**Abgeleitete Werte (automatisch aus der Projekt-ID):**
- Auth-Domain `schichtklar.firebaseapp.com`
- Storage-Bucket `schichtklar.firebasestorage.app`
- Functions-Basis-URL wird im Code dynamisch aus `NEXT_PUBLIC_FIREBASE_PROJECT_ID` gebildet (`us-central1-<projectId>.cloudfunctions.net`) – keine Hardcodes.

**Web-Config:** Die `NEXT_PUBLIC_FIREBASE_*`-Werte des neuen Projekts gehören in `.env.local` (lokal, gitignored) bzw. in die Hosting-Umgebungsvariablen – **nicht** ins Repository. Firebase-Web-API-Keys sind per Design öffentlich; Sicherheit über Firestore-/Storage-Rules.

**Altes Projekt `jobflow25`:** war Test/Entwicklung, wird nicht weiter verwendet, keine Migration nötig. Kann in der Firebase-Konsole archiviert/gelöscht werden.

## 2. ERFORDERLICHE manuelle Schritte in GitHub (für CI/CD-Deploy)

Damit der Deploy-Workflow gegen `schichtklar` läuft, muss **außerhalb des Repos** eingerichtet werden:

1. **Service-Account** im Projekt `schichtklar` erstellen (Firebase-Konsole → Projekteinstellungen → Dienstkonten → neuen privaten Schlüssel generieren).
2. Diesen als **GitHub-Secret `FIREBASE_SERVICE_ACCOUNT_SCHICHTKLAR`** hinterlegen (Repo → Settings → Secrets and variables → Actions). Der Workflow referenziert bereits diesen Namen.
3. Ggf. weitere Secrets/Variablen setzen: `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_ADMIN_CREDENTIALS_BASE64`, E-Mail-Zugang, Impressums-`NEXT_PUBLIC_COMPANY_*`.
4. GitHub Actions reaktivieren (Repo-weit seit 31.05.2026 inaktiv – Settings → Actions / Billing).

## 3. GitHub-Repository-Name `JobFlow`

**Vorkommen:** Beispiel-Prompts/Defaults in `scripts/setup-github-secrets.sh`, `scripts/setup-workload-identity.sh` (`REPO_NAME:-JobFlow`) und Clone-Beispiele in der README.

**Status:** bewusst belassen – spiegelt den **aktuellen echten Repo-Namen** (`NiPacustoms/JobFlow`). Optional: Repository in GitHub umbenennen (Settings → Rename; automatische Redirects), danach diese Defaults auf `Schichtklar` setzen. Nutzer-unsichtbar.

## 4. Nicht betroffen (verifiziert)

- **Firestore-Collections / Storage-Pfade / Custom Claims:** kein Markenbezug, keine Datenmigration nötig.
- **Lokaler Emulator-Projektname:** `schichtklar-rules-test` (rein lokal).
- **IndexedDB-Cache:** `SchichtklarOffline` (clientseitiger Cache; Frischstart, kein Datenverlust).
