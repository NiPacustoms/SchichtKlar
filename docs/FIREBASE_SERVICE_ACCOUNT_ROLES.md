# Firebase Service Account - Vollständige Rollenliste

## Service Account

**Email:** `schichtklar@schichtklar.iam.gserviceaccount.com`

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

Gehe zu: https://console.cloud.google.com/iam-admin/iam?project=schichtklar

### Schritt 2: Service Account finden

Finde: `schichtklar@schichtklar.iam.gserviceaccount.com`

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
