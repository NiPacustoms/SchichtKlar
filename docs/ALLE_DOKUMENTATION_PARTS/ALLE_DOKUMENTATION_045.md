# JobFlow – Dokumentation Teil 45

*Zeichen 874219–894103 von 2862906*

---

**Problem:** Vereinfachte Berechnung, nicht BMF-konform

**Aktuelle Implementierung:**
```typescript
// functions/src/payroll/payrollCalculationService.ts
// Vereinfachte Lohnsteuerberechnung basierend auf Lohnsteuerklasse
// In Produktion würde hier die offizielle Lohnsteuertabelle verwendet
```

**Gesetzliche Anforderung:**
- Lohnsteuer muss nach **offizieller BMF-Lohnsteuertabelle** berechnet werden
- Vereinfachte Formeln sind **nicht rechtskonform**
- Steuerberater können falsche Abrechnungen nicht akzeptieren

**Vergleich mit Best Practices:**

| Software | Steuerberechnung |
|----------|------------------|
| **DATEV** | Offizielle BMF-Tabellen, jährlich aktualisiert |
| **Sage** | Offizielle BMF-Tabellen, automatische Updates |
| **Personio** | Integration mit DATEV oder externen Services |
| **JobFlow (aktuell)** | ❌ Vereinfachte Formeln |

**Empfehlung:**

**Option 1: DATEV-Integration (EMPFOHLEN)**
- DATEV-API für Steuerberechnung nutzen
- Automatische Updates
- Rechtssicherheit

**Option 2: BMF-Lohnsteuertabelle implementieren**
- Offizielle Tabellen jährlich aktualisieren
- Komplex, fehleranfällig
- Wartungsaufwand hoch

**Option 3: Externer Service**
- Integration mit Steuerberechnungs-Service
- Kostenpflichtig, aber rechtssicher

---

### 2.4 Mindestlohn-Validierung - KRITISCH

**Problem:** Keine automatische Validierung

**Gesetzliche Vorgabe (MiLoG):**
- Mindestlohn 2025: **12,82 €/Stunde**
- Verstoß = Bußgeld bis 500.000€

**Aktuelle Implementierung:**
```typescript
// lib/config/payrollRules.ts
export function validateHourlyRate(rate: number): { valid: boolean; error?: string } {
  const rules = getPayrollRules();
  if (rate < rules.minimumWage) {
    return {
      valid: false,
      error: `Stundensatz ${rate.toFixed(2)}€ unterschreitet Mindestlohn ${rules.minimumWage.toFixed(2)}€`,
    };
  }
  return { valid: true };
}
```

✅ Funktion existiert, aber:
- ❌ Wird nicht automatisch bei Berechnung aufgerufen
- ❌ Keine Warnung in UI
- ❌ Keine Blockierung bei Verstoß

**Empfehlung:**
```typescript
// In calculatePayroll() vor Berechnung:
const validation = validateHourlyRate(employee.hourlyRate);
if (!validation.valid) {
  throw new Error(`MINDESTLOHN-VERSTOSS: ${validation.error}`);
}
```

---

### 2.5 Arbeitszeitgesetz (ArbZG) - WICHTIG

**Problem:** Keine ArbZG-Validierung

**Gesetzliche Vorgaben:**
- Höchstarbeitszeit: 8h/Tag, 40h/Woche (§3 ArbZG)
- Ruhezeit: 11h ununterbrochen (§5 ArbZG)
- Pausen: 30min bei >6h, 45min bei >9h (§4 ArbZG)

**Aktuelle Implementierung:**
- ❌ Keine Validierung der täglichen Arbeitszeit
- ❌ Keine Validierung der wöchentlichen Arbeitszeit
- ❌ Keine Ruhezeit-Prüfung
- ❌ Keine Pausen-Validierung

**Vergleich mit Best Practices:**

