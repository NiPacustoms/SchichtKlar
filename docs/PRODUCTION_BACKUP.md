# Production Backup Strategy

Diese Dokumentation beschreibt die Backup-Strategie für Production.

## Übersicht

JobFlow sichert folgende Daten:
1. **Firestore** - Alle Datenbankdaten
2. **Firebase Storage** - Alle hochgeladenen Dateien

## Backup-Ziele

- **RPO (Recovery Point Objective)**: ≤ 24 Stunden
- **RTO (Recovery Time Objective)**: ≤ 2 Stunden
- **Retention**: 30 Tage

## Backup-Strategie

### Firestore Backups

**Frequenz:** Täglich um 02:00 UTC

**Script:** `scripts/firestore-backup.sh`

**Ziel:** `gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/<YYYYMMDD-HHMMSS>`

**Setup:**

1. Backup-Bucket erstellen:
```bash
gsutil mb -p <PROJECT_ID> -l europe-west1 gs://<BACKUP_BUCKET>
```

2. Service Account Berechtigungen:
```bash
# Service Account benötigt:
# - Storage Admin (für Backup-Bucket)
# - Firestore Admin (für Export)
```

3. Cloud Scheduler Job erstellen:
```bash
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://<REGION>-<PROJECT_ID>.cloudfunctions.net/firestoreBackup" \
  --http-method=POST \
  --time-zone="UTC"
```

**Oder manuell ausführen:**

```bash
PROJECT_ID=jobflow25 \
BACKUP_BUCKET=gs://jobflow-backups \
./scripts/firestore-backup.sh
```

### Storage Backups

**Frequenz:** Täglich um 03:00 UTC

**Script:** `scripts/storage-backup.sh`

**Ziel:** `gs://<BACKUP_BUCKET>/storage/<PROJECT_ID>/<YYYYMMDD-HHMMSS>/`

**Setup:**

1. Cloud Scheduler Job erstellen:
```bash
gcloud scheduler jobs create http storage-daily-backup \
  --schedule="0 3 * * *" \
  --uri="https://<REGION>-<PROJECT_ID>.cloudfunctions.net/storageBackup" \
  --http-method=POST \
  --time-zone="UTC"
```

**Oder manuell ausführen:**

```bash
PROJECT_ID=jobflow25 \
SOURCE_BUCKET=gs://jobflow25.appspot.com \
BACKUP_BUCKET=gs://jobflow-backups \
./scripts/storage-backup.sh
```

## Backup-Cloud-Functions

### Firestore Backup Function

Erstelle eine Cloud Function für automatische Backups:

```typescript
// functions/src/backup/firestoreBackup.ts
import * as functions from 'firebase-functions';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const firestoreBackup = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 2 * * *') // Täglich um 02:00 UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const projectId = process.env.GCLOUD_PROJECT || 'jobflow25';
    const backupBucket = process.env.BACKUP_BUCKET || 'gs://jobflow-backups';
    
    try {
      const { stdout, stderr } = await execAsync(
        `PROJECT_ID=${projectId} BACKUP_BUCKET=${backupBucket} ./scripts/firestore-backup.sh`
      );
      
      console.log('Backup erfolgreich:', stdout);
      return { success: true, output: stdout };
    } catch (error) {
      console.error('Backup fehlgeschlagen:', error);
      throw error;
    }
  });
```

### Storage Backup Function

```typescript
// functions/src/backup/storageBackup.ts
import * as functions from 'firebase-functions';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const storageBackup = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 3 * * *') // Täglich um 03:00 UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const projectId = process.env.GCLOUD_PROJECT || 'jobflow25';
    const sourceBucket = `gs://${projectId}.appspot.com`;
    const backupBucket = process.env.BACKUP_BUCKET || 'gs://jobflow-backups';
    
    try {
      const { stdout, stderr } = await execAsync(
        `PROJECT_ID=${projectId} SOURCE_BUCKET=${sourceBucket} BACKUP_BUCKET=${backupBucket} ./scripts/storage-backup.sh`
      );
      
      console.log('Backup erfolgreich:', stdout);
      return { success: true, output: stdout };
    } catch (error) {
      console.error('Backup fehlgeschlagen:', error);
      throw error;
    }
  });
