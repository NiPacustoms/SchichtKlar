# JobFlow – Dokumentation Teil 103

*Zeichen 2026674–2046488 von 2862906*

---

   - Firebase CLI fällt auf Default Service Account zurück (funktioniert trotzdem)

## Lösung

### 1. APIs aktivieren

Alle benötigten Google Cloud APIs wurden aktiviert:

```bash
npm run firebase:enable-apis
```

Oder manuell:

```bash
./scripts/enable-required-apis.sh
```

**Aktivierte APIs:**
- ✅ `cloudfunctions.googleapis.com`
- ✅ `cloudbuild.googleapis.com`
- ✅ `artifactregistry.googleapis.com`
- ✅ `run.googleapis.com`
- ✅ `eventarc.googleapis.com`
- ✅ `pubsub.googleapis.com`
- ✅ `storage.googleapis.com`
- ✅ `firebaseextensions.googleapis.com`
- ✅ `cloudbilling.googleapis.com`
- ✅ `runtimeconfig.googleapis.com`
- ✅ `compute.googleapis.com`
- ✅ `firebase.googleapis.com`
- ✅ `firebasehosting.googleapis.com`
- ✅ `serviceusage.googleapis.com`

### 2. Service Account Rollen

Der Service Account `jobflow25@jobflow25.iam.gserviceaccount.com` hat bereits alle benötigten Rollen:
- ✅ `roles/cloudfunctions.admin`
- ✅ `roles/firebase.sdkAdminServiceAgent`
- ✅ `roles/firebaseextensions.admin`
- ✅ `roles/firebasehosting.admin`
- ✅ `roles/run.admin`
- ✅ `roles/serviceusage.serviceUsageAdmin`

### 3. Verifikation

Nach der API-Aktivierung:
1. Warte 2-5 Minuten für API-Propagierung
2. Teste das Deployment: `git push`

## Scripts

### Vollständiges Setup

```bash
npm run firebase:setup:full
```

Führt automatisch aus:
1. Service Account Rollen setzen
2. APIs aktivieren
3. Verifikation

### Einzeln

```bash
# Service Account Rollen
npm run firebase:setup

# APIs aktivieren
npm run firebase:enable-apis

# Verifikation
npm run firebase:verify
```

## Hinweise

### Cloud Billing API

- Die Cloud Billing API wird vom Firebase CLI verwendet, um Billing-Informationen zu prüfen
- Bei Spark Plan (Free Tier) Projekten kann die API manchmal nicht aktiviert werden
- Dies verhindert das Deployment normalerweise nicht, da Firebase CLI mit einem Fallback arbeitet

### Runtime Config API

- Runtime Config API ist optional für Firebase Functions
- Wird nur für spezielle Anwendungsfälle benötigt
- Der 403-Fehler ist nicht kritisch, wenn keine Runtime Config verwendet wird

### Compute Engine API

- Compute Engine API ist nicht zwingend erforderlich
- Firebase CLI fällt automatisch auf den Default Compute Service Account zurück
- Deployment funktioniert auch ohne aktivierte API

## Status

✅ **Alle APIs aktiviert**
✅ **Service Account Rollen korrekt**
✅ **Bereit für Deployment**

Das Deployment sollte jetzt erfolgreich durchlaufen.


```

---

### 📄 FIREBASE_CLEANUP_POLICY.md

```markdown
# Firebase Cleanup Policy - Artifact Registry

## Problem

Beim Deployment von Cloud Functions tritt folgende Warnung auf:

```
Functions successfully deployed but could not set up cleanup policy in location europe-west1.
Pass the --force option to automatically set up a cleanup policy or run 'firebase functions:artifacts:setpolicy' to manually set up a cleanup policy.
```

## Bedeutung

Die Cleanup Policy ist **optional** und dient zur automatischen Bereinigung alter Build-Artefakte in Artifact Registry. Sie verhindert, dass sich alte Docker-Images und Build-Artefakte ansammeln und Speicherkosten verursachen.

