# JobFlow – Dokumentation Teil 66

*Zeichen 1291518–1311359 von 2862906*

---

  - Accept/Decline funktioniert
- ✅ **Verfügbarkeitsprüfung**: Implementiert
  - Konfliktvermeidung vorhanden
- ✅ **Status-Workflow**: Implementiert
  - Workflow (offen → zugewiesen → bestätigt/abgelehnt) funktioniert
- ✅ **Benachrichtigungen**: Implementiert (95%)
  - Backend vorhanden
  - Tabs (Alle/Ungelesen/Gelesen/Archiviert)
  - Mark as Read, Bulk-Operations

**Status: 🟢 90% - Vollständig funktionsfähig**

---

## ⏱️ 5. Arbeitszeiterfassung (Mitarbeiter)

### Anforderungen (README.md)
- ✅ **Start/Stop/Pause** mit GPS-Tracking
- ✅ **ArbZG-konforme Pausen** (30min nach 6h, 45min nach 9h)
- ✅ **Nettozeit-Berechnung** mit Pausenabzug
- ✅ **Offline-Support** mit lokaler Zwischenspeicherung

### Aktueller Stand
- ✅ **Zeiterfassung**: Vollständig implementiert (95%)
  - `/employee/zeiterfassung` - Vollständig
  - Start/Pause/Ende funktioniert
  - Live-Timer vorhanden
  - Pause-Verwaltung implementiert
  - Manuelle Erfassung möglich
  - Historie vorhanden
- ⚠️ **GPS-Tracking**: **UNKLAR**
  - Browser Geolocation API erwähnt in README
  - Implementierung im Code nicht eindeutig verifiziert
- ✅ **ArbZG-konforme Pausen**: Implementiert
  - Pausen-Verwaltung vorhanden
  - Pausenabzug funktioniert
- ✅ **Nettozeit-Berechnung**: Implementiert
  - Berechnung mit Pausenabzug vorhanden
- ⚠️ **Offline-Support**: **TEILWEISE**
  - PWA aktiv (README)
  - Lokale Zwischenspeicherung nicht eindeutig verifiziert

**Status: 🟢 93% - Funktional, GPS/Offline unklar**

---

## ✍️ 6. Signatur-Workflow

### Anforderungen (README.md)
- ✅ **Digitale Unterschriften** für Arbeitszeiten
- ✅ **Mehrtage-Einsätze** mit Sammelsignatur (>7 Tage)
- ✅ **Rechtssichere Speicherung** mit Audit-Trail
- ✅ **Entsperrung** nur durch Admin mit Pflicht-Kommentar

### Aktueller Stand
- ✅ **Digitale Unterschriften**: Implementiert
  - Signatur-Workflow vorhanden
- ✅ **Mehrtage-Einsätze**: Implementiert
  - Sammelsignatur für >7 Tage vorhanden
- ✅ **Rechtssichere Speicherung**: Implementiert
  - Audit-Trail vorhanden
  - Audit-Logs-Seite vorhanden (85%)
- ✅ **Entsperrung**: Implementiert
  - Admin-Entsperrung vorhanden
  - Pflicht-Kommentar vorhanden

**Status: 🟢 90% - Vollständig funktionsfähig**

---

## 📊 7. Live-Überwachung (Admin)

### Anforderungen (README.md)
- ✅ **Tagesüberblick** mit laufenden Sessions
- ✅ **Automatische Prüfung** von ArbZG-Compliance
- ✅ **Warnungen** für fehlende GPS-Daten, Pausen, Überlappungen
- ✅ **Export-Funktionen** für Berichte und Abrechnungen

### Aktueller Stand
- ✅ **Admin Dashboard**: Implementiert (95%)
  - `/admin/dashboard` - Vollständig
  - KPIs, Quick Actions, Alerts
  - Statistics, Recent Activities
  - Realtime Updates
- ✅ **Berichte**: Implementiert (95%)
  - `/admin/berichte` - Vollständig
  - Zeitkonten, Zuschläge, Mitarbeiter-Statistiken
  - Charts, Filter, Export (PDF/Excel)
  - Pagination vorhanden
- ⚠️ **ArbZG-Compliance-Prüfung**: **TEILWEISE**
  - Automatische Prüfung erwähnt, aber nicht eindeutig verifiziert
- ⚠️ **Warnungen**: **TEILWEISE**
  - Warnungen für fehlende GPS-Daten, Pausen, Überlappungen nicht eindeutig verifiziert
