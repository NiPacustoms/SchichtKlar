# JobFlow – Dokumentation Teil 138

*Zeichen 2722012–2741897 von 2862906*

---

## BMF-Steuerrechner-API (Nur für Tests)

### Wichtiger Hinweis

⚠️ **Die BMF-Steuerrechner-API ist ausschließlich für Testzwecke vorgesehen!**

- Die gewerbliche Nutzung ist ohne Einwilligung des BMF untersagt
- Für Produktion verwenden wir die implementierten PAP-Formeln (Programmablaufplan 2025)
- Die PAP-Formeln sind bereits in `lib/services/payroll/taxCalculation.ts` implementiert

### Test-API (Optional)

Falls Sie die BMF-Steuerrechner-API für Tests verwenden möchten:

```bash
# BMF-Steuerrechner-API (nur für Tests)
NEXT_PUBLIC_BMF_API_URL=https://www.bmf-steuerrechner.de/interface/2025Version1.xhtml
```

**Hinweis:** Die BMF-Steuerrechner-API wird aktuell nicht direkt verwendet, da wir die PAP-Formeln implementiert haben, die für Produktion geeignet sind.

## Aktuelle Implementierung

### Lohnsteuerberechnung

✅ **Implementiert:** BMF-konforme Lohnsteuerberechnung nach PAP 2025
- Datei: `lib/services/payroll/taxCalculation.ts`
- Verwendet offizielle BMF-Formeln
- Rechtskonform für Produktion
- **Funktioniert ohne externe API**

### ELStAM-Abfrage

✅ **Implementiert:** ELSTER-API-Integration (OPTIONAL)
- Datei: `lib/services/payroll/elstamService.ts`
- Automatische Abfrage nur wenn API-Key konfiguriert ist
- **Standard:** Verwendet manuell gepflegte Steuerdaten aus Employee-Daten
- Fallback auf lokale Daten bei API-Fehlern oder fehlendem API-Key

## Nächste Schritte

### Standard-Betrieb (ohne API)

1. **Steuerdaten manuell pflegen**
   - In der Firestore `users` Collection für jeden Mitarbeiter:
     - `taxClass`: Lohnsteuerklasse (1-6)
     - `childAllowance`: Anzahl Kinder
     - `churchTax`: Kirchensteuerpflichtig (boolean)
     - `state`: Bundesland (z.B. 'BW', 'BY', 'BE')
   - Die Lohnabrechnung verwendet diese Daten automatisch

2. **Berechnung testen**
   - Lohnabrechnung für Testperiode durchführen
   - Überprüfen Sie die BMF-konformen Berechnungen
   - Validieren Sie die Ergebnisse

### Optional: ELStAM-API aktivieren

1. **ELSTER-Registrierung** (nur wenn API gewünscht)
   - Registrieren Sie sich bei ELSTER
   - Beantragen Sie den API-Zugang für ELStAM
   - Konfigurieren Sie den API-Key in den Umgebungsvariablen

2. **Testing mit API**
   - Testen Sie die ELStAM-Integration mit Testdaten
   - Überprüfen Sie die Validierung und Synchronisation

3. **Produktion mit API**
   - Überwachen Sie die API-Aufrufe
   - Implementieren Sie Error-Handling und Retry-Logik

## Fehlerbehandlung

### ELStAM-API-Fehler

Bei API-Fehlern wird automatisch auf Mock-Daten zurückgegriffen. Die Fehler werden geloggt:

```typescript
// Beispiel: API-Fehler wird geloggt, Mock-Daten werden verwendet
console.warn('ELStAM-API-Fehler, verwende Mock-Daten als Fallback:', error);
```

### Validierung

Die ELStAM-Daten werden gegen lokale Employee-Daten validiert:
- Abweichungen werden als Warnungen geloggt
- ELStAM-Werte haben Vorrang
- Lokale Daten werden automatisch synchronisiert

## Support

- **ELSTER-API:** https://www.elster.de/elstam
- **BMF-Steuerrechner:** https://www.bmf-steuerrechner.de
- **PAP-Dokumentation:** https://www.bmf-steuerrechner.de/sonstiges/dialog/informationSchnittstelle.xhtml




---

## Quelle: docs/PRODUCTION_BACKUP.md

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




---

## Quelle: docs/PRODUCTION_ENVIRONMENT.md

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




---

## Quelle: docs/PRODUCTION_MONITORING.md

# Production Monitoring & Alerts

Diese Dokumentation beschreibt das Monitoring und Alerting für Production.

## Übersicht

