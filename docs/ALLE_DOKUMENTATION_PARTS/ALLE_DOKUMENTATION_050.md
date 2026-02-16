# JobFlow – Dokumentation Teil 50

*Zeichen 973620–993502 von 2862906*

---

- `logPDFDownload` - PDF-Download-Protokollierung
- `deleteEmployeeData` - DSGVO-konforme Datenlöschung
- `exportDataBeforeDeletion` - Datenexport vor Löschung

### Firestore Collections
- `/companies/{companyId}/employeePayrollData/{employeeId}`
- `/companies/{companyId}/payrollCalculations/{calculationId}`
- `/companies/{companyId}/payrollPeriods/{periodId}`
- `/companies/{companyId}/payrollAuditLogs/{logId}`
- `/payrollCalculations/{calculationId}`
- `/payrollPeriods/{periodId}`
- `/payrollAuditLogs/{logId}`

## Datenmodell

### EmployeePayrollData
```typescript
interface EmployeePayrollData {
  employeeId: string;
  employmentType: 'festanstellung' | 'minijob' | 'midijob' | 'teilzeit' | 'vollzeit';
  contractStart: Date;
  workingHoursPerWeek: number;
  baseSalary: number;
  taxId: string;
  taxClass: 1 | 2 | 3 | 4 | 5 | 6;
  childAllowance: number;
  churchTax: boolean;
  socialSecurityNumber: string; // Encrypted
  healthInsurance: string;
  iban: string; // Encrypted
  // ... weitere Felder
}
```

### PayrollCalculation
```typescript
interface PayrollCalculation {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  workedHours: number;
  grossSalary: number;
  taxDeductions: TaxDeductions;
  socialSecurityDeductions: SocialSecurityDeductions;
  netSalary: number;
  employerContributions: EmployerContributions;
  totalEmployerCost: number;
  // ... weitere Felder
}
```

## Sicherheitsmaßnahmen

### Verschlüsselung
- **Client-seitige Verschlüsselung** für IBAN, SV-Nummern, Steuer-IDs
- **AES-256 Verschlüsselung** mit Crypto-JS
- **Sichere Schlüsselverwaltung** über Umgebungsvariablen
- **Maskierung** für Anzeige sensibler Daten

### Zugriffskontrolle
- **Firestore Security Rules** für granulare Berechtigungen
- **Admin-only** Zugriff auf Gehaltsdaten
- **Mitarbeiter** können nur eigene Daten einsehen
- **Audit-Logging** für alle Zugriffe

### Compliance
- **DSGVO-konforme Datenverarbeitung**
- **Automatische Datenlöschung** nach Aufbewahrungsfristen
- **GoBD-konforme Dokumentation**
- **Vollständige Audit-Trails**

## Testing

### Unit Tests
- **TaxCalculationService** - Alle Steuerklassen und Grenzfälle
- **SocialSecurityService** - Alle Beschäftigungsarten
- **EncryptionService** - Verschlüsselung und Entschlüsselung
- **DATEVExportService** - Export-Validierung

### Integration Tests
- **Vollständige Lohnabrechnung** für Test-Mitarbeiter
- **PDF-Generierung** mit verschiedenen Szenarien
- **DATEV-Export** mit Validierung
- **Firebase Functions** mit Mock-Daten

## Deployment

### Firebase Functions
```bash
firebase deploy --only functions
```

### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Frontend
```bash
npm run build
firebase deploy --only hosting
```

## Monitoring

### Audit-Logs
- Alle Änderungen an Gehaltsdaten
- Zugriffe auf Gehaltsabrechnungen
- PDF-Downloads und DATEV-Exports
- Datenlöschungen und -exporte

### Error Handling
- Umfassende Fehlerbehandlung in allen Services
- Logging für Debugging und Monitoring
- Benutzerfreundliche Fehlermeldungen
- Automatische Wiederholung bei temporären Fehlern

## Wartung

### Jährliche Updates
- **Steuertabellen** aktualisieren
- **Sozialversicherungsbeiträge** anpassen
- **Rechtliche Änderungen** implementieren
- **Sicherheitsupdates** durchführen

### Monitoring
- **Audit-Logs** regelmäßig prüfen
- **Performance-Metriken** überwachen
- **Fehlerraten** analysieren
- **Benutzerfeedback** sammeln

## Fazit