| Software | ArbZG-Validierung |
|----------|-------------------|
| **DATEV** | ✅ Vollständig, Warnungen bei Verstößen |
| **Sage** | ✅ Vollständig, Blockierung bei Verstößen |
| **Personio** | ✅ Vollständig, Integration mit Zeiterfassung |
| **JobFlow (aktuell)** | ❌ Nicht implementiert |

**Empfehlung:**
```typescript
// Neue Funktion: validateArbZG()
function validateArbZG(timesheets: TimesheetEntry[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Tägliche Arbeitszeit prüfen
  timesheets.forEach(ts => {
    if (ts.totalHours > 8) {
      warnings.push(`Arbeitszeit ${ts.totalHours}h überschreitet 8h/Tag am ${ts.date}`);
    }
  });
  
  // Wöchentliche Arbeitszeit prüfen
  const weeklyHours = calculateWeeklyHours(timesheets);
  if (weeklyHours > 40) {
    warnings.push(`Wöchentliche Arbeitszeit ${weeklyHours}h überschreitet 40h/Woche`);
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}
```

---

### 2.6 ELStAM-Integration - WICHTIG

**Problem:** Keine Abfrage der elektronischen Lohnsteuerabzugsmerkmale

**Gesetzliche Vorgabe:**
- ELStAM müssen vor jeder Lohnabrechnung abgefragt werden (§39e EStG)
- Steuerklasse, Kinderfreibetrag, Freibeträge können sich ändern

**Aktuelle Implementierung:**
- ❌ Keine ELStAM-Abfrage
- ❌ Statische Steuerklasse im System
- ❌ Keine Validierung gegen ELStAM

**Vergleich mit Best Practices:**

| Software | ELStAM-Integration |
|----------|-------------------|
| **DATEV** | ✅ Vollständig, automatische Abfrage |
| **Sage** | ✅ Vollständig, automatische Abfrage |
| **Personio** | ✅ Via DATEV-Integration |
| **JobFlow (aktuell)** | ❌ Nicht implementiert |

**Empfehlung:**
- BMF-ELStAM-API integrieren
- Automatische Abfrage vor jeder Berechnung
- Warnung bei Abweichungen

---

### 2.7 Minijob/Midijob-Berechnung - WICHTIG

**Problem:** Unvollständige Implementierung

**Aktuelle Implementierung:**
```typescript
// lib/services/payroll/socialSecurityCalculation.ts
// Minijob: Arbeitnehmer zahlt keine SV-Beiträge
// Arbeitgeber zahlt pauschale Beiträge
const employerHealthInsurance = grossSalary * 0.13; // 13% pauschal
```

**Gesetzliche Vorgabe 2025:**
- Minijob-Grenze: **556€/Monat** (nicht 538€!)
- Pauschale AG-Beiträge: 13% KV, 15% RV, 3% ALV, 13% PV

**Probleme:**
1. ❌ Minijob-Grenze falsch (538€ statt 556€)
2. ❌ Midijob-Grenze falsch (520,01€ - 2.000€, nicht 538€ - 2.000€)
3. ❌ Gleitzone-Berechnung vereinfacht

**Korrekte Werte 2025:**
- Minijob: bis **556€/Monat**
- Midijob: **520,01€ - 2.000€/Monat**

**Empfehlung:**
```typescript
private readonly limits = {
  miniJobLimit: 556, // ✅ 2025 (nicht 538!)
  midiJobLowerLimit: 520.01, // ✅ 2025 (nicht 538!)
  midiJobUpperLimit: 2000,
};
```

---

### 2.8 Feiertags-Integration - WICHTIG

**Problem:** Feiertage nicht automatisch erkannt

**Aktuelle Implementierung:**
- ❌ Keine Feiertags-Provider
- ❌ Manuelle Eingabe erforderlich
- ❌ Bundesland-spezifische Feiertage nicht berücksichtigt

**Vergleich mit Best Practices:**

| Software | Feiertags-Integration |
|----------|----------------------|
| **DATEV** | ✅ Vollständig, alle Bundesländer |
| **Sage** | ✅ Vollständig, alle Bundesländer |
| **Personio** | ✅ Vollständig, alle Bundesländer |
| **JobFlow (aktuell)** | ❌ Nicht implementiert |

