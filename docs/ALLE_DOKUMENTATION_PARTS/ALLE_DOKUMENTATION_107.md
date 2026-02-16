# JobFlow – Dokumentation Teil 107

*Zeichen 2106104–2125968 von 2862906*

---

  unemploymentInsurance: number; // Arbeitslosenversicherung AN
  incomeTax: number; // Lohnsteuer
  
  // Netto
  netSalary: number; // = grossSalary - alle Abzüge
  
  // Arbeitgeber-Kosten / Lohnnebenkosten
  employerSocialInsurance: number; // AG-Anteil Sozialversicherung (Gesamt)
  employerHealthInsurance: number; // AG-Anteil KV
  employerPensionInsurance: number; // AG-Anteil RV
  employerUnemploymentInsurance: number; // AG-Anteil ALV
  employerCareInsurance: number; // AG-Anteil PV
  employerAccidentInsurance: number; // Unfallversicherung (Berufsgenossenschaft)
  employerInsolvencyInsurance: number; // Insolvenzgeldumlage (0,06%)
  totalEmployerContributions: number; // = Summe aller Lohnnebenkosten (AG-Anteile + UV + Insolvenz)
  totalEmployerCost: number; // = grossSalary + totalEmployerContributions
  
  // Prüfung
  details?: Record<string, unknown>; // Zusätzliche Details (z.B. Steuerklasse, Kinder)
  calcLog?: Array<{ step: string; value: number; timestamp: Date }>; // Berechnungsschritte für Nachvollziehbarkeit
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indizes (Firestore):**
- `periodId` + `userId` (unique) - Ein Item pro Mitarbeiter pro Periode
- `periodId` + `employeeName` (asc) - Sortierung nach Name
- `userId` + `periodId` - Für Mitarbeiter-Historie

### 3.3 Bezugstabellen (read-only im Payroll-Kontext)

#### Collection `users`

**Relevante Felder:**
- `hourlyRate?: number` - Stundensatz (falls stündlich)
- `baseSalary?: number` - Monatsgehalt (falls monatlich)
- `status: 'active' | 'inactive'` - Nur aktive Mitarbeiter
- `role: 'admin' | 'dispatcher' | 'nurse'` - Für Zugriffskontrolle

#### Collection `timesheets`

**Relevante Felder:**
- `userId: string`
- `date: Date` - Datum der Zeiterfassung
- `totalHours: number` - Gesamtstunden
- `overtimeHours?: number` - Überstunden
- `nightHours?: number` - Nachtschicht-Stunden
- `weekendHours?: number` - Wochenend-Stunden
- `holidayHours?: number` - Feiertags-Stunden
- `status: 'draft' | 'submitted' | 'approved' | 'rejected'` - Nur `'approved'` fließt ein
- `approvedAt?: Date` - Freigabe-Zeitpunkt
- `approvedBy?: string` - Freigabe durch (Admin UID)

**Wichtig:** Nur Timesheets mit `status: 'approved'` werden für Payroll-Berechnung verwendet.

#### Collection `facilities` (optional)

**Relevante Felder:**
- `id: string` - Kostenstellen-ID
- `name: string` - Name der Einrichtung

---

## 4. Zuschlags- & Berechnungsregeln (konfigurierbar)

### 4.1 Regelkonfiguration

**Datei:** `lib/config/payrollRules.ts` (neu zu erstellen)