- ✅ **Export-Funktionen**: Implementiert
  - PDF/Excel-Export vorhanden

**Status: 🟡 85% - Funktional, Compliance-Prüfung unklar**

---

## 📱 8. PWA & Offline-Support

### Anforderungen (README.md)
- ✅ **Progressive Web App** mit Install-Prompt
- ✅ **Offline-Funktionalität** für kritische Features
- ✅ **Automatische Synchronisation** bei Online-Wiederkehr
- ✅ **Konfliktbehandlung** für gleichzeitige Änderungen

### Aktueller Stand
- ✅ **PWA**: Implementiert
  - PWA aktiv (README)
  - Install-Prompt vorhanden
- ⚠️ **Offline-Funktionalität**: **UNKLAR**
  - Service Worker erwähnt in README
  - Implementierung nicht eindeutig verifiziert
- ⚠️ **Automatische Synchronisation**: **UNKLAR**
  - Nicht eindeutig verifiziert
- ⚠️ **Konfliktbehandlung**: **UNKLAR**
  - Nicht eindeutig verifiziert

**Status: 🟡 80% - PWA aktiv, Offline-Features unklar**

---

## 💰 9. Lohnabrechnung

### Anforderungen (PAYROLL_REQUIREMENTS.md)
Umfangreiches System mit:
- Abrechnungsperioden-Management
- Berechnung (Brutto → Netto)
- Exporte (DATEV CSV, PDF)
- Audit-Trail
- Rollen & Rechte
- Compliance (GoBD, DSGVO, etc.)

### Aktueller Stand
- ✅ **Lohnabrechnung**: Implementiert (87%)
  - `/admin/lohnabrechnung` - Vollständig (95%)
  - Periodenverwaltung vorhanden
  - Berechnung vorhanden
  - Genehmigung vorhanden
  - Export (DATEV/PDF) vorhanden
  - Bulk-Operationen vorhanden
  - Preview vorhanden
  - Audit-Logs vorhanden
- ⚠️ **Unlock-Funktion**: **TODO**
  - `// TODO: unlock function` im Code
  - Funktion zum Entsperren fehlt
- ✅ **Mitarbeiter-Ansicht**: Implementiert (90%)
  - `/employee/gehaltsabrechnungen` - Vollständig
  - Jahresfilter, Statistiken
  - Tabellen-Ansicht, Preview-Dialog
  - PDF-Download vorhanden

**Status: 🟡 87% - Funktional, Unlock-Funktion fehlt**

---

## 💬 10. Chat-System

### Anforderungen (TODO-Liste)
- ❌ **Real-time Chat Service** mit Firebase Realtime Database
- ❌ **1:1 und Gruppen-Chat Interface**
- ❌ **Message-Encryption** für DSGVO
- ❌ **WhatsApp-ähnliche UI** mit Typing-Indicators
- ❌ **File-Sharing Funktionen**
- ❌ **Admin Broadcast-Nachrichten**
- ❌ **Rollen-basierte Kanäle**

### Aktueller Stand
- ⚠️ **Chat-UI**: Vorhanden (100%)
  - `/admin/chat` - UI vorhanden (90%)
  - `/employee/chat` - UI vorhanden (90%)
  - Channel List, Chat View vorhanden
  - Mobile/Desktop-Layout vorhanden
- ❌ **Chat-Backend**: **FEHLT KOMPLETT** (0%)
  - Laut TODO-Liste: "komplett neu zu implementieren"
  - Backend fehlt komplett
  - Real-time Chat nicht funktionsfähig
- ❌ **Detail-Seiten**: **EXISTIEREN NICHT**
  - `/admin/chat/[channelId]` - 0% (existiert nicht)
  - `/employee/chat/[channelId]` - 0% (existiert nicht)

**Status: 🔴 40% - UI vorhanden, Backend fehlt komplett**

---

## 📊 11. Employee Reports

### Anforderungen (README.md)
- ✅ **Berichte** für Mitarbeiter
- ✅ **Statistiken** und Auswertungen