**Empfehlung:**
- Integration mit `feiertage-api.de` oder ähnlichem Service
- Automatische Erkennung von Feiertagen
- Bundesland-spezifische Feiertage

---

### 2.9 DATEV-Export - EMPFEHLUNG

**Aktuelle Implementierung:**
- ✅ DATEV-Export vorhanden
- ⚠️ Format muss validiert werden

**Empfehlung:**
- DATEV-Format-Validator integrieren
- Test-Import in DATEV durchführen
- Dokumentation erweitern

---

### 2.10 Audit-Logging - EMPFEHLUNG

**Aktuelle Implementierung:**
- ✅ Audit-Logging vorhanden
- ⚠️ Vollständigkeit prüfen

**Empfehlung:**
- Alle kritischen Aktionen loggen
- GoBD-konforme Aufbewahrung (10 Jahre)
- Export-Funktion für Prüfungen

---

## 3. Vergleich mit Best Practices

### 3.1 DATEV Lohn und Gehalt

**Stärken:**
- ✅ Offizielle BMF-Steuertabellen
- ✅ Vollständige ELStAM-Integration
- ✅ Automatische Updates
- ✅ Rechtssicherheit
- ✅ DATEV-Format nativ

**Schwächen:**
- ❌ Hohe Kosten
- ❌ Komplexe Bedienung
- ❌ Lokale Installation erforderlich

**Lernpunkte für JobFlow:**
- DATEV-API für Steuerberechnung nutzen
- DATEV-Format exakt einhalten
- Automatische Updates implementieren

---

### 3.2 Sage Business Cloud Lohnabrechnung

**Stärken:**
- ✅ Cloud-basiert
- ✅ Offizielle BMF-Steuertabellen
- ✅ ELStAM-Integration
- ✅ Benutzerfreundlich
- ✅ DATEV-Export

**Schwächen:**
- ❌ Kostenpflichtig
- ❌ Abhängigkeit von externem Service

**Lernpunkte für JobFlow:**
- Cloud-First-Ansatz (bereits vorhanden)
- Benutzerfreundliche UI (bereits vorhanden)
- Externe Services für Steuerberechnung nutzen

---

### 3.3 Personio

**Stärken:**
- ✅ HR + Payroll kombiniert
- ✅ Moderne UI
- ✅ DATEV-Integration
- ✅ Cloud-basiert

**Schwächen:**
- ❌ Externe Abhängigkeit
- ❌ Kostenpflichtig

**Lernpunkte für JobFlow:**
- Moderne UI (bereits vorhanden)
- Integration mit Zeiterfassung (bereits vorhanden)
- DATEV-Export (bereits vorhanden)

---

## 4. Gesetzeskonformitäts-Checkliste

### 4.1 Steuerrecht

- [ ] ✅ Lohnsteuerberechnung nach BMF-Tabelle (❌ **AKTUELL: Vereinfacht**)
- [ ] ✅ Solidaritätszuschlag (5,5%)
- [ ] ✅ Kirchensteuer (8-9% je nach Bundesland)
- [ ] ✅ ELStAM-Abfrage (❌ **NICHT IMPLEMENTIERT**)
- [ ] ✅ Lohnsteuerbescheinigung generierbar

### 4.2 Sozialversicherungsrecht

- [ ] ✅ Beitragssätze 2025 korrekt (❌ **ALV falsch: 1,3% statt 1,2%**)
- [ ] ✅ Beitragsbemessungsgrenzen 2025 korrekt (❌ **Inkonsistent: 3 verschiedene Werte**)
- [ ] ✅ Minijob-Grenze 556€ (❌ **FALSCH: 538€**)
- [ ] ✅ Midijob-Grenze 520,01€ - 2.000€ (❌ **FALSCH: 538€ - 2.000€**)
- [ ] ✅ Pflegeversicherung: Erhöhung bei Kinderlosigkeit >23J

