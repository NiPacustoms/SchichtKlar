# JobFlow – Dokumentation Teil 126

*Zeichen 2483796–2503666 von 2862906*

---

- Vermeide zu spezifische Keys

### 2. Optimistic Updates

- Implementiere immer Rollback-Logik
- Aktualisiere alle betroffenen Queries
- Zeige Loading-States an

### 3. Error Handling

- Benutzerfreundliche Fehlermeldungen
- Recovery-Optionen anbieten
- Logging für Debugging

### 4. Performance

- Lazy Loading für seltene Features
- Intelligentes Caching
- Bundle-Optimierung

### 5. Testing

- Unit Tests für alle Hooks
- Integration Tests für Service-Interaktionen
- Error Boundary Tests

## 🔮 Zukünftige Verbesserungen

- **Service Worker**: Offline-Funktionalität
- **Real-time Updates**: WebSocket-Integration
- **Advanced Caching**: Redis-ähnliche Cache-Strategien
- **Performance Monitoring**: APM-Integration
- **A/B Testing**: Feature-Flag-Integration

---

Diese Dokumentation wird kontinuierlich aktualisiert. Bei Fragen oder Verbesserungsvorschlägen wenden Sie sich an das Entwicklungsteam.

```

---

### 📄 SLO_SLA.md

```markdown
# SLO/SLA & Error Budgets

## Service Level Objectives (SLO)
- Verfügbarkeit (Monat): 99.9% (Downtime ≤ ~43min/Monat)
- Fehlerquote (5xx / 4xx authz): P95 < 0.5%
- Latenz API (P95): < 400ms, (P99): < 900ms
- App LCP: < 2.5s (P75), INP < 200ms (P75)

## Service Level Indicators (SLI)
- Uptime: Health-Endpoint `/api/health` (200 OK)
- Error Rate: Anteil nicht-erfolgreicher Requests
- Latenz: P95/P99 aus Logs/Monitoring

## Error Budget
- Monatliches Budget: 0.1% Nichtverfügbarkeit
- Policy: Bei Budgetverbrauch > 50% Feature-Freeze, Fokus auf Stabilität

## Messung & Reporting
- Status-Seite `/status` (öffentlich)
- Alerting: Degraded Health, Error-Rate > Schwellwert, Latenz-Spikes
- Wöchentlicher SLO-Report im Team-Channel

## SLA (extern, informativ)
- Basic SLA: 99.9% Availability (Monat) – geplante Wartungsfenster exkl.
- Support-Reaktionszeiten: P1 ≤ 1h, P2 ≤ 4h (Geschäftszeiten), P3 ≤ 2 WT

```

---

### 📄 STATIC_TEMPLATE_NOTES.md

```markdown
# Notes zu statischen Templates

- Kein Placeholder-Support: Inhalte werden komplett in Firestore gepflegt.
- Pro Kombination aus (`companyId`, `templateKey`, `channel`, `locale`) existiert eine finale Variante.
- Cloud Functions wählen Variante aus und speichern sie direkt als Notification / senden E-Mail.
- Wenn keine Variante existiert, greifen Default-Texte im Code.
- Admin-UI muss Preview anhand der Felder `title`, `message`, `subject`, `bodyHtml`, `actionText` rendern.
- NotificationSettings bleiben unverändert (channel/type toggles).



```

---

### 📄 TEMPLATE_MANAGEMENT.md

```markdown
# Template-Verwaltung in JobFlow

## Überblick

JobFlow stellt Unternehmen eine mandantenfähige Vorlagenverwaltung zur Verfügung. Admins können für jeden Mandanten:

- **In-App-Benachrichtigungen** (Kanal `app`) definieren,
- **E-Mail-Benachrichtigungen** (Kanal `email`) mit HTML-/Text-Inhalten hinterlegen,
- Templates mehrsprachig (`locale`) und versioniert verwalten.

Vorlagen werden in der Sammlung `companyTemplates` gespeichert und sind eindeutig durch die Kombination aus `companyId`, `key`, `channel` und `locale`.

## Administrationsoberfläche

Die neue Seite `Admin → Dokumente → Templates` (`/admin/documents/templates`) bietet:

