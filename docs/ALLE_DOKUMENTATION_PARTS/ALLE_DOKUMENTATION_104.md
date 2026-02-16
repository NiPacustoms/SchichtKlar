# JobFlow – Dokumentation Teil 104

*Zeichen 2046489–2066329 von 2862906*

---

   - ODER öffne das Service Account JSON aus GitHub Secrets und suche nach `"client_email"`

2. **Rolle hinzufügen:**
   - Gehe zu: https://console.cloud.google.com/iam-admin/iam?project=jobflow25
   - Finde das Service Account in der Liste (suche nach der Email-Adresse)
   - Klicke auf das **Bearbeiten-Symbol** (Stift) bei dem Service Account

3. **Diese Rolle hinzufügen:**
   - Klicke auf **"ADD ANOTHER ROLE"**
   - Suche nach: **"Firebase Extensions API Agent"**
   - Wähle: `roles/firebaseextensions.agent`
   - **ODER** für alle Firebase-Berechtigungen: **"Firebase Admin"** (`roles/firebase.admin`)

4. **Speichern:**
   - Klicke auf **"SAVE"**

5. **Warten:**
   - Warte **2-5 Minuten**, damit die Berechtigungen wirksam werden

6. **Deployment erneut triggern:**
   - Push einen neuen Commit oder re-run den GitHub Actions Job

## Alternative: Direkte Berechtigung (falls Rollen nicht verfügbar)

Falls die Rolle nicht verfügbar ist, kannst du auch eine **Custom Role** erstellen mit nur dieser Berechtigung:

1. Gehe zu: https://console.cloud.google.com/iam-admin/roles?project=jobflow25
2. Klicke auf **"CREATE ROLE"**
3. Titel: `Firebase Extensions Viewer`
4. ID: `firebase.extensions.viewer`
5. Füge diese Berechtigung hinzu:
   - `firebaseextensions.instances.list`
6. Speichere die Rolle
7. Weise diese Rolle dem Service Account zu

## Verifizierung

Nach dem Hinzufügen der Rolle, warte 2-5 Minuten und trigger dann erneut den Deployment.

## Warum wird das benötigt?

Firebase CLI prüft automatisch, ob Firebase Extensions im Projekt verwendet werden, auch wenn keine aktiv sind. Dies erfordert die Berechtigung `firebaseextensions.instances.list`.


```

---

### 📄 FIREBASE_SERVICE_ACCOUNT_PERMISSIONS.md

```markdown
# Firebase Service Account - Berechtigungen erweitern

## Problem
Auch wenn die Firebase Extensions API aktiviert ist, schlägt das Deployment fehl, weil das Service Account keine Berechtigung hat, den API-Status zu prüfen.

## Lösung: Service Account Berechtigung hinzufügen

### Schritt 1: Service Account identifizieren

1. Gehe zu [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=jobflow25)

2. Finde das Service Account, das für das Deployment verwendet wird:
   - Normalerweise: `firebase-adminsdk-xxxxx@jobflow25.iam.gserviceaccount.com`
   - ODER: Das Service Account aus GitHub Secrets (`FIREBASE_SERVICE_ACCOUNT_JobFlow`)

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


```

---

### 📄 FIREBASE_SERVICE_ACCOUNT_ROLES.md

```markdown
# Firebase Service Account - Vollständige Rollenliste

## Service Account
**Email:** `jobflow25@jobflow25.iam.gserviceaccount.com`

## Benötigte Rollen für Firebase Deployment

### ✅ Pflicht-Rollen (Muss vorhanden sein)

1. **Firebase Extensions Admin**
   - **Rolle-ID:** `roles/firebaseextensions.admin`
   - **Berechtigung:** `firebaseextensions.instances.list`, `firebaseextensions.instances.get`
   - **Status:** ⚠️ FEHLT - Aktueller Fehler!
   - **Begründung:** Firebase CLI prüft Extensions während Deployment

2. **Firebase Admin SDK Administrator Service Agent**
   - **Rolle-ID:** `roles/firebase.adminsdk.adminServiceAgent`
   - **Berechtigung:** `firebase.projects.get`, Firebase Admin SDK Zugriff
   - **Status:** ✅ Vorhanden
   - **Begründung:** Grundlegende Firebase-Projektverwaltung

3. **Firebase Hosting Administrator**
   - **Rolle-ID:** `roles/firebasehosting.admin`
   - **Berechtigung:** `firebasehosting.sites.update`, `firebasehosting.sites.get`
   - **Status:** ✅ Vorhanden
   - **Begründung:** Deployment zu Firebase Hosting