**Wichtig:** Diese Warnung beeinträchtigt das Deployment **nicht**. Die Function wurde erfolgreich deployed.

## Lösung

### Option 1: Manuell einrichten (empfohlen)

Nach dem ersten erfolgreichen Deployment:

```bash
firebase functions:artifacts:setpolicy --project=jobflow25 --location=europe-west1
```

### Option 2: Automatisch im Workflow

Ein GitHub Actions Step wurde bereits hinzugefügt, der die Cleanup Policy automatisch einrichtet (mit `continue-on-error: true`, da es optional ist).

### Option 3: Mit --force Flag

Beim nächsten Deployment wird das `--force` Flag automatisch verwendet, wenn die Cleanup Policy noch nicht eingerichtet ist.

## Was macht die Cleanup Policy?

Die Cleanup Policy löscht automatisch:
- Alte Docker-Images von Cloud Functions
- Alte Build-Artefakte in Artifact Registry
- Standard: Behält die letzten 10 Versionen

## Kosten

Ohne Cleanup Policy können sich über die Zeit alte Artefakte ansammeln, was geringe Storage-Kosten verursachen kann. Die Cleanup Policy verhindert dies.

## Status

✅ **Deployment funktioniert** - Die Warnung ist nicht kritisch
⚠️ **Cleanup Policy optional** - Kann manuell eingerichtet werden für automatische Bereinigung


```

---

### 📄 FIREBASE_COSTS.md

```markdown
# Firebase Hosting Kostenübersicht - JobFlow

## Konfiguration

- **Projekt:** jobflow25
- **Region:** europe-west1 (Belgien)
- **Tarif:** Blaze Plan (Pay-as-you-go)
- **Hosting:** Firebase Hosting mit Next.js SSR
- **Backend:** Cloud Functions (Generation 2, läuft auf Cloud Run)

## Kostenaufteilung

### ✅ Kostenlos (bis zu bestimmten Limits)

1. **Firebase Hosting**
   - ✅ Hosting kostenlos
   - ✅ SSL-Zertifikate kostenlos
   - ✅ CDN inklusive
   - ✅ 10 GB Storage kostenlos pro Monat
   - ✅ 360 MB/Day Transfer kostenlos

2. **Firestore Database**
   - ✅ 50.000 Reads/Day kostenlos
   - ✅ 20.000 Writes/Day kostenlos
   - ✅ 20.000 Deletes/Day kostenlos

3. **Firebase Authentication**
   - ✅ Unbegrenzt kostenlos

4. **Cloud Storage**
   - ✅ 5 GB Storage kostenlos
   - ✅ 1 GB Transfer/Day kostenlos

### 💰 Kostenpflichtig (Pay-as-you-go)

#### 1. Cloud Functions (Next.js SSR)

**Kostenkomponenten:**

**a) Invocations (Funktionsaufrufe)**
- Erste 2 Millionen Invocations/Monat: **Kostenlos**
- Danach: **$0,40 pro 1 Million Invocations**
- Deine SSR-Function wird bei jedem Page Request aufgerufen

**b) Compute Time (Ausführungszeit)**
- Gemessen in: **GB-Sekunden**
- Berechnung: `Memory (GB) × Execution Time (Sekunden) × Anzahl Invocations`
- Standard Memory: **512 MB** (0,5 GB)
- Standard Timeout: **60 Sekunden**

**Preise in europe-west1:**
- Erste 400.000 GB-Sekunden/Monat: **Kostenlos**
- 400.001 - 800.000 GB-Sekunden: **$0,0000025 pro GB-Sekunde**
- Über 800.000 GB-Sekunden: **$0,00000125 pro GB-Sekunde**

**c) Netzwerk (Egress)**
- Erste 5 GB/Monat: **Kostenlos** (nur egress aus Google)
- Danach: **$0,12 pro GB** (intern EU-EU)
- $0,12 pro GB (extern, erste 10 TB)