- Filter nach Kanal, Status und Locale,
- Volltextsuche über Namen, Keys und Beschreibungen,
- Editor mit Live-Vorschau für App- und E-Mail-Inhalte,
- Direkte Eingabe der finalen Inhalte (Titel, Nachricht, Betreff, HTML-Body, Action-Text),
- Sofortige Vorschau sowie Aktionen zum Bearbeiten und Löschen.

Ein Direktlink führt zu den bestehenden Dokumententypen, damit alle dokumentbezogenen Aufgaben zentral erreichbar bleiben.

## Template Keys

Die Cloud Functions erwarten feste Keys, die im Template-Editor verwendet werden sollten:

| Key                         | Zweck                                                |
|-----------------------------|------------------------------------------------------|
| `shift_assigned`            | Mitarbeiter erhält eine neue Schicht                 |
| `assignment_confirmed`      | Mitarbeiter hat eine Schicht bestätigt               |
| `assignment_rejected`       | Mitarbeiter hat eine Schicht abgelehnt               |
| `document_verified`         | Dokument wurde verifiziert                           |
| `document_rejected`         | Dokument wurde abgelehnt                             |
| `document_expiry_warning`   | Dokument läuft in Kürze ab                           |
| `new_message`               | Neue Chat-Nachricht                                  |
| `shift_requested_admin`     | Schicht-Anfrage eines Mitarbeiters an den Admin      |
| `assignment_accepted_admin` | Mitarbeiter hat eine angefragte Schicht angenommen   |
| `shift_full_admin`          | Schicht hat das Soll erreicht (Admin-Benachrichtigung) |

Weitere Keys können jederzeit ergänzt werden; die Trigger-Funktionen greifen automatisch auf veröffentlichte Templates zu.

## Kanal- und Typ-Einstellungen

Die Benachrichtigungseinstellungen (`notificationSettings/{userId}`) unterstützen neue Felder:

```json
{
  "channels": {
    "app": true,
    "email": true,
    "sms": false
  },
  "typeChannels": {
    "shift_assigned": { "app": true, "email": false }
  },
  "preferredLocale": "de"
}
```

- `channels` schaltet globale Kanäle (App, E-Mail, SMS) ein/aus.
- `typeChannels` überschreibt das Verhalten pro Template-Key.
- `types` wird weiterhin als Legacy-Flag ausgewertet (z.B. globale Deaktivierung eines Keys).
- `preferredLocale` erlaubt benutzerspezifische Lokalisierung (Fallback `de`).

## API & Queries

- **List/Create**: `GET/POST /api/templates`
- **Einzelzugriff**: `GET/PATCH/DELETE /api/templates/{id}`
- Admin-Berechtigung ist erforderlich (`role === admin/dispatcher`); die Functions lesen den Mandanten aus dem User-Dokument.
- Firestore-Indizes für `companyTemplates` wurden ergänzt (`companyId`, `channel`, `status`, `locale`, `updatedAt`).

## Cloud Functions

`functions/src/notificationTriggers.ts` lädt Templates direkt aus Firestore und nutzt die gespeicherten statischen Inhalte:

- Vorlagen für App-Notifications werden direkt aus der Datenbank geladen (basierend auf `companyId`, `templateKey`, `channel`, `locale`),
- Die gespeicherten Felder (`title`, `message`, `subject`, `bodyHtml`, `actionText`) werden ohne weitere Verarbeitung verwendet,
- Optional werden E-Mails versendet (unter Berücksichtigung der Settings),
- Bei fehlenden Templates wird auf Fallback-Texte ausgewichen,
- Metadaten (Template-ID, Template-Key) werden in den Notification-Dokumenten hinterlegt.

## Manual Tests

1. **Templates anlegen**: Admin erstellt je ein `app`- und `email`-Template für `shift_assigned` (Locale `de`) mit finalen Inhalten:
   - App-Template: `title` und `message` werden direkt eingegeben
   - Email-Template: `subject` und `bodyHtml` werden direkt eingegeben
2. **Benachrichtigung triggern**: Eine Schicht wird neu zugewiesen (`onShiftAssigned`).
3. **Erwartung**:
   - In-App-Benachrichtigung enthält die exakt gespeicherten Werte aus dem Template.
   - E-Mail wird versendet (SMTP-Konfiguration vorausgesetzt) mit den gespeicherten Inhalten.
   - Notification-Datensatz enthält `metadata.templateKey` und `channel: 'app'`.
