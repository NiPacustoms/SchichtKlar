# JobFlow – Dokumentation Teil 56

*Zeichen 1092860–1112720 von 2862906*

---

- Beispiel: 1h Feiertag+Nacht+Überstunde = `hourlyRate × (1 + 0.25 + 0.35) × 1.25`

### 12.4 Nachträgliche Timesheet-Änderung

**Problem:** Timesheet nach Approval geändert

**Lösung:**
- Firestore Trigger: Wenn `timesheets/{id}` geändert wird und `status === 'approved'`:
  - Prüfen: Betrifft das eine `ready` oder `approved` Periode?
  - Periode-Status zurücksetzen auf `open` oder `ready`
  - Admin-Benachrichtigung: "Timesheet-Änderung erfordert Neuberechnung"

### 12.5 Negative Netto-Beträge

**Problem:** `netSalary < 0` durch hohe Abzüge

**Lösung:**
- Validierung: `netSalary` darf nicht negativ sein
- Falls negativ: Fehler werfen, Berechnung stoppen
- UI: "Berechnung fehlgeschlagen: Netto-Betrag ist negativ. Bitte prüfen Sie die Abzüge."

### 12.6 Sehr hohe Überstunden

**Problem:** `overtimeHours > 20` (ArbZG-Verstoß möglich)

**Lösung:**
- Warnung in `calcLog`, nicht blockierend
- UI-Warnung: "Hohe Überstundenanzahl - Bitte ArbZG-Prüfung durchführen"

### 12.7 Rundungsdifferenzen

**Problem:** Summe(Items) ≠ Perioden-Totals

**Lösung:**
- Toleranz: `0.01` €
- Falls größer: Fehler werfen
- In `calcLog` dokumentieren

---

## 13. Akzeptanzkriterien

### 13.1 Funktional

✅ Periodenstatus folgen erlaubten Übergängen (siehe Abschnitt 6.2)  
✅ Summen von Items == Perioden-Totals ± Rundungsdifferenz ≤ 0.01  
✅ Exporte öffnen/ladbar, Spalten korrekt, Umlaute UTF-8  
✅ Rechte greifen: nurse sieht keine Payroll  
✅ Nur `approved` Timesheets fließen in Berechnung ein  
✅ Berechnung für Perioden < 50 Mitarbeiter < 30 Sekunden  
✅ Berechnung für Perioden ≥ 50 Mitarbeiter via Cloud Function < 5 Minuten  

### 13.2 Nicht-Funktional

✅ Alle sensiblen Daten verschlüsselt (IBAN, SV-Nr., Steuer-ID)  
✅ Audit-Logs für alle kritischen Aktionen  
✅ GoBD-konforme Dokumentation (10 Jahre Aufbewahrung)  
✅ DSGVO-konforme Datenverarbeitung  
✅ UI-Response-Zeit < 1 Sekunde (ohne Berechnung)  
✅ Mobile-Responsive Design  

### 13.3 Testing

✅ Unit Tests: Zuschlag-Funktionen (Nacht/WE/Feiertag/Overtime)  
✅ Unit Tests: Summenbildung (Sum(items) ≈ totals)  
✅ Integration Tests: Vollständige Berechnung für Test-Perioden  
✅ Smoke Tests: Export-Datei Header + Anzahl Zeilen  
✅ E2E Tests: Perioden-Workflow (Erstellen → Berechnen → Genehmigen → Export)  

---

## 14. Rechtliche Compliance & Gesetzeskonformität

### 14.1 Überblick

Das System muss vollständig konform sein mit allen geltenden deutschen Gesetzen und Verordnungen. Diese Sektion dokumentiert alle relevanten Rechtsgrundlagen und deren Umsetzung.

### 14.2 Mindestlohngesetz (MiLoG)

**Rechtsgrundlage:** Gesetz zur Regelung eines allgemeinen Mindestlohns (MiLoG)

**Anforderungen:**