```

## Backup-Verifizierung

### Backup-Liste anzeigen

```bash
# Firestore Backups
gsutil ls gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/

# Storage Backups
gsutil ls gs://<BACKUP_BUCKET>/storage/<PROJECT_ID>/
```

### Backup-Größe prüfen

```bash
# Firestore Backup-Größe
gsutil du -sh gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/

# Storage Backup-Größe
gsutil du -sh gs://<BACKUP_BUCKET>/storage/<PROJECT_ID>/
```

### Backup-Validierung

Erstelle eine Cloud Function zur automatischen Validierung:

```typescript
// Prüft ob Backups erfolgreich waren
export const validateBackups = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 4 * * *') // Täglich um 04:00 UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    // Prüfe ob letztes Backup < 24h alt ist
    // Sende Alert bei fehlendem Backup
  });
```

## Wiederherstellung

Siehe `docs/DISASTER_RECOVERY.md` für detaillierte Wiederherstellungs-Prozesse.

### Firestore Restore

```bash
# 1. Projekt setzen
gcloud config set project <PROJECT_ID>

# 2. Letztes Backup finden
gsutil ls gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/

# 3. Restore durchführen
gcloud firestore import gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/<STAMP>

# 4. Indexe prüfen
node scripts/create-firestore-indexes.js
```

### Storage Restore

```bash
# 1. Zielbucket prüfen
gsutil ls gs://<PROJECT_ID>.appspot.com

# 2. Restore durchführen
gsutil -m rsync -r \
  gs://<BACKUP_BUCKET>/storage/<PROJECT_ID>/<STAMP>/ \
  gs://<PROJECT_ID>.appspot.com
```

## Backup-Retention

### Alte Backups löschen

Erstelle eine Cloud Function zur automatischen Bereinigung:

```typescript
// Löscht Backups älter als 30 Tage
export const cleanupOldBackups = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 5 * * 0') // Wöchentlich Sonntags um 05:00 UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Lösche Backups älter als 30 Tage
    // Siehe: gsutil -m rm -r gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/<OLD_DATE>/
  });
```

## Monitoring

### Backup-Status überwachen

1. **GCP Monitoring Alert:**
   - Metric: `cloudfunctions.googleapis.com/function/execution_count`
   - Filter: `function_name = "firestoreBackup" AND status = "error"`
   - Threshold: > 0
   - Notification: Email

2. **Backup-Größe überwachen:**
   - Prüfe ob Backup-Größe ungewöhnlich ist
   - Alert bei > 50% Größenänderung

3. **Backup-Frequenz überwachen:**
   - Prüfe ob tägliche Backups vorhanden sind
   - Alert bei fehlendem Backup > 24h

## Disaster Recovery Drill

**Frequenz:** Quartalsweise

**Prozess:**

1. Test-Restore in Staging-Umgebung
2. Smoke Tests durchführen
3. Ergebnisse dokumentieren
4. RTO/RPO messen

Siehe `docs/DISASTER_RECOVERY.md` für Details.

## Kosten

### Backup-Kosten (geschätzt)

- **Firestore Export**: ~$0.05 pro GB
- **Storage Backup**: ~$0.02 pro GB/Monat
- **Cloud Functions**: ~$0.40 pro Million Invocations

**Beispiel (100GB Daten):**
- Firestore Export: ~$5/Monat
- Storage Backup: ~$2/Monat
- Cloud Functions: ~$1/Monat
- **Gesamt: ~$8/Monat**

## Checkliste

- [ ] Backup-Bucket erstellt
- [ ] Service Account Berechtigungen konfiguriert
- [ ] Cloud Functions für Backups erstellt
- [ ] Cloud Scheduler Jobs konfiguriert
- [ ] Backup-Validierung eingerichtet
- [ ] Monitoring & Alerts konfiguriert
- [ ] Retention-Policy eingerichtet
- [ ] Disaster Recovery Drill durchgeführt
- [ ] Dokumentation aktualisiert

## Weitere Informationen

- Siehe auch: `docs/DISASTER_RECOVERY.md` für Wiederherstellungs-Prozesse
- Siehe auch: `scripts/firestore-backup.sh` für Backup-Script
- Siehe auch: `scripts/storage-backup.sh` für Storage-Backup-Script