Das Lohnabrechnungssystem für JobFlow wurde erfolgreich implementiert und bietet:

- ✅ **Vollständige Rechtskonformität** nach deutschem Recht
- ✅ **Moderne Technologie** mit React, TypeScript, Firebase
- ✅ **Höchste Sicherheitsstandards** mit Verschlüsselung
- ✅ **Benutzerfreundliche Oberfläche** für Admins und Mitarbeiter
- ✅ **Automatisierte Prozesse** für Effizienz
- ✅ **Umfassende Dokumentation** für Wartung

Das System ist produktionsreif und kann sofort in der JobFlow-Anwendung eingesetzt werden.

```

---

### 📄 LOHNABRECHNUNG_USER_GUIDE.md

```markdown
# Lohnabrechnungssystem - Benutzerhandbuch

## Übersicht

Das Lohnabrechnungssystem für JobFlow ermöglicht die vollständige Verwaltung von Gehaltsabrechnungen für deutsche Zeitarbeitsfirmen. Das System ist rechtskonform nach deutschem Steuerrecht und bietet sowohl Admin- als auch Mitarbeiter-Funktionen.

## Admin-Funktionen

### Lohnabrechnung Dashboard

**Zugriff:** `/admin/lohnabrechnung`

Das Dashboard bietet eine Übersicht über alle Abrechnungsperioden und ermöglicht die Verwaltung der Lohnabrechnung.

#### Funktionen:
- **Statistiken** anzeigen (Mitarbeiter, Gehälter, Gesamtkosten)
- **Abrechnungsperioden** verwalten
- **Bulk-Aktionen** (alle berechnen, alle genehmigen)
- **DATEV-Export** generieren
- **Status-Übersicht** für alle Perioden

#### Workflow:
1. **Periode auswählen** aus der Tabelle
2. **Aktion wählen** (Berechnen, Genehmigen, Export)
3. **Bestätigen** der Aktion
4. **Status verfolgen** in der Tabelle

### Mitarbeiter-Gehaltsdaten

**Zugriff:** `/admin/mitarbeiter/[uid]/gehalt`

Verwaltung der Gehaltsdaten für jeden Mitarbeiter mit einem mehrstufigen Formular.

#### Schritt 1: Vertragsdaten
- **Beschäftigungsart** (Festanstellung, Minijob, Midijob, Teilzeit, Vollzeit)
- **Arbeitsstunden pro Woche**
- **Vertragsbeginn** und -ende
- **Arbeitszeitregelungen**

#### Schritt 2: Gehaltsdaten
- **Zahlungsart** (Monatlich, Stündlich)
- **Grundgehalt** in Euro
- **Stundensatz** (bei stündlicher Zahlung)
- **Zusatzleistungen**

#### Schritt 3: Steuerdaten
- **Steuer-ID** (verschlüsselt gespeichert)
- **Steuerklasse** (1-6)
- **Kinderfreibetrag**
- **Kirchensteuer** (ja/nein, Bundesland)

#### Schritt 4: Sozialversicherung
- **Sozialversicherungsnummer** (verschlüsselt)
- **Krankenkasse** und -nummer
- **Rentenversicherung** (ja/nein)
- **Arbeitslosenversicherung** (ja/nein)

#### Schritt 5: Bankdaten
- **IBAN** (verschlüsselt gespeichert)
- **BIC**
- **Bank** und Kontoinhaber
- **Sichere Speicherung** mit Verschlüsselung

#### Schritt 6: Zuschläge
- **Nachtzuschlag** (%)
- **Wochenendzuschlag** (%)
- **Feiertagszuschlag** (%)
- **Sonstige Zuschläge**

### Abrechnungsperioden

**Zugriff:** `/admin/lohnabrechnung/[periodId]`

Detailansicht einer Abrechnungsperiode mit allen Mitarbeitern und deren Berechnungen.

#### Funktionen:
- **Mitarbeiterliste** mit Status
- **Einzelansicht** mit Brutto/Netto
- **PDF-Download** für jeden Mitarbeiter
- **Genehmigung** einzelner oder aller Berechnungen
- **DATEV-Export** für die gesamte Periode

## Mitarbeiter-Funktionen

### Meine Gehaltsabrechnungen

**Zugriff:** `/gehaltsabrechnungen`

Mitarbeiter können ihre eigenen Gehaltsabrechnungen einsehen und herunterladen.