4. **Cloud Functions Admin**
   - **Rolle-ID:** `roles/cloudfunctions.admin`
   - **Berechtigung:** `cloudfunctions.functions.create`, `cloudfunctions.functions.delete`, `cloudfunctions.functions.get`, `cloudfunctions.functions.list`, `cloudfunctions.functions.update`, `cloudfunctions.operations.get`
   - **Status:** ✅ Vorhanden
   - **Begründung:** Deployment von Cloud Functions (Next.js SSR)

5. **Service Usage Administrator**
   - **Rolle-ID:** `roles/serviceusage.serviceUsageAdmin`
   - **Berechtigung:** API-Status prüfen und aktivieren
   - **Status:** ✅ Vorhanden
   - **Begründung:** Firebase CLI aktiviert APIs automatisch

### ✅ Empfohlene Rollen (Sollten vorhanden sein)

6. **Cloud Run Administrator**
   - **Rolle-ID:** `roles/run.admin`
   - **Berechtigung:** Cloud Run Ressourcen verwalten
   - **Status:** ✅ Vorhanden
   - **Begründung:** Cloud Functions v2 nutzen Cloud Run

7. **Service Usage Consumer** (Optional, falls Service Usage Admin fehlt)
   - **Rolle-ID:** `roles/serviceusage.serviceUsageConsumer`
   - **Berechtigung:** APIs verwenden
   - **Status:** ✅ Vorhanden (als Alternative zu Admin)
   - **Begründung:** Alternative zu Service Usage Admin

8. **Storage Administrator**
   - **Rolle-ID:** `roles/storage.admin`
   - **Berechtigung:** Firebase Storage verwalten
   - **Status:** ✅ Vorhanden
   - **Begründung:** Storage-Zugriff für Uploads

### ⚠️ Fehlende Rollen (Sollten hinzugefügt werden)

9. **Runtime Config Admin** (Optional, für Runtime Config API)
   - **Rolle-ID:** `roles/runtimeconfig.admin`
   - **Berechtigung:** `runtimeconfig.configs.get`, `runtimeconfig.configs.list`
   - **Status:** ⚠️ FEHLT (siehe 403-Fehler in Logs)
   - **Begründung:** Firebase CLI prüft Runtime Config (wird ignoriert, aber könnte später benötigt werden)

10. **Edge Container Service Account Admin**
    - **Rolle-ID:** `roles/edgecontainer.serviceAccountAdmin`
    - **Berechtigung:** Edge Container Service Accounts verwalten
    - **Status:** ✅ Vorhanden
    - **Begründung:** Firebase Hosting Edge Functions

### 📋 Zusammenfassung

**Aktuell vorhanden:**
- ✅ Firebase Admin SDK Administrator Service Agent
- ✅ Firebase Hosting Administrator
- ✅ Cloud Functions Admin
- ✅ Service Usage Administrator
- ✅ Cloud Run Administrator
- ✅ Storage Administrator
- ✅ Edge Container Service Account Admin
- ✅ Service Usage Consumer (Betrachter)
- ⚠️ Firebase Extensions API-Dienst-Agent (hat NICHT die richtige Berechtigung!)

**Fehlt:**
- ❌ **Firebase Extensions Admin** (`roles/firebaseextensions.admin`) - **KRITISCH!**
- ⚠️ Runtime Config Admin (optional, wird ignoriert)

## Lösung: Hinzufügen der fehlenden Rolle

### Schritt 1: Zur IAM-Seite
Gehe zu: https://console.cloud.google.com/iam-admin/iam?project=jobflow25

### Schritt 2: Service Account finden
Finde: `jobflow25@jobflow25.iam.gserviceaccount.com`

### Schritt 3: Rolle hinzufügen
1. Klicke auf **Bearbeiten** (Stift-Symbol)
2. Klicke auf **"ADD ANOTHER ROLE"**
3. Suche nach: **"Firebase Extensions Admin"**
4. Wähle: `roles/firebaseextensions.admin`
5. Klicke auf **"SAVE"**

### Schritt 4: Warten
Warte **2-5 Minuten**, bis die Berechtigungen propagiert sind.

### Schritt 5: Deployment erneut triggern
```bash
git commit --allow-empty -m "Test deployment after adding Extensions Admin role"
git push origin main
```

## Alternative: Alle Rollen auf einmal

Falls du alle Rollen sicherstellen möchtest, füge diese hinzu:

1. **Firebase Extensions Admin** (`roles/firebaseextensions.admin`) - **KRITISCH**
2. **Runtime Config Admin** (`roles/runtimeconfig.admin`) - Optional