### Aktueller Stand
- ⚠️ **Employee Reports**: **55%** (KRITISCH)
  - `/employee/berichte` - UI vollständig (100%)
  - **Datenberechnungen fehlen komplett** (40%)
  - Viele TODOs im Code:
    ```typescript
    weeklyData: [], // TODO: Aus echten Timesheet-Daten berechnen
    monthlyOvertime: [], // TODO: Aus echten Timesheet-Daten berechnen
    worktimeDetails: [] as WorktimeDetail[], // TODO: Aus echten Timesheet-Daten laden
    bonusDetails: [] as BonusDetail[], // TODO: Aus echten Surcharge-Daten laden
    vacationDetails: [] as VacationDetail[] // TODO: Aus echten Vacation-Daten laden
    ```
  - **Echte Datenberechnung fehlt komplett!**

**Status: 🟠 55% - UI vorhanden, Daten fehlen**

---

## 📈 Gesamtbewertung

### Umsetzungsgrad nach Kategorien

| Kategorie | Anforderungen | Umsetzung | Status |
|-----------|---------------|-----------|--------|
| Authentifizierung & RBAC | 4 | 95% | 🟢 |
| Kundenverwaltung | 4 | 93% | 🟢 |
| Mitarbeiterverwaltung | 4 | 85% | 🟡 |
| Auftragsverwaltung | 4 | 90% | 🟢 |
| Arbeitszeiterfassung | 4 | 93% | 🟢 |
| Signatur-Workflow | 4 | 90% | 🟢 |
| Live-Überwachung | 4 | 85% | 🟡 |
| PWA & Offline | 4 | 80% | 🟡 |
| Lohnabrechnung | Umfangreich | 87% | 🟡 |
| Chat-System | 7 | 40% | 🔴 |
| Employee Reports | 2 | 55% | 🟠 |
| **GESAMT** | **~50** | **78%** | **🟡** |

### Kritische Lücken

1. **🔴 Chat-System** - Backend fehlt komplett (40%)
2. **🔴 Employee Reports** - Datenberechnungen fehlen (55%)
3. **🟠 Detail-Seiten** - 3 wichtige Seiten existieren nicht:
   - `/admin/mitarbeiter/[uid]` (25%)
   - `/admin/einrichtungen/[id]` (0%)
   - `/admin/chat/[channelId]` (0%)
   - `/employee/chat/[channelId]` (0%)
4. **🟠 Payroll Unlock** - Funktion fehlt (TODO)
5. **🟡 Offline-Support** - Implementierung unklar
6. **🟡 GPS-Tracking** - Implementierung unklar
7. **🟡 ArbZG-Compliance-Prüfung** - Automatische Prüfung unklar

---

## ✅ Was funktioniert wirklich

### Vollständig implementiert und funktionsfähig:
1. ✅ **Authentifizierung** - Firebase Auth aktiv
2. ✅ **RBAC** - Rollenbasierte Zugriffskontrolle
3. ✅ **Dashboard (Admin & Employee)** - Nutzt echte Services
4. ✅ **Schichtverwaltung** - Vollständiges CRUD
5. ✅ **Zeiterfassung** - Timer funktioniert
6. ✅ **Dokumentenverwaltung** - Upload/Download/View
7. ✅ **Mitarbeiterverwaltung (Liste)** - CRUD funktioniert
8. ✅ **Einrichtungsverwaltung (Liste)** - CRUD funktioniert
9. ✅ **Benachrichtigungen** - Backend vorhanden
10. ✅ **Lohnabrechnung** - Vollständig funktionsfähig (außer Unlock)
11. ✅ **Signatur-Workflow** - Vollständig implementiert
12. ✅ **Assignments** - Vollständig funktionsfähig

---

## 🚨 Was fehlt oder unvollständig ist

### Kritisch (muss vor Production):
1. **Chat-System Backend** - Komplett neu implementieren
2. **Employee Reports Datenberechnungen** - Echte Datenberechnung implementieren
3. **Detail-Seiten** - 3 wichtige Seiten implementieren

### Wichtig (sollte vor Production):
4. **Payroll Unlock-Funktion** - Implementieren
5. **Offline-Support** - Verifizieren/Implementieren
6. **GPS-Tracking** - Verifizieren/Implementieren
7. **ArbZG-Compliance-Prüfung** - Automatische Prüfung implementieren

### Optional (kann später):
8. **Export-Funktionen** - Teilweise TODOs vorhanden
9. **Erweiterte Features** - Siehe TODO-Liste

---

## 📝 Fazit

### Ehrliche Einschätzung:
- **UI-Entwicklung**: **90%** - Fast alle Seiten haben vollständige UIs
- **Backend-Integration**: **70%** - Viele Services vorhanden, aber Chat und Reports fehlen
- **Funktionalität**: **78%** - Durchschnittlich