**Beispielrechnung für typische Nutzung:**

**Szenario 1: Klein (1000 Page Views/Tag = ~30.000/Monat)**
```
Invocations: 30.000 (kostenlos, unter 2M Limit)
Compute Time: 30.000 × 0,5 GB × 2 Sekunden = 30.000 GB-Sekunden (kostenlos, unter 400k)
Netzwerk: ~5 GB (kostenlos)

Kosten: $0/Monat
```

**Szenario 2: Mittel (10.000 Page Views/Tag = ~300.000/Monat)**
```
Invocations: 300.000 (kostenlos, unter 2M Limit)
Compute Time: 300.000 × 0,5 GB × 2 Sekunden = 300.000 GB-Sekunden (kostenlos, unter 400k)
Netzwerk: ~50 GB = 45 GB kostenpflichtig → $0,12 × 45 = $5,40

Kosten: ~$5-6/Monat
```

**Szenario 3: Groß (100.000 Page Views/Tag = ~3M/Monat)**
```
Invocations: 3.000.000 = 1M kostenpflichtig → $0,40
Compute Time: 3M × 0,5 GB × 2 Sekunden = 3M GB-Sekunden
  - Erste 400k: kostenlos
  - 400k-800k: 400k × $0,0000025 = $1,00
  - Über 800k: 2,2M × $0,00000125 = $2,75
  - Total Compute: $3,75
Netzwerk: ~500 GB = 495 GB kostenpflichtig → $0,12 × 495 = $59,40

Kosten: ~$63-65/Monat
```

#### 2. Firestore (falls Limits überschritten)

**Preise in europe-west1:**
- Reads: **$0,06 pro 100.000** (nach Free Tier)
- Writes: **$0,18 pro 100.000** (nach Free Tier)
- Deletes: **$0,02 pro 100.000** (nach Free Tier)
- Storage: **$0,18 pro GB/Monat** (nach 1 GB Free Tier)

#### 3. Cloud Storage (falls Limits überschritten)

**Preise:**
- Storage: **$0,020 pro GB/Monat** (nach 5 GB Free)
- Netzwerk Egress: **$0,12 pro GB** (nach 1 GB/Day Free)

## Kostenoptimierung

### 1. Statische Seiten (ISR/SSG)
- Nutze statische Generierung wo möglich
- Reduziert Cloud Function Invocations
- **Kostenersparnis:** Bis zu 80% bei statischen Seiten

### 2. Caching
- Nutze Firebase Hosting CDN
- Statische Assets werden automatisch gecacht
- **Kostenersparnis:** Reduziert Netzwerk-Egress

### 3. Memory & Timeout optimieren
- Aktuell: 512 MB Memory, 60s Timeout (Default)
- Für schnelle SSR-Responses: 256 MB reicht oft
- **Kostenersparnis:** 50% weniger Compute-Kosten

### 4. Min Instances
- Standard: 0 (Cold Start)
- Bei konstantem Traffic: 1 Min Instance
- **Kosten:** ~$10-15/Monat für 1 Instance, aber kein Cold Start

### 5. Max Instances limitieren
- Standard: Unbegrenzt
- Setze Max Instances basierend auf erwartetem Traffic
- **Kostenersparnis:** Verhindert unerwartete Kosten bei Traffic-Spikes

## Monitoring & Budgets

### Kostenüberwachung einrichten:

```bash
# Budget-Alarm erstellen
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="JobFlow Monthly Budget" \
  --budget-amount=50USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Kosten-Dashboard:
- Google Cloud Console → Billing → Reports
- Firebase Console → Usage and billing

## Geschätzte Kosten (realistisch)

**Startup/Entwicklung:**
- ~1.000-5.000 Page Views/Monat
- **Kosten: $0-5/Monat**

**Kleines Team (10-50 Nutzer):**
- ~50.000-100.000 Page Views/Monat
- **Kosten: $10-25/Monat**

**Wachsendes Business (100-500 Nutzer):**
- ~500.000-1M Page Views/Monat
- **Kosten: $30-60/Monat**

**Enterprise (1000+ Nutzer):**
- ~5M+ Page Views/Monat
- **Kosten: $100-300/Monat** (je nach Optimierung)

## Wichtige Hinweise

1. **Free Tier Credits:**
   - Google gibt neue Kunden oft $300 Free Credits für 90 Tage
   - Prüfe dein Billing-Konto

2. **Kostenexplosion vermeiden:**
   - Setze Budget-Alerts
   - Monitor täglich in den ersten Wochen
   - Nutze `minInstances: 0` wenn möglich

3. **Region Preise:**
   - europe-west1 (Belgien) ist eine günstige Region
   - US-Regionen sind oft teurer

4. **Billing-Transparenz:**
   - Alle Kosten sind in der Google Cloud Console einsehbar
   - Firebase Console zeigt auch Nutzung und geschätzte Kosten

## Nächste Schritte

1. **Kosten überwachen:**
   ```bash
   # Tägliche Kosten-Checks
   gcloud billing accounts list
   ```

2. **Optimierungen implementieren:**
   - Statische Seiten wo möglich
   - Caching nutzen
   - Memory/Timeout optimieren

3. **Budget-Alarm einrichten:**
   - In Google Cloud Console → Billing → Budgets & alerts

## Weitere Informationen

- [Firebase Pricing](https://firebase.google.com/pricing)
- [Cloud Functions Pricing](https://cloud.google.com/functions/pricing)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Firestore Pricing](https://cloud.google.com/firestore/pricing)

---

**Stand:** November 2024
**Region:** europe-west1 (Belgien)
**Tarif:** Blaze Plan (Pay-as-you-go)


```

---

### 📄 FIREBASE_DEPLOYMENT_FIX.md

```markdown
# Firebase Deployment - Extensions API Fix

## Problem
Beim Deployment schlägt es fehl mit:
```
Error: Permissions denied enabling firebaseextensions.googleapis.com.
```

## Ursache
Das Service Account hat keine Berechtigung, die Firebase Extensions API zu aktivieren. Firebase CLI versucht automatisch, diese API zu aktivieren, wenn Functions deployed werden.

## Lösung (2 Optionen)

### Option 1: API manuell aktivieren (Empfohlen)

1. Öffne die Google Cloud Console:
   https://console.cloud.google.com/apis/library/firebaseextensions.googleapis.com?project=jobflow25

2. Klicke auf "Enable" (Aktivieren)

3. Warte ca. 1-2 Minuten, bis die API aktiviert ist

4. Deployment erneut auslösen (automatisch durch GitHub Actions oder manuell)

### Option 2: Service Account Berechtigung erweitern

1. Gehe zu [IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=jobflow25)

2. Finde das Service Account (normalerweise `firebase-adminsdk-xxxxx@jobflow25.iam.gserviceaccount.com`)

3. Klicke auf das Bearbeiten-Symbol (Stift)

4. Füge die Rolle hinzu:
   - **Service Usage Admin** (`roles/serviceusage.serviceUsageAdmin`)

   ODER spezifischer:
   - **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`)

5. Speichere die Änderungen

6. Deployment erneut auslösen

## Hinweis

Die Firebase Extensions API wird automatisch benötigt, wenn:
- Firebase Functions verwendet werden
- Firebase Frameworks Backend (Next.js SSR) verwendet wird

Dies ist ein einmaliger Setup-Schritt pro Projekt.


```

---

### 📄 FIREBASE_INTEGRATION.md

```markdown
# Firebase Integration für JobFlow

## Übersicht

Diese Dokumentation beschreibt die Firebase-Integration in der JobFlow-Anwendung. Firebase wird für Authentifizierung, Datenbank (Firestore), Dateispeicherung und Cloud Functions verwendet.