## Warum diese Rollen?

- **Firebase Extensions Admin:** Firebase CLI prüft während des Deployments, welche Extensions installiert sind (auch wenn keine vorhanden sind). Dies erfordert `firebaseextensions.instances.list`.

- **Runtime Config Admin:** Firebase CLI prüft Runtime Config, aber dieser Fehler wird ignoriert. Kann später benötigt werden.

## Verifikation

Nach dem Hinzufügen der Rollen, überprüfe in den Deployment-Logs:
- ✅ Kein `firebaseextensions.instances.list` Fehler mehr
- ✅ Deployment läuft erfolgreich durch


```

---

### 📄 FIREBASE_SERVICE_ACCOUNT_USER_FIX.md

```markdown
# Firebase Deployment - Service Account User Berechtigung

## Problem

Beim Deployment von Cloud Functions (Next.js SSR) trat folgender Fehler auf:

```
Caller is missing permission 'iam.serviceaccounts.actAs' on service account 
projects/-/serviceAccounts/350790971531-compute@developer.gserviceaccount.com. 
Grant the role 'roles/iam.serviceAccountUser' to the caller on the service account.
```

## Ursache

Firebase CLI benötigt die Berechtigung, den Compute Engine Default Service Account zu "impersonieren" (als diesen Service Account aufzutreten), um Cloud Functions zu deployen. Dies ist erforderlich, da Cloud Functions v2 (die Next.js SSR verwendet) auf Cloud Run basieren und den Compute Engine Service Account verwenden.

## Lösung

### Service Account User Rolle hinzufügen

Der Deployment Service Account (`jobflow25@jobflow25.iam.gserviceaccount.com`) benötigt die Rolle `roles/iam.serviceAccountUser` auf dem Compute Engine Service Account (`350790971531-compute@developer.gserviceaccount.com`).

### Automatisch (empfohlen)

```bash
npm run firebase:setup
```

Das Script setzt automatisch alle benötigten Berechtigungen, inklusive der Service Account User Rolle.

### Manuell

```bash
gcloud iam service-accounts add-iam-policy-binding \
  350790971531-compute@developer.gserviceaccount.com \
  --member="serviceAccount:jobflow25@jobflow25.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" \
  --project=jobflow25
```

**Hinweis:** Ersetze `350790971531` mit deiner Projektnummer. Du findest sie mit:
```bash
gcloud projects describe jobflow25 --format="value(projectNumber)"
```

## Warum ist das nötig?

Cloud Functions v2 (die für Next.js SSR verwendet wird) laufen auf Cloud Run. Cloud Run verwendet standardmäßig den Compute Engine Default Service Account. Wenn Firebase CLI eine neue Function erstellt, muss es die Berechtigung haben, diesen Service Account zu "verwenden" (impersonieren), um die Function unter diesem Service Account zu erstellen.

## Status

✅ **Berechtigung gesetzt**
✅ **Setup-Script aktualisiert**
✅ **Automatisiert für zukünftige Setups**

## Verifikation

Das Deployment sollte jetzt erfolgreich durchlaufen. Die Berechtigung wurde bereits gesetzt und ist im Setup-Script automatisiert.

## Weitere Informationen