- **Mindestlohn 2025:** 12,82 €/Stunde (ab 01.01.2025)
- **Verdienstgrenze Minijob:** 556 €/Monat (2025)
- **Midijob-Grenzen:**
  - Untere Grenze: 520,01 €/Monat
  - Obere Grenze: 2.000 €/Monat

**Umsetzung im System:**

```typescript
// Validierung in calculateBaseSalary()
if (hourlyRate < MINIMUM_WAGE) {
  throw new Error(`Stundensatz ${hourlyRate}€ unterschreitet Mindestlohn ${MINIMUM_WAGE}€`);
}

// Minijob-Validierung
if (grossSalary <= MINIJOB_LIMIT && grossSalary > 0) {
  // Sonderregelungen für Minijobber anwenden
}
```

**Compliance-Check:**
- [ ] Stundensatz-Validierung: Kein Stundensatz < 12,82 €/h
- [ ] Automatische Warnung bei Unterschreitung
- [ ] Dokumentation der Validierung im Audit-Log

### 14.3 Arbeitszeitgesetz (ArbZG)

**Rechtsgrundlage:** Arbeitszeitgesetz (ArbZG)

**Anforderungen:**

- **Höchstarbeitszeit:** 8 Stunden täglich, 40 Stunden wöchentlich (§3 ArbZG)
- **Ruhezeit:** 11 Stunden ununterbrochene Ruhezeit zwischen Arbeitstagen (§5 ArbZG)
- **Ruhepausen:** Mindestens 30 Minuten bei Arbeitszeit > 6 Stunden, mindestens 45 Minuten bei Arbeitszeit > 9 Stunden (§4 ArbZG)
- **Nachtarbeit:** 22:00 - 06:00 Uhr (§2 ArbZG)
- **Sonn- und Feiertagsarbeit:** Grundsätzlich verboten, Ausnahmen für Pflege (§9-12 ArbZG)

**Umsetzung im System:**

- **Validierung in Timesheet-Service:**
  - Tägliche Arbeitszeit darf 8 Stunden nicht überschreiten (ohne Überstundenvereinbarung)
  - Wöchentliche Arbeitszeit darf 40 Stunden nicht überschreiten (ohne Überstundenvereinbarung)
  - Ruhezeiten zwischen Schichten prüfen
  - Nachtarbeit identifizieren (22:00-06:00)

- **Warnungen:**
  - Bei Überschreitung der Höchstarbeitszeit
  - Bei Verstoß gegen Ruhezeiten
  - Bei mehr als 10 Überstunden pro Woche

**Compliance-Check:**
- [ ] Validierung: Tägliche Arbeitszeit ≤ 8h (außer Überstunden)
- [ ] Validierung: Wöchentliche Arbeitszeit ≤ 40h (außer Überstunden)
- [ ] Validierung: Ruhezeiten ≥ 11h
- [ ] Validierung: Pausen ≥ 30min (bei >6h Arbeit)
- [ ] Warnung: Bei ArbZG-Verstößen

### 14.4 Entgeltsicherungsgesetz (EntgeltSiG)

**Rechtsgrundlage:** Gesetz zur Sicherung von Ansprüchen der Beschäftigten bei Zahlungsunfähigkeit des Arbeitgebers (EntgeltSiG)

**Anforderungen:**

- **Insolvenzgeldumlage:** 0,06% des Bruttolohns (2025)
- **Abzug:** Vom Arbeitgeber zu zahlen
- **Meldung:** Automatische Meldung an die Bundesagentur für Arbeit bei Insolvenz

**Umsetzung im System:**

```typescript
// In PayrollItem
employerInsolvencyInsurance: number; // 0.06% vom Brutto
totalEmployerCost = grossSalary + ... + employerInsolvencyInsurance;
```

**Compliance-Check:**
- [ ] Berechnung: Insolvenzgeldumlage (0,06% vom Brutto)
- [ ] Ausweisung in AG-Kosten
- [ ] DATEV-Export: Konto 6020

### 14.5 Betriebsverfassungsgesetz (BetrVG)

**Rechtsgrundlage:** Betriebsverfassungsgesetz (BetrVG)