#### Funktionen:
- **Jahresfilter** für Abrechnungen
- **Statistiken** (Durchschnittsgehalt, Anzahl Abrechnungen)
- **PDF-Download** für jede Abrechnung
- **Vorschau** vor Download
- **Jahresübersicht** mit allen Abrechnungen

#### Workflow:
1. **Jahr auswählen** aus dem Dropdown
2. **Abrechnung auswählen** aus der Tabelle
3. **Vorschau anzeigen** oder **PDF herunterladen**
4. **Statistiken** einsehen

## Automatisierte Prozesse

### Monatliche Berechnung

**Zeitplan:** Jeden 1. des Monats um 2 Uhr morgens

Das System berechnet automatisch:
- **Alle aktiven Mitarbeiter** für den Vormonat
- **Brutto- und Nettogehälter** nach deutschem Steuerrecht
- **Sozialversicherungsbeiträge** nach aktuellen Sätzen
- **PDFs** für alle Mitarbeiter
- **DATEV-Export** für Steuerberater

### Genehmigungsworkflow

1. **Automatische Berechnung** am 1. des Monats
2. **Admin-Prüfung** der Berechnungen
3. **Genehmigung** durch Admin
4. **Zahlung** und Sperrung der Daten
5. **Audit-Log** für alle Schritte

## Sicherheit und Datenschutz

### Verschlüsselung

**Sensible Daten werden verschlüsselt gespeichert:**
- IBAN und BIC
- Sozialversicherungsnummern
- Krankenversicherungsnummern
- Steuer-IDs

**Verschlüsselung erfolgt:**
- **Client-seitig** vor der Übertragung
- **AES-256** Verschlüsselung
- **Sichere Schlüsselverwaltung**

### Zugriffskontrolle

**Admin-Berechtigung erforderlich für:**
- Gehaltsdaten verwalten
- Lohnabrechnungen genehmigen
- DATEV-Export generieren
- Audit-Logs einsehen

**Mitarbeiter können:**
- Nur eigene Gehaltsabrechnungen einsehen
- PDFs herunterladen
- Statistiken einsehen

### Audit-Logging

**Alle Aktionen werden protokolliert:**
- Änderungen an Gehaltsdaten
- Zugriffe auf Abrechnungen
- PDF-Downloads
- DATEV-Exports
- Genehmigungen und Sperrungen

## DATEV-Export

### Export-Formate

**LODAS-Format (ASCII):**
- Standard-Format für deutsche Steuerberater
- Vollständige Lohndaten
- Automatische Generierung

**XML-Format:**
- Moderne Alternative
- Strukturierte Daten
- Einfache Integration

**CSV-Format:**
- Einfache Tabellenkalkulation
- Schnelle Übersicht
- Flexible Weiterverarbeitung

### Export-Workflow

1. **Periode auswählen** im Admin-Dashboard
2. **DATEV-Export** generieren
3. **Datei herunterladen** oder per E-Mail senden
4. **An Steuerberater** weiterleiten

## Fehlerbehebung

### Häufige Probleme

**PDF wird nicht generiert:**
- Prüfen Sie die Mitarbeiterdaten
- Stellen Sie sicher, dass alle Pflichtfelder ausgefüllt sind
- Kontaktieren Sie den Administrator

**DATEV-Export fehlerhaft:**
- Prüfen Sie die Firmendaten
- Stellen Sie sicher, dass alle Mitarbeiterdaten vollständig sind
- Kontaktieren Sie den Administrator

**Zugriff verweigert:**
- Prüfen Sie Ihre Berechtigung
- Melden Sie sich erneut an
- Kontaktieren Sie den Administrator

### Support

**Bei Problemen wenden Sie sich an:**
- **Administrator** für technische Probleme
- **Steuerberater** für rechtliche Fragen
- **System-Administrator** für Zugriffsprobleme

## Best Practices

### Für Administratoren

1. **Regelmäßige Prüfung** der Gehaltsdaten
2. **Sichere Passwörter** verwenden
3. **Audit-Logs** regelmäßig prüfen
4. **Backup-Strategien** implementieren
5. **Schulungen** für Mitarbeiter durchführen

### Für Mitarbeiter

1. **Gehaltsabrechnungen** regelmäßig prüfen
2. **PDFs** sicher aufbewahren
3. **Bei Fragen** den Administrator kontaktieren
4. **Passwörter** sicher aufbewahren
5. **Logout** nach jeder Sitzung