```typescript
export interface PayrollRules {
  // Basislohn
  defaultHourlyRate: number; // Default: 15.00 €/h (MUSS >= Mindestlohn sein!)
  defaultMonthlyHours: number; // Default: 160h/Monat
  
  // Mindestlohn (gesetzlich)
  minimumWage: number; // 12.82 €/h (ab 01.01.2025, MiLoG §1)
  minijobLimit: number; // 556 €/Monat (2025)
  midijobLimit: {
    lower: number; // 520.01 €/Monat
    upper: number; // 2000 €/Monat
  };
  
  // Überstunden (ArbZG)
  overtimeThreshold: {
    daily: number; // Default: 8h/Tag (§3 ArbZG)
    weekly: number; // Default: 40h/Woche (§3 ArbZG)
  };
  overtimeMultiplier: number; // Default: 1.25 (25% Zuschlag, tarifvertraglich)
  
  // Nachtzuschlag (ArbZG §6)
  nightShiftStart: string; // Default: "22:00" (gesetzlich)
  nightShiftEnd: string; // Default: "06:00" (gesetzlich)
  nightShiftSurchargePercent: number; // Default: 25% (tarifvertraglich)
  
  // Wochenendzuschlag
  weekendDays: number[]; // Default: [6, 0] (Samstag, Sonntag)
  weekendSurchargePercent: number; // Default: 20% (tarifvertraglich)
  
  // Feiertagszuschlag
  holidaySurchargePercent: number; // Default: 35% (tarifvertraglich)
  // Feiertage werden über Feiertags-Provider geladen
  
  // Reihenfolge der Berechnung
  calculationOrder: Array<'base' | 'overtime' | 'night' | 'weekend' | 'holiday'>;
  // Default: ['base', 'overtime', 'night', 'weekend', 'holiday']
  
  // Rundung
  roundHoursTo: number; // Default: 2 (Dezimalstellen)
  roundAmountsTo: number; // Default: 2 (Cent-Genauigkeit)
}
```

### 4.2 Berechnungslogik

**Reihenfolge:**

1. **Basislohn berechnen:**
   - Falls `hourlyRate` vorhanden: `baseSalary = hourlyRate × regularHours`
   - Falls `baseSalary` monatlich: `baseSalary` direkt verwenden

2. **Überstunden identifizieren:**
   - Tägliche Überstunden: Stunden > `overtimeThreshold.daily` pro Tag
   - Wöchentliche Überstunden: Stunden > `overtimeThreshold.weekly` pro Woche
   - `overtimeHours = max(dailyOvertime, weeklyOvertime)`

3. **Zuschläge berechnen (additiv):**
   - Nachtzuschlag: `nightHours × hourlyRate × (nightShiftSurchargePercent / 100)`
   - Wochenendzuschlag: `weekendHours × hourlyRate × (weekendSurchargePercent / 100)`
   - Feiertagszuschlag: `holidayHours × hourlyRate × (holidaySurchargePercent / 100)`
   - Überstundenzuschlag: `overtimeHours × hourlyRate × (overtimeMultiplier - 1)`

4. **Brutto berechnen:**
   - `grossSalary = baseSalary + overtimeAmount + nightShiftAmount + weekendAmount + holidayAmount + bonuses - deductions`

5. **Steuern & Sozialversicherung:**
   - Siehe `PayrollCalculationService` (`functions/src/payroll/payrollCalculationService.ts`)
   - Lohnsteuer: Abhängig von Steuerklasse, Jahresbrutto
   - Sozialversicherung: Beitragsbemessungsgrenzen berücksichtigen

6. **Netto berechnen:**
   - `netSalary = grossSalary - (alle Abzüge)`

7. **Arbeitgeber-Kosten:**
   - AG-Anteil Sozialversicherung (~18-20% vom Brutto)
   - `totalEmployerCost = grossSalary + (alle AG-Anteile)`

### 4.3 Perioden-Grenzen

- **Start/Ende inklusiv:** `startDate` und `endDate` sind Teil der Periode
- **Zeitzone:** Serverzeit (UTC), Konvertierung in Lokalzeit für Anzeige
- **Validierung:** `startDate <= endDate`, beide im selben Monat/Jahr

### 4.4 Feiertagskalender

**Provider:** `lib/services/holidayProvider.ts` (neu zu erstellen)

- Bundesweit geltende Feiertage
- Bundesland-spezifische Feiertage
- API-Integration möglich (z.B. `feiertage-api.de`)

---

## 5. Eingangsdaten & Validierung

### 5.1 Timesheet-Validierung

**Voraussetzungen für Payroll-Berechnung:**

1. **Status:** `status === 'approved'`
2. **Zeitspanne:** `date` liegt innerhalb von `[startDate, endDate]`
3. **Datenqualität:**
   - `endTime > startTime` (validiert in Timesheet-Service)
   - `breakMinutes >= 0`
   - `totalHours <= 24` (Tagesmaximum)
   - `totalHours >= 0`