**Anforderungen:**

- **Betriebsrat:** Informationsrecht bei Lohnabrechnungen (§80 BetrVG)
- **Einsichtsrecht:** Betriebsrat kann Einsicht in anonymisierte Lohnabrechnungen nehmen
- **Mitbestimmung:** Bei Einführung neuer Lohnabrechnungssysteme (§94 BetrVG)

**Umsetzung im System:**

- **Anonymisierte Reports:** Für Betriebsrat-Zugriff
- **Export-Funktion:** Aggregierte Daten ohne personenbezogene Identifikation

**Compliance-Check:**
- [ ] Anonymisierte Exporte für Betriebsrat möglich
- [ ] Keine Weitergabe personenbezogener Daten ohne Einwilligung

### 14.6 Steuerrechtliche Anforderungen

#### 14.6.1 Einkommensteuergesetz (EStG)

**Rechtsgrundlage:** Einkommensteuergesetz (EStG)

**Anforderungen:**

- **Lohnsteuerabzug:** Nach Maßgabe der Lohnsteuertabelle (§39a EStG)
- **Steuerklassen:** 6 Steuerklassen (§38b EStG)
- **Grundfreibetrag 2025:** 11.908 € (2025)
- **Progressionszonen:** Nach aktueller Einkommensteuertabelle
- **Kinderfreibetrag:** 3.012 € pro Kind (2025)
- **Solidaritätszuschlag:** 5,5% der Lohnsteuer (§51a EStG)
- **Kirchensteuer:** 8-9% der Lohnsteuer (je nach Bundesland)

**Umsetzung im System:**

**WICHTIG:** Vereinfachte Berechnung im Code ist nicht ausreichend! In Produktion muss die offizielle BMF-Lohnsteuertabelle verwendet werden.

```typescript
// OPTION 1: BMF-Lohnsteuertabelle via API
// Integration mit offizieller BMF-API oder DATEV-Service

// OPTION 2: Interne Lohnsteuertabelle (nach BMF-Richtlinien)
// Muss jährlich aktualisiert werden!
interface TaxTable {
  taxClass: 1 | 2 | 3 | 4 | 5 | 6;
  annualIncomeRange: { min: number; max: number };
  taxAmount: number;
}

// Berechnung nach Lohnsteuertabelle
const incomeTax = calculateIncomeTaxByTable(
  annualGross,
  taxClass,
  childAllowance,
  taxTable2025
);
```

**Lohnsteuertabelle 2025 (vereinfacht):**
- Grundfreibetrag: 11.908 €
- Progressionszone: 0% bis 42% Steuersatz
- Spitzensteuersatz: 42% (ab 66.761 €)
- Reichensteuer: 45% (ab 277.826 €)

**Compliance-Check:**
- [ ] Lohnsteuerberechnung nach aktueller BMF-Tabelle
- [ ] Alle 6 Steuerklassen unterstützt
- [ ] Kinderfreibetrag korrekt berücksichtigt
- [ ] Solidaritätszuschlag (5,5%) korrekt
- [ ] Kirchensteuer (8-9% je nach Bundesland)
- [ ] Jährliche Aktualisierung der Steuertabelle

#### 14.6.2 Lohnsteuer-Richtlinien (LStR)

**Rechtsgrundlage:** Lohnsteuer-Richtlinien (LStR) des Bundesministeriums der Finanzen

**Anforderungen:**

- **Lohnsteuerabzugsverfahren:** Nach LStR
- **Bescheinigung:** Lohnsteuerbescheinigung (§41b EStG)
- **Meldungen:** ELStAM (Elektronische Lohnsteuerabzugsmerkmale)
- **Aufbewahrung:** 6 Jahre (§147 AO)

**Compliance-Check:**
- [ ] ELStAM-Abfrage (falls integriert)
- [ ] Lohnsteuerbescheinigung generierbar
- [ ] Aufbewahrung 6 Jahre

### 14.7 Sozialversicherungsrecht

#### 14.7.1 Sozialversicherungsbeiträge 2025