## Rechtliche Hinweise

### Aufbewahrungspflichten

**Gehaltsabrechnungen:**
- 6 Jahre nach Ende des Kalenderjahres
- Automatische Löschung nach Ablauf
- Export vor Löschung möglich

**Audit-Logs:**
- 10 Jahre Aufbewahrung
- Unveränderliche Speicherung
- GoBD-konforme Dokumentation

### Datenschutz

**DSGVO-konforme Verarbeitung:**
- Rechtmäßige Datenverarbeitung
- Datenschutz durch Technikgestaltung
- Betroffenenrechte gewährleistet
- Automatische Datenlöschung

**Verschlüsselung:**
- Client-seitige Verschlüsselung
- Sichere Übertragung
- Geschützte Speicherung
- Zugriffskontrolle

## Fazit

Das Lohnabrechnungssystem für JobFlow bietet eine vollständige, rechtskonforme Lösung für die Gehaltsabrechnung. Mit moderner Technologie, höchsten Sicherheitsstandards und benutzerfreundlicher Oberfläche ist es die ideale Lösung für deutsche Zeitarbeitsfirmen.

**Vorteile:**
- ✅ Vollständige Rechtskonformität
- ✅ Automatisierte Prozesse
- ✅ Höchste Sicherheitsstandards
- ✅ Benutzerfreundliche Oberfläche
- ✅ Umfassende Dokumentation
- ✅ Professioneller Support

```

---

### 📄 push-notifications-setup.md

```markdown
# Push-Benachrichtigungen Setup

## Übersicht

Die App unterstützt jetzt Push-Benachrichtigungen für Schichtzuweisungen. Mitarbeiter erhalten sowohl E-Mail- als auch Push-Benachrichtigungen, wenn ihnen eine Schicht zugewiesen wird.

## Funktionalität

- ✅ **E-Mail-Benachrichtigungen**: Bereits implementiert
- ✅ **Push-Benachrichtigungen**: Neu implementiert
- ✅ **Service Worker**: Erweitert für Push-Events
- ✅ **Automatische Initialisierung**: Beim Login wird der FCM Token gespeichert

## Konfiguration

### 1. Firebase Cloud Messaging (FCM) VAPID Key

1. Gehe zur Firebase Console → Project Settings → Cloud Messaging
2. Generiere einen neuen Web Push-Zertifikat (VAPID Key)
3. Füge den Public Key als Umgebungsvariable hinzu:

```env
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key-here
```

### 2. Firebase Admin SDK (für API-Route)

Die API-Route `/api/push/notify` benötigt Firebase Admin SDK:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

**Alternative**: Verwende eine Cloud Function statt der API-Route (empfohlen für Production).

### 3. Service Worker

Der Service Worker (`public/sw.js`) wurde bereits erweitert und registriert sich automatisch in Production.

## Verwendung

### Automatisch

Push-Benachrichtigungen werden automatisch gesendet, wenn:
- Ein Admin eine Schicht erstellt und direkt einen Mitarbeiter zuweist
- Ein Admin einen Mitarbeiter einer bestehenden Schicht zuweist

### Manuell

```typescript
import { sendPushNotification } from '@/lib/services/pushNotifications';

await sendPushNotification({
  userId: 'user-id',
  title: 'Neue Schicht zugewiesen',
  body: 'Sie haben eine neue Schicht zugewiesen bekommen',
  data: {
    assignmentId: 'assignment-id',
    type: 'assignment',
  },
  link: '/employee/forms/assignment/assignment-id',
});
```

## Browser-Unterstützung

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 16.4+)
- ⚠️ Safari (Desktop): Eingeschränkte Unterstützung

## Testing

1. **Berechtigung anfordern**: Beim ersten Login wird der Benutzer nach Berechtigung gefragt
2. **Token speichern**: Der FCM Token wird automatisch in Firestore gespeichert (`fcmTokens/{userId}`)
3. **Benachrichtigung senden**: Teste über die Admin-Oberfläche beim Zuweisen einer Schicht

## Troubleshooting

### Keine Push-Benachrichtigungen erhalten?

1. Prüfe Browser-Berechtigungen: `Settings → Site Settings → Notifications`
2. Prüfe ob FCM Token gespeichert ist: Firestore Collection `fcmTokens`
3. Prüfe Browser-Konsole auf Fehler
4. Prüfe ob Service Worker registriert ist: `Application → Service Workers` (Chrome DevTools)