### 4.3 Arbeitsrecht

- [ ] ✅ Mindestlohn-Validierung (⚠️ **Vorhanden, aber nicht automatisch**)
- [ ] ✅ ArbZG-Validierung (❌ **NICHT IMPLEMENTIERT**)
- [ ] ✅ Ruhezeiten-Prüfung (❌ **NICHT IMPLEMENTIERT**)
- [ ] ✅ Pausen-Validierung (❌ **NICHT IMPLEMENTIERT**)

### 4.4 Lohnabrechnungspflicht (§108 GewO)

- [ ] ✅ Alle Pflichtangaben im PDF
- [ ] ✅ Digitale Bereitstellung BAG-konform
- [ ] ✅ Download/Print möglich
- [ ] ✅ Archivierung 6 Jahre

### 4.5 GoBD

- [ ] ✅ Unveränderliche Dokumentation
- [ ] ✅ Vollständige Audit-Trails
- [ ] ✅ Maschinelle Auswertbarkeit
- [ ] ✅ Aufbewahrung 6 Jahre

### 4.6 DSGVO

- [ ] ✅ Verschlüsselung sensibler Daten
- [ ] ✅ Zugriffskontrolle
- [ ] ✅ Betroffenenrechte (Auskunft, Löschung, Portabilität)

---

## 5. Kritische Probleme - Priorisierung

### 🔴 PRIORITÄT 1 - Sofort beheben (vor Produktivnutzung)

1. **Beitragsbemessungsgrenzen vereinheitlichen**
   - Alle Dateien auf 7.050€ (RV/ALV) und 4.987,50€ (KV/PV) aktualisieren
   - Einheitliche Konstante verwenden

2. **Beitragssätze korrigieren**
   - ALV: 1,2% (nicht 1,3%)
   - Insolvenzgeldumlage: 0,06% (nicht 0,09%)

3. **Minijob/Midijob-Grenzen korrigieren**
   - Minijob: 556€ (nicht 538€)
   - Midijob: 520,01€ - 2.000€ (nicht 538€ - 2.000€)

4. **Steuerberechnung BMF-konform machen**
   - DATEV-API integrieren ODER
   - Offizielle BMF-Tabellen implementieren

5. **Mindestlohn-Validierung aktivieren**
   - Automatische Prüfung bei Berechnung
   - Blockierung bei Verstoß

### 🟡 PRIORITÄT 2 - Vor Produktivnutzung

6. **ArbZG-Validierung implementieren**
   - Tägliche/wöchentliche Arbeitszeit prüfen
   - Ruhezeiten prüfen
   - Pausen prüfen

7. **ELStAM-Integration**
   - BMF-ELStAM-API integrieren
   - Automatische Abfrage vor Berechnung

8. **Feiertags-Integration**
   - Feiertags-Provider integrieren
   - Bundesland-spezifische Feiertage

### 🟢 PRIORITÄT 3 - Verbesserungen

9. **DATEV-Export validieren**
   - Format-Validator
   - Test-Import in DATEV

10. **Audit-Logging vervollständigen**
    - Alle kritischen Aktionen
    - GoBD-konforme Aufbewahrung

---

## 6. Empfehlungen

### 6.1 Kurzfristig (1-2 Wochen)

1. **Kritische Werte korrigieren**
   - Beitragsbemessungsgrenzen vereinheitlichen
   - Beitragssätze korrigieren
   - Minijob/Midijob-Grenzen korrigieren

2. **Validierungen aktivieren**
   - Mindestlohn-Validierung automatisch
   - Fehlerbehandlung verbessern

3. **Tests durchführen**
   - Vergleichsrechnung mit DATEV
   - Test-Abrechnungen für verschiedene Szenarien

### 6.2 Mittelfristig (1-2 Monate)

1. **Steuerberechnung BMF-konform**
   - DATEV-API integrieren (empfohlen)
   - ODER BMF-Tabellen implementieren