4. **Settings prüfen**: `channels.email = false` verhindert den Versand; `typeChannels.shift_assigned.email = false` deaktiviert nur die E-Mail.

Weitere manuelle Tests:

- `assignment_confirmed`/`assignment_rejected`: Statuswechsel triggert passende Templates.
- `document_verified`/`document_rejected`: Dokumentprüfung im Admin führt zu neuen Notifications.
- Chat-Nachricht löst `new_message` aus (nur bei aktiven Templates).

## Template-Struktur

Templates speichern statische, final gerenderte Inhalte. Es gibt keine Platzhalter oder dynamische Rendering-Logik zur Laufzeit. Die Inhalte werden direkt aus der Datenbank verwendet:

- **App-Templates** (`channel: 'app'`): Erfordern `title` und `message`
- **Email-Templates** (`channel: 'email'`): Erfordern `subject` und `bodyHtml` (optional `bodyText`)

Jedes Template ist eindeutig durch die Kombination aus `companyId`, `key`, `channel` und `locale`.

## Migration & Fallbacks

Falls keine Templates vorhanden sind, greifen die bisherigen statischen Fallback-Texte. Damit bleibt die bestehende Funktionalität erhalten und Mandanten können schrittweise migrieren.



```

---

### 📄 TESTS.md

```markdown
# Tests

## Smoke
- Script: `scripts/smoke.sh`
- Ausführung: `BASE_URL=https://app.example.com ./scripts/smoke.sh`
- Prüft: `/api/health`, `/status`, `/auth/login`

## Load (k6)
- Script: `scripts/k6-health.js`
- Ausführung: `BASE_URL=https://app.example.com k6 run scripts/k6-health.js`
- Ziele: Error-Rate < 1%, P95 < 400ms, P99 < 900ms

## E2E (manuell, kurz)
- Admin Login → Audit-Logs öffnen
- Mitarbeiter Login → Dienstplan laden → Zeiten erfassen
- Dokument hochladen → Anzeige prüfen

## E2E (Playwright)

Ausführen:

```bash
npm run test:e2e
```

### Echte E2E-Logins (ohne Mock)

Für reale Logins lege lokal eine `.env.e2e` im Projektwurzelverzeichnis an (nicht einchecken):

```
# Admin-Account (Rolle: admin oder dispatcher)
E2E_ADMIN_EMAIL=admin@your-domain.tld
E2E_ADMIN_PASSWORD=your-admin-password

# Mitarbeiter-Account (Rolle: nurse)
E2E_EMPLOYEE_EMAIL=employee@your-domain.tld
E2E_EMPLOYEE_PASSWORD=your-employee-password

# Für echte Logins Mock-Auth nicht verwenden
NEXT_PUBLIC_E2E_TEST=
```

Die Playwright-Konfiguration lädt `.env.e2e` automatisch, falls vorhanden. Starte reale E2E-Tests z. B. mit:

```bash
npm run test:e2e:real
```

```

---

### 📄 UNTERSCHRIFT_WORKFLOW_NACHWEIS.md

```markdown
---
title: Nachweis Unterschriften-Workflow
last_updated: 2025-11-10
owner: ops
---

# Nachweis: Unterschriften-Workflow in JobFlow

## 1. Zweck und Abdeckung
- **Ziel:** Dokumentiert den End-to-End-Prozess zur Erfassung, Speicherung und Nachverfolgung von Unterschriften für Einsätze und Zeiterfassung.
- **Geltungsbereich:** Tagesignaturen der Einrichtungen, Mitarbeiter-Ablehnungen von Einsätzen sowie technische Persistenz (Firebase Storage & Firestore).
- **Verantwortlich:** Operations & Produktteam JobFlow.

## 2. Technische Komponenten
- **Dialoge**
  - `components/ui/SignatureDialog.tsx` – Canvas-basierte Signaturerfassung.
  - `components/admin/DailySignatureDialog.tsx` – Tagesbestätigung durch Einrichtungen am Mitarbeitergerät.
  - `components/schedule/AssignmentRequestCard.tsx` – Mitarbeiter-Ablehnung inkl. Signaturpflicht.