### Service Worker nicht registriert?

- In Development wird der Service Worker automatisch deaktiviert
- In Production sollte er sich automatisch registrieren
- Prüfe Browser-Konsole auf Fehler

### Firebase Admin Fehler?

- Stelle sicher, dass `FIREBASE_SERVICE_ACCOUNT_KEY` korrekt gesetzt ist
- Alternative: Verwende Cloud Functions statt API-Route

## Cloud Function Alternative (Empfohlen)

Für Production sollte eine Cloud Function verwendet werden:

```typescript
// functions/src/sendPushNotification.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const sendPushNotification = functions.https.onCall(async (data, context) => {
  const { userId, notification, data: notificationData } = data;
  
  // Hole FCM Token
  const tokenDoc = await admin.firestore().doc(`fcmTokens/${userId}`).get();
  const token = tokenDoc.data()?.token;
  
  if (!token) {
    throw new functions.https.HttpsError('not-found', 'Kein FCM Token gefunden');
  }
  
  // Sende Benachrichtigung
  await admin.messaging().send({
    token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notificationData,
    webpush: {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/favicon-192.png',
      },
    },
  });
  
  return { success: true };
});
```

## Sicherheit

- FCM Tokens werden in Firestore gespeichert (nur für den jeweiligen Benutzer zugänglich)
- API-Route prüft Authentifizierung (über Middleware)
- Push-Benachrichtigungen enthalten keine sensiblen Daten


```

---

## Firebase Setup

*13 Dateien*

### 📄 FIREBASE_ADD_EXTENSIONS_ROLE.md

```markdown
# Firebase Extensions Admin Rolle hinzufügen (via gcloud CLI)

## Problem
Die Rolle "Firebase Extensions Admin" ist in der Google Cloud Console nicht auswählbar.

## Lösung: Rolle über gcloud CLI hinzufügen

### Schritt 1: gcloud CLI installieren (falls nicht vorhanden)

**macOS:**
```bash
brew install google-cloud-sdk
```

**Oder manuell:**
- Download: https://cloud.google.com/sdk/docs/install

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

Du solltest `roles/firebaseextensions.admin` in der Liste sehen.

### Schritt 6: Warten

Warte **2-5 Minuten**, bis die Berechtigungen propagiert sind.

### Schritt 7: Deployment erneut triggern

```bash
git commit --allow-empty -m "Test deployment after adding Extensions Admin role via CLI"
git push origin main
```

## Alternative: Custom Role erstellen

Falls die Rolle über gcloud auch nicht funktioniert, kannst du eine Custom Role mit der spezifischen Berechtigung erstellen:

### 1. Custom Role erstellen

```bash
gcloud iam roles create firebaseExtensionsViewer \
  --project=jobflow25 \
  --title="Firebase Extensions Viewer" \
  --description="Allows listing Firebase Extensions instances" \
  --permissions=firebaseextensions.instances.list
```

### 2. Custom Role zuweisen

```bash
gcloud projects add-iam-policy-binding jobflow25 \
  --member="serviceAccount:jobflow25@jobflow25.iam.gserviceaccount.com" \
  --role="projects/jobflow25/roles/firebaseExtensionsViewer"
```

## Verifikation

Nach dem Hinzufügen der Rolle, sollte das Deployment erfolgreich sein ohne den Fehler:
```
firebaseextensions.instances.list
```


```

---

### 📄 FIREBASE_API_ERRORS_FIX.md

```markdown
# Firebase Deployment API-Fehler - Lösung

## Problem

Nach dem Beheben des `firebaseextensions.instances.list` Fehlers traten neue API-Fehler auf:

1. **Cloud Billing API nicht aktiviert**
   - Fehler: `Cloud Billing API has not been used in project 350790971531 before or it is disabled`
   - Firebase CLI prüft Billing-Informationen während des Deployments

2. **Runtime Config API fehlende Berechtigung**
   - Fehler: `Request to https://runtimeconfig.googleapis.com/v1beta1/projects/jobflow25/configs had HTTP Error: 403`
   - Firebase CLI versucht, Runtime Config zu verwenden (optional)

3. **Compute Engine API nicht aktiviert**
   - Fehler: `Compute Engine API has not been used in project 350790971531 before or it is disabled`
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