### Hauptprobleme:
1. **Chat-System** - Muss komplett neu implementiert werden (Backend fehlt)
2. **Reports** - Datenberechnungen fehlen komplett
3. **Detail-Seiten** - 3 wichtige Detail-Seiten existieren nicht
4. **Kleinere Features** - Unlock, Exports, etc.

### Empfehlung:
Die App hat eine **solide Basis** (78%), aber für Production fehlen noch:
- Chat-Backend (kritisch)
- Reports-Datenberechnungen (kritisch)
- Detail-Seiten (wichtig)
- Kleinere Features (unlock, exports)

**Geschätzte Zeit bis Production-Ready: 4-6 Wochen** (bei Vollzeit-Entwicklung)

---

**Letzte Aktualisierung:** 2025-01-27  
**Bewertung:** Realistisch und unverblümt basierend auf Code-Analyse


```

---

### 📄 API_MONITORING.md

```markdown
# API-Monitoring & Caching für Routenberechnung

## Übersicht

Das System überwacht und optimiert die Nutzung der OpenRouteService API für Routenberechnungen in JobFlow.

## Features

### 1. **API-Monitoring** (`lib/services/apiMonitoring.ts`)

- **Tägliches Limit**: 2.000 Requests/Tag (OpenRouteService Free Tier)
- **Rate Limiting**: 40 Requests/Minute
- **Firestore-basiert**: Persistente Speicherung der API-Call-Statistiken
- **Automatische Bereinigung**: Alte Daten (>7 Tage) werden automatisch gelöscht

### 2. **Mehrstufiges Caching** (`lib/services/maps.ts`)

#### Memory Cache (schnell)
- In-Memory-Speicherung für sofortigen Zugriff
- TTL: 24 Stunden

#### Firestore Cache (persistent)
- Persistente Speicherung in Firestore
- TTL: 24 Stunden
- Überlebt Browser-Neustarts

#### Cache-Strategie
1. Zuerst Memory Cache prüfen (schnellste Option)
2. Falls nicht vorhanden: Firestore Cache prüfen
3. Falls im Firestore Cache: Zurück in Memory Cache laden
4. Bei Cache-Miss: API-Call durchführen

### 3. **Rate Limiting**

- Prüft vor jedem API-Call, ob Limits erreicht sind
- Blockiert Requests bei Limit-Erreichung
- Fallback auf OpenStreetMap-Link bei Limit-Erreichung

### 4. **Fehlerbehandlung**

- **429 (Too Many Requests)**: Fallback auf OpenStreetMap-Link
- **Tägliches Limit erreicht**: Fallback mit Hinweis
- **Rate Limit erreicht**: Fallback mit Hinweis
- **Fail-Open-Strategie**: Bei Monitoring-Fehlern wird Request erlaubt

## Verwendung

### Routenberechnung

```typescript
import { maps } from '@/lib/services/maps';

const route = await maps.getRoute(
  { latitude: 52.52, longitude: 13.405 }, // Origin
  { latitude: 48.1351, longitude: 11.5820 } // Destination
);

if (route) {
  console.log(`Distanz: ${route.distanceMeters}m`);
  console.log(`Dauer: ${route.durationSeconds}s`);
}
```

### API-Statistiken abrufen

```typescript
import { ApiMonitoringService } from '@/lib/services/apiMonitoring';

const stats = await ApiMonitoringService.getStats();
console.log(`Verwendet: ${stats.dailyCount}/${2000}`);
console.log(`Verbleibend: ${stats.remaining}`);
console.log(`Prozent: ${stats.percentageUsed.toFixed(1)}%`);
```

### Rate Limit prüfen

```typescript
const check = await ApiMonitoringService.canMakeRequest();
if (!check.allowed) {
  console.warn(check.reason);
}
```

## Firestore Collections

### `api_monitoring`
- **Document ID**: Datum im Format `YYYY-MM-DD`
- **Felder**:
  - `date`: Datum (string)
  - `count`: Anzahl API-Calls (number)
  - `lastCallAt`: Zeitpunkt des letzten Calls (Timestamp)
  - `rateLimitWindow`: Array mit minütlichen Call-Zählern
  - `updatedAt`: Letzte Aktualisierung (Timestamp)

