# Payroll - Betrieb ohne externe APIs

## Übersicht

Die JobFlow-Lohnabrechnung funktioniert **vollständig ohne externe APIs** und verwendet BMF-konforme Berechnungsformeln nach PAP 2025.

✅ **Keine BMF-API erforderlich** - Die Lohnsteuerberechnung verwendet die offiziellen BMF-Formeln direkt  
✅ **Keine ELSTER-API erforderlich** - Steuerdaten werden manuell gepflegt  
✅ **Vollständig rechtskonform** - Alle gesetzlichen Vorgaben werden eingehalten  
✅ **Keine Abhängigkeiten** - Funktioniert komplett offline

## Betrieb ohne APIs (Standard)

✅ **Die App funktioniert vollständig ohne APIs!**

### Manuelle Steuerdaten-Pflege

Die Steuerdaten werden manuell in den Employee-Daten (Firestore `users` Collection) gepflegt:

- **taxClass** (1-6): Lohnsteuerklasse
- **childAllowance** (number): Anzahl Kinder
- **churchTax** (boolean): Kirchensteuerpflichtig
- **state** (string): Bundesland (für Kirchensteuer: 'BW', 'BY', etc.)

### BMF-konforme Berechnung

Die Lohnsteuerberechnung verwendet die offiziellen BMF-Formeln nach Programmablaufplan (PAP) 2025:
- ✅ Implementiert in `lib/services/payroll/taxCalculation.ts`
- ✅ Rechtskonform ohne externe API
- ✅ Verwendet offizielle BMF-Formeln

### Vorteile ohne API

- ✅ Keine Registrierung erforderlich
- ✅ Keine API-Kosten
- ✅ Keine Abhängigkeit von externen Services
- ✅ Volle Kontrolle über die Daten
- ✅ Funktioniert offline

## Steuerdaten-Pflege

Die Steuerdaten werden manuell in der UI gepflegt:

**Pfad:** `/admin/mitarbeiter/[uid]/gehalt` → Schritt 3: Steuerdaten

**Pflegbare Felder:**
- **Steuer-ID**: 11-stellige Steuer-ID des Mitarbeiters
- **Steuerklasse**: 1-6 (Dropdown-Auswahl)
- **Kinderfreibetrag**: Anzahl Kinder (Zahl)
- **Kirchensteuer**: Ja/Nein (Switch)

Diese Daten werden direkt für die BMF-konforme Lohnsteuerberechnung verwendet.

## Technische Details

### Lohnsteuerberechnung

Die Lohnsteuerberechnung verwendet die offiziellen BMF-Formeln nach Programmablaufplan (PAP) 2025:
- Implementiert in: `lib/services/payroll/taxCalculation.ts`
- Verwendet offizielle BMF-Formeln
- Rechtskonform ohne externe API
- Berechnet: Lohnsteuer, Solidaritätszuschlag, Kirchensteuer

### Datenfluss

1. **Steuerdaten eingeben** → UI: `/admin/mitarbeiter/[uid]/gehalt`
2. **Daten speichern** → Firestore `users` Collection
3. **Lohnabrechnung berechnen** → Verwendet gespeicherte Steuerdaten
4. **BMF-konforme Berechnung** → Nach PAP 2025 Formeln

---

## Historische API-Information (Nicht mehr verwendet)

> **Hinweis:** Die folgenden Abschnitte beschreiben APIs, die nicht mehr verwendet werden.
> Die App funktioniert vollständig ohne externe APIs.

## ELStAM-API (ELSTER) - Nicht mehr verwendet

### Registrierung

Für die produktive Nutzung der ELStAM-API ist eine Registrierung bei ELSTER erforderlich:

1. **Registrierung bei ELSTER**
   - Website: https://www.elster.de
   - Registrierung als Unternehmen/Steuerberater
   - Beantragung des API-Zugangs für ELStAM

2. **API-Key erhalten**
   - Nach erfolgreicher Registrierung erhalten Sie einen API-Key
   - Dieser wird in den Umgebungsvariablen konfiguriert

### Konfiguration

Fügen Sie folgende Umgebungsvariablen zu Ihrer `.env.local` oder `.env` Datei hinzu:

```bash
# ELStAM-API (ELSTER)
ELSTAM_API_KEY=ihr-api-key-hier
NEXT_PUBLIC_ELSTAM_API_URL=https://www.elster.de/elstam/api/v1

# Mock-Modus (für Entwicklung ohne API-Key)
# NEXT_PUBLIC_ELSTAM_USE_MOCK=true
```