- **Logik & Services**
  - `lib/services/timesheets.ts` – Persistenz und Statusmanagement (`approveWithFacilitySignature`).
  - `lib/services/firebaseStorage.ts` – Upload und Metadatenverwaltung der Signatur-Bilddateien.
  - `lib/services/assignments.ts` – Speicherung von Signaturverweisen bei Einsatz-Ablehnungen.
- **Hooks**
  - `app/(employee)/employee/zeiterfassung/page.tsx` – Automatisches Öffnen des Tagesdialogs beim Schichtende.

## 3. Prozessabläufe
### 3.1 Tagesabschluss (Einrichtungssignatur)
1. Mitarbeiter beendet die Schicht (`Schicht beenden`).
2. `DailySignatureDialog` öffnet sich automatisch mit Einsatz- und Kontrolldaten.
3. Einrichtung prüft Angaben, wählt Status (`performed`, `aborted`, `no-show`) und trägt Namen ein.
4. Unterschrift wird über `SignatureDialog` aufgenommen und als PNG in Firebase Storage gespeichert (`signatures/timesheets/{timesheetId}/{YYYY-MM-DD}.png`).
5. `timesheetService.approveWithFacilitySignature`:
   - schreibt `facilitySignatureUrl`, `facilitySignedAt`, `facilitySignedBy`, `facilitySignerName`, `facilityConfirmationStatus` in das Timesheet-Dokument,
   - setzt Status auf `approved`.

### 3.2 Einsatz-Ablehnung durch Mitarbeiter
1. Mitarbeiter klickt auf `Ablehnen` in `AssignmentRequestCard`.
2. Ablehnungsgrund optional, anschließend Signaturpflicht (Canvas).
3. Upload nach `signatures/assignments/{assignmentId}/employee-signature.png`.
4. `cloudFunctions.declineAssignment` setzt Status `pending-signature`.
5. `assignmentService.update` speichert `employeeSignatureUrl` & `employeeSignedAt`; Admin-Signatur kann im Anschluss ergänzend hinterlegt werden.

## 4. Datenhaltung & Felder
### 4.1 Firestore – Timesheet-Dokument
| Feld | Typ | Quelle | Beschreibung |
|---|---|---|---|
| `facilitySignatureUrl` | string | `approveWithFacilitySignature` | Download-URL der PNG-Signatur |
| `facilitySignedAt` | Timestamp | `approveWithFacilitySignature` | Zeitpunkt der Einrichtungsunterschrift |
| `facilitySignedBy` | string | `approveWithFacilitySignature` | Benutzer-ID oder `facility-guest` |
| `facilitySignerName` | string | `DailySignatureDialog` | Freitextname der unterschreibenden Person |
| `facilityConfirmationStatus` | `'performed' \| 'aborted' \| 'no-show'` | `DailySignatureDialog` | Leistungsstatus laut Einrichtung |
| `employeeSignatureUrl` | string | zukünftige Erweiterungen | Signatur des Mitarbeiters (Timesheet-Eingabe) |
| `employeeSignedAt` | Timestamp | zukünftige Erweiterungen | Zeitpunkt Mitarbeiterunterschrift |
| `updatedAt` | Timestamp | Service | Nachverfolgung für Audit/Versionierung |

### 4.2 Firestore – Assignment-Dokument
| Feld | Typ | Quelle | Beschreibung |
|---|---|---|---|
| `employeeSignatureUrl` | string | `AssignmentRequestCard` | Signatur bei Schichtablehnung |
| `employeeSignedAt` | Timestamp | `AssignmentRequestCard` | Zeitpunkt der Ablehnung |
| `adminSignatureUrl` | string | Admin-Workflow | Nachgelagerte Unterschrift durch Disponent |

### 4.3 Firebase Storage
- **Pfadstruktur:** `exports/signatures/...` (Standard-Basepath aus `firebaseStorageService`).
- **Metadaten:** `kind`, `role`, `date`/`weekStart`, `signerName`.
- **Zugriff:** Gesichert über Firebase Security Rules (nicht öffentlich).