**Rechtsgrundlage:** Sozialgesetzbuch (SGB) IV, V, VI, XI

**Beitragssätze 2025:**

| Versicherung | AN-Anteil | AG-Anteil | Gesamt | Bemessungsgrenze |
|--------------|-----------|-----------|--------|------------------|
| **Krankenversicherung** | 7,3% + Zusatzbeitrag | 7,3% + Zusatzbeitrag | 14,6% + Zusatzbeitrag | 4.987,50 €/Monat |
| **Rentenversicherung** | 9,3% | 9,3% | 18,6% | 7.050,00 €/Monat (West/Ost vereinheitlicht) |
| **Arbeitslosenversicherung** | 1,2% | 1,2% | 2,4% | 7.050,00 €/Monat (West/Ost vereinheitlicht) |
| **Pflegeversicherung** | 1,535% | 1,535% | 3,07% | 4.987,50 €/Monat |
| **Pflegeversicherung (kinderlos, >23J)** | 1,680% | 1,535% | 3,215% | 4.987,50 €/Monat |

**WICHTIG 2025:**
- Beitragsbemessungsgrenzen Ost/West wurden vereinheitlicht!
- Neue einheitliche Grenze für RV/ALV: 7.050,00 €/Monat
- KV/PV: 4.987,50 €/Monat (unverändert)

**Umsetzung im System:**

```typescript
// Aktualisierte Werte für 2025
const SOCIAL_INSURANCE_LIMITS_2025 = {
  health: 4987.50, // KV/PV (unverändert)
  pension: 7050.00, // RV (vereinheitlicht, war 7500 West)
  unemployment: 7050.00, // ALV (vereinheitlicht, war 7500 West)
  care: 4987.50, // PV (unverändert)
};

const SOCIAL_INSURANCE_RATES_2025 = {
  healthEmployee: 0.073, // 7,3%
  healthEmployer: 0.073, // 7,3%
  pensionEmployee: 0.093, // 9,3%
  pensionEmployer: 0.093, // 9,3%
  unemploymentEmployee: 0.012, // 1,2%
  unemploymentEmployer: 0.012, // 1,2%
  careEmployee: 0.01535, // 1,535% (bzw. 1,680% wenn kinderlos >23J)
  careEmployer: 0.01535, // 1,535%
};
```

**Compliance-Check:**
- [ ] Beitragsbemessungsgrenzen 2025 korrekt (7.050€ für RV/ALV)
- [ ] Beitragssätze 2025 korrekt
- [ ] Zusatzbeitrag KV konfigurierbar (ca. 1,0-2,5% je nach KK)
- [ ] Pflegeversicherung: Erhöhung bei Kinderlosigkeit >23J
- [ ] Capping bei Bemessungsgrenzen korrekt

#### 14.7.2 Unfallversicherung (UV)

**Rechtsgrundlage:** Sozialgesetzbuch (SGB) VII

**Anforderungen:**

- **Unfallversicherung:** Vollständig vom Arbeitgeber getragen (kein AN-Anteil)
- **Beitragssatz:** Abhängig von Berufsgenossenschaft (0,04% - 13% vom Brutto)
- **Durchschnitt:** Ca. 1,3% vom Brutto (je nach Branche)

**Umsetzung im System:**

```typescript
// Nur AG-Kosten
employerAccidentInsurance: number; // 1,3% vom Brutto (Beispiel)
// Kein AN-Abzug!
```

**Compliance-Check:**
- [ ] Unfallversicherung nur als AG-Kosten
- [ ] Kein AN-Abzug für UV
- [ ] Konfigurierbar je nach Berufsgenossenschaft

### 14.8 Gewerbeordnung (GewO) - Lohnabrechnungspflicht

**Rechtsgrundlage:** §108 Abs. 1 Gewerbeordnung (GewO)

**Anforderungen - Pflichtangaben in Lohnabrechnung:**

Die Lohnabrechnung muss folgende Angaben enthalten (§108 GewO):

