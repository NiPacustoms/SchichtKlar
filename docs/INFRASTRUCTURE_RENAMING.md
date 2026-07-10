# Infrastruktur-Namen: bewusst beibehaltene JobFlow-Bezüge

**Stand:** 10.07.2026 · Branch `chore/rename-jobflow-to-schichtklar`

Beim Rebrand JobFlow → Schichtklar wurden **sichtbare** Produktbezeichnungen vollständig ersetzt. Einige **technische Identifier** enthalten weiterhin „jobflow", weil ihre Änderung bestehende Infrastruktur, Deployments oder Authentifizierung beschädigen würde. Sie sind **für Endnutzer nicht sichtbar**. Diese Datei dokumentiert jeden dieser Fälle und wie ein Käufer sie migrieren kann.

## 1. Firebase-Projekt-ID `jobflow25`

**Vorkommen:** `.firebaserc`, `.github/workflows/firebase-hosting.yml` (`--project jobflow25`), zahlreiche `scripts/*` (Setup/Deploy/Permissions), `.env.production.example` (Kommentare).

**Warum unverändert:** Eine Firebase-/GCP-Projekt-ID ist **unveränderlich**. An ihr hängen produktiv: Authentication-Nutzerkonten, Firestore-Daten, Storage-Bucket, Hosting-Site, Cloud Functions und alle Service-Account-Berechtigungen. „Umbenennen" ist technisch nur als **Anlegen eines neuen Projekts + vollständige Datenmigration** möglich.

**Nutzer-sichtbar:** Nein (erscheint nur in Netzwerk-Requests/CI-Logs).

**Abgeleitete, ebenfalls gebundene Werte:**
- Auth-Domain `jobflow25.firebaseapp.com`
- Storage-Bucket `jobflow25.firebasestorage.app`
- Functions-Basis-URL `https://us-central1-jobflow25.cloudfunctions.net`

**Migration für einen Käufer (optional, wenn ein eigenes Projekt gewünscht ist):**
1. Neues Firebase-Projekt anlegen (z. B. `schichtklar-prod`), Region `europe-west1` beibehalten.
2. `NEXT_PUBLIC_FIREBASE_*` (aus Projekt-Einstellungen), `.firebaserc` (`default`) und die `--project`-Flags in `.github/workflows/firebase-hosting.yml` + Skripten auf die neue ID setzen.
3. Firestore/Storage per Managed Export/Import migrieren; Auth-Nutzer via `firebase auth:export`/`auth:import`.
4. Firestore- und Storage-Rules sowie Indizes neu deployen.
5. Custom Claims neu setzen (`scripts/sync-user-claims.js` / `sync-custom-claims.js`).
6. Neuen Service-Account anlegen und als GitHub-Secret hinterlegen (siehe Punkt 2).

**Risiko:** Hoch (Datenmigration). Ohne Käuferwunsch nach eigenem Projekt bleibt `jobflow25` bestehen.

## 2. GitHub-Actions-Secret-Name `FIREBASE_SERVICE_ACCOUNT_JobFlow`

**Vorkommen:** `.github/workflows/firebase-hosting.yml`, `.github/workflows/configure-storage-cors.yml`, `scripts/README.md`, `scripts/setup-workload-identity.sh`.

**Warum unverändert:** Der Name referenziert ein tatsächlich im GitHub-Repository konfiguriertes **Secret**. Eine Umbenennung im Code ohne gleichzeitige Umbenennung des Secrets in den Repo-Settings bricht das Deployment.

**Migration (optional):** In GitHub → Settings → Secrets ein Secret `FIREBASE_SERVICE_ACCOUNT_SCHICHTKLAR` mit demselben Wert anlegen, dann die Workflow-Referenzen umstellen und das alte Secret entfernen. Rein kosmetisch, kein funktionaler Gewinn.

## 3. GitHub-Repository-Name `JobFlow`

**Vorkommen:** Beispiel-Prompts/Defaults in `scripts/setup-github-secrets.sh`, `scripts/setup-workload-identity.sh` (`REPO_NAME:-JobFlow`).

**Warum unverändert:** Diese Werte spiegeln den **aktuellen echten Repo-Namen** (`NiPacustoms/JobFlow`) wider. Sie sind korrekt, solange das Repository nicht umbenannt wird.

**Migration (optional):** Repository in GitHub umbenennen (Settings → Rename). GitHub richtet automatische Redirects ein. Danach die genannten Defaults auf `Schichtklar` setzen. Manuelle, nutzer-unsichtbare Aktion.

## 4. Nicht betroffen (verifiziert)

- **Firestore-Collections:** kein Collection-Name enthält „jobflow" (geprüft gegen `firestore.rules`). Keine Datenmigration nötig.
- **Storage-Pfade:** `logos/**`, `documents/**` – kein Markenbezug.
- **Custom Claims:** `role`, `companyId` – kein Markenbezug.
- **Lokaler Emulator-Projektname** wurde von `jobflow-rules-test` auf `schichtklar-rules-test` geändert (rein lokal, keine Produktivdaten).
- **IndexedDB-Cache** `JobFlowOffline` → `SchichtklarOffline` (nur clientseitiger Offline-Cache; da vor Launch keine echten Nutzer existieren, kein Datenverlust).