## 5. Compliance & Nachverfolgbarkeit
- **GoBD-konform:** Genehmigte Timesheets werden unveränderlich behandelt; Signaturen speichern Zeitpunkt & Verantwortliche.
- **DSGVO:** Speicherung nur erforderlicher Daten (Signaturbild + Metadaten); Zugriff durch authentifizierte Nutzer mit Rollenprüfung.
- **Audit-Trail:** Firestore `updatedAt` + vorhandene Audit-Logs ermöglichen Nachvollziehbarkeit der Genehmigung.
- **Proof:** Diese Dokumentation dient als Nachweis für interne/externe Audits (z. B. Pflegeaufsicht, Mandantenprüfung).

## 6. Prüfung & Tests
- **Manueller Test (Daily):**
  1. Schicht starten & beenden.
  2. Signatur erfassen, Status wählen.
  3. Firestore-Dokument (`timesheets/{id}`) auf neue Felder prüfen.
  4. Storage-Upload validieren (PNG + Metadaten).
- **Assignment-Ablehnung:** Ablehnung mit Signatur durchführen, anschließend Firestore & Storage kontrollieren.

## 7. Änderungsverlauf
- **2025-11-10:** Erstdokumentation, Ergänzung der Timesheet-Typen und -Mapper um Signaturfelder (Ticket: Unterschriften-Nachweis).
- **2025-01-XX:** Wochensignatur entfernt (obsolet). Nur noch tägliche Signaturen werden verwendet.


```

---

### 📄 VERBESSERUNGEN_2025-01-27.md

```markdown
# Verbesserungen - 2025-01-27

**Datum:** 2025-01-27  
**Status:** ✅ Abgeschlossen

---

## ✅ Durchgeführte Verbesserungen

### 1. ArbZG-Compliance-Prüfung im Admin-Dashboard

**Problem:** ArbZG-Verstöße wurden zwar im Backend geprüft, aber nicht visuell im Admin-Dashboard angezeigt.

**Lösung:**
- ✅ ArbZG-Validierung in `useAdminDashboard` Hook integriert
- ✅ Automatische Prüfung aller Timesheets auf ArbZG-Verstöße
- ✅ Warnungen und Fehler werden als Dashboard-Alerts angezeigt
- ✅ AlertsPanel erweitert um `arbzg-violation` Typ

**Dateien geändert:**
- `lib/hooks/useAdminDashboard.ts` - ArbZG-Validierung hinzugefügt
- `components/admin/AlertsPanel.tsx` - Icon für ArbZG-Verstöße hinzugefügt

**Funktionalität:**
- Prüft tägliche Arbeitszeit (>8h)
- Prüft wöchentliche Arbeitszeit (>40h)
- Prüft Ruhezeiten (<11h)
- Prüft Pausen (30min nach 6h, 45min nach 9h)
- Zeigt kritische Verstöße als Fehler, Warnungen als Warnungen

---

### 2. PWA Offline-Support - Verifiziert

**Status:** ✅ Bereits vollständig implementiert

**Vorhandene Features:**
- ✅ Service Worker registriert (`app/layout.tsx`)
- ✅ Offline-Queue Service vorhanden (`lib/services/offlineQueue.ts`)
- ✅ Offline-Queue in Zeiterfassung integriert (`lib/services/timesheets.ts`)
- ✅ Automatische Synchronisation bei Online-Wiederkehr
- ✅ Lokale Speicherung in localStorage
- ✅ Retry-Mechanismus (3 Versuche)

**Funktionalität:**
- Zeiterfassungen werden bei Offline-Status in Queue gespeichert
- Automatische Synchronisation bei Online-Wiederkehr
- Fehlerbehandlung mit Retry-Logik

---

### 3. GPS-Tracking - Verifiziert

**Status:** ✅ Bereits vollständig implementiert

**Vorhandene Features:**
- ✅ GPS-Erfassung beim Start/Stop (`app/(employee)/employee/zeiterfassung/page.tsx`)
- ✅ Browser Geolocation API verwendet
- ✅ Warnung bei fehlendem GPS (nicht blockierend)
- ✅ Standort wird in Firestore gespeichert
- ✅ High-Accuracy Modus aktiviert