1. **Arbeitgeber:**
   - Name und Anschrift
   - Steuernummer oder Betriebsnummer

2. **Arbeitnehmer:**
   - Name und Anschrift
   - Geburtsdatum
   - Steuer-ID
   - Sozialversicherungsnummer
   - Steuerklasse
   - Kinderfreibetrag

3. **Abrechnungszeitraum:**
   - Beginn und Ende
   - Zahlungszeitpunkt

4. **Zusammensetzung des Arbeitsentgelts:**
   - Bruttolohn/-gehalt
   - Zuschläge (Nacht, Wochenende, Feiertag, Überstunden)
   - Zulagen, Boni, Provisionen
   - Sachbezüge (z.B. Firmenwagen)

5. **Abzüge:**
   - Lohnsteuer
   - Solidaritätszuschlag
   - Kirchensteuer
   - Sozialversicherungsbeiträge (KV, RV, ALV, PV) - gesplittet nach AN/AG
   - Sonstige Abzüge (z.B. Vorschüsse)

6. **Auszahlungsbetrag:**
   - Nettolohn/-gehalt
   - Auszahlungstag
   - Bankverbindung (optional)

**Digitale Bereitstellung:**

- **BAG-Urteil (2023):** Digitale Bereitstellung über passwortgeschütztes Mitarbeiterportal ist zulässig
- **Voraussetzungen:**
  - Passwortgeschützt
  - DSGVO-konform
  - Download/Print möglich
  - Archivierung möglich

**Umsetzung im System:**

- **PDF-Lohnabrechnung:** Alle Pflichtangaben enthalten
- **Mitarbeiterportal:** Passwortgeschützter Zugriff
- **Download/Print:** Immer möglich
- **Archivierung:** 6 Jahre (GoBD)

**Compliance-Check:**
- [ ] Alle Pflichtangaben nach §108 GewO im PDF
- [ ] Digitale Bereitstellung BAG-konform
- [ ] Download/Print möglich
- [ ] Archivierung 6 Jahre

### 14.9 GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern)

**Rechtsgrundlage:** GoBD (Verwaltungsgrundsätze)

**Anforderungen:**

- **Unveränderlichkeit:** Dokumente müssen unveränderlich sein nach Erstellung
- **Vollständigkeit:** Alle relevanten Dokumente müssen vorhanden sein
- **Ordnungsmäßigkeit:** Dokumente müssen nachvollziehbar und prüfbar sein
- **Maschinelle Auswertbarkeit:** Digitale Dokumente müssen maschinell auswertbar sein
- **Aufbewahrungsfristen:**
  - Steuerrechtlich: 6 Jahre (§147 AO)
  - Sozialversicherungsrechtlich: 5 Jahre
  - Arbeitsrechtlich: 3 Jahre (§195 BGB)

**Umsetzung im System:**

- **Unveränderlichkeit:**
  - PDF-Versionierung (kein Überschreiben)
  - Firestore Timestamps (createdAt, updatedAt)
  - Audit-Log für alle Änderungen

- **Vollständigkeit:**
  - Alle Berechnungen dokumentiert
  - Alle Belege archiviert
  - Keine Löschung innerhalb Aufbewahrungsfrist

- **Nachvollziehbarkeit:**
  - Berechnungsschritte im `calcLog`
  - Vollständiger Audit-Trail
  - Export-Funktionen für Prüfungen

- **Archivierung:**
  - Automatische Archivierung nach 6 Jahren (optional)
  - Löschung nur nach Ablauf Aufbewahrungsfrist

**Compliance-Check:**
- [ ] PDF-Versionierung (kein Überschreiben)
- [ ] Audit-Log für alle Änderungen
- [ ] Berechnungsschritte dokumentiert
- [ ] Aufbewahrung 6 Jahre
- [ ] Export für Prüfungen möglich

### 14.10 DSGVO (Datenschutz-Grundverordnung)

**Rechtsgrundlage:** DSGVO, Bundesdatenschutzgesetz (BDSG)

**Anforderungen:**