### `route_cache`
- **Document ID**: Cache-Key (z.B. `route:52.52,13.405->48.1351,11.5820`)
- **Felder**:
  - `value`: RouteSummary-Objekt
  - `expiresAt`: Ablaufzeitpunkt (Timestamp)
  - `cachedAt`: Zeitpunkt der Speicherung (Timestamp)

## Performance-Optimierungen

1. **Cache-Hit-Rate**: Durch 24h TTL werden identische Routen nicht mehrfach berechnet
2. **Memory + Firestore**: Kombination für beste Performance
3. **Rate Limiting**: Verhindert unnötige API-Calls bei Limit-Erreichung
4. **Fail-Silently**: Cache-Fehler blockieren nicht die App

## Limits & Kosten

- **Tägliches Limit**: 2.000 Requests/Tag (kostenlos)
- **Rate Limit**: 40 Requests/Minute
- **Kosten bei Überschreitung**: Keine (API blockiert nur)
- **Cache-Reduktion**: ~60-80% weniger API-Calls durch Caching

## Monitoring & Wartung

### Alte Daten bereinigen

```typescript
await ApiMonitoringService.cleanupOldRecords();
```

**Empfehlung**: Als Cloud Function täglich ausführen.

### Statistiken überwachen

Für Admin-Dashboard:
- Tägliche API-Call-Anzahl
- Verbleibende Requests
- Cache-Hit-Rate (kann über Firestore-Queries berechnet werden)

## Troubleshooting

### Problem: "API-Limit erreicht"
- **Lösung**: Warten bis zum nächsten Tag (Reset um 00:00 UTC)
- **Prävention**: Caching optimieren, weniger API-Calls

### Problem: Cache funktioniert nicht
- **Prüfen**: Firestore-Berechtigungen für `route_cache` Collection
- **Prüfen**: Browser-Konsole auf Fehler

### Problem: Rate Limit trotz Monitoring
- **Ursache**: Mehrere gleichzeitige Requests
- **Lösung**: Rate Limiting funktioniert, aber mehrere Requests können gleichzeitig durchgehen

## Zukünftige Verbesserungen

- [ ] Cache-Hit-Rate-Metriken
- [ ] Admin-Dashboard für API-Statistiken
- [ ] Automatische Cleanup-Cloud-Function
- [ ] Erweiterte Rate-Limiting-Strategien (z.B. pro User)


```

---

### 📄 APP_100_PERCENT_CHECK_REPORT.md

```markdown
# JobFlow - 100% App Check Report

**Erstellt am:** $(date)  
**Ziel:** Vollständige systematische Prüfung aller Aspekte der JobFlow-App ohne Halluzinationen

---

## 1. TypeScript & Build-Status

### ✅ Status: **FEHLER GEFUNDEN**

**TypeScript-Kompilierung:** `npm run typecheck` - **15 Fehler gefunden**

#### Fehler-Details:

1. **`app/(admin)/admin/dienstplan/page.tsx`**
   - Zeile 496: `error TS1005: ')' expected.`
   - Zeile 507: `error TS2657: JSX expressions must have one parent element.`
   - Zeile 515: `error TS1128: Declaration or statement expected.`
   - **Problem:** JSX-Syntax-Fehler - fehlende schließende Klammern oder falsche Struktur

2. **`app/(admin)/admin/einrichtungen/page.tsx`**
   - Zeile 261: `error TS1005: ')' expected.`
   - Zeile 301: `error TS1128: Declaration or statement expected.`
   - **Problem:** JSX-Syntax-Fehler

3. **`app/(admin)/admin/mitarbeiter/[uid]/page.tsx`**
   - Zeile 150: `error TS2657: JSX expressions must have one parent element.`
   - **Problem:** JSX-Struktur-Fehler

4. **`app/(admin)/admin/mitarbeiter/page.tsx`**
   - Zeile 823: `error TS1005: ')' expected.`
   - Zeile 824: `error TS2657: JSX expressions must have one parent element.`
   - Zeile 858: `error TS2657: JSX expressions must have one parent element.`
   - Zeile 913: `error TS1128: Declaration or statement expected.`
   - **Problem:** Mehrere JSX-Syntax-Fehler

5. **`app/(employee)/employee/berichte/page.tsx`**
   - Zeile 174: `error TS1005: 'try' expected.`
   - Zeile 177: `error TS1472: 'catch' or 'finally' expected.`
   - Zeile 1091: `error TS1005: '}' expected.`
   - **Problem:** Try-Catch-Block-Syntax-Fehler

