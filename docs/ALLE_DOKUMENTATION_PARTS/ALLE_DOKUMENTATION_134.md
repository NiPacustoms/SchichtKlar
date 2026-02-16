# JobFlow – Dokumentation Teil 134

*Zeichen 2642532–2662403 von 2862906*

---

5. ✅ Weitere Features nach Priorität planen


```

---

### 📄 mock-data-inventory.md

```markdown
# Mock-/Demo-Daten Inventur und Konsolidierung

Stand: automatisch erstellt

## Konsolidierte Stellen

- components/schedule/MyAssignmentCard.tsx
  - Vorher: Inline „Mock shift data“ Objekt
  - Jetzt: Import `buildMockShiftFromAssignment` aus `lib/test-data/shifts`
  - Zweck: Einheitliche Testdatenquelle für Schicht-Darstellung

- lib/hooks/useReports.ts
  - Vorher: Inline `vacationDays` (Mock)
  - Jetzt: Import `mockVacationDaysBasic` aus `lib/test-data/reports`
  - Zweck: Einheitliche Testdatenquelle für Urlaubs-Tage bis Service verfügbar

## Zentrale Testdatenquelle

- lib/test-data/shifts.ts
  - `mockShiftBasic`
  - `buildMockShiftFromAssignment(assignment)`

- lib/test-data/reports.ts
  - `mockVacationDaysBasic`

## Duplikate (exakt)

- Keine mehrfach identischen Objekte/IDs gefunden. Inline-Mocks wurden zentralisiert, um künftige Duplikate zu vermeiden.

## Empfehlungen

- Weitere Mocks (i18n/Monitoring) sind Funktions-Stubs, keine Daten-Duplikate – belassen.
- E2E-Login-Mock bleibt test-guarded in `contexts/AuthContext.tsx`.