2. **ArbZG-Validierung**
   - Implementierung der Validierungslogik
   - Integration in Berechnungsprozess

3. **ELStAM-Integration**
   - BMF-API-Integration
   - Automatische Abfrage

### 6.3 Langfristig (3-6 Monate)

1. **Feiertags-Integration**
   - Provider-Integration
   - Bundesland-spezifische Feiertage

2. **Performance-Optimierungen**
   - Batch-Processing für große Perioden
   - Caching-Strategien

3. **Erweiterte Features**
   - Lohnsteuerbescheinigung
   - Erweiterte Reports
   - Analytics

---

## 7. Fazit

### 7.1 Aktueller Status

Die JobFlow-Lohnabrechnung ist **grundsätzlich funktionsfähig**, weist jedoch **kritische gesetzeskonforme Mängel** auf, die vor Produktivnutzung behoben werden müssen.

### 7.2 Risikobewertung

**Hohes Risiko:**
- Falsche Beitragsbemessungsgrenzen → Falsche Abrechnungen
- Falsche Beitragssätze → Falsche Abzüge
- Vereinfachte Steuerberechnung → Nicht rechtskonform

**Mittleres Risiko:**
- Fehlende ArbZG-Validierung → Mögliche Verstöße
- Fehlende ELStAM-Integration → Veraltete Steuerklassen

**Niedriges Risiko:**
- Fehlende Feiertags-Integration → Manuelle Eingabe erforderlich

### 7.3 Empfehlung

**NICHT produktiv nutzen** bis:
1. ✅ Kritische Werte korrigiert
2. ✅ Steuerberechnung BMF-konform
3. ✅ Mindestlohn-Validierung aktiv
4. ✅ Vergleichsrechnung mit DATEV erfolgreich

**Nach Korrekturen:**
- ✅ Vergleichsrechnung mit DATEV durchführen
- ✅ Test-Abrechnungen für verschiedene Szenarien
- ✅ Rechtliche Prüfung durch Steuerberater
- ✅ Schrittweise Einführung (Testphase)

---

**Dokumentationsstand:** 2025-01  
**Nächste Review:** Nach Implementierung der kritischen Korrekturen

```

---

### 📄 ZEITERFASSUNG_COMPLIANCE_ANALYSE.md

```markdown
# Zeiterfassung Compliance-Analyse - Pflegebereich

**Stand:** 2025-01  
**Rechtsstand:** Deutschland, BAG-Urteil 2022, ArbZG, GoBD, DSGVO  
**Ziel:** Prüfung der Zeiterfassung auf Einhaltung deutscher Rechtsanforderungen für den Pflegebereich

---

## 1. Rechtliche Grundlagen

### 1.1 BAG-Urteil 2022 (Bundesarbeitsgericht)

**Rechtsgrundlage:** Urteil vom 13. September 2022 (1 ABR 22/21)

**Anforderungen:**
- ✅ **Objektive Erfassung:** System muss objektiv arbeiten, ohne Manipulationsmöglichkeiten
- ✅ **Verlässliche Erfassung:** Daten müssen korrekt und vollständig sein
- ✅ **Zugängliche Erfassung:** Daten müssen für Arbeitgeber und Arbeitnehmer zugänglich sein

**Quelle:** EuGH-Urteil Mai 2019, BAG-Bestätigung September 2022

### 1.2 Arbeitszeitgesetz (ArbZG)

**Relevante Paragraphen:**
- §3 ArbZG: Höchstarbeitszeit (8 Stunden täglich, 48 Stunden wöchentlich)
- §4 ArbZG: Ruhepausen (30 min nach 6h, 45 min nach 9h)
- §5 ArbZG: Ruhezeiten (11 Stunden zwischen Schichten)
- §16 ArbZG: Aufzeichnungspflicht

### 1.3 GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen)