## Installierte Pakete

- `firebase` - Firebase JavaScript SDK

## Konfiguration

### Firebase-Konfiguration

Die Firebase-Konfiguration befindet sich in `lib/firebase.ts` und verwendet Ihre bereitgestellten Credentials:

```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyC2vI9ALsfzIqZa17SVj1LgrMGoc8jN_1A',
  authDomain: 'jobflow25.firebaseapp.com',
  projectId: 'jobflow25',
  storageBucket: 'jobflow25.firebasestorage.app',
  messagingSenderId: '350790971531',
  appId: '1:350790971531:web:ac2a19940aa9317a54e48e',
  measurementId: 'G-VCN3XLGVGD',
};
```

### Umgebungsvariablen

Die Konfiguration unterstützt auch Umgebungsvariablen für bessere Sicherheit:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Services

### 1. AuthService (`lib/services/authService.ts`)

Verwaltet Benutzerauthentifizierung:

- `signIn(email, password)` - Benutzer anmelden
- `signUp(email, password, displayName, role)` - Benutzer registrieren
- `signOut()` - Benutzer abmelden
- `getUserProfile(uid)` - Benutzerprofil abrufen
- `onAuthStateChanged(callback)` - Auth-Status überwachen

### 2. FirestoreService (`lib/services/firestoreService.ts`)

Generische Firestore-Operationen:

- `getCollection(collectionName, constraints)` - Sammlung abrufen
- `getDocument(collectionName, docId)` - Einzelnes Dokument abrufen
- `createDocument(collectionName, data)` - Dokument erstellen
- `updateDocument(collectionName, docId, data)` - Dokument aktualisieren
- `deleteDocument(collectionName, docId)` - Dokument löschen
- `subscribeToCollection()` - Real-time Listener für Sammlungen
- `subscribeToDocument()` - Real-time Listener für einzelne Dokumente

### 3. ChatService (`lib/services/chatService.ts`)

Bereits vorhandener Service für Chat-Funktionalität mit Firebase-Integration.

## React Hooks

### useAuth Hook (`lib/hooks/useFirebase.ts`)

React Hook für Authentifizierung:

```typescript
const { user, userProfile, loading, signIn, signUp, signOut, isAdmin } = useAuth();
```

## Komponenten

### LoginForm (`components/auth/LoginForm.tsx`)

Anmelde- und Registrierungsformular mit Firebase-Authentifizierung.

### AuthGuard (`components/auth/AuthGuard.tsx`)

Schutz für Routen, die Authentifizierung oder Admin-Rechte erfordern:

```typescript
<AuthGuard requireAdmin={true}>
  <AdminComponent />
</AuthGuard>
```

## Verwendung

### 1. Authentifizierung in einer Komponente

```typescript
import { useAuth } from "../lib/hooks/useFirebase";

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Lädt...</div>;
  if (!user) return <div>Bitte anmelden</div>;

  return (
    <div>
      <p>Willkommen, {user.displayName}!</p>
      <button onClick={signOut}>Abmelden</button>
    </div>
  );
}
```

### 2. Firestore-Daten abrufen

```typescript
import { FirestoreService } from '../lib/services/firestoreService';

// Einrichtungen abrufen
const facilities = await FirestoreService.getFacilities();

// Real-time Listener
const unsubscribe = FirestoreService.subscribeToCollection('facilities', [], facilities => {
  console.log('Einrichtungen aktualisiert:', facilities);
});
```

### 3. Route-Schutz

```typescript
import AuthGuard from "../components/auth/AuthGuard";

function AdminPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <div>Admin-Bereich</div>
    </AuthGuard>
  );
}
```

## Firestore-Struktur

### Benutzer (`users`)

```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  facilityId?: string;
  createdAt: Date;
  lastLoginAt: Date;
}
```

### Einrichtungen (`facilities`)