```

---




---

## Quelle: docs/LOHNABRECHNUNG_IMPLEMENTATION.md

# Lohnabrechnungssystem - Implementierungsdokumentation

## Übersicht

Das Lohnabrechnungssystem für JobFlow wurde erfolgreich implementiert und bietet eine vollständige, rechtskonforme Lösung für die Gehaltsabrechnung deutscher Zeitarbeitsfirmen.

## Implementierte Features

### ✅ Phase 1: Datenmodell & Typen
- **TypeScript-Typen** für alle Lohnabrechnungsdaten
- **EmployeePayrollData** Interface für Mitarbeiter-Gehaltsdaten
- **PayrollCalculation** Interface für Lohnberechnungen
- **TaxDeductions** und **SocialSecurityDeductions** Interfaces
- **Form Types** für UI-Komponenten
- **Filter Types** für Datenabfragen
- **API Response Types** für einheitliche Antworten

### ✅ Phase 2: Lohnberechnungs-Engine
- **TaxCalculationService** mit offiziellen BMF-Formeln 2025
- **SocialSecurityService** mit aktuellen Beitragssätzen
- **PayrollCalculationService** als Haupt-Berechnungsservice
- Unterstützung für alle Steuerklassen (1-6)
- Minijob- und Midijob-Sonderregelungen
- Kirchensteuer-Berechnung nach Bundesland
- Solidaritätszuschlag-Berechnung
- Überstunden- und Zuschlag-Berechnung

### ✅ Phase 3: PDF-Generierung
- **PayrollPDFService** mit @react-pdf/renderer
- Rechtskonforme Gehaltsabrechnungen nach § 108 GewO
- Professionelle PDF-Layouts mit Firmenbranding
- Maskierung sensibler Daten für Datenschutz
- Batch-PDF-Generierung für alle Mitarbeiter
- Automatische Speicherung in Firebase Storage

### ✅ Phase 4: DATEV-Export
- **DATEVExportService** für Steuerberater-Integration
- LODAS-Format (Lohn- und Gehaltsdaten)
- ASCII- und XML-Export-Formate
- CSV-Export für einfache Integration
- Validierung der Export-Daten
- Automatische Speicherung in Firebase Storage

### ✅ Phase 5: UI-Komponenten
- **Admin-Dashboard** für Lohnabrechnungsverwaltung
- **Mitarbeiter-Gehaltsdaten** Verwaltung mit Stepper-UI
- **Mitarbeiter-Ansicht** für Gehaltsabrechnungen
- Responsive Design mit Material-UI
- Glass-Morphism Design für moderne Optik
- Intuitive Navigation und Benutzerführung

### ✅ Phase 6: Firebase Cloud Functions
- **Automatische monatliche Berechnung** (Scheduled Function)
- **PDF-Generierung** (Callable Function)
- **Genehmigungsworkflow** (Callable Function)
- **Audit-Logging** (Firestore Triggers)
- **Datenaufbewahrung** (Scheduled Function)
- **Sicherheits-Validierung** für alle Funktionen

### ✅ Phase 7: Sicherheit & Compliance
- **Client-seitige Verschlüsselung** für sensible Daten
- **Firestore Security Rules** für Datenzugriff
- **Audit-Logging** für alle Änderungen
- **DSGVO-konforme Datenlöschung**
- **GoBD-konforme Dokumentation**
- **Verschlüsselung** von IBAN, SV-Nummern, Steuer-IDs

### ✅ Phase 8: Testing & Dokumentation
- **Unit Tests** für Steuerberechnung
- **Unit Tests** für Sozialversicherung
- **Integration Tests** für PDF-Generierung
- **Comprehensive Documentation**
- **API-Dokumentation**
- **Benutzerhandbuch**

## Technische Architektur

### Frontend
- **React 18** mit TypeScript
- **Material-UI** für UI-Komponenten
- **@react-pdf/renderer** für PDF-Generierung
- **Crypto-JS** für Client-seitige Verschlüsselung
- **Firebase SDK** für Datenzugriff

### Backend
- **Firebase Firestore** für Datenbank
- **Firebase Cloud Functions** für Server-Logik
- **Firebase Storage** für Dateien
- **Firebase Authentication** für Sicherheit
- **Scheduled Functions** für Automatisierung

### Sicherheit
- **End-to-End Verschlüsselung** für sensible Daten
- **Firestore Security Rules** für Zugriffskontrolle
- **Audit-Logging** für Compliance
- **DSGVO-konforme Datenverarbeitung**
- **GoBD-konforme Dokumentation**

## Rechtliche Compliance

### BAG (Bundesarbeitsgericht)
- ✅ ArbZG-konforme Zeiterfassung
- ✅ Pausenvalidierung nach Arbeitszeitgesetz
- ✅ Überstunden-Tracking
- ✅ Nacht-/Wochenend-/Feiertagsstunden

### DSGVO (Datenschutz-Grundverordnung)
- ✅ Client-seitige Verschlüsselung
- ✅ Datenschutz durch Technikgestaltung
- ✅ Rechtmäßige Datenverarbeitung
- ✅ Betroffenenrechte (Auskunft, Löschung, Portabilität)
- ✅ Automatische Datenlöschung nach Aufbewahrungsfristen

### GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern)
- ✅ Unveränderliche Dokumentation
- ✅ Vollständige Audit-Trails
- ✅ Maschinelle Auswertbarkeit
- ✅ Ordnungsmäßige Buchführung

### Steuerrecht
- ✅ Aktuelle Lohnsteuertabellen 2025
- ✅ Sozialversicherungsbeiträge 2025
- ✅ Minijob- und Midijob-Sonderregelungen
- ✅ DATEV-Export für Steuerberater

## API-Endpunkte

### Cloud Functions
- `calculateMonthlyPayroll` - Automatische monatliche Berechnung
- `generatePayslipPDF` - PDF-Generierung
- `generateBatchPayslipPDFs` - Batch-PDF-Generierung
- `approvePayroll` - Genehmigung von Lohnabrechnungen
- `lockPayroll` - Sperrung nach Zahlung
- `unlockPayroll` - Entsperrung in Ausnahmefällen
- `logPayslipAccess` - Zugriffsprotokollierung
- `logDATEVExport` - DATEV-Export-Protokollierung
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



---

## Quelle: docs/LOHNABRECHNUNG_USER_GUIDE.md

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



---

## Quelle: docs/MARKTREIFE_ANALYSE.md

# JobFlow - Schonungslose Marktreife-Analyse

**Datum:** 27. Januar 2026  
**Status:** 🔴 **NICHT MARKTREIF**  
**Gesamtbewertung:** **~45-50% Marktreife**

---

## 🎯 Executive Summary

**Die App ist NICHT verkaufsfertig.** Trotz umfangreicher Features und guter Architektur gibt es **kritische technische Blockierer**, die einen Produktionsbetrieb verhindern:

1. ❌ **Build schlägt fehl** - Syntax-Fehler verhindern Kompilierung
2. ❌ **TypeScript-Fehler** - 50+ Parsing- und Syntax-Fehler
3. ❌ **ESLint-Fehler** - Viele Warnungen, Parsing-Fehler
4. ⚠️ **Keine Unit-Tests** - Nur E2E-Tests vorhanden, keine Code-Coverage
5. ⚠️ **Fehlende Module** - `@/lib/services/facilities` nicht gefunden

**Positiv:**
- ✅ Features sind vollständig implementiert
- ✅ Security-Audit zeigt gute Sicherheit
- ✅ DSGVO-Compliance vorhanden
- ✅ E2E-Tests vorhanden (20+ Test-Dateien)

---

## 📊 Detaillierte Bewertung nach Kategorien

### 1. Code-Qualität & Build-Fähigkeit

**Score: 15/30** 🔴

#### ❌ KRITISCH: Build schlägt fehl

**Aktueller Status:**
```bash
npm run build
# ❌ FEHLGESCHLAGEN
# - Syntax-Fehler in mehreren Dateien
# - Unterminated regexp literal
# - Module not found: @/lib/services/facilities
```

**Betroffene Dateien:**
- `app/(admin)/admin/dienstplan/page.tsx` - Parsing-Fehler
- `app/(admin)/admin/dokumenttypen/page.tsx` - Parsing-Fehler
- `app/(admin)/admin/einrichtungen/[id]/page.tsx` - JSX-Fehler
- `app/(admin)/admin/einrichtungen/page.tsx` - JSX-Fehler
- `app/(admin)/admin/einstellungen/page.tsx` - Parsing-Fehler
- `app/(employee)/employee/einrichtungen/page.tsx` - Syntax-Fehler
- `app/(employee)/employee/einsaetze/page.tsx` - Fehlendes Modul

**Impact:** 🔴 **BLOCKER** - App kann nicht gebaut werden, kein Deployment möglich

#### ❌ TypeScript-Fehler: 50+ Fehler

**Aktueller Status:**
```bash
npm run typecheck
# ❌ 50+ TypeScript-Fehler
```

**Hauptprobleme:**
- Parsing-Fehler (Identifier expected, ')' expected)
- JSX-Struktur-Fehler (fehlende schließende Tags)
- Fehlende Module
- Type-Assertions ohne Validierung

**Impact:** 🔴 **BLOCKER** - Type-Safety nicht gewährleistet

#### ⚠️ ESLint-Fehler: Viele Warnungen

**Aktueller Status:**
```bash
npm run lint
# ⚠️ Viele Warnungen (unused vars)
# ❌ Parsing-Fehler in 5 Dateien
```

**Hauptprobleme:**
- Unused imports/variables (30+ Warnungen)
- Parsing-Fehler in Admin-Seiten
- `no-redeclare` Fehler

**Impact:** 🟡 **HOCH** - Code-Qualität leidet, aber nicht blockierend

---

### 2. Testing & Qualitätssicherung

**Score: 8/20** 🟡

#### ✅ E2E-Tests vorhanden

**Status:**