**Aggregation:**
- Pro Mitarbeiter alle `approved` Timesheets im Zeitraum sammeln
- Stunden summieren: `totalHours`, `overtimeHours`, `nightHours`, `weekendHours`, `holidayHours`
- `bonuses` und `deductions` summieren

### 5.2 Benutzer-Validierung

**Voraussetzungen:**

1. **Status:** `status === 'active'`
2. **Lohnsatz vorhanden:** `hourlyRate` ODER `baseSalary` muss gesetzt sein
3. **Payroll-Daten:** `EmployeePayrollData` muss vorhanden sein (Steuerklasse, etc.)

### 5.3 Berechnungsvalidierung

**Nach Berechnung prüfen:**

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Fehler (blockierend):**
- `grossSalary <= 0`
- `netSalary < 0`
- `totalDeductions > grossSalary`
- `overtimeHours > 200` (Plausibilität)

**Warnungen (nicht blockierend):**
- `overtimeHours > 20` (ArbZG-Prüfung empfohlen)
- `workedHours > 200` (Sehr hohe Stunden)
- Keine Timesheets für aktiven Mitarbeiter

### 5.4 Rundung

- **Stunden:** 2 Dezimalstellen (z.B. `8.50`)
- **Beträge:** 2 Dezimalstellen, kaufmännisch gerundet (z.B. `1234.56` €)
- **Rundungsdifferenz:** Summe(Items) darf bis zu `0.01` € von Perioden-Totals abweichen

---

## 6. Prozess & Zustände

### 6.1 Status-Lebenszyklus

```
┌─────────┐
│  open   │ ← Periode erstellt
└────┬────┘
     │ calculatePayroll()
     ▼
┌──────────────┐
│ calculating  │ ← Berechnung läuft
└────┬─────────┘
     │ Erfolg
     ▼
┌─────────┐
│  ready  │ ← Ergebnis verfügbar, Prüfung möglich
└────┬────┘
     │ approvePayroll() (nur Admin)
     ▼
┌───────────┐
│ approved  │ ← Genehmigt, kann bezahlt werden
└────┬──────┘
     │ markAsPaid() (nur Admin)
     ▼
┌─────────┐
│  paid   │ ← Zahlung vermerkt
└────┬────┘
     │ lockPayroll() (nur Admin)
     ▼
┌──────────┐
│  locked  │ ← Gesperrt, keine Änderungen mehr
└──────────┘
```

### 6.2 Erlaubte Übergänge

| Von | Nach | Bedingung | Funktion |
|-----|------|-----------|----------|
| `open` | `calculating` | - | `calculatePayroll()` |
| `calculating` | `ready` | Berechnung erfolgreich | Automatisch |
| `calculating` | `open` | Berechnung fehlgeschlagen | Automatisch (Rollback) |
| `ready` | `approved` | Admin-Berechtigung | `approvePayroll()` |
| `approved` | `paid` | Admin-Berechtigung | `markAsPaid()` |
| `paid` | `locked` | Admin-Berechtigung | `lockPayroll()` |
| `locked` | `open` | Admin-Berechtigung | `unlockPayroll()` |

### 6.3 UI-Verhalten pro Status

- **open**: Button "Berechnen" aktiv
- **calculating**: Loading-Spinner, alle Buttons deaktiviert
- **ready**: Buttons "Genehmigen", "Zurück auf open", "Exporte" aktiv
- **approved**: Buttons "Als bezahlt markieren", "Sperren", "Exporte" aktiv
- **paid**: Button "Sperren" aktiv
- **locked**: Keine Aktionen möglich (außer Admin-Entsperrung)

---

## 7. UI/UX (Admin)

### 7.1 Dashboard-Seite

**Route:** `/admin/lohnabrechnung`

**Komponenten:**

1. **KPI-Karten (oben):**
   - Anzahl Mitarbeiter (gesamt/aktive)
   - Gesamt Brutto (letzte 12 Monate)
   - Gesamt Netto (letzte 12 Monate)
   - Gesamt AG-Kosten / Lohnnebenkosten (letzte 12 Monate)
   - **Detaillierte Lohnnebenkosten-Karte (nur Admin):**
     - AG-Anteil Krankenversicherung
     - AG-Anteil Rentenversicherung
     - AG-Anteil Arbeitslosenversicherung
     - AG-Anteil Pflegeversicherung
     - Unfallversicherung (Berufsgenossenschaft)
     - Insolvenzgeldumlage
     - Gesamt Lohnnebenkosten