```typescript
{
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Dokumente (`documents`)

```typescript
{
  title: string;
  facilityId: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Sicherheit

- Firestore Security Rules sind in `firestore.rules` definiert
- Authentifizierung ist für alle geschützten Routen erforderlich
- Admin-Funktionen sind durch Rollen-basierte Zugriffskontrolle geschützt

## Nächste Schritte

1. Firestore Security Rules konfigurieren
2. Cloud Functions für erweiterte Logik implementieren
3. Push-Benachrichtigungen einrichten
4. Datei-Upload für Dokumente implementieren
5. Audit-Logging erweitern

```

---

### 📄 FIREBASE_MANUAL_ROLE_ADD.md

```markdown
# Firebase Extensions Admin Rolle manuell hinzufügen

## Option 1: Über Google Cloud Console (Manuell)

### Schritt 1: IAM-Seite öffnen
Gehe zu: https://console.cloud.google.com/iam-admin/iam?project=jobflow25

### Schritt 2: Service Account finden
Finde: `jobflow25@jobflow25.iam.gserviceaccount.com`

### Schritt 3: Bearbeiten
1. Klicke auf das **Bearbeiten-Symbol** (Stift) bei dem Service Account
2. Klicke auf **"ADD ANOTHER ROLE"**

### Schritt 4: Rolle-ID direkt eingeben
1. Im Dropdown, tippe oder füge ein: `roles/firebaseextensions.admin`
2. Oder suche nach: `firebaseextensions.admin` (ohne `roles/`)

### Schritt 5: Speichern
Klicke auf **"SAVE"**

---

## Option 2: Über gcloud CLI (nach Installation)

### Schritt 1: gcloud installieren
```bash
# Installation abschließen (benötigt sudo-Passwort)
~/google-cloud-sdk/install.sh

# PATH aktualisieren
source ~/google-cloud-sdk/path.bash.inc
```

### Schritt 2: Anmelden
```bash
gcloud auth login
```

### Schritt 3: Projekt setzen
```bash
gcloud config set project jobflow25
```

### Schritt 4: Rolle hinzufügen
```bash
gcloud projects add-iam-policy-binding jobflow25 \
  --member="serviceAccount:jobflow25@jobflow25.iam.gserviceaccount.com" \
  --role="roles/firebaseextensions.admin"
```

### Schritt 5: Verifizieren
```bash
gcloud projects get-iam-policy jobflow25 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:jobflow25@jobflow25.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

---

## Option 3: Custom Role erstellen (Falls Standard-Rolle nicht verfügbar)

### Schritt 1: Custom Role erstellen
1. Gehe zu: https://console.cloud.google.com/iam-admin/roles?project=jobflow25
2. Klicke auf **"CREATE ROLE"**
3. **Titel:** `Firebase Extensions Viewer`
4. **ID:** `firebase.extensions.viewer`
5. **Beschreibung:** `Allows listing Firebase Extensions instances`
6. Füge diese Berechtigung hinzu:
   - `firebaseextensions.instances.list`
7. Klicke auf **"CREATE"**

### Schritt 2: Custom Role zuweisen
1. Gehe zu: https://console.cloud.google.com/iam-admin/iam?project=jobflow25
2. Finde: `jobflow25@jobflow25.iam.gserviceaccount.com`
3. Bearbeiten → "ADD ANOTHER ROLE"
4. Suche nach: `Firebase Extensions Viewer`
5. Wähle: `projects/jobflow25/roles/firebase.extensions.viewer`
6. Speichern


```

---

### 📄 FIREBASE_SERVICE_ACCOUNT_FIX.md

```markdown
# Firebase Service Account - Fehlende Berechtigung beheben

## Problem
```
Authorization failed. This account is missing the following required permissions on project jobflow25:
    firebaseextensions.instances.list
```

## Lösung: Rolle hinzufügen

### Schritt-für-Schritt Anleitung

1. **Service Account finden:**
   - Gehe zu: https://console.cloud.google.com/iam-admin/serviceaccounts?project=jobflow25