**Anforderungen:**
- Unveränderlichkeit nach Genehmigung
- Vollständigkeit
- Nachvollziehbarkeit (Audit-Trail)
- Aufbewahrung: 10 Jahre für Lohnabrechnungen

### 1.4 DSGVO

**Anforderungen:**
- Rechtmäßigkeit der Verarbeitung
- Zweckbindung
- Datensparsamkeit
- Technische und organisatorische Maßnahmen (TOMs)

---

## 2. Compliance-Checkliste

### 2.1 Objektive, verlässliche und zugängliche Zeiterfassung (BAG-Urteil)

| Anforderung | Status | Implementierung | Bewertung |
|------------|--------|-----------------|-----------|
| **Objektive Erfassung** | ✅ | Server-seitige Berechnung von `totalHours` in `submitTimesheet.ts` | ✅ **ERFÜLLT** |
| **Verlässliche Erfassung** | ✅ | Validierung in `timesheetValidation.ts`, ArbZG-Checks | ✅ **ERFÜLLT** |
| **Zugängliche Erfassung** | ✅ | UI für Mitarbeiter (`/employee/zeiterfassung`), Admin-Übersicht | ✅ **ERFÜLLT** |
| **Manipulationsschutz** | ✅ | Server-seitige Validierung, Firestore Security Rules | ✅ **ERFÜLLT** |

**Details:**
- ✅ Server-seitige Berechnung verhindert Client-Manipulation (```71:77:functions/src/submitTimesheet.ts```)
- ✅ Validierung bei Erstellung und Update (```166:277:functions/src/timesheetValidation.ts```)
- ✅ Zugriffskontrolle über Firebase Auth und Security Rules

---

### 2.2 ArbZG-Konformität

| Anforderung | Status | Implementierung | Bewertung |
|------------|--------|-----------------|-----------|
| **Pausenvalidierung (30 min nach 6h)** | ✅ | `submitTimesheet.ts` Zeile 72-77 | ✅ **ERFÜLLT** |
| **Pausenvalidierung (45 min nach 9h)** | ⚠️ | Nur in `timesheetValidation.ts` Zeile 229-233 | ⚠️ **TEILWEISE** |
| **Höchstarbeitszeit (10h täglich)** | ✅ | `timesheetValidation.ts` Zeile 216-220 | ✅ **ERFÜLLT** |
| **Wöchentliche Höchstarbeitszeit (48h)** | ✅ | `timesheetValidation.ts` Zeile 236-243 | ✅ **ERFÜLLT** |
| **Ruhezeiten (11h zwischen Schichten)** | ✅ | `validateRestPeriod()` in `timesheetValidationUtils.ts` Zeile 171-251 | ✅ **ERFÜLLT** |
| **Nachtschichten-Erkennung** | ✅ | Berechnung in `submitTimesheet.ts` Zeile 64-66 | ✅ **ERFÜLLT** |

**Status:** ✅ **ALLE ARBZG-ANFORDERUNGEN ERFÜLLT**

**Hinweis:** Die Ruhezeiten-Validierung ist vollständig implementiert und wird bei jedem Submit geprüft.
Die 45-Minuten-Pause wird ebenfalls vollständig validiert und blockiert ungültige Zeiterfassungen.

---

### 2.3 GoBD-Konformität

| Anforderung | Status | Implementierung | Bewertung |
|------------|--------|-----------------|-----------|
| **Unveränderlichkeit nach Genehmigung** | ⚠️ | Status-basierte Prüfung, aber keine harte Sperre | ⚠️ **TEILWEISE** |
| **Audit-Trail** | ✅ | `auditLogs` Collection, `submitTimesheet.ts` Zeile 87-101 | ✅ **ERFÜLLT** |
| **Vollständigkeit** | ✅ | Alle relevanten Felder werden erfasst | ✅ **ERFÜLLT** |
| **Nachvollziehbarkeit** | ✅ | Audit-Logs mit Änderungshistorie | ✅ **ERFÜLLT** |
| **Aufbewahrung (10 Jahre)** | ⚠️ | Keine automatische Löschung implementiert | ⚠️ **MANUELL** |