2. **Perioden-Tabelle:**
   - Spalten: Jahr/Monat, Status (Badge), Mitarbeiter#, Brutto, Netto, AG-Kosten (Gesamt), **Lohnnebenkosten-Detail (erweiterbar)**, Aktionen
   - **Lohnnebenkosten-Detail (nur Admin, erweiterbar):**
     - Expandable-Row mit Lohnnebenkosten-Aufschlüsselung
     - AG-Anteil KV, RV, ALV, PV
     - Unfallversicherung
     - Insolvenzgeldumlage
     - Summe Lohnnebenkosten
   - Sortierung: Neueste zuerst
   - Filter: Status, Jahr, Monat
   - Pagination: 20 Zeilen pro Seite

3. **Aktions-Buttons (pro Zeile):**
   - "Berechnen" (wenn `status === 'open'`)
   - "Genehmigen" (wenn `status === 'ready'`)
   - "Als bezahlt" (wenn `status === 'approved'`)
   - "Sperren" (wenn `status === 'paid'`)
   - "Entsperren" (wenn `status === 'locked'`, nur Admin)
   - "Export DATEV" (wenn `status >= 'ready'`)
   - "Export PDF" (wenn `status >= 'ready'`)
   - "Details" (öffnet Modal mit Items-Liste)

### 7.2 Dialoge

**Berechnen-Dialog:**
- Text: "Möchten Sie die Lohnabrechnung für [Jahr/Monat] berechnen? Dies kann einige Minuten dauern."
- Button: "Ja, berechnen" / "Abbrechen"

**Genehmigen-Dialog:**
- Text: "Möchten Sie die Lohnabrechnung für [Jahr/Monat] genehmigen? Nach der Genehmigung können keine Änderungen mehr vorgenommen werden."
- Optional: Notiz-Feld
- Button: "Ja, genehmigen" / "Abbrechen"

**Sperren-Dialog:**
- Text: "Möchten Sie die Periode [Jahr/Monat] sperren? Gesperrte Perioden können nur von Administratoren entsperrt werden."
- Button: "Ja, sperren" / "Abbrechen"

### 7.3 Fehlerbehandlung

**Toasts/Notifications:**
- Erfolg: "Lohnabrechnung erfolgreich berechnet" (grün)
- Fehler: "Fehler bei Berechnung: [Fehlermeldung]" (rot)
- Warnung: "Berechnung abgeschlossen, aber Warnungen vorhanden" (gelb)

**Fehlermeldungen:**
- "Keine freigegebenen Zeiterfassungen für diesen Zeitraum gefunden"
- "Berechnung fehlgeschlagen: [Detaillierte Fehlermeldung]"
- "Berechtigung verweigert: Nur Administratoren können diese Aktion ausführen"

### 7.4 Items-Detailansicht

**Modal/Drawer mit:**
- Tabelle aller `PayrollItem` für die Periode
- **Standard-Spalten:** Name, Brutto, Netto, AG-Kosten (Gesamt)
- **Erweiterte Ansicht (nur Admin, umschaltbar):**
  - Toggle-Button: "Lohnnebenkosten-Detail anzeigen/ausblenden"
  - **Lohnnebenkosten-Spalten:**
    - AG-Anteil KV
    - AG-Anteil RV
    - AG-Anteil ALV
    - AG-Anteil PV
    - Unfallversicherung
    - Insolvenzgeldumlage
    - **Gesamt Lohnnebenkosten** (fett hervorgehoben)
  - Gesamt AG-Kosten (Brutto + Lohnnebenkosten)
- Sortierbar, filterbar
- Export-Funktion (CSV) - inkl. Lohnnebenkosten-Detail für Admin

---

## 8. Exporte

### 8.1 DATEV CSV Export

**Format:** DATEV-konformes CSV

**Implementierung:** `payrollService.generateDATEVExport(periodId)`

