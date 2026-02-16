# JobFlow – Dokumentation Teil 105

*Zeichen 2066330–2086217 von 2862906*

---

2. **Firebase Console:** Überprüfen Sie, ob Ihr Projekt korrekt konfiguriert ist
3. **Umgebungsvariablen:** Stellen Sie sicher, dass alle Variablen korrekt gesetzt sind
4. **Netzwerk:** Überprüfen Sie, ob keine Firewall die Verbindung blockiert

## Support

Bei weiteren Problemen überprüfen Sie die [Firebase-Dokumentation](https://firebase.google.com/docs) oder erstellen Sie ein Issue im Projekt-Repository.

```

---

## Features & Guides

*1 Dateien*

### 📄 ADMIN_FEATURES.md

```markdown
# JobFlow Admin-Features Dokumentation

## Übersicht

Diese Dokumentation beschreibt die neuen Admin-Features der JobFlow-Anwendung, die speziell für Zeitarbeitsfirmen im Pflegebereich entwickelt wurden.

## 🎯 Kernfunktionen

### 1. Dashboard mit KPI-Widgets

**Zweck:** Übersichtliche Darstellung aller wichtigen Kennzahlen

**Features:**

- **Aktive Mitarbeiter:** Anzahl der eingeloggten und verfügbaren Mitarbeiter
- **Aktive Einsätze:** Laufende Aufträge mit Trend-Anzeige
- **Offene Signaturen:** Arbeitszeiten, die auf Unterschrift warten
- **Aktive Benachrichtigungen:** Ungelesene Nachrichten
- **Gesamtkunden:** Alle aktiven Kunden
- **Überfällige Arbeitszeiten:** DSGVO-Verstöße (über 8h/Tag)

**Design:**

- Glasmorphism-Design mit Petrol (#005f73) und Mustard (#e8aa42)
- Trend-Indikatoren für positive/negative Entwicklungen
- Responsive Grid-Layout (Desktop-First)

### 2. Live-Übersicht Arbeitszeiten

**Zweck:** Echtzeit-Monitoring aller aktiven Arbeitszeiten

**Features:**

- **Live-Status:** Aktuelle Arbeitszeiten mit Start/Stop/Pause
- **DSGVO-Compliance:** Automatische Prüfung der Arbeitszeit-Grenzen
- **Pausenverwaltung:** 30-Minuten-Pause nach 6 Stunden
- **Standort-Tracking:** GPS-basierte Einsatzort-Erfassung
- **Progress-Bars:** Visuelle Darstellung der Arbeitszeit-Limits

**DSGVO-Regeln:**

- Maximal 8 Stunden pro Tag
- 30-Minuten-Pause nach 6 Stunden
- Automatische Warnungen bei Überschreitungen

### 3. Digitale Signatur für Schichtabschluss

**Zweck:** Rechtssichere Dokumentation der Arbeitszeiten

**Features:**

- **Canvas-basierte Unterschrift:** Touch- und Maus-Unterstützung
- **Multi-Signatur:** Mitarbeiter, Kunde und PDL
- **Standort-Erfassung:** Automatische GPS-Integration
- **Notizen:** Zusätzliche Informationen zum Einsatz
- **Export-Funktion:** Download der Unterschriften als PNG

**Sicherheit:**

- DSGVO-Compliance-Prüfung vor Abschluss
- Audit-Trail für alle Unterschriften
- Verschlüsselte Speicherung

### 4. Benachrichtigungssystem

**Zweck:** Automatisierte Kommunikation mit Mitarbeitern und Kunden

#### 4.1 Vorlagen-Manager

**Features:**

- **Variable-System:** {{user}}, {{date}}, {{order}}, {{customer}}
- **Multi-Kanal:** E-Mail, SMS, Push-Benachrichtigungen
- **Kategorien:** Auftrag, Arbeitszeit, Erinnerung, System
- **Vorschau:** Live-Vorschau mit Beispiel-Daten
- **Versionierung:** Änderungshistorie und Rollbacks

**Verfügbare Variablen:**

```
{{user}} - Name des Mitarbeiters
{{date}} - Aktuelles Datum
{{order}} - Auftragsname
{{customer}} - Kundenname
{{startTime}} - Startzeit des Einsatzes
{{endTime}} - Endzeit des Einsatzes
{{location}} - Einsatzort
{{manager}} - Name des Vorgesetzten
{{company}} - Firmenname
{{hours}} - Arbeitsstunden
```

#### 4.2 Kampagnen-Manager

**Features:**

- **Zeitplanung:** Sofort, geplant oder wiederkehrend
- **Zielgruppen:** Alle Mitarbeiter, Rollen-basiert, individuell
- **Multi-Kanal:** Gleichzeitiger Versand über mehrere Kanäle
- **Tracking:** Zustellbestätigungen und Öffnungsraten
- **A/B-Tests:** Verschiedene Nachrichten-Varianten

**Zeitplanung:**

- **Sofort:** Direkter Versand
- **Geplant:** Einmaliger Versand zu festem Zeitpunkt
- **Wiederkehrend:** Täglich, wöchentlich, monatlich

### 5. Chat-System

**Zweck:** Interne Firmenkommunikation

**Features:**

- **Direktnachrichten:** 1:1-Kommunikation zwischen Mitarbeitern
- **Gruppenchats:** Projekt- und Abteilungs-Chats
- **Rollenbasierte Berechtigung:** Admin vs. Mitarbeiter
- **Datei-Anhänge:** Dokumente und Bilder teilen
- **Moderation:** Nachrichten melden und Benutzer blockieren

**Sicherheit:**

- DSGVO-konform (nur interne Nutzer)
- Audit-Trail für alle Nachrichten
- Automatische Löschung nach konfigurierbarer Zeit

## 🔧 Technische Implementierung

### Architektur

- **Frontend:** React 18 + TypeScript + MUI 5
- **Backend:** Firebase (Auth, Firestore, Storage)
- **State Management:** React Query
- **Styling:** Glasmorphism-Design mit CSS-in-JS

### Komponenten-Struktur

```
src/features/
├── dashboard/
│   ├── components/
│   │   └── DashboardKPIWidgets.tsx
│   └── pages/
│       └── AdminDashboardPage.tsx
├── worktimes/
│   ├── components/
│   │   ├── WorktimeLiveOverview.tsx
│   │   └── SignatureCapture.tsx
│   └── hooks/
│       └── useWorktimes.ts
└── notifications/
    ├── components/
    │   ├── NotificationTemplateManager.tsx
    │   ├── NotificationCampaignManager.tsx
    │   └── ChatSystem.tsx
    └── hooks/
        └── useNotifications.ts
```

### Datenmodelle

#### Worktime

```typescript
interface Worktime {
  id: string;
  orderId: string;
  employeeId: string;
  startTime: Date;
  endTime?: Date;
  breaks: Break[];
  totalHours: number;
  netHours: number;
  signature?: Signature;
  isSigned: boolean;
  isLocked: boolean;
  location?: GeoLocation;
  createdAt: Date;
  updatedAt: Date;
}
```

#### NotificationTemplate

```typescript
interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### NotificationCampaign

```typescript
interface NotificationCampaign {
  id: string;
  name: string;
  templateId: string;
  targetAudience: TargetAudience;
  channels: NotificationChannel[];
  scheduledAt?: Date;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringInterval: number;
  maxRecurrences?: number;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  totalRecipients: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Verwendung

### 1. Dashboard aufrufen

1. Als Admin einloggen
2. Navigation zu "Dashboard"
3. KPI-Widgets überprüfen
4. Tabs für verschiedene Bereiche nutzen

### 2. Arbeitszeiten überwachen

1. Tab "Arbeitszeiten" öffnen
2. Live-Übersicht aller aktiven Einsätze
3. DSGVO-Warnungen beachten
4. Bei Bedarf Pausen oder Stopps veranlassen

### 3. Benachrichtigungen verwalten

1. Tab "Benachrichtigungen" öffnen
2. Vorlagen erstellen/bearbeiten
3. Kampagnen planen und starten
4. Ergebnisse überwachen

### 4. Chat-System nutzen

1. Tab "Chat" öffnen
2. Direktnachrichten oder Gruppen erstellen
3. Kommunikation mit Mitarbeitern
4. Moderation bei Bedarf

## 📱 Responsive Design

### Desktop (≥1280px)

- Vollständige Funktionalität
- Bottom Navigation
- Tab-basierte Organisation
- Glasmorphism-Design

### Tablet (768px - 1279px)

- Angepasste Layouts
- Touch-optimierte Bedienung
- Kompakte Darstellung

### Mobile (<768px)

- Mobile-First Navigation
- Drawer-basierte Menüs
- Touch-optimierte Komponenten
- Vertikale Layouts

## 🔒 Sicherheit & DSGVO

### Authentifizierung

- Firebase Auth mit Custom Claims
- Rollenbasierte Zugriffskontrolle
- Einladungsbasierter Zugang

### Datenschutz

- DSGVO-konforme Arbeitszeit-Grenzen
- Automatische Pausen-Erinnerungen
- Audit-Trails für alle Aktionen
- Verschlüsselte Datenübertragung

### Berechtigungen

- **Admin:** Vollzugriff auf alle Features
- **Mitarbeiter:** Eingeschränkter Zugriff
- **Keine externen Nutzer**

## 🧪 Testing

### Unit Tests

- Komponenten-Tests mit Jest
- Hook-Tests für Business-Logik
- Utility-Funktionen

### Integration Tests

- React Testing Library
- Firebase Emulator
- Mock-Services

### E2E Tests

- Playwright für kritische Flows
- Desktop-First Testing
- DSGVO-Compliance Tests

## 📊 Performance

### Optimierungen

- React Query für intelligentes Caching
- Lazy Loading für seltene Komponenten
- Virtualisierung für große Datenmengen
- Optimistic Updates

### Monitoring

- Bundle-Analyse mit Webpack Bundle Analyzer
- Performance-Metriken
- Error Boundaries
- Loading States

## 🔮 Zukünftige Erweiterungen

### Geplante Features

- **KI-gestützte Arbeitszeit-Optimierung**
- **Erweiterte Reporting-Funktionen**
- **Mobile App (React Native)**
- **API für Drittanbieter-Integration**

### Skalierbarkeit

- Multi-Mandanten-Architektur
- Microservices-Ansatz
- Cloud-Native Deployment
- Global Distribution

## 📞 Support

### Dokumentation

- Diese README-Datei
- API-Dokumentation
- Video-Tutorials
- Best Practices

### Kontakt

- Technischer Support: support@jobflow.de
- Feature-Requests: features@jobflow.de
- Bug-Reports: bugs@jobflow.de

---

**JobFlow v2.0** - Entwickelt für moderne Zeitarbeitsfirmen im Pflegebereich

```

---

## Lohnabrechnung

*7 Dateien*

### 📄 LOHNABRECHNUNG_EXPORT_DOKUMENTATION.md

```markdown
# Lohnabrechnung - Export-Funktionen für Admin

**Datum:** 2025-01  
**Status:** ✅ **Implementiert**  
**Ziel:** Vollständige Export-Funktionen für Steuerberater

---

## ✅ Verfügbare Export-Formate

### 1. DATEV Export (für Steuerberater)

**Format:** DATEV-konformes CSV (EXTF-Format, LODAS)

**Dateiname:** `DATEV_Lohnbuchhaltung_[Jahr]_[Monat].csv`

**Inhalt:**
- ✅ Header mit DATEV-Version, Firmendaten, Periode
- ✅ Pro Mitarbeiter: Vollständige Lohnabrechnungsdaten
- ✅ **Alle Lohnnebenkosten-Details** (AG-Anteile, Unfallversicherung, Insolvenzgeldumlage)
- ✅ Stunden (regulär, Überstunden, Nacht, Wochenende, Feiertag)
- ✅ Zuschlagsbeträge
- ✅ Footer mit Summen

**Verwendung:**
- Direkter Import in DATEV möglich
- Steuerberater kann direkt weiterarbeiten
- Alle notwendigen Daten enthalten

**Zugriff:**
- Admin: Export-Menü → "DATEV Export"

---

### 2. Vollständiger CSV Export (für Steuerberater)

**Format:** CSV (UTF-8 mit BOM für Excel-Kompatibilität)

**Dateiname:** `Lohnabrechnung_Vollstaendig_[Jahr]_[Monat].csv`

**Inhalt (37 Spalten):**

#### Basis-Informationen:
- Personalnummer
- Name
- Jahr
- Monat

#### Brutto/Netto:
- Bruttogehalt
- Nettogehalt

#### Steuern (detailliert):
- Lohnsteuer
- Solidaritätszuschlag
- Kirchensteuer
- Steuern Gesamt

#### Sozialversicherung (AN):
- KV (AN)
- RV (AN)
- ALV (AN)
- PV (AN)
- SV Gesamt (AN)

#### Lohnnebenkosten (AG) - **VOLLSTÄNDIG**:
- AG-Anteil KV
- AG-Anteil RV
- AG-Anteil ALV
- AG-Anteil PV
- Unfallversicherung
- Insolvenzgeldumlage
- Lohnnebenkosten Gesamt
- Gesamt AG-Kosten

#### Stunden:
- Reguläre Stunden
- Überstunden
- Nachtstunden
- Wochenendstunden
- Feiertagsstunden
- Gesamtstunden

#### Zuschlagsbeträge:
- Überstundenvergütung
- Nachtzuschlag
- Wochenendzuschlag
- Feiertagszuschlag
- Boni
- Abzüge

**Zusammenfassung:**
- Summenzeile am Ende mit Gesamtwerten

**Verwendung:**
- Excel-Import möglich
- Vollständige Übersicht für Steuerberater
- Alle Details für Buchhaltung

**Zugriff:**
- Admin: Export-Menü → "Vollständiger CSV Export"

---

### 3. PDF Export

**Format:** PDF (A4)

**Dateiname:** `Lohnabrechnung_[Jahr]_[Monat].pdf`

**Inhalt:**
- Deckblatt mit Periode und Status
- Detailtabelle aller Mitarbeiter
- Zusammenfassung (Brutto, Netto, AG-Kosten)
- Druckbare Übersicht

**Verwendung:**
- Archivierung
- Druckbare Übersicht
- Präsentation

**Zugriff:**
- Admin: Export-Menü → "PDF Export"

---

## ✅ Admin-UI

### Export-Menü

**Zugriff:**
- Export-Icon (Download) in jeder Perioden-Zeile
- Nur verfügbar wenn Status ≥ 'ready'

**Optionen:**
1. **DATEV Export** - Für Steuerberater (DATEV-Format)
2. **Vollständiger CSV Export** - Alle Details für Steuerberater
3. **PDF Export** - Druckbare Übersicht

**Funktionen:**
- Automatischer Download nach Export
- Toast-Benachrichtigung bei Erfolg/Fehler
- Audit-Logging aller Exports

---

## ✅ Daten-Vollständigkeit

### DATEV Export enthält:

✅ **Basis-Daten:**
- Personalnummer
- Name
- Jahr/Monat
- Brutto/Netto

✅ **Steuern:**
- Lohnsteuer
- Solidaritätszuschlag
- Kirchensteuer

✅ **Sozialversicherung (AN):**
- KV, RV, ALV, PV
- Gesamt SV (AN)

✅ **Lohnnebenkosten (AG) - VOLLSTÄNDIG:**
- AG-Anteil KV
- AG-Anteil RV
- AG-Anteil ALV
- AG-Anteil PV
- Unfallversicherung
- Insolvenzgeldumlage
- Gesamt Lohnnebenkosten
- Gesamt AG-Kosten

✅ **Stunden:**
- Überstunden
- Nachtstunden
- Wochenendstunden
- Feiertagsstunden

✅ **Zuschlagsbeträge:**
- Überstundenvergütung
- Nachtzuschlag
- Wochenendzuschlag
- Feiertagszuschlag

---

### Vollständiger CSV Export enthält:

✅ **Alle Daten aus DATEV Export PLUS:**
- Reguläre Stunden
- Gesamtstunden
- Boni
- Abzüge
- Zusammenfassungszeile

---

## ✅ Steuerberater-Integration

### DATEV Import

**Schritte:**
1. Admin exportiert DATEV-Datei
2. Datei an Steuerberater senden
3. Steuerberater importiert in DATEV
4. Weiterverarbeitung in DATEV möglich

**Vorteile:**
- Keine manuelle Dateneingabe
- Fehlerfreie Übertragung
- Zeitersparnis

### CSV Import

**Schritte:**
1. Admin exportiert vollständigen CSV
2. Datei in Excel öffnen
3. Steuerberater kann alle Daten prüfen
4. Weitere Verarbeitung möglich

**Vorteile:**
- Excel-kompatibel
- Vollständige Übersicht
- Einfache Prüfung

---

## ✅ Audit-Logging

**Alle Exports werden geloggt:**
- Wer hat exportiert
- Wann wurde exportiert
- Welche Periode
- Export-Format
- Anzahl Mitarbeiter
- Gesamtbeträge

**Zugriff:**
- Nur Admin
- Audit-Log-Dialog in UI

---

## ✅ Sicherheit

**Zugriffskontrolle:**
- Nur Admin kann exportieren
- Firestore Security Rules prüfen Rolle
- Cloud Functions prüfen Berechtigung

**Daten:**
- Sensible Daten (IBAN, SV-Nr.) verschlüsselt
- Export enthält nur notwendige Daten
- Audit-Log für Compliance

---

## ✅ Verwendung

### DATEV Export

```typescript
// In Admin-UI
const url = await exportDATEV.mutateAsync(periodId);
// Automatischer Download
```

### Vollständiger CSV Export

```typescript
// In Admin-UI
const url = await exportFullCSV.mutateAsync(periodId);
// Automatischer Download
```

### PDF Export

```typescript
// In Admin-UI
const url = await exportPDF.mutateAsync(periodId);
// Automatischer Download
```

---

## ✅ Workflow für Steuerberater

### Option 1: DATEV Import

1. Admin exportiert DATEV-Datei
2. Datei per E-Mail/Cloud an Steuerberater
3. Steuerberater importiert in DATEV
4. Weiterverarbeitung in DATEV

### Option 2: CSV Prüfung

1. Admin exportiert vollständigen CSV
2. Datei in Excel öffnen
3. Steuerberater prüft alle Daten
4. Bei Bedarf: DATEV-Export für Import

---

## ✅ Vorteile

1. **Lückenlos:** Alle Daten werden exportiert
2. **Steuerberater-ready:** DATEV-Format direkt importierbar
3. **Vollständig:** Alle Lohnnebenkosten-Details enthalten
4. **Einfach:** Ein Klick für Export
5. **Sicher:** Audit-Logging für Compliance

---

**Dokumentationsstand:** 2025-01  
**Nächste Review:** Nach Test-Exports

```

---

### 📄 LOHNABRECHNUNG_FEHLER.md

```markdown
# KRITISCHER FEHLER GEFUNDEN - Beitragsbemessungsgrenzen 2025

**Datum:** 2025-01  
**Status:** 🔴 **FEHLER GEFUNDEN**  
**Schweregrad:** KRITISCH

---

## ❌ FEHLER: Falsche Beitragsbemessungsgrenzen

### Aktuell im Code (FALSCH):
- RV/ALV: **7.050€** ❌
- KV/PV: **4.987,50€** ❌

### Korrekte Werte 2025 (offiziell):
- RV/ALV: **8.050€** ✅
- KV/PV: **5.512,50€** ✅

**Quellen:**
- Bundesregierung: https://www.bundesregierung.de/breg-de/aktuelles/beitragsgemessungsgrenzen-2386514
- WST: https://www.wst.de/blog/2024/12/04/mindestlohn-und-beitragsbemessungsgrenzen-in-der-sozialversicherung-steigen-in-2025/

---

## ❌ FEHLER: Midijob untere Grenze

### Aktuell im Code (FALSCH):
- Midijob untere Grenze: **520,01€** ❌

### Korrekte Werte 2025:
- Midijob untere Grenze: **556,01€** ✅ (nicht 520,01€!)

**Quelle:** TK.de - Midijob-Grenzen 2025

---

## ✅ Korrekte Werte 2025 (vollständig)

### Beitragsbemessungsgrenzen:
- **RV/ALV:** 8.050€/Monat (96.600€/Jahr)
- **KV/PV:** 5.512,50€/Monat (66.150€/Jahr)

### Minijob/Midijob:
- **Minijob:** bis 556€/Monat
- **Midijob:** 556,01€ - 2.000€/Monat

### Mindestlohn:
- **12,82€/Stunde** ✅ (korrekt)

### Beitragssätze:
- **ALV:** 1,2% ✅ (korrekt)
- **Insolvenzgeldumlage:** 0,06% ✅ (korrekt)

---

## 🔧 SOFORTIGE KORREKTUR ERFORDERLICH

**Betroffene Dateien:**
1. `lib/config/payrollRules.ts`
2. `lib/services/payroll/socialSecurityCalculation.ts`
3. `functions/src/payroll/payrollCalculationService.ts`

**Auswirkung:**
- Falsche Berechnung für Gehälter > 7.050€ (sollte 8.050€ sein)
- Falsche Berechnung für Gehälter > 4.987,50€ (sollte 5.512,50€ sein)
- Falsche Midijob-Einstufung bei 520,01€ - 556€

**Rechtliche Konsequenzen:**
- Zu niedrige Abzüge bei hohen Gehältern
- Falsche Midijob-Einstufung
- **Rechtliche Haftung bei falscher Abrechnung**

---

**Status:** 🔴 **SOFORTIGE KORREKTUR ERFORDERLICH**

```

---

### 📄 LOHNABRECHNUNG_KORREKTUREN.md

```markdown
# Lohnabrechnung - Durchgeführte Korrekturen

**Datum:** 2025-01  
**Status:** ✅ Abgeschlossen  
**Ziel:** Konsistente Umsetzung aller kritischen Werte für 2025

---

## 1. Durchgeführte Korrekturen

### ✅ 1.1 Beitragsbemessungsgrenzen vereinheitlicht

**Problem:** Drei verschiedene Werte im Code (7.050€, 7.500€, 7.550€)

**Korrektur:**
- ✅ `lib/config/payrollRules.ts`: 7.050€ (bereits korrekt)
- ✅ `functions/src/payroll/payrollCalculationService.ts`: 7.500€ → **7.050€** korrigiert
- ✅ `lib/services/payroll/socialSecurityCalculation.ts`: 7.550€ → **7.050€** korrigiert

**Korrekte Werte 2025:**
- RV/ALV: **7.050,00 €/Monat** (vereinheitlicht, war 7.500€ West in 2024)
- KV/PV: **4.987,50 €/Monat** (unverändert)

---

### ✅ 1.2 Beitragssätze korrigiert

**Problem:** Falsche Beitragssätze

**Korrektur:**
- ✅ ALV (Arbeitnehmer): 1,3% → **1,2%** korrigiert
- ✅ Insolvenzgeldumlage: 0,09% → **0,06%** korrigiert

**Korrekte Werte 2025:**
- Arbeitslosenversicherung: **1,2%** (AN) + **1,2%** (AG) = 2,4% gesamt
- Insolvenzgeldumlage: **0,06%** (nur AG, EntgeltSiG)

**Geänderte Dateien:**
- ✅ `lib/services/payroll/socialSecurityCalculation.ts` (3 Stellen korrigiert)
- ✅ `lib/config/payrollRules.ts` (bereits korrekt)

---

### ✅ 1.3 Minijob/Midijob-Grenzen korrigiert

**Problem:** Falsche Grenzen (538€ statt 556€, 538€ statt 520,01€)

**Korrektur:**
- ✅ Minijob-Grenze: 538€ → **556€** korrigiert
- ✅ Midijob untere Grenze: 538€ → **520,01€** korrigiert
- ✅ Midijob obere Grenze: 2.000€ (bereits korrekt)

**Korrekte Werte 2025:**
- Minijob: bis **556€/Monat**
- Midijob: **520,01€ - 2.000€/Monat**

**Geänderte Dateien:**
- ✅ `lib/services/payroll/socialSecurityCalculation.ts`
- ✅ `lib/config/payrollRules.ts` (bereits korrekt)

---

### ✅ 1.4 Pflegeversicherung - Kinderlosigkeit korrigiert

**Problem:** Unklare Berechnung des Zuschlags bei Kinderlosigkeit >23J

**Korrektur:**
- ✅ Zuschlag korrekt berechnet: 0,145% (1,680% - 1,535%)
- ✅ Kommentare hinzugefügt für Klarheit

**Korrekte Werte 2025:**
- Pflegeversicherung (normal): **1,535%** (AN) + **1,535%** (AG) = 3,07%
- Pflegeversicherung (kinderlos >23J): **1,680%** (AN) + **1,535%** (AG) = 3,215%

**Geänderte Dateien:**
- ✅ `lib/services/payroll/socialSecurityCalculation.ts`

---

### ✅ 1.5 Mindestlohn-Validierung aktiviert

**Problem:** Validierung vorhanden, aber nicht automatisch aufgerufen

**Korrektur:**
- ✅ Mindestlohn-Validierung in `calculatePayroll()` integriert
- ✅ Automatische Prüfung bei Berechnung
- ✅ Fehler wird geworfen bei Verstoß

**Geänderte Dateien:**
- ✅ `lib/services/payroll/payrollCalculation.ts`

**Code:**
```typescript
// 2. Mindestlohn-Validierung (MiLoG §1)
if (employee.hourlyRate) {
  const { validateHourlyRate } = await import('@/lib/config/payrollRules');
  const validation = validateHourlyRate(employee.hourlyRate);
  if (!validation.valid) {
    throw new Error(`MINDESTLOHN-VERSTOSS: ${validation.error}`);
  }
}
```

---

### ✅ 1.6 Sozialversicherungsberechnung - Parameter korrigiert

**Problem:** `calculateSocialSecurity()` wurde ohne `hasChildren` und `isOver23` aufgerufen