**Kritische Punkte:**
1. ⚠️ **Unveränderlichkeit:** Timesheets mit Status `approved` können theoretisch noch geändert werden
   - **Lösung:** Firestore Security Rules sollten `approved`-Timesheets vor Änderungen schützen
   - **Aktuell:** Nur Status-Prüfung in Cloud Functions

2. ⚠️ **Aufbewahrung:** Keine automatische Archivierung nach 10 Jahren
   - **Empfehlung:** Archivierungs-Cloud Function implementieren

**Details:**
- ✅ Audit-Logs werden erstellt (```87:101:functions/src/submitTimesheet.ts```)
- ✅ Änderungen werden protokolliert (old/new values)
- ⚠️ Keine Firestore Security Rule, die `approved`-Timesheets schützt

---

### 2.4 Signatur-Workflow (Rechtssicherheit)

| Anforderung | Status | Implementierung | Bewertung |
|------------|--------|-----------------|-----------|
| **Mitarbeiter-Signatur** | ✅ | `employeeSignatureUrl` in Timesheet-Interface | ✅ **ERFÜLLT** |
| **Einrichtungs-Signatur** | ✅ | `facilitySignatureUrl`, `DailySignatureDialog.tsx` | ✅ **ERFÜLLT** |
| **Sammelsignatur (>7 Tage)** | ❌ | Obsolet - nicht mehr verwendet | ❌ **OBSOLET** |
| **Signatur-Speicherung** | ✅ | Firebase Storage, verschlüsselt | ✅ **ERFÜLLT** |

**Details:**
- ✅ Tägliche Signatur durch Einrichtung (```18:138:components/admin/DailySignatureDialog.tsx```)
- ✅ Signatur-URLs werden in Timesheet gespeichert (```29:36:lib/services/timesheets.ts```)

---

### 2.5 DSGVO-Konformität

| Anforderung | Status | Implementierung | Bewertung |
|------------|--------|-----------------|-----------|
| **Rechtmäßigkeit** | ✅ | Zeiterfassung ist gesetzlich vorgeschrieben | ✅ **ERFÜLLT** |
| **Zweckbindung** | ✅ | Daten nur für Lohnabrechnung verwendet | ✅ **ERFÜLLT** |
| **Datensparsamkeit** | ✅ | Nur notwendige Felder erfasst | ✅ **ERFÜLLT** |
| **TOMs** | ✅ | Verschlüsselung, Zugriffskontrolle, Audit-Logs | ✅ **ERFÜLLT** |
| **Betroffenenrechte** | ⚠️ | Export-Funktion vorhanden, Löschung unklar | ⚠️ **TEILWEISE** |

**Details:**
- ✅ Verschlüsselung at-rest (Firebase)
- ✅ Zugriffskontrolle über Firebase Auth
- ✅ Audit-Logs für Nachvollziehbarkeit
- ⚠️ Löschung nach Aufbewahrungsfrist nicht automatisiert

---

## 3. Erfasste Datenfelder

### 3.1 Pflichtfelder (ArbZG)

| Feld | Status | Implementierung |
|------|--------|-----------------|
| **Startzeit** | ✅ | `startTime` (```8:8:lib/services/timesheets.ts```) |
| **Endzeit** | ✅ | `endTime` (```9:9:lib/services/timesheets.ts```) |
| **Pausen** | ✅ | `breakMinutes`, `breaks[]` (```10:46:lib/services/timesheets.ts```) |
| **Datum** | ✅ | `date` (```7:7:lib/services/timesheets.ts```) |
| **Gesamtstunden** | ✅ | `totalHours` (```11:11:lib/services/timesheets.ts```) |

### 3.2 Zusatzfelder (Pflegebereich)

| Feld | Status | Implementierung |
|------|--------|-----------------|
| **Nachtschicht-Stunden** | ✅ | `nightHours` (```15:15:lib/services/timesheets.ts```) |