- [Google Cloud IAM - Service Account User Role](https://cloud.google.com/iam/docs/service-accounts#user-role)
- [Cloud Functions Service Account](https://cloud.google.com/functions/docs/reference/iam/roles#additional-configuration)


```

---

### 📄 FIREBASE_SETUP.md

```markdown
# Firebase Setup für JobFlow

## Problem

Die Anwendung zeigt Firebase-Fehler wegen fehlender Firestore-Indizes. Diese müssen erstellt werden, damit die komplexen Queries funktionieren.

## Schnelle Lösung

### Option 1: Automatische Index-Erstellung (Empfohlen)

```bash
# Stelle sicher, dass du in der Projekt-Root bist
node scripts/create-firestore-indexes.js
```

### Option 2: Firebase CLI

```bash
# Firebase CLI installieren (falls nicht vorhanden)
npm install -g firebase-tools

# Bei Firebase anmelden
firebase login

# Indizes deployen
firebase deploy --only firestore:indexes
```

### Option 3: Manuelle Erstellung über Firebase Console

#### Direkte Links (aus den Fehlermeldungen):

1. **Assignments Index:**

   ```
   https://console.firebase.google.com/v1/r/project/jobflow25/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9qb2JmbG93MjUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2Fzc2lnbm1lbnRzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg4KCmFzc2lnbmVkQXQQAhoMCghfX25hbWVfXxAC
   ```

2. **Timesheets Index (by date):**

   ```
   https://console.firebase.google.com/v1/r/project/jobflow25/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9qb2JmbG93MjUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3RpbWVzaGVldHMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEZGF0ZRABGgwKCF9fbmFtZV9fEAE
   ```

3. **Timesheets Index (by date range):**
   ```
   https://console.firebase.google.com/v1/r/project/jobflow25/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9qb2JmbG93MjUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3RpbWVzaGVldHMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEZGF0ZRACGgwKCF9fbmFtZV9fEAI
   ```

## Benötigte Indizes

### Assignments Collection

- `userId` (ASC) + `assignedAt` (ASC)
- `userId` (ASC) + `assignedAt` (DESC)
- `shiftId` (ASC) + `assignedAt` (ASC)
- `status` (ASC) + `assignedAt` (DESC)
- `shiftId` (ASC) + `status` (ASC)

### Timesheets Collection

- `userId` (ASC) + `date` (ASC)
- `userId` (ASC) + `date` (DESC)
- `userId` (ASC) + `date` (Range Query)

## Temporäre Lösung

Falls die Indizes noch nicht erstellt sind, wurden die Services bereits vereinfacht, um die Fehler zu vermeiden. Die Queries funktionieren jetzt ohne `orderBy` und `range` Queries.

## Überprüfung

Nach der Index-Erstellung:

1. Die Fehler in der Browser-Konsole sollten verschwinden
2. Die Anwendung sollte normal funktionieren
3. Die Daten werden korrekt sortiert angezeigt

## Monitoring

Überwache die Firebase Console auf:

- **Index-Status:** https://console.firebase.google.com/project/jobflow25/firestore/indexes
- **Query-Performance:** Firestore > Usage
- **Fehler-Logs:** Firebase > Functions > Logs

## Troubleshooting

### Index wird nicht erstellt

- Überprüfe, ob du die richtigen Berechtigungen hast
- Stelle sicher, dass das Projekt korrekt konfiguriert ist
- Warte 5-10 Minuten, da Index-Erstellung Zeit braucht

### Queries funktionieren immer noch nicht

- Überprüfe die Index-Konfiguration
- Stelle sicher, dass alle benötigten Felder im Index enthalten sind
- Teste die Queries in der Firebase Console

### Performance-Probleme

- Überwache die Query-Performance in der Firebase Console
- Erwäge zusätzliche Indizes für häufig verwendete Queries
- Optimiere die Query-Struktur falls nötig

```

---

### 📄 FIREBASE_SETUP_GUIDE.md

```markdown
# Firebase Setup für JobFlow

## Problem: "Expected first argument to collection() to be a CollectionReference"

Dieser Fehler tritt auf, wenn die Firebase-Konfiguration nicht korrekt eingerichtet ist.

## Lösung

### 1. Firebase-Projekt erstellen
1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes aus
3. Aktivieren Sie Firestore Database
4. Aktivieren Sie Authentication

### 2. Umgebungsvariablen einrichten
Erstellen Sie eine `.env.local` Datei im Projektverzeichnis mit folgenden Inhalten:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Emulator Settings (optional für Entwicklung)
NEXT_PUBLIC_USE_EMULATOR=false
```

### 3. Firebase-Konfiguration abrufen
1. Gehen Sie zu Firebase Console → Project Settings → General
2. Scrollen Sie nach unten zu "Your apps"
3. Klicken Sie auf das Web-Symbol (</>) um eine Web-App hinzuzufügen
4. Kopieren Sie die Konfigurationswerte in Ihre `.env.local` Datei

### 4. Firestore-Regeln einrichten
Stellen Sie sicher, dass Ihre `firestore.rules` Datei korrekt konfiguriert ist.

### 5. Entwicklungsserver neu starten
```bash
npm run dev
```

## Häufige Probleme

### Problem: "Missing Firebase environment variables"
**Lösung:** Stellen Sie sicher, dass alle erforderlichen Umgebungsvariablen in `.env.local` gesetzt sind.

### Problem: "Firestore instance could not be initialized"
**Lösung:** Überprüfen Sie Ihre Firebase-Konfiguration und stellen Sie sicher, dass Firestore in der Firebase Console aktiviert ist.

### Problem: Emulator-Verbindung schlägt fehl
**Lösung:** Stellen Sie sicher, dass die Firebase-Emulatoren laufen:
```bash
firebase emulators:start
```

## Debugging

Falls das Problem weiterhin besteht, überprüfen Sie:

1. **Browser-Konsole:** Schauen Sie nach Fehlermeldungen