**Dateiname:** `DATEV_Lohnbuchhaltung_[Jahr]_[Monat].csv`

**Inhalt:**
- Header: DATEV-Version, Firmendaten, Periode
- Zeilen: Pro Mitarbeiter eine Zeile mit:
  - Personalnummer
  - Name
  - Bruttolohn
  - Nettolohn
  - Steuerklasse
  - Sozialversicherungsbeiträge
  - Lohnsteuer
- Footer: Anzahl Records, Export-Datum/Zeit

**DATEV-Konten:**
- 7000: Lohnkosten (Brutto)
- 1200: Bank (Gegenkonto)
- 6020: AG-Anteile Sozialversicherung

**Cloud Function:** `functions/src/payroll/datevExportService.ts`

### 8.2 PDF Export

**Format:** PDF (A4)

**Implementierung:** `payrollService.generatePDF(periodId)`

**Dateiname:** `Lohnabrechnung_[Jahr]_[Monat].pdf`

**Inhalt:**
- Deckblatt: Firmenlogo, Periode, Status
- Zusammenfassung: Totals (Brutto, Netto, AG-Kosten, Mitarbeiter)
- **Lohnnebenkosten-Übersicht (nur Admin-Version):**
  - Detaillierte Aufstellung aller AG-Kosten-Komponenten
- Detailtabelle: Alle Items mit Stunden, Sätzen, Beträgen
- Footer: Erstellt am, Status, Seitenzahl

**Cloud Function:** `functions/src/payroll/payrollPDFService.ts`

**Bibliothek:** `@react-pdf/renderer` oder `pdf-lib`

### 8.3 CSV Detail Export

**Format:** CSV (UTF-8)

**Dateiname:** `Lohnabrechnung_Detail_[Jahr]_[Monat].csv`

**Spalten:**
- Mitarbeiter-ID, Name
- Basis-Stunden, Überstunden, Nacht-Stunden, Wochenend-Stunden, Feiertags-Stunden
- Basis-Lohn, Überstunden-Betrag, Nacht-Betrag, Wochenend-Betrag, Feiertags-Betrag
- Boni, Abzüge
- Brutto, Netto, AG-Kosten (Gesamt)
- Alle Abzüge im Detail
- **Lohnnebenkosten-Detail (nur in Admin-Export):**
  - AG-Anteil KV, RV, ALV, PV
  - Unfallversicherung
  - Insolvenzgeldumlage
  - Gesamt Lohnnebenkosten

---

## 9. Security & Compliance

### 9.1 Firestore Security Rules

**Aktuelle Rules:** `firestore.rules` (noch sehr permissiv - MUSS erweitert werden!)

