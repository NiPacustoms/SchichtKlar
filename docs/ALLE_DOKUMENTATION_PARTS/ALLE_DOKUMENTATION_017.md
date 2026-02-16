# JobFlow – Dokumentation Teil 17

*Zeichen 317832–337709 von 2862906*

---

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



---

## Quelle: docs/FIREBASE_SETUP.md

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



---

## Quelle: docs/FIREBASE_SETUP_GUIDE.md

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
2. **Firebase Console:** Überprüfen Sie, ob Ihr Projekt korrekt konfiguriert ist
3. **Umgebungsvariablen:** Stellen Sie sicher, dass alle Variablen korrekt gesetzt sind
4. **Netzwerk:** Überprüfen Sie, ob keine Firewall die Verbindung blockiert

## Support

Bei weiteren Problemen überprüfen Sie die [Firebase-Dokumentation](https://firebase.google.com/docs) oder erstellen Sie ein Issue im Projekt-Repository.



---

## Quelle: docs/FIX_STATUS.md

# Fix Status Report - JobFlow

**Datum:** 26. Januar 2026  
**Zeit:** Nach automatisierten Fixes

---

## ✅ Erfolgreich abgeschlossen

### 1. Dependencies installiert ✅

- **Status:** ✅ **ERFOLGREICH**
- **Pakete:** 1.047 packages installed
- **Sicherheitslücken:** 6 gefunden (1 moderate, 2 high, 3 critical)
- **Empfehlung:** `npm audit fix` ausführen

### 2. TypeScript Error Fixes (teilweise) ✅

- **Status:** ⚠️ **TEILWEISE ERFOLGREICH**
- **Durchgeführt:**
  - Theme mode comparisons gefixt
  - Unused variables umbenannt
  - Einige Null-Checks hinzugefügt
  - tz Property in shifts.ts hinzugefügt

---

## ⚠️ Probleme nach Cleanup-Script

### 3. Code-Cleanup Script hat Syntax-Fehler verursacht ❌

**Problem:** Das `code-cleanup.sh` Script hat aggressive Änderungen vorgenommen, die zu Parsing-Fehlern geführt haben.

**Betroffene Dateien (Beispiele):**

- `app/(employee)/employee/dokumente/page.tsx` - Doppelte Destructuring
- `app/(admin)/admin/berichte/page.tsx` - Parsing error
- Viele weitere Dateien mit Parsing-Fehlern

**Ursache:**

- Script hat logger-Imports falsch eingefügt
- Destructuring-Patterns wurden beschädigt
- Import-Statements wurden korrupt

**Lösung erforderlich:**

1. Git-Status prüfen
2. Betroffene Dateien manuell korrigieren
3. Oder: Git reset für betroffene Dateien

---

## 📊 Aktueller Status

### TypeScript-Fehler

- **Vor Fix:** ~80 Fehler
- **Nach Fix:** ~75 Fehler (einige behoben, aber komplexere Probleme bleiben)
- **Hauptprobleme:**
  - Assignment-Typen fehlen Properties (`title`, `facility`, `priority`, etc.)
  - Berichte-Seite: Viele `possibly undefined` Fehler
  - Fehlende Module: `@/lib/validation/staffSchemas`, `@/lib/validation/authSchemas`
  - MUI Grid API-Änderungen (MUI v7)
  - Fehlende Properties in verschiedenen Typen

### ESLint-Warnungen

- **Vor Fix:** Viele unused variables
- **Nach Fix:** Parsing-Fehler durch Cleanup-Script
- **Status:** ❌ Build schlägt fehl wegen Syntax-Fehler

### Build-Status

- **Status:** ❌ **FEHLGESCHLAGEN**
- **Grund:** Syntax-Fehler durch Cleanup-Script
- **Nächste Schritte:** Syntax-Fehler beheben

---

## 🎯 Empfohlene Nächste Schritte

### Sofort (Kritisch)

1. **Syntax-Fehler beheben**

   ```bash
   # Prüfe Git-Status
   git status

   # Option 1: Betroffene Dateien zurücksetzen
   git checkout -- app/(employee)/employee/dokumente/page.tsx
   # ... weitere betroffene Dateien

   # Option 2: Manuelle Korrektur der Syntax-Fehler
   ```

2. **Build testen**
   ```bash
   npm run build
   ```

### Kurzfristig

3. **TypeScript-Fehler systematisch beheben**
   - Assignment-Typen erweitern
   - Null-Checks in berichte/page.tsx hinzufügen
   - Fehlende Module erstellen oder Imports korrigieren

4. **ESLint-Warnungen reduzieren**
   - Unused variables entfernen oder mit `_` prefixen
   - Unused imports entfernen

### Mittelfristig

5. **Sicherheitsaudit**

   ```bash
   npm audit
   npm audit fix
   ```

6. **Code-Qualität verbessern**
   - Logger-Imports manuell hinzufügen (nicht per Script)
   - Console.logs schrittweise ersetzen

---

## 📝 Zusammenfassung

### ✅ Erfolgreich

- Dependencies installiert (1.047 packages)
- Einige TypeScript-Fehler behoben

### ⚠️ Probleme

- Cleanup-Script hat Syntax-Fehler verursacht
- Build schlägt fehl
- Viele TypeScript-Fehler bleiben bestehen

### 🔧 Nächste Aktionen

1. Syntax-Fehler beheben (höchste Priorität)
2. Build wieder zum Laufen bringen
3. TypeScript-Fehler systematisch angehen

---

**Status:** 🟡 **Teilweise erfolgreich - Manuelle Korrekturen erforderlich**

---

## 🔧 Manuell behobene Syntax-Fehler

### Behoben:

1. ✅ `app/(employee)/employee/dokumente/page.tsx` - Doppeltes Destructuring
2. ✅ `app/(admin)/admin/kommunikation/page.tsx` - Doppeltes Destructuring
3. ✅ `app/(admin)/admin/lohnabrechnung/page.tsx` - Doppeltes Destructuring
4. ✅ `app/(admin)/admin/schichten/page.tsx` - Doppeltes Destructuring
5. ✅ `app/(admin)/admin/uebersicht/page.tsx` - Doppeltes Destructuring
6. ✅ `app/(admin)/admin/mitarbeiter/page.tsx` - Doppeltes Destructuring
7. ✅ `app/(employee)/employee/einrichtungen/page.tsx` - Fehlender `import {`

### Noch zu beheben:

- Weitere Syntax-Fehler in anderen Dateien
- Build schlägt noch fehl

**Empfehlung:**

- Zuerst Syntax-Fehler beheben
- Dann Build testen
- Danach TypeScript-Fehler angehen



---

## Quelle: docs/GO_LIVE_CHECKLIST.md

# Go‑Live Checkliste

## Technik

- [ ] Health `/api/health` liefert 200, Status-Seite `/status` grün
- [ ] CSP/Security-Header aktiv, keine Mixed-Content-Warnungen
- [ ] Rate Limiting aktiv für `/api` & `/auth`
- [ ] Firestore-Rules mit `tenantId`-Isolation verifiziert (neg./pos. Tests)
- [ ] Backups funktionsfähig (Firestore/Storage), letzter Erfolg < 24h
- [ ] Restore-Drill dokumentiert (RTO ≤ 2h, RPO ≤ 24h)

## Sicherheit & Compliance

- [ ] DSGVO-Prozesse dokumentiert (`DSGVO_PROZESSE.md`)
- [ ] Datenexport (`exportUserData`) & Löschung (`deleteUserData`) getestet
- [ ] Audit-Logs aktiv, Viewer erreichbar (`/admin/audit-logs`)
- [ ] ASVS-Checkliste geprüft, keine offenen High Findings

## Observability

- [ ] Alerts für Health/Fehlerraten/Latenz gesetzt
- [ ] SLO/SLA kommuniziert (`SLO_SLA.md`)

## Accounts & Rollen

- [ ] Admin/Dispatcher/Nurse Test-Accounts vorhanden
- [ ] RBAC: `tenantId`/`facilityIds` im Client wirksam

## Dokumentation

- [ ] Admin Guide aktuell (`ADMIN_GUIDE.md`)
- [ ] Changelog gepflegt (`CHANGELOG.md`)
- [ ] Tests-Doku (`TESTS.md`) vorhanden

## Betrieb

- [ ] Env/Secrets validiert (`scripts/validate-env.js`)
- [ ] Rollout-Plan: Pilot → GA, Kommunikationsplan vorbereitet

Abschluss: Wenn alle Punkte gecheckt sind, Go‑Live freigeben.



---

## Quelle: docs/IMPLEMENTATION_GUIDE.md

# JobFlow - Implementation Guide: Mock → Production

## Quick Start Guide

### Step 1: Environment Setup (15 Min)

1. **Firebase Konfiguration erstellen**:

```bash
# .env.local erstellen
cp ENV_EXAMPLE.md .env.local
```

2. **Firebase Credentials eintragen**:

- Gehe zu Firebase Console → Project Settings → General
- Kopiere die Web App Configuration
- Füge die Werte in `.env.local` ein

3. **Feature Flags konfigurieren**:

```env
# Development: Mock-Modus
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_REALTIME=false

# Production: Scharfschaltung
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REALTIME=true
```

### Step 2: Feature Flags Implementation (30 Min)

**Neue Datei erstellen**: `lib/config/featureFlags.ts`

```typescript
/**
 * Feature Flags für schrittweise Migration von Mock zu Production
 */
export const FEATURE_FLAGS = {
  // Auth Configuration
  USE_MOCK_AUTH: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true',

  // Data Configuration
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',

  // Realtime Updates
  USE_REALTIME: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',

  // Environment
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Type-safe Feature Flag Check
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

// Log current configuration (Development only)
if (FEATURE_FLAGS.IS_DEVELOPMENT && typeof window !== 'undefined') {
  console.group('🚀 JobFlow Feature Flags');
  console.log('Mock Auth:', FEATURE_FLAGS.USE_MOCK_AUTH);
  console.log('Mock Data:', FEATURE_FLAGS.USE_MOCK_DATA);
  console.log('Realtime:', FEATURE_FLAGS.USE_REALTIME);
  console.groupEnd();
}
```

### Step 3: Auth Context Migration (1-2 Stunden)

**Datei**: `contexts/AuthContext.tsx`

**Änderung 1**: Feature Flags importieren

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
```

**Änderung 2**: useEffect anpassen (Zeile 24-103)

```typescript
useEffect(() => {
  // === MOCK MODE (Development) ===
  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    const mockUser: User = {
      id: 'mock-user-id',
      email: 'nurse@jobflow.de',
      displayName: 'Pflegekraft Benutzer',
      role: 'nurse',
      active: true,
      phone: '+49 123 456789',
      qualifications: ['Krankenpfleger', 'Intensivpflege'],
      vacationDays: 25,
      usedVacationDays: 5,
      documents: [],
      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
        shiftReminders: true,
        documentExpiry: true,
        systemAnnouncements: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTimeout(() => {
      setUser(mockUser);
      setFirebaseUser(null);
      setLoading(false);
    }, 500);

    return;
  }

  // === PRODUCTION MODE (Firebase Auth) ===
  const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
    setFirebaseUser(firebaseUser);

    if (firebaseUser) {
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Get custom claims for role
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const role = idTokenResult.claims.role || userData.role || 'nurse';

          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || userData.displayName || '',
            role: role as 'nurse' | 'admin' | 'dispatcher',
            active: userData.active !== undefined ? userData.active : true,
            phone: userData.phone || '',
            qualifications: userData.qualifications || [],
            vacationDays: userData.vacationDays || 25,
            usedVacationDays: userData.usedVacationDays || 0,
            documents: userData.documents || [],
            notificationSettings: userData.notificationSettings || {
              emailNotifications: true,
              pushNotifications: true,
              shiftReminders: true,
              documentExpiry: true,
              systemAnnouncements: true,
            },
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
        } else {
          // User document doesn't exist - create basic profile
          console.warn('User document not found, creating basic profile');
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);
```

**Änderung 3**: signIn/signOut Funktionen anpassen

```typescript
const signIn = async (email: string, password: string) => {
