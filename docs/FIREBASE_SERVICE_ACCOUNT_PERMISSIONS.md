# Firebase Service Account - Berechtigungen erweitern

## Problem

Auch wenn die Firebase Extensions API aktiviert ist, schlägt das Deployment fehl, weil das Service Account keine Berechtigung hat, den API-Status zu prüfen.

## Lösung: Service Account Berechtigung hinzufügen

### Schritt 1: Service Account identifizieren

1. Gehe zu [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=jobflow25)

2. Finde das Service Account, das für das Deployment verwendet wird:
   - Normalerweise: `firebase-adminsdk-xxxxx@jobflow25.iam.gserviceaccount.com`
   - ODER: Das Service Account aus GitHub Secrets (`FIREBASE_SERVICE_ACCOUNT_Schichtklar`)

### Schritt 2: Service Account öffnen

Klicke auf das Service Account, um die Details zu öffnen.

### Schritt 3: Berechtigung hinzufügen

**Option A: Über IAM (Empfohlen)**

1. Gehe zu [IAM & Admin → IAM](https://console.cloud.google.com/iam-admin/iam?project=jobflow25)

2. Finde das Service Account in der Liste

3. Klicke auf das Bearbeiten-Symbol (Stift) bei dem Service Account

4. Klicke auf "ADD ANOTHER ROLE"

5. Füge die folgenden Rollen hinzu:
   - **Firebase Extensions API Admin** (`roles/firebaseextensions.admin`) - Für Firebase Extensions Zugriff
   - **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`) - Für API-Status-Prüfung
   - **Artifact Registry Administrator** (`roles/artifactregistry.admin`) - Für Cleanup Policy Setup
   - **Compute Viewer** (`roles/compute.viewer`) - Für Compute API Zugriff
   - **Service Usage Admin** (`roles/serviceusage.serviceUsageAdmin`) - Für Runtime Config API Zugriff

   **WICHTIG:** Alle Rollen werden benötigt für vollständiges Deployment!

6. Klicke auf "SAVE"

**Option B: Über Service Account Details**

1. Im Service Account Detail-View, klicke auf "PERMISSIONS" Tab

2. Klicke auf "GRANT ACCESS"

3. Füge die Rollen hinzu (wiederhole für jede):
   - Principal: Das Service Account (sollte bereits ausgewählt sein)
   - Role 1: `Firebase Extensions API Admin` (`roles/firebaseextensions.admin`)
   - Role 2: `Service Usage Consumer` (`roles/serviceusage.serviceUsageConsumer`)
   - Role 3: `Artifact Registry Administrator` (`roles/artifactregistry.admin`)
   - Role 4: `Compute Viewer` (`roles/compute.viewer`)
   - Role 5: `Service Usage Admin` (`roles/serviceusage.serviceUsageAdmin`)

4. Klicke auf "SAVE"

### Schritt 4: Deployment erneut auslösen

Nachdem die Berechtigung hinzugefügt wurde:

- Warte 1-2 Minuten, damit die Änderungen wirksam werden
- Push einen neuen Commit oder triggere das Deployment manuell

## Verifizierung

Um zu prüfen, ob die Berechtigung funktioniert:

1. Gehe zu [APIs & Services → Enabled APIs](https://console.cloud.google.com/apis/library?project=jobflow25)

2. Suche nach "Firebase Extensions API"

3. Stelle sicher, dass sie aktiviert ist (Status sollte "Enabled" sein)

## Alternative: Service Account Email finden

Falls du nicht sicher bist, welches Service Account verwendet wird:

1. Öffne das JSON des Service Accounts (aus GitHub Secrets)
2. Suche nach `"client_email"` - das ist die Email-Adresse
3. Verwende diese Email in den obigen Schritten

## Automatisches Setup (Empfohlen)

Du kannst die fehlenden Berechtigungen automatisch mit einem Script hinzufügen:

### Voraussetzungen

1. Installiere die [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. Logge dich ein: `gcloud auth login`
3. Setze das Projekt: `gcloud config set project jobflow25`

### Script ausführen

**Option 1: Mit npm (einfachste Methode)**

```bash
npm run firebase:fix-permissions
```

**Option 2: Direkt ausführen**

```bash
./scripts/fix-service-account-permissions.sh [SERVICE_ACCOUNT_EMAIL]
```

**Option 3: Service Account automatisch ermitteln lassen**
Das Script fragt interaktiv nach, falls keine Email angegeben wird.

### Was das Script macht

- Prüft aktuelle Berechtigungen
- Fügt fehlende Rollen automatisch hinzu:
  - `roles/firebaseextensions.admin`
  - `roles/serviceusage.serviceUsageConsumer`
  - `roles/artifactregistry.admin`
  - `roles/compute.viewer`
  - `roles/serviceusage.serviceUsageAdmin`
- Versucht die Cleanup Policy automatisch einzurichten
- Gibt eine Zusammenfassung aus

## Bekannte Probleme

### Cleanup Policy Fehler

Falls der Deployment-Fehler "could not set up cleanup policy" anzeigt:

- Die benötigte Rolle ist: **Artifact Registry Administrator** (`roles/artifactregistry.admin`)
- Alternativ: Verwende `--force` Flag beim Deployment (siehe Workflow-Anpassung)

### Runtime Config API Permission

Falls `runtimeconfig.googleapis.com` Permission Denied zeigt:

- Die benötigte Rolle ist: **Service Usage Admin** (`roles/serviceusage.serviceUsageAdmin`)

### Compute API Permission

Falls `compute.projects.get` Permission Denied zeigt:

- Die benötigte Rolle ist: **Compute Viewer** (`roles/compute.viewer`)