JobFlow verwendet mehrere Monitoring-Tools und Alerting-Mechanismen:

1. **Sentry** - Error Tracking & Performance Monitoring
2. **Firebase Console** - Firebase-spezifisches Monitoring
3. **Health Checks** - `/api/health` Endpoint
4. **Status Page** - `/status` öffentliche Status-Seite
5. **GCP Monitoring** - Cloud Functions & Hosting Monitoring

## Sentry Configuration

### Setup

Sentry ist bereits konfiguriert in:
- `sentry.client.config.ts` - Client-side Error Tracking
- `sentry.server.config.ts` - Server-side Error Tracking
- `sentry.edge.config.ts` - Edge Runtime Error Tracking

### Environment Variable

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Features

- **Error Tracking**: Automatisches Tracking aller JavaScript-Fehler
- **Performance Monitoring**: Tracking von API-Latenz und Page Load Times
- **Release Tracking**: Automatisches Tracking von Deployments
- **Sensitive Data Filtering**: Automatisches Entfernen von Passwörtern, Tokens, etc.

### Alerting in Sentry

1. Sentry Dashboard öffnen
2. Settings > Alerts
3. Alert Rules erstellen:
   - **Error Rate**: > 5% in 5 Minuten
   - **New Issues**: Sofort bei neuen kritischen Fehlern
   - **Performance Degradation**: P95 Latenz > 1s

## Health Check Endpoint

### `/api/health`

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok" | "degraded" | "error",
  "timestamp": 1234567890,
  "uptimeSeconds": 3600,
  "env": "production",
  "firebase": {
    "connected": true,
    "error": null
  }
}
```

**Status Codes:**
- `200` - OK
- `503` - Service Unavailable (degraded/error)

### Status Page

**Endpoint:** `GET /status`

Öffentliche Status-Seite, die den Health-Check konsumiert.

## GCP Monitoring & Alerts

### Cloud Functions Monitoring

**Empfohlene Alerts:**

1. **Error Rate Alert**
   - Metric: `cloudfunctions.googleapis.com/function/execution_count`
   - Filter: `status = "error"`
   - Threshold: > 5% in 5 Minuten
   - Notification: Email + Slack

2. **Execution Time Alert**
   - Metric: `cloudfunctions.googleapis.com/function/execution_times`
   - Threshold: P95 > 5s
   - Notification: Email

3. **Invocation Count Alert**
   - Metric: `cloudfunctions.googleapis.com/function/invocation_count`
   - Threshold: > 1000/Minute (anomaly detection)
   - Notification: Email

### Firebase Hosting Monitoring

**Empfohlene Alerts:**

1. **5xx Error Rate**
   - Metric: `firebase.googleapis.com/hosting/request_count`
   - Filter: `status_code >= 500`
   - Threshold: > 1/Minute
   - Notification: Email + PagerDuty (kritisch)

2. **Response Time**
   - Metric: `firebase.googleapis.com/hosting/response_time`
   - Threshold: P95 > 2s
   - Notification: Email

### Firestore Monitoring

**Empfohlene Alerts:**

1. **Read/Write Errors**
   - Metric: `firestore.googleapis.com/api/request_count`
   - Filter: `status = "error"`
   - Threshold: > 10/Minute
   - Notification: Email

2. **Quota Usage**
   - Metric: `firestore.googleapis.com/api/request_count`
   - Threshold: > 80% des Tageslimits
   - Notification: Email

### Storage Monitoring

**Empfohlene Alerts:**

1. **Storage Errors**
   - Metric: `storage.googleapis.com/api/request_count`
   - Filter: `status = "error"`
   - Threshold: > 5/Minute
   - Notification: Email

## Alerting Setup

### GCP Alerting Policy erstellen

1. GCP Console öffnen
2. Monitoring > Alerting > Policies
3. "Create Policy" klicken
4. Condition hinzufügen (siehe oben)
5. Notification Channel konfigurieren:
   - Email
   - Slack (optional)
   - PagerDuty (optional, für kritische Alerts)

### Beispiel: Health Check Alert

```yaml
Display Name: Health Check Failed
Condition:
  Resource Type: Cloud Function
  Metric: cloudfunctions.googleapis.com/function/execution_count
  Filter: function_name = "health-check" AND status = "error"
  Aggregation: count
  Threshold: > 0 in 5 minutes
Notification:
  - Email: ops@company.com
  - Slack: #alerts
```

## SLO/SLA Monitoring

Siehe `docs/SLO_SLA.md` für detaillierte SLO-Definitionen.

