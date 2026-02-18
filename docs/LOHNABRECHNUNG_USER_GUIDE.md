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