**Ziel-Rules für Payroll:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper-Funktionen
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isDispatcher() {
      return isAuthenticated() && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'dispatcher' ||
        isAdmin()
      );
    }
    
    // payrollPeriods
    match /payrollPeriods/{periodId} {
      allow read: if isDispatcher();
      allow create: if isDispatcher();
      allow update: if isDispatcher() && (
        // Status-Übergänge
        request.resource.data.status in ['calculating', 'ready', 'approved', 'paid', 'locked'] &&
        // Lock nur Admin
        (request.resource.data.status != 'locked' || isAdmin())
      );
      allow delete: if isAdmin();
    }
    
    // payrollItems
    match /payrollItems/{itemId} {
      allow read: if isDispatcher();
      // Write nur via Cloud Function (wird serverseitig geprüft)
      allow write: if false; // Explizit gesperrt - nur CF
    }
    
    // payrollAuditLogs
    match /payrollAuditLogs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Nur CF kann schreiben
    }
    
    // employeePayrollData (sensible Daten)
    match /employeePayrollData/{employeeId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

### 9.2 Cloud Functions Sicherheit

**Alle Callable Functions prüfen:**

```typescript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
}

const user = await db.collection('users').doc(context.auth.uid).get();
const role = user.data()?.role;

if (role !== 'admin' && role !== 'dispatcher') {
  throw new functions.https.HttpsError('permission-denied', 'Access denied');
}
```

**Admin-only Functions:**
- `approvePayroll`
- `lockPayroll`
- `unlockPayroll`

**Dispatcher+Admin Functions:**
- `calculatePayroll`
- `generatePayslipPDF`
- `generateDATEVExport`

### 9.3 Audit-Logging

**Cloud Functions:** `functions/src/payroll/auditLogging.ts`

**Geloggte Aktionen:**
- Erstellen/Ändern/Löschen von `PayrollPeriod`
- Erstellen/Ändern von `PayrollItem`
- Status-Änderungen
- PDF-Downloads
- DATEV-Exports
- Datenzugriffe (wenn aktiviert)

**Log-Struktur:**
```typescript
interface PayrollAuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'calculate' | 'approve' | 'export' | 'download';
  resourceType: 'payroll_period' | 'payroll_item' | 'payroll_calculation';
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

**Aufbewahrung:** 10 Jahre (GoBD)

### 9.4 Verschlüsselung sensibler Daten

**Client-seitige Verschlüsselung:**
- IBAN: AES-256 verschlüsselt
- Sozialversicherungsnummer: AES-256 verschlüsselt
- Steuer-ID: AES-256 verschlüsselt

**Implementierung:** Crypto-JS oder Web Crypto API

**Anzeige:** Maskiert (z.B. `DE** **** **** 1234`)

### 9.5 DSGVO-Compliance

- **Rechtmäßigkeit:** Datenverarbeitung nur für Lohnabrechnung
- **Speicherbegrenzung:** Daten werden nach gesetzlicher Aufbewahrungsfrist gelöscht
- **Betroffenenrechte:** Auskunft, Löschung, Portabilität (Export-Funktion)
- **Datenschutz durch Technikgestaltung:** Verschlüsselung, Zugriffskontrolle

---

## 10. Performance & Stabilität

### 10.1 Berechnungs-Performance

**Client vs. Server:**

- **Client-seitig** (`lib/services/payroll.ts`): Für kleine Perioden (< 50 Mitarbeiter)
- **Cloud Function** (`functions/src/payroll/calc.ts`): Für große Perioden (≥ 50 Mitarbeiter)

**Schwellwert:** Konfigurierbar, Default: 50 Mitarbeiter

**Cloud Function Timeout:**
- Max. Laufzeit: 540 Sekunden (9 Minuten)
- Für sehr große Perioden: Batch-Processing

### 10.2 Batch-Processing

**Für Perioden > 200 Mitarbeiter:**

1. Mitarbeiter in Batches von 50 aufteilen
2. Pro Batch: Berechnung, Items speichern
3. Nach allen Batches: Totals aggregieren
4. Status auf `ready` setzen

### 10.3 Caching & React Query

**Client-seitig:**

```typescript
const { data: periods } = useQuery({
  queryKey: ['payrollPeriods'],
  queryFn: () => payrollService.getAll(),
  staleTime: 30000, // 30 Sekunden
  cacheTime: 300000, // 5 Minuten
});
```

**Invalidierung:**
- Nach Berechnung: `queryClient.invalidateQueries(['payrollPeriods'])`
- Nach Status-Änderung: `queryClient.invalidateQueries(['payrollPeriods', periodId])`

### 10.4 Pagination

**Items-Liste:**
- Default: 50 Items pro Seite
- Firestore `limit()` + `startAfter()` für Pagination
- Virtuelles Scrolling für große Listen

### 10.5 Retry-Strategie

**Bei Cloud Function Fehlern:**
- 3 Retries mit exponentieller Backoff (1s, 2s, 4s)
- UI zeigt Fortschritt während Retries

### 10.6 UI-Feedback

**Während Berechnung:**
- Loading-Spinner
- Fortschrittsanzeige (falls verfügbar)
- "Berechnung läuft..." Toast
- Alle kritischen Buttons deaktiviert

---

## 11. Monitoring

### 11.1 Cloud Logging

**Logs pro Berechnung:**

```typescript
console.log('Payroll calculation started', {
  periodId,
  employeeCount,
  startTime: new Date().toISOString(),
});

console.log('Payroll calculation completed', {
  periodId,
  employeeCount,
  duration: Date.now() - startTime,
  success: true,
});
```

**Log-Level:**