- **Rechtmäßigkeit:** Datenverarbeitung nur für Lohnabrechnung (Art. 6 DSGVO)
- **Datensparsamkeit:** Nur notwendige Daten verarbeiten (Art. 5 DSGVO)
- **Verschlüsselung:** Verschlüsselung bei Übertragung und Speicherung (Art. 32 DSGVO)
- **Zugriffskontrolle:** Nur berechtigte Personen haben Zugriff (Art. 32 DSGVO)
- **Betroffenenrechte:**
  - Auskunft (Art. 15 DSGVO)
  - Löschung (Art. 17 DSGVO)
  - Datenportabilität (Art. 20 DSGVO)
  - Widerspruch (Art. 21 DSGVO)

**Umsetzung im System:**

- **Verschlüsselung:**
  - IBAN: AES-256 verschlüsselt
  - Sozialversicherungsnummer: AES-256 verschlüsselt
  - Steuer-ID: AES-256 verschlüsselt
  - HTTPS für alle Übertragungen

- **Zugriffskontrolle:**
  - Firestore Security Rules
  - Cloud Functions Authentifizierung
  - Rollen-basierte Berechtigungen

- **Betroffenenrechte:**
  - Export-Funktion für Datenportabilität
  - Löschung nach Aufbewahrungsfrist
  - Auskunft über gespeicherte Daten

**Compliance-Check:**
- [ ] Sensible Daten verschlüsselt (IBAN, SV-Nr., Steuer-ID)
- [ ] HTTPS für alle Übertragungen
- [ ] Zugriffskontrolle implementiert
- [ ] Export-Funktion für Betroffene
- [ ] Löschung nach Aufbewahrungsfrist

### 14.11 Branchenspezifische Regelungen

#### 14.11.1 Zeitarbeit (AÜG)

**Rechtsgrundlage:** Arbeitnehmerüberlassungsgesetz (AÜG)

**Anforderungen:**

- **Gleichbehandlung:** Leiharbeitnehmer müssen gleichgestellt werden (§8 AÜG)
- **Vergütung:** Mindestens Entgelt wie vergleichbare Stammbeschäftigte
- **Lohnfortzahlung:** Bei Krankheit nach 6 Wochen Wartezeit
- **Überlassungshöchstdauer:** 18 Monate (§1 Abs. 1b AÜG)

**Compliance-Check:**
- [ ] Gleichbehandlung dokumentiert
- [ ] Lohnfortzahlung bei Krankheit

#### 14.11.2 Pflegebereich

**Relevant:**
- Nacht-/Schichtarbeit besonders relevant
- Sonn- und Feiertagsarbeit mit Ausnahmen erlaubt (§10 ArbZG)
- Häufige Überstunden durch Personalmangel

**Compliance-Check:**
- [ ] Sonn- und Feiertagsarbeit korrekt dokumentiert
- [ ] Nachtzuschläge korrekt berechnet

### 14.12 Elektronische Lohnsteuerabzugsmerkmale (ELStAM)

**Rechtsgrundlage:** §39e EStG

**Anforderungen:**

- **Abfrage:** ELStAM können elektronisch abgefragt werden
- **Inhalt:** Steuerklasse, Kinderfreibetrag, Freibeträge
- **Aktualität:** Abfrage vor jeder Lohnabrechnung empfohlen

**Umsetzung im System:**

- **Integration:** ELStAM-Abfrage via BMF-API (optional)
- **Validierung:** Steuerklasse gegen ELStAM prüfen

**Compliance-Check:**
- [ ] ELStAM-Integration (optional, aber empfohlen)
- [ ] Validierung gegen ELStAM

### 14.13 Compliance-Checkliste (Zusammenfassung)

#### Gesetzliche Grundlagen

