# Disaster Recovery Runbook

Ziel: Wiederherstellung der Kernfunktionen (Auth, Firestore, Storage) innerhalb RTO <= 2h bei RPO <= 24h.

## Backup-Quelle

- Firestore: `scripts/firestore-backup.sh` exportiert nach `gs://<BACKUP_BUCKET>/firestore/<PROJECT>/<YYYYMMDD-HHMMSS>`
- Storage: `scripts/storage-backup.sh` kopiert nach `gs://<BACKUP_BUCKET>/storage/<PROJECT>/<YYYYMMDD-HHMMSS>/`

## Wiederherstellung Firestore

1. Projekt setzen: `gcloud config set project <PROJECT_ID>`
2. Letztes Backup finden: `gsutil ls gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/`
3. Restore: `gcloud firestore import gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/<STAMP>`
4. Indexe prüfen: `node scripts/create-firestore-indexes.js`

## Wiederherstellung Storage

1. Prüfe Zielbucket (Produktion): `gs://<PROJECT_ID>.appspot.com`
2. Sync: `gsutil -m rsync -r gs://<BACKUP_BUCKET>/storage/<PROJECT_ID>/<STAMP>/ gs://<PROJECT_ID>.appspot.com`

## Secrets & Konfiguration

- `.env` und Firebase-Konsole prüfen (API Keys, OAuth Redirects, Auth-Domains)
- Service Accounts: Zugriff auf Backup-Bucket (Storage Admin, Firestore Admin)

## Smoke Tests (nach Restore)

- Login (Admin & Mitarbeiter)
- Schichtliste laden (Filter)
- Dokumente anzeigen/Download
- Timesheet erstellen
- Admin: Einrichtung ändern

## Rollen & Regeln

- `firestore.rules` neu deployen und Querzugriff-Tests durchführen

## Protokollierung

- Zeiten dokumentieren: Start, Ende, Dauer
- Datenstand dokumentieren: Backup-Stempel (RPO)

## Drill-Frequenz

- Quartalsweise durchführen, Ergebnisse im Repo dokumentieren

---

## Deployed Version zurück ins Git (welcher Commit liegt live?)

**Wichtig:** Auf Firebase liegt nur der **Build** (kompilierte App), nicht der Quellcode. Quellcode lebt in Git. Wenn ihr den deployten Stand wiederherstellen wollt, braucht ihr den **Commit**, der zuletzt erfolgreich deployed wurde.

### Option 1: Letzten deployten Commit ermitteln (GitHub Actions)

Der Production-Deploy (`.github/workflows/firebase-hosting.yml`) baut bei jedem Push auf `main`. Der **Commit, der den Lauf ausgelöst hat, ist der deployte Stand.**

- **Manuell:** GitHub → Repo → Actions → Workflow „Deploy to Firebase Hosting“ → letzten **erfolgreichen** Run auf `main` öffnen → oben steht der Commit (z. B. „abc123“). Lokal: `git fetch origin && git checkout abc123`.
- **Per Script:** Im Projektroot ausführen:
  ```bash
  ./scripts/get-deployed-commit.sh
  ```
  Das Script gibt die Commit-SHA des letzten erfolgreichen Production-Deploys aus (falls GitHub API erreichbar). Dann: `git fetch origin && git checkout <ausgegebene-SHA>`.

### Option 2: Release-Tags setzen (empfohlen für später)

Bei jedem Production-Deploy einen Tag setzen, damit ihr jederzeit den live-Stand checkouten könnt:

- Nach erfolgreichem Deploy: `git tag release-$(date +%Y%m%d-%H%M) main && git push origin --tags`
- Wiederherstellen: `git fetch origin && git checkout release-20250215-1200` (Beispiel).

Ihr könnt das in der GitHub Action nach dem Deploy automatisch machen (z. B. mit `actions/github-script`).

### Option 3: Repo komplett verloren – was geht, was nicht

- **Von Firebase „Quellcode zurückholen“:** Nicht möglich. Hosting liefert nur die **deployten Dateien** (HTML, JS-Bundles, CSS). Das ist kompiliert/minifiziert, kein editierbarer TypeScript/React-Code.
- **Build-Artefakte als Notfall-Backup:** Man könnte die Live-Site per `wget`/Crawler herunterladen – das ist nur ein Snapshot der **gebauten** App, kein Ersatz für Git.
- **Fazit:** Git (oder ein Mirror/Backup des Repos) ist die einzige Quelle für den echten Quellcode. Repo regelmäßig sichern und bei jedem Live-Release den zugehörigen Commit dokumentieren oder taggen.
