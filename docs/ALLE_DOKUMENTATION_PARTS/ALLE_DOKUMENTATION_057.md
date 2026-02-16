# JobFlow – Dokumentation Teil 57

*Zeichen 1112721–1132608 von 2862906*

---

- `firebase/firestore` - Datenbank
- `firebase-functions` - Cloud Functions
- `@react-pdf/renderer` oder `pdf-lib` - PDF-Generierung
- `react-query` oder `@tanstack/react-query` - Caching/State
- `crypto-js` - Verschlüsselung (optional)

### 15.3 Datenbank-Indizes

**Firestore Indexes** (`firestore.indexes.json`):

```json
{
  "indexes": [
    {
      "collectionGroup": "payrollPeriods",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "year", "order": "DESCENDING" },
        { "fieldPath": "month", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "payrollItems",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "periodId", "order": "ASCENDING" },
        { "fieldPath": "employeeName", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "payrollItems",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "periodId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 16. Changelog & Versionierung

### Version 1.0 (Aktuell)

- Basis-Funktionalität: Perioden, Berechnung, Genehmigung
- DATEV-Export (CSV)
- PDF-Export
- Audit-Logging
- Firestore Rules (Grundgerüst)

### Geplante Erweiterungen

- Automatische monatliche Berechnung (Scheduled Function)
- Batch-PDF-Generierung
- Feiertags-Provider (Bundesland-spezifisch)
- Erweiterte Reports/Analytics
- Multi-Mandanten-Fähigkeit

---

**Dokumentationsstand:** 2025-01  
**Letzte Aktualisierung:** 2025-01  
**Nächste Review:** Q2 2025

```

---

### 📄 payroll.todo.md