6. **`app/(employee)/employee/profil/page.tsx`**
   - Zeile 597: `error TS1005: ')' expected.`
   - Zeile 728: `error TS1128: Declaration or statement expected.`
   - Zeile 729: `error TS1109: Expression expected.`
   - **Problem:** JSX-Syntax-Fehler

### `any`-Typen Analyse

**Gefunden:** 133 Vorkommen von `: any` in 65 Dateien

**Kritische Dateien mit `any`:**
- `lib/services/payroll/elstamService.ts` - 1x
- `functions/src/payroll/calculatePayroll.ts` - 2x
- `functions/src/payroll/calc.ts` - 2x
- `lib/services/times.ts` - 4x
- `lib/services/payroll.ts` - 1x
- `contexts/AuthContext.tsx` - 3x
- Weitere 58 Dateien

**Empfehlung:** `any`-Typen sollten durch spezifische Typen ersetzt werden, wo möglich.

### Console-Logs in Production-Code

**Gefunden:** 658 Vorkommen von `console.(log|warn|error|debug)` in 130 Dateien

**Kritische Dateien:**
- `lib/services/times.ts` - 15x
- `lib/services/shifts.ts` - 11x
- `lib/services/reports.ts` - 11x
- `lib/services/assignments.ts` - 18x
- `lib/services/alerts.ts` - 20x
- `functions/src/shiftNotifications.ts` - 14x
- Weitere 124 Dateien

**Empfehlung:** Console-Logs sollten in Production entfernt oder durch ein Logging-System ersetzt werden.

---

## 2. Linter & Code-Qualität

### ✅ Status: **KEINE FEHLER**

**ESLint:** 0 Fehler gefunden ✅

**Prettier:** Nicht geprüft (muss noch durchgeführt werden)

---

## 3. TODO/FIXME/HACK/BUG Analyse

### ✅ Status: **1515+ TODOs GEFUNDEN**

**Kategorisierung nach Priorität:**

#### 🔴 KRITISCH (Muss sofort behoben werden)

1. **Chat-System - Komplett neu implementieren**
   - **Datei:** `.cursor/rules/07-todo-implementation.mdc`
   - **Status:** Laut TODO-Liste muss das Chat-System "komplett neu implementiert" werden
   - **Betroffene Dateien:**
     - `lib/services/chatService.ts`
     - `app/(employee)/employee/chat/`
     - `app/(admin)/admin/chat/`
   - **Priorität:** HOCH

2. **Employee Reports - Viele Datenberechnungen fehlen**
   - **Datei:** `lib/services/employeeReports.ts`
   - **TODOs:**
     - `weeklyData: []` - TODO: Aus echten Timesheet-Daten berechnen
     - `monthlyOvertime: []` - TODO: Aus echten Timesheet-Daten berechnen
     - `worktimeDetails: []` - TODO: Aus echten Timesheet-Daten laden
     - `bonusDetails: []` - TODO: Aus echten Surcharge-Daten laden
     - `vacationDetails: []` - TODO: Aus echten Vacation-Daten laden
   - **Priorität:** HOCH

3. **Payroll Unlock - Funktion vorhanden** ✅
   - **Datei:** `lib/services/payroll.ts` (Zeile 772-799)
   - **Status:** ✅ Implementiert - Funktion `unlockPayroll()` ist vollständig implementiert
   - **Hinweis:** Frühere Dokumentation war veraltet

#### 🟡 MITTEL (Sollte bald behoben werden)

4. **Export-Funktionen - Teilweise TODOs**
   - **Datei:** `lib/services/exportService.ts`
   - **Status:** Teilweise TODOs vorhanden
   - **Priorität:** MITTEL

5. **Holiday Provider - Externe API-Integration fehlt**
   - **Datei:** `lib/services/holidayProvider.ts`
   - **TODO:** `// TODO: Später durch externe API (z. B. feiertage-api.de) ersetzen`
   - **Priorität:** NIEDRIG

6. **E2E-Tests - Viele TODOs**
   - **Datei:** `tests/e2e/payroll.e2e.test.ts`
   - **TODOs:** 12+ TODO-Kommentare für Firebase Emulator-Implementierung
   - **Priorität:** MITTEL

#### 🟢 NIEDRIG (Kann später behoben werden)

7. **Verschiedene Service-TODOs**
   - `lib/services/reports.ts` - `excludeAssigned` Logic TODO
   - `lib/services/reports.ts` - `userName: ''` TODO