### Verwendung

Die ELStAM-API wird automatisch vor jeder Lohnabrechnung aufgerufen, wenn:
- Ein API-Key konfiguriert ist
- Der Mock-Modus nicht aktiviert ist
- Der Mitarbeiter eine gültige Steuer-ID hat

**Fallback-Verhalten:**
- Wenn kein API-Key vorhanden ist → Mock-Daten werden verwendet
- Bei API-Fehlern → Fallback auf Mock-Daten mit Warnung

## BMF-Steuerrechner-API (Nur für Tests)

### Wichtiger Hinweis

⚠️ **Die BMF-Steuerrechner-API ist ausschließlich für Testzwecke vorgesehen!**

- Die gewerbliche Nutzung ist ohne Einwilligung des BMF untersagt
- Für Produktion verwenden wir die implementierten PAP-Formeln (Programmablaufplan 2025)
- Die PAP-Formeln sind bereits in `lib/services/payroll/taxCalculation.ts` implementiert

### Test-API (Optional)

Falls Sie die BMF-Steuerrechner-API für Tests verwenden möchten:

```bash
# BMF-Steuerrechner-API (nur für Tests)
NEXT_PUBLIC_BMF_API_URL=https://www.bmf-steuerrechner.de/interface/2025Version1.xhtml
```

**Hinweis:** Die BMF-Steuerrechner-API wird aktuell nicht direkt verwendet, da wir die PAP-Formeln implementiert haben, die für Produktion geeignet sind.

## Aktuelle Implementierung

### Lohnsteuerberechnung

✅ **Implementiert:** BMF-konforme Lohnsteuerberechnung nach PAP 2025
- Datei: `lib/services/payroll/taxCalculation.ts`
- Verwendet offizielle BMF-Formeln
- Rechtskonform für Produktion
- **Funktioniert ohne externe API**

### ELStAM-Abfrage

✅ **Implementiert:** ELSTER-API-Integration (OPTIONAL)
- Datei: `lib/services/payroll/elstamService.ts`
- Automatische Abfrage nur wenn API-Key konfiguriert ist
- **Standard:** Verwendet manuell gepflegte Steuerdaten aus Employee-Daten
- Fallback auf lokale Daten bei API-Fehlern oder fehlendem API-Key

## Nächste Schritte

### Standard-Betrieb (ohne API)

1. **Steuerdaten manuell pflegen**
   - In der Firestore `users` Collection für jeden Mitarbeiter:
     - `taxClass`: Lohnsteuerklasse (1-6)
     - `childAllowance`: Anzahl Kinder
     - `churchTax`: Kirchensteuerpflichtig (boolean)
     - `state`: Bundesland (z.B. 'BW', 'BY', 'BE')
   - Die Lohnabrechnung verwendet diese Daten automatisch

2. **Berechnung testen**
   - Lohnabrechnung für Testperiode durchführen
   - Überprüfen Sie die BMF-konformen Berechnungen
   - Validieren Sie die Ergebnisse

### Optional: ELStAM-API aktivieren

1. **ELSTER-Registrierung** (nur wenn API gewünscht)
   - Registrieren Sie sich bei ELSTER
   - Beantragen Sie den API-Zugang für ELStAM
   - Konfigurieren Sie den API-Key in den Umgebungsvariablen

2. **Testing mit API**
   - Testen Sie die ELStAM-Integration mit Testdaten
   - Überprüfen Sie die Validierung und Synchronisation

3. **Produktion mit API**
   - Überwachen Sie die API-Aufrufe
   - Implementieren Sie Error-Handling und Retry-Logik

## Fehlerbehandlung

### ELStAM-API-Fehler

Bei API-Fehlern wird automatisch auf Mock-Daten zurückgegriffen. Die Fehler werden geloggt:

```typescript
// Beispiel: API-Fehler wird geloggt, Mock-Daten werden verwendet
console.warn('ELStAM-API-Fehler, verwende Mock-Daten als Fallback:', error);
```

### Validierung

Die ELStAM-Daten werden gegen lokale Employee-Daten validiert:
- Abweichungen werden als Warnungen geloggt
- ELStAM-Werte haben Vorrang
- Lokale Daten werden automatisch synchronisiert

## Support

- **ELSTER-API:** https://www.elster.de/elstam
- **BMF-Steuerrechner:** https://www.bmf-steuerrechner.de
- **PAP-Dokumentation:** https://www.bmf-steuerrechner.de/sonstiges/dialog/informationSchnittstelle.xhtml