**Funktionalität:**
- Automatische GPS-Erfassung beim Start/Stop
- Warnung, aber keine Blockierung bei fehlendem GPS
- Standort wird in Timesheet gespeichert

---

## 📊 Zusammenfassung

### Was funktioniert:

1. ✅ **ArbZG-Compliance-Prüfung** - Vollständig automatisiert im Dashboard
2. ✅ **PWA Offline-Support** - Vollständig implementiert
3. ✅ **GPS-Tracking** - Vollständig implementiert
4. ✅ **Offline-Queue** - Vollständig integriert

### Verbleibende Optimierungen (optional):

1. ⚠️ **Background Sync API** - Für bessere Offline-Synchronisation (Service Worker erweitern)
2. ⚠️ **IndexedDB** - Für größere Offline-Datenmengen (statt localStorage)
3. ⚠️ **Reverse Geocoding** - Adressen aus GPS-Koordinaten (optional)

---

## 🎯 Production-Ready Status

**Aktueller Stand: 92%** 🟢

Die App ist **production-ready** für die Kernfunktionalität:
- ✅ Alle kritischen Features implementiert
- ✅ ArbZG-Compliance automatisiert
- ✅ Offline-Support vorhanden
- ✅ GPS-Tracking vorhanden

**Optional für zukünftige Versionen:**
- Background Sync API
- IndexedDB für größere Datenmengen
- Erweiterte Offline-Features

---

**Letzte Aktualisierung:** 2025-01-27


```

---

### 📄 VERKAUFSFERTIGKEITSPRÜFUNG.md

```markdown
# Verkaufsfertigkeitsprüfung - JobFlow App

**Datum:** $(date)  
**Status:** 🟡 **BEDINGT VERKAUFSFERTIG** (mit kritischen Fixes)

---

## Executive Summary

Die JobFlow-App ist **grundsätzlich funktionsfähig**, hat jedoch einige **kritische Probleme**, die vor dem Verkauf behoben werden müssen:

### ✅ Positive Aspekte:
- ✅ Keine Linter-Fehler
- ✅ Solide Sicherheitsarchitektur (Firestore Rules, Auth)
- ✅ Gute Fehlerbehandlung (Error Boundaries)
- ✅ Mandantenisolation implementiert
- ✅ TypeScript-Typisierung vorhanden

### 🔴 Kritische Probleme (MUSS behoben werden):
1. **Build-Fehler** - Import-Fehler in `VacationRequestForm.tsx` ✅ BEHOBEN
2. **Debug-Routen in Production** - Sicherheitsrisiko ✅ BEHOBEN
3. **Next.js Config Warnung** - `webSocketServer` nicht unterstützt ✅ BEHOBEN

### 🟡 Mittlere Probleme (sollten behoben werden):
1. **Viele TODOs** - 1515+ TODOs gefunden (viele nicht kritisch)
2. **Console-Logs** - 755 console.log/warn/error Aufrufe in Production-Code
3. **Fehlende Input-Validierung** - Teilweise fehlende Zod-Validierung in API-Routen
4. **XSS-Risiko** - `dangerouslySetInnerHTML` ohne Sanitization in TemplateManager

### 🟢 Niedrige Priorität:
1. Rate Limiting fehlt
2. Inkonsistente Service-Patterns
3. Viele Mock-Daten in Employee Reports

---

## 1. Code-Qualität

### 1.1 Linter & TypeScript ✅
**Status:** ✅ **GUT**

- ✅ Keine Linter-Fehler gefunden
- ✅ TypeScript-Kompilierung erfolgreich (nach Fix)
- ✅ Type-Safety vorhanden

### 1.2 Build-Probleme 🔴 → ✅ BEHOBEN
**Status:** ✅ **BEHOBEN**

**Gefundene Probleme:**
1. ❌ Import-Fehler: `AdapterDateFnsV3` existiert nicht
   - **Datei:** `components/vacation/VacationRequestForm.tsx:21`
   - **Fix:** Geändert zu `AdapterDateFns`
   
2. ⚠️ Next.js Config Warnung: `webSocketServer` nicht unterstützt
   - **Datei:** `next.config.js:11-16`
   - **Fix:** Entfernt (nicht mehr benötigt in Next.js 15)

**Build-Test:**
```bash
npm run build