```markdown
# Payroll – To-Do (Implementierungsplan)

**Version:** 1.0  
**Ziel:** Vollständige Implementierung des Payroll-Moduls  
**Priorität:** Hoch  
**Geschätzte Dauer:** 4-6 Wochen (abhängig von Team-Größe)

---

## Phase 1: Konfiguration & Grundlagen

### 1.1 Regelkonfiguration

- [ ] **Datei erstellen:** `lib/config/payrollRules.ts`
  - [ ] Interface `PayrollRules` definieren
  - [ ] Default-Werte setzen (siehe Requirements Abschnitt 4.1)
  - [ ] Export-Funktion: `getPayrollRules(): PayrollRules`
  - [ ] Validierung: Prüfen auf gültige Werte (z.B. Prozentwerte 0-100)

- [ ] **Feiertags-Provider (Stub):**
  - [ ] Datei erstellen: `lib/services/holidayProvider.ts`
  - [ ] Interface: `HolidayProvider`
  - [ ] Funktion: `getHolidays(year: number, state?: string): Promise<Date[]>`
  - [ ] Stub-Implementierung: Bundesweite Feiertage hardcoded
  - [ ] TODO-Kommentar: "Später: API-Integration (z.B. feiertage-api.de)"

### 1.2 Validierung & Utilities

- [ ] **Validierungs-Helpers:**
  - [ ] Datei: `lib/validation/payrollValidation.ts`
  - [ ] Funktion: `validatePayrollPeriod(period: PayrollPeriod): ValidationResult`
  - [ ] Funktion: `validatePayrollItem(item: PayrollItem): ValidationResult`
  - [ ] Funktion: `validateTimesheet(timesheet: Timesheet): ValidationResult`
  - [ ] Rundungs-Helper: `roundTo2Decimals(value: number): number`

---

## Phase 2: Datenwege & Services

### 2.1 Timesheet-Integration

- [ ] **Erweitern:** `lib/services/timesheets.ts`
  - [ ] Funktion: `getByDateRange(uid?: string, start: Date, end: Date, approvedOnly: boolean = true): Promise<Timesheet[]>`
  - [ ] Filter: Nur `status === 'approved'`
  - [ ] Aggregation: Summiere Stunden pro Mitarbeiter
  - [ ] Validierung: Keine überlappenden Zeiten
  - [ ] Fehlerbehandlung: Klare Fehlermeldungen

**Code-Referenz:** Aktuell existiert `timesheetService.getByUserId()` - erweitern um Datumsfilter

### 2.2 User-Integration

- [ ] **Erweitern:** `lib/services/users.ts` (falls vorhanden) oder `payrollService.getActiveEmployees()`
  - [ ] Funktion: `getActiveEmployees(): Promise<Employee[]>`
  - [ ] Filter: Nur `status === 'active'`
  - [ ] Felder: `id`, `name`, `hourlyRate`, `baseSalary`, `role`
  - [ ] Validierung: Mindestens einer der Lohnsätze muss gesetzt sein

**Code-Referenz:** `payrollService.getActiveEmployees()` existiert bereits - prüfen ob Erweiterung nötig

### 2.3 Facilities (optional)

- [ ] **Erweitern:** `lib/services/facilities.ts` (falls vorhanden)
  - [ ] Funktion: `getById(id: string): Promise<Facility | null>`
  - [ ] Optional: Kostenstellen-Zuordnung für `PayrollItem.facilityId`

---

## Phase 3: Berechnungs-Engine

### 3.1 Cloud Function: Berechnung

- [ ] **Datei erstellen/erweitern:** `functions/src/payroll/calc.ts`
  
  **Schritte:**
  
  - [ ] **Input-Validierung:**
    - [ ] Prüfen: `periodId` vorhanden
    - [ ] Prüfen: Periode existiert in Firestore
    - [ ] Prüfen: Periode-Status ist `open` oder `ready`
    - [ ] Prüfen: Benutzer-Berechtigung (admin/disponent)
  
  - [ ] **Daten laden:**
    - [ ] Periode laden: `payrollPeriods/{periodId}`
    - [ ] Aktive Mitarbeiter laden
    - [ ] Timesheets laden: `getByDateRange(start, end, approvedOnly=true)`
  
  - [ ] **Berechnung pro Mitarbeiter:**
    - [ ] Loop über alle Mitarbeiter
    - [ ] Für jeden Mitarbeiter:
      - [ ] Timesheets aggregieren (Stunden summieren)
      - [ ] Basislohn berechnen
      - [ ] Überstunden identifizieren (siehe Requirements 4.2)
      - [ ] Zuschläge berechnen (Nacht, Wochenende, Feiertag)
      - [ ] Brutto berechnen
      - [ ] Steuern & Sozialversicherung berechnen (nutze `PayrollCalculationService`)
      - [ ] Netto berechnen
      - [ ] **Lohnnebenkosten berechnen:**
        - [ ] AG-Anteil KV, RV, ALV, PV
        - [ ] Unfallversicherung (Berufsgenossenschaft, ~1,3% vom Brutto)
        - [ ] Insolvenzgeldumlage (0,06% vom Brutto)
        - [ ] `totalEmployerContributions` = Summe aller Lohnnebenkosten
      - [ ] `totalEmployerCost` = Brutto + Lohnnebenkosten berechnen
      - [ ] `PayrollItem` erstellen (inkl. aller Lohnnebenkosten-Felder)
      - [ ] `PayrollItem` in Firestore speichern
  
  - [ ] **Totals aggregieren:**
    - [ ] Summe aller `grossSalary`
    - [ ] Summe aller `netSalary`
    - [ ] Summe aller `totalEmployerContributions` (Lohnnebenkosten)
    - [ ] Summe aller `totalEmployerCost` (Brutto + Lohnnebenkosten)
    - [ ] **Detaillierte Lohnnebenkosten-Totals:**
      - [ ] Summe AG-Anteil KV, RV, ALV, PV
      - [ ] Summe Unfallversicherung
      - [ ] Summe Insolvenzgeldumlage
    - [ ] Anzahl Mitarbeiter
  
  - [ ] **Status aktualisieren:**
    - [ ] Periode-Status auf `ready` setzen
    - [ ] `calculatedAt` Timestamp setzen
    - [ ] Totals in Periode speichern
  
  - [ ] **Fehlerbehandlung:**
    - [ ] Try-Catch um gesamte Funktion
    - [ ] Bei Fehler: Status zurück auf `open`
    - [ ] Fehler in Firestore loggen
    - [ ] Cloud Logging für Debugging

**Code-Referenz:** 
- `functions/src/payroll/calculateMonthlyPayroll.ts` (existiert, kann als Vorlage dienen)
- `functions/src/payroll/payrollCalculationService.ts` (Berechnungslogik)

### 3.2 Client-Trigger

- [ ] **Erweitern:** `lib/services/payroll.ts` → `calculatePayroll()`
  
  **Logik:**
  - [ ] Prüfen: Anzahl Mitarbeiter in Periode
  - [ ] Wenn < 50: Client-seitig berechnen (bestehende Logik nutzen)
  - [ ] Wenn ≥ 50: Cloud Function aufrufen
  - [ ] Loading-State setzen
  - [ ] Fortschritt anzeigen (falls verfügbar)
  - [ ] Fehlerbehandlung

**Code-Referenz:** `payrollService.calculatePayroll()` existiert bereits - erweitern um CF-Aufruf

### 3.3 Berechnungs-Helpers

- [ ] **Erweitern:** `lib/services/payroll/payrollCalculation.ts`
  
  - [ ] Funktion: `calculateBaseSalary(employee: Employee, regularHours: number): number`
  - [ ] Funktion: `calculateOvertimeHours(timesheets: Timesheet[], rules: PayrollRules): number`
  - [ ] Funktion: `calculateSurcharge(hours: number, rate: number, surchargePercent: number): number`
  - [ ] Funktion: `aggregateTimesheets(timesheets: Timesheet[]): AggregatedTimeData`

---

## Phase 4: UI/Flows

### 4.1 Admin-Dashboard-Seite

- [ ] **Datei erstellen:** `app/(admin)/admin/lohnabrechnung/page.tsx`
  
  **Komponenten:**
  
  - [ ] **KPI-Karten:**
    - [ ] Komponente: `PayrollKPICards`
    - [ ] Daten: Aus `payrollService.getStatistics()`
    - [ ] Standard-Karten: Mitarbeiter, Brutto, Netto, AG-Kosten (Gesamt)
    - [ ] **Lohnnebenkosten-Detail-Karte (nur Admin, aufklappbar):**
      - [ ] AG-Anteil KV, RV, ALV, PV
      - [ ] Unfallversicherung
      - [ ] Insolvenzgeldumlage
      - [ ] Gesamt Lohnnebenkosten
    - [ ] Design: Material-UI Cards, responsive
  
  - [ ] **Perioden-Tabelle:**
    - [ ] Komponente: `PayrollPeriodsTable`
    - [ ] Spalten: Jahr/Monat, Status, Mitarbeiter#, Brutto, Netto, AG-Kosten (Gesamt), **Lohnnebenkosten-Detail (erweiterbar)**, Aktionen
    - [ ] **Lohnnebenkosten-Detail (nur Admin, erweiterbar):**
      - [ ] Expandable-Row mit Lohnnebenkosten-Aufschlüsselung
      - [ ] AG-Anteil KV, RV, ALV, PV
      - [ ] Unfallversicherung
      - [ ] Insolvenzgeldumlage
      - [ ] Summe Lohnnebenkosten
    - [ ] Sortierung: Neueste zuerst
    - [ ] Filter: Status-Dropdown, Jahr/Monat-Select
    - [ ] Pagination: 20 Zeilen pro Seite
    - [ ] Status-Badges: Farbcodiert (open=grau, calculating=gelb, ready=blau, approved=grün, paid=orange, locked=rot)
  
  - [ ] **Aktions-Buttons:**
    - [ ] Pro Zeile: Context-Menu oder Action-Buttons
    - [ ] Buttons je nach Status aktivieren/deaktivieren
    - [ ] Icons: Material-UI Icons
  
  - [ ] **Layout:**
    - [ ] Responsive Design (Mobile, Tablet, Desktop)
    - [ ] Loading-States
    - [ ] Error-Handling mit Toasts

### 4.2 Dialoge

- [ ] **Berechnen-Dialog:**
  - [ ] Komponente: `CalculatePayrollDialog`
  - [ ] Props: `periodId`, `onConfirm`, `onCancel`
  - [ ] Text: "Möchten Sie die Lohnabrechnung für [Jahr/Monat] berechnen?"
  - [ ] Button: "Ja, berechnen" (primär), "Abbrechen" (sekundär)
  
- [ ] **Genehmigen-Dialog:**
  - [ ] Komponente: `ApprovePayrollDialog`
  - [ ] Props: `periodId`, `onConfirm`, `onCancel`
  - [ ] Text: Warnung über Irreversibilität
  - [ ] Optional: Notiz-Textfeld
  - [ ] Button: "Ja, genehmigen" (primär), "Abbrechen" (sekundär)
  
- [ ] **Sperren-Dialog:**
  - [ ] Komponente: `LockPayrollDialog`
  - [ ] Props: `periodId`, `onConfirm`, `onCancel`
  - [ ] Text: Warnung über Sperrung
  - [ ] Button: "Ja, sperren" (primär), "Abbrechen" (sekundär)

### 4.3 Items-Detailansicht

- [ ] **Modal/Drawer:**
  - [ ] Komponente: `PayrollItemsDetail`
  - [ ] Props: `periodId`, `open`, `onClose`
  - [ ] Tabelle: Alle `PayrollItem` für Periode
  - [ ] **Standard-Spalten:** Name, Brutto, Netto, AG-Kosten (Gesamt)
  - [ ] **Erweiterte Ansicht (nur Admin, umschaltbar):**
    - [ ] Toggle-Button: "Lohnnebenkosten-Detail anzeigen"
    - [ ] **Lohnnebenkosten-Spalten:**
      - [ ] AG-Anteil KV
      - [ ] AG-Anteil RV
      - [ ] AG-Anteil ALV
      - [ ] AG-Anteil PV
      - [ ] Unfallversicherung
      - [ ] Insolvenzgeldumlage
      - [ ] Gesamt Lohnnebenkosten (fett hervorgehoben)
    - [ ] Gesamt AG-Kosten (Brutto + Lohnnebenkosten)
  - [ ] Sortierbar, filterbar
  - [ ] Export-Button: CSV-Download (inkl. Lohnnebenkosten-Detail für Admin)

### 4.4 Export-Funktionalität

- [ ] **DATEV-Export:**
  - [ ] Button in Perioden-Tabelle
  - [ ] Aufruf: `payrollService.generateDATEVExport(periodId)`
  - [ ] Blob-URL → automatischer Download
  - [ ] Toast: "DATEV-Export erfolgreich"
  
- [ ] **PDF-Export:**
  - [ ] Button in Perioden-Tabelle
  - [ ] Aufruf: `payrollService.generatePDF(periodId)`
  - [ ] Blob-URL → automatischer Download
  - [ ] Toast: "PDF-Export erfolgreich"

**Code-Referenz:** `payrollService.generateDATEVExport()` und `generatePDF()` existieren bereits

- [ ] **Lohnnebenkosten-Report (nur Admin):**
  - [ ] Button in Admin-Dashboard: "Lohnnebenkosten-Report"
  - [ ] PDF/CSV-Export mit detaillierter Aufstellung
  - [ ] Aggregiert nach Periode oder Mitarbeiter
  - [ ] Alle Komponenten der Lohnnebenkosten aufgelistet (KV, RV, ALV, PV, UV, Insolvenz)

### 4.5 Error-Handling & Toasts

- [ ] **Toast-Notifications:**
  - [ ] Erfolg: Grün, 3 Sekunden
  - [ ] Fehler: Rot, 5 Sekunden
  - [ ] Warnung: Gelb, 4 Sekunden
  - [ ] Bibliothek: Material-UI Snackbar oder react-hot-toast

- [ ] **Fehlermeldungen:**
  - [ ] "Keine freigegebenen Zeiterfassungen gefunden"
  - [ ] "Berechnung fehlgeschlagen: [Detaillierte Meldung]"
  - [ ] "Berechtigung verweigert: Nur Administratoren können diese Aktion ausführen"

---

## Phase 5: Security

### 5.1 Firestore Security Rules

- [ ] **Datei erweitern:** `firestore.rules`
  
  **Regeln für Payroll:**
  
  - [ ] Helper-Funktionen: `isAuthenticated()`, `isAdmin()`, `isDispatcher()`
  - [ ] `payrollPeriods/{periodId}`:
    - [ ] Read: `isDispatcher()`
    - [ ] Create: `isDispatcher()`
    - [ ] Update: `isDispatcher()` + Status-Validierung
    - [ ] Delete: `isAdmin()`
  - [ ] `payrollItems/{itemId}`:
    - [ ] Read: `isDispatcher()`
    - [ ] Write: `false` (nur CF)
  - [ ] `payrollAuditLogs/{logId}`:
    - [ ] Read: `isAdmin()`
    - [ ] Write: `false` (nur CF)
  - [ ] `employeePayrollData/{employeeId}`:
    - [ ] Read: `isAdmin()`
    - [ ] Write: `isAdmin()`

**Code-Referenz:** Requirements Abschnitt 9.1

### 5.2 Cloud Functions Sicherheit

- [ ] **Alle Callable Functions prüfen:**
  - [ ] Authentifizierung: `if (!context.auth) throw ...`
  - [ ] Rolle prüfen: `if (role !== 'admin' && role !== 'dispatcher') throw ...`
  - [ ] Admin-only: Separate Prüfung für `approvePayroll`, `lockPayroll`, `unlockPayroll`

**Code-Referenz:** `functions/src/payroll/approvePayroll.ts` (existiert als Vorlage)

### 5.3 Audit-Logging

- [ ] **Erweitern:** `functions/src/payroll/auditLogging.ts`
  
  - [ ] Trigger: `logPayrollPeriodAuditEvent` (existiert bereits)
  - [ ] Trigger: `logPayrollItemAuditEvent` (neu)
  - [ ] Callable: `logPayslipAccess` (existiert bereits)
  - [ ] Callable: `logDATEVExport` (existiert bereits)
  - [ ] Callable: `logPDFDownload` (existiert bereits)

**Code-Referenz:** `functions/src/payroll/auditLogging.ts` existiert bereits - prüfen ob alle Events abgedeckt

### 5.4 Verschlüsselung (optional, später)

- [ ] **Client-seitige Verschlüsselung:**
  - [ ] Service: `lib/services/encryption.ts`
  - [ ] Funktionen: `encryptIBAN()`, `decryptIBAN()`, `encryptSVNumber()`, etc.
  - [ ] Bibliothek: Crypto-JS oder Web Crypto API
  - [ ] Schlüssel-Management: Umgebungsvariablen

**Priorität:** Niedrig (kann in späterem Sprint)

---

## Phase 6: Tests

### 6.1 Unit Tests

- [ ] **Datei:** `lib/services/payroll/__tests__/payrollCalculation.test.ts`
  
  - [ ] Test: `calculateBaseSalary()` - monatlich vs. stündlich
  - [ ] Test: `calculateOvertimeHours()` - täglich vs. wöchentlich
  - [ ] Test: `calculateSurcharge()` - Nacht, Wochenende, Feiertag
  - [ ] Test: `aggregateTimesheets()` - Summierung korrekt
  - [ ] Test: Rundung auf 2 Dezimalstellen

- [ ] **Datei:** `lib/services/payroll/__tests__/sumValidation.test.ts`
  
  - [ ] Test: Summe(Items) ≈ Perioden-Totals (Toleranz 0.01)
  - [ ] Test: Rundungsdifferenzen werden korrekt behandelt

- [ ] **Datei:** `lib/config/__tests__/payrollRules.test.ts`
  
  - [ ] Test: Default-Werte sind gültig
  - [ ] Test: Validierung wirft Fehler bei ungültigen Werten

### 6.2 Integration Tests

- [ ] **Datei:** `lib/services/payroll/__tests__/payrollIntegration.test.ts`
  
  - [ ] Test: Vollständige Berechnung für Test-Periode
  - [ ] Test: Alle Items werden erstellt
  - [ ] Test: Totals sind korrekt
  - [ ] Test: Status-Übergänge funktionieren

### 6.3 Smoke Tests

- [ ] **Datei:** `tests/e2e/payroll.test.ts`
  
  - [ ] Test: DATEV-Export erzeugt gültige CSV-Datei
  - [ ] Test: CSV hat korrekten Header
  - [ ] Test: CSV hat korrekte Anzahl Zeilen
  - [ ] Test: PDF-Export erzeugt gültige PDF-Datei
  - [ ] Test: PDF enthält erwartete Inhalte

### 6.4 E2E Tests (Playwright)

- [ ] **Datei:** `tests/e2e/payroll-workflow.spec.ts`
  
  - [ ] Test: Periode erstellen
  - [ ] Test: Berechnung starten
  - [ ] Test: Status "calculating" → "ready"
  - [ ] Test: Genehmigung (nur Admin)
  - [ ] Test: Export DATEV
  - [ ] Test: Export PDF

**Code-Referenz:** `tests/e2e/` Verzeichnis existiert bereits

---

## Phase 7: Monitoring & Performance

### 7.1 Cloud Logging

- [ ] **In Cloud Functions:**
  - [ ] Log: Berechnung gestartet (periodId, employeeCount, startTime)
  - [ ] Log: Berechnung abgeschlossen (periodId, duration, success)
  - [ ] Log: Fehler (periodId, error message, stack trace)
  - [ ] Log-Level: `INFO`, `WARN`, `ERROR`

### 7.2 Metriken (optional)

- [ ] **Firebase Console:**
  - [ ] Dashboard für Payroll-Metriken
  - [ ] Metriken: Berechnungsdauer, Fehlerrate, Anzahl Perioden
  - [ ] Alerts konfigurieren (Fehlerrate > 5%, Timeouts)

**Priorität:** Niedrig (kann in späterem Sprint)

### 7.3 Performance-Optimierung

- [ ] **Client-seitig:**
  - [ ] React Query: `staleTime` 30s, `cacheTime` 5min
  - [ ] Pagination für Items-Liste (50 pro Seite)
  - [ ] Virtuelles Scrolling für große Listen
  
- [ ] **Cloud Functions:**
  - [ ] Batch-Processing für > 200 Mitarbeiter
  - [ ] Retry-Strategie bei Fehlern
  - [ ] Timeout-Handling

---

## Phase 8: Rechtliche Compliance & Gesetzeskonformität

### 8.1 Mindestlohngesetz (MiLoG)

- [ ] **Validierung implementieren:**
  - [ ] Prüfung: Stundensatz ≥ 12,82 €/h (2025)
  - [ ] Fehler werfen bei Unterschreitung
  - [ ] Warnung in UI anzeigen
  - [ ] Dokumentation im Audit-Log

- [ ] **Minijob/Midijob-Unterstützung:**
  - [ ] Validierung: Minijob-Grenze (556 €/Monat)
  - [ ] Midijob-Grenzen (520,01 - 2.000 €/Monat)
  - [ ] Sonderregelungen für Minijobber

### 8.2 Arbeitszeitgesetz (ArbZG)

- [ ] **Validierung implementieren:**
  - [ ] Tägliche Arbeitszeit ≤ 8h (außer Überstunden)
  - [ ] Wöchentliche Arbeitszeit ≤ 40h (außer Überstunden)
  - [ ] Ruhezeiten ≥ 11h zwischen Schichten
  - [ ] Pausen ≥ 30min (bei >6h Arbeit)
  - [ ] Nachtarbeit identifizieren (22:00-06:00)

- [ ] **Warnungen:**
  - [ ] ArbZG-Verstoß-Warnung
  - [ ] Überschreitung Höchstarbeitszeit
  - [ ] Verstoß gegen Ruhezeiten

### 8.3 Lohnsteuerberechnung (BMF-konform)

- [ ] **Lohnsteuertabelle 2025:**
  - [ ] Grundfreibetrag: 11.908 € (2025)
  - [ ] Alle 6 Steuerklassen unterstützt
  - [ ] Progressionszonen korrekt
  - [ ] Kinderfreibetrag: 3.012 € pro Kind

- [ ] **Berechnung:**
  - [ ] Integration BMF-Lohnsteuertabelle (API oder interne Tabelle)
  - [ ] Solidaritätszuschlag: 5,5%
  - [ ] Kirchensteuer: 8-9% (je nach Bundesland)

- [ ] **WICHTIG:** Vereinfachte Berechnung ist nicht ausreichend!
  - [ ] Option 1: BMF-API-Integration
  - [ ] Option 2: Interne Tabelle nach BMF-Richtlinien (jährlich aktualisieren!)

### 8.4 Sozialversicherungsbeiträge 2025

- [ ] **Aktualisierte Werte:**
  - [ ] Beitragsbemessungsgrenzen 2025:
    - [ ] KV/PV: 4.987,50 €/Monat (unverändert)
    - [ ] RV/ALV: 7.050,00 €/Monat (vereinheitlicht, war 7.500€ West)
  - [ ] Beitragssätze 2025:
    - [ ] KV: 7,3% AN + 7,3% AG (+ Zusatzbeitrag)
    - [ ] RV: 9,3% AN + 9,3% AG
    - [ ] ALV: 1,2% AN + 1,2% AG
    - [ ] PV: 1,535% AN + 1,535% AG (bzw. 1,680% wenn kinderlos >23J)

- [ ] **Implementierung:**
  - [ ] `SOCIAL_INSURANCE_LIMITS_2025` aktualisieren
  - [ ] `SOCIAL_INSURANCE_RATES_2025` aktualisieren
  - [ ] Capping bei Bemessungsgrenzen
  - [ ] Pflegeversicherung: Erhöhung bei Kinderlosigkeit >23J

### 8.5 Entgeltsicherungsgesetz (EntgeltSiG)

- [ ] **Insolvenzgeldumlage:**
  - [ ] Berechnung: 0,06% vom Brutto
  - [ ] Nur AG-Kosten (kein AN-Abzug)
  - [ ] Ausweisung in `totalEmployerCost`
  - [ ] DATEV-Export: Konto 6020

### 8.6 Gewerbeordnung (GewO) - Pflichtangaben

- [ ] **PDF-Lohnabrechnung - Alle Pflichtangaben nach §108 GewO:**
  - [ ] Arbeitgeber: Name, Anschrift, Steuernummer
  - [ ] Arbeitnehmer: Name, Anschrift, Geburtsdatum, Steuer-ID, SV-Nr., Steuerklasse
  - [ ] Abrechnungszeitraum: Beginn, Ende, Zahlungszeitpunkt
  - [ ] Zusammensetzung: Brutto, Zuschläge, Zulagen, Boni
  - [ ] Abzüge: Lohnsteuer, Soli, Kirchensteuer, SV-Beiträge (gesplittet)
  - [ ] Auszahlungsbetrag: Netto, Auszahlungstag

- [ ] **Digitale Bereitstellung (BAG-konform):**
  - [ ] Passwortgeschütztes Mitarbeiterportal
  - [ ] Download/Print möglich