- [ ] Mindestlohngesetz (MiLoG) - 12,82 €/h
- [ ] Arbeitszeitgesetz (ArbZG) - Höchstarbeitszeit, Ruhezeiten
- [ ] Entgeltsicherungsgesetz (EntgeltSiG) - Insolvenzgeldumlage
- [ ] Einkommensteuergesetz (EStG) - Lohnsteuerberechnung
- [ ] Sozialversicherungsrecht (SGB) - Beiträge 2025
- [ ] Gewerbeordnung (GewO) - Pflichtangaben §108
- [ ] GoBD - Aufbewahrung, Unveränderlichkeit
- [ ] DSGVO - Datenschutz
- [ ] Betriebsverfassungsgesetz (BetrVG) - Betriebsrat

#### Technische Umsetzung

- [ ] Lohnsteuerberechnung nach BMF-Tabelle
- [ ] Sozialversicherungsbeiträge 2025 korrekt
- [ ] Mindestlohn-Validierung
- [ ] ArbZG-Validierung (Arbeitszeit, Ruhezeiten)
- [ ] PDF mit allen Pflichtangaben
- [ ] Digitale Bereitstellung BAG-konform
- [ ] Verschlüsselung sensibler Daten
- [ ] Audit-Log für Compliance
- [ ] Aufbewahrung 6 Jahre

#### Jährliche Updates

- [ ] Steuertabelle aktualisieren (Januar)
- [ ] Beitragsbemessungsgrenzen aktualisieren (Januar)
- [ ] Mindestlohn aktualisieren (jeweils 01.01.)
- [ ] Beitragssätze prüfen (jährlich)

---

## 15. API-Spezifikation

### 15.1 Client-Services

**Datei:** `lib/services/payroll.ts`

**Hauptfunktionen:**
- `getAll(): Promise<PayrollPeriod[]>`
- `getById(id: string): Promise<PayrollPeriod | null>`
- `create(data: {...}): Promise<string>`
- `calculatePayroll(periodId: string): Promise<void>`
- `approvePayroll(periodId: string, approvedBy: string): Promise<void>`
- `markAsPaid(periodId: string): Promise<void>`
- `lockPayroll(periodId: string): Promise<void>`
- `getPayrollItems(periodId: string): Promise<PayrollItem[]>`
- `generateDATEVExport(periodId: string): Promise<string>` (Blob-URL)
- `generatePDF(periodId: string): Promise<string>` (Blob-URL)

### 15.2 Cloud Functions

**Datei:** `functions/src/payroll/`

**Callable Functions:**
- `calculatePayroll` - Berechnung (falls groß)
- `approvePayroll` - Genehmigung
- `lockPayroll` - Sperren
- `unlockPayroll` - Entsperren
- `generatePayslipPDF` - PDF-Generierung
- `generateBatchPayslipPDFs` - Batch-PDF
- `exportDATEV` - DATEV-Export

**Scheduled Functions:**
- `calculateMonthlyPayroll` - Automatische monatliche Berechnung (1. des Monats, 2 Uhr)

**Firestore Triggers:**
- `logPayrollPeriodAuditEvent` - Audit-Log bei Perioden-Änderungen
- `logPayrollItemAuditEvent` - Audit-Log bei Item-Änderungen

---

## 15. Technische Referenzen

### 15.1 Code-Struktur

```
lib/
  services/
    payroll.ts                    # Hauptservice (Client)
    payroll/
      payrollCalculation.ts       # Berechnungslogik (Client)
    payrollSettings.ts            # Payroll-Einstellungen
    timesheets.ts                 # Timesheet-Service
  config/
    payrollRules.ts               # Regel-Konfiguration (neu)
  types/
    payroll.ts                    # TypeScript Interfaces

functions/
  src/
    payroll/
      calc.ts                     # Cloud Function: Berechnung (neu/erweitern)
      approvePayroll.ts           # Cloud Function: Genehmigung
      payrollCalculationService.ts # Berechnungslogik (Server)
      payrollPDFService.ts        # PDF-Generierung
      datevExportService.ts       # DATEV-Export
      auditLogging.ts             # Audit-Logging

app/
  (admin)/
    admin/
      lohnabrechnung/
        page.tsx                  # Admin-Dashboard (neu)
```

### 15.2 Externe Bibliotheken

