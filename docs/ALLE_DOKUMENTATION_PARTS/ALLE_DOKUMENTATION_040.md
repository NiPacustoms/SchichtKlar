# JobFlow – Dokumentation Teil 40

*Zeichen 775028–794896 von 2862906*

---

7. **Admin Chat Service Unread Count**
   - Unread-Count Berechnung implementieren
   - Geschätzte Zeit: 1-2 Tage

8. **Settings Service Import**
   - User roles, document types, email templates importieren
   - Geschätzte Zeit: 1 Tag

### Priorität 3: Optional

9. **Employee Reports Performance Score**
   - Performance-Score Berechnung implementieren
   - Trend-Berechnung implementieren
   - Goals aus User-Daten laden
   - Geschätzte Zeit: 2-3 Tage

---

## Zusammenfassung

### Stärken
- ✅ Buttons konsistent implementiert
- ✅ Formulare vollständig validiert
- ✅ Service-Funktionen größtenteils implementiert
- ✅ Dialoge gut strukturiert
- ✅ API-Routen vollständig

### Schwächen
- ❌ Employee Reports Datenberechnungen fehlen komplett
- ❌ Payroll Unlock-Funktion fehlt
- ❌ Mehrere TODOs in Services
- ❌ Auth Context nicht überall genutzt

### Empfohlene Maßnahmen

1. **Sofort:** Employee Reports Datenberechnungen implementieren
2. **Sofort:** Payroll Unlock-Funktion implementieren
3. **Bald:** Auth Context Integration
4. **Bald:** User Service excludeAssigned Logic
5. **Später:** Reports Service Verbesserungen
6. **Später:** Payroll Service Verbesserungen

---

**Nächste Schritte:** Implementierung der Priorität-1-Verbesserungen


```

---

### 📄 ANALYSE_AGENT3_AUSBAUPOTENZIALE.md

```markdown
# Agent 3: Funktionslücken und Ausbaupotenziale

**Datum:** 2025-01-27  
**Status:** Abgeschlossen

## Zusammenfassung

Diese Analyse identifiziert Funktionslücken, Ausbaupotenziale für bestehende Features, bewertet die Nutzerfreundlichkeit und schlägt neue Features vor. Zusätzlich wird die Backend-Integration (Mock-Daten vs. echte Daten) analysiert.

## 1. Kritische Funktionslücken

### 1.1 Chat-System Backend

**Status:** 🔴 **KRITISCH**

**Problem:**
- UI vorhanden (100%)
- Backend fehlt komplett (0%)
- Laut `.cursor/rules/07-todo-implementation.mdc` muss Chat-System "komplett neu implementiert" werden

**Betroffene Seiten:**
- `/admin/chat` - 55% fertig
- `/employee/chat` - 55% fertig
- `/admin/chat/[channelId]` - Wrapper vorhanden
- `/employee/chat/[channelId]` - Wrapper vorhanden

**Impact:** Hoch - Chat ist Kernfeature für Team-Kommunikation

**Empfehlung:**
- Komplette Neuimplementierung des Chat-Backends
- Firestore-Integration für Nachrichten
- Real-time Updates mit onSnapshot
- Channel-Management
- Nachrichten-Verschlüsselung (optional)

### 1.2 Employee Reports Datenberechnungen

**Status:** 🔴 **KRITISCH**

**Problem:**
- UI vorhanden (100%)
- Datenberechnungen fehlen (40%)
- Viele TODOs im Code

**Fehlende Berechnungen:**
```typescript
// lib/services/employeeReports.ts
compensation: {
  paid: 0, // TODO: Aus Payroll-Daten berechnen
  timeOff: 0, // TODO: Aus Time-Off-Daten berechnen
},
emergencyDays: 0, // TODO: Aus Entry-Daten extrahieren
special: 0, // TODO: Aus speziellen Zuschlägen berechnen
performance: {
  score: 0, // TODO: Performance-Score berechnen
  trend: 'stable', // TODO: Trend aus historischen Daten berechnen
  goals: [], // TODO: Aus User-Daten laden
}
```

**Impact:** Hoch - Reports zeigen keine echten Daten

**Empfehlung:**
- Payroll-Daten-Integration
- Time-Off-Daten-Integration
- Performance-Score-Berechnung implementieren
- Trend-Analyse implementieren
- Goals aus User-Daten laden

### 1.3 Payroll Unlock-Funktion

**Status:** 🟠 **MITTEL**

**Problem:**
- TODO im Code: `// TODO: unlock function`
- Funktion zum Entsperren von Lohnabrechnungen fehlt

**Impact:** Mittel - Funktion zum Entsperren fehlt

**Empfehlung:**
- Unlock-Funktion implementieren
- Berechtigungen prüfen
- Audit-Log für Unlock-Aktionen

### 1.4 Detail-Seiten (KORRIGIERT)

**Status:** 🟢 **EXISTIEREN**

**Korrektur:** Entgegen BESTANDSAUFNAHME_EHRLICH.md existieren die Detail-Seiten:
- ✅ `/admin/mitarbeiter/[uid]` - Vollständig implementiert
- ✅ `/admin/einrichtungen/[id]` - Vollständig implementiert
- ✅ `/admin/chat/[channelId]` - Wrapper vorhanden
- ✅ `/employee/chat/[channelId]` - Wrapper vorhanden

**Bemerkung:** Die Detail-Seiten sind vorhanden, aber könnten erweitert werden.

## 2. Backend-Integration

### 2.1 Seiten mit echten Firebase-Daten

**Status:** 🟢 Vollständig migriert

- ✅ Dashboard (Admin & Employee) - Nutzt echte Services
- ✅ Authentifizierung - Firebase Auth aktiv
- ✅ Schichtverwaltung - Vollständiges CRUD
- ✅ Zeiterfassung - Timer funktioniert
- ✅ Dokumentenverwaltung - Upload/Download/View
- ✅ Mitarbeiterverwaltung (Liste) - CRUD funktioniert
- ✅ Einrichtungsverwaltung (Liste) - CRUD funktioniert
- ✅ Benachrichtigungen - Backend vorhanden

### 2.2 Seiten mit Mock-Daten oder TODOs

**Status:** 🟡 Teilweise Mock/TODO

- ⚠️ Employee Reports - Viele Datenberechnungen fehlen (TODOs)
- ⚠️ Chat-System - Backend fehlt komplett
- ⚠️ Payroll - TODO für unlock function
- ⚠️ Einrichtungen Export - TODO vorhanden

### 2.3 Fehlende Service-Implementierungen

**Status:** 🟠 Teilweise fehlend

- ❌ Chat-Service - Muss komplett neu implementiert werden
- ⚠️ Employee Reports Service - Teilweise TODOs
- ⚠️ Payroll Service - Unlock-Funktion fehlt
- ⚠️ Export-Service - Teilweise TODOs

### 2.4 Unvollständige Datenberechnungen

**Status:** 🟠 Teilweise unvollständig

- ⚠️ Overtime-Berechnungen - Teilweise implementiert
- ⚠️ Surcharge-Berechnungen - Teilweise implementiert
- ⚠️ Performance-Score - Fehlt komplett
- ⚠️ Trend-Analyse - Fehlt komplett

## 3. Nutzerfreundlichkeit

### 3.1 Fehlende Bestätigungs-Dialoge

**Status:** 🟡 Teilweise vorhanden

**Vorhanden:**
- ✅ Schicht löschen - Bestätigungs-Dialog
- ✅ Mitarbeiter löschen - Bestätigungs-Dialog
- ✅ Dokument löschen - Bestätigungs-Dialog

**Fehlend:**
- ❌ Bulk-Operationen - Keine Bestätigung
- ❌ Kritische Aktionen - Teilweise fehlend
- ❌ Daten-Export - Keine Bestätigung

**Empfehlung:**
- Bestätigungs-Dialoge für alle kritischen Aktionen
- Warnung bei Bulk-Operationen
- Bestätigung bei Daten-Export

### 3.2 Unklare Fehlermeldungen

**Status:** 🟡 Teilweise unklar

**Probleme:**
- ⚠️ Technische Fehlermeldungen für Endnutzer
- ⚠️ Fehlende Kontext-Informationen
- ⚠️ Inkonsistente Error-Messages

**Empfehlung:**
- User-friendly Error-Messages
- Kontext-spezifische Fehlermeldungen
- Hilfe-Links bei Fehlern

### 3.3 Fehlende Hilfe-Texte oder Tooltips

**Status:** 🟠 Fehlend

**Probleme:**
- ❌ Keine Tooltips auf Buttons
- ❌ Keine Hilfe-Texte in Formularen
- ❌ Keine Onboarding-Tour
- ❌ Keine Kontext-Hilfe

**Empfehlung:**
- Tooltips auf allen Buttons
- Hilfe-Texte in Formularen
- Onboarding-Tour für neue Nutzer
- Kontext-Hilfe-System

### 3.4 Mobile-Responsiveness-Probleme

**Status:** 🟡 Teilweise Probleme

**Probleme:**
- ⚠️ BottomNavigation vorhanden, aber möglicherweise nicht optimal
- ⚠️ Formulare möglicherweise nicht optimal für Mobile
- ⚠️ Tabellen möglicherweise nicht scrollbar

**Empfehlung:**
- Mobile-First Testing
- Responsive Formulare
- Scrollbare Tabellen
- Touch-optimierte Buttons

### 3.5 Accessibility-Probleme

**Status:** 🟡 Teilweise Probleme

**Probleme:**
- ⚠️ ARIA-Labels teilweise fehlend
- ⚠️ Keyboard-Navigation nicht vollständig
- ⚠️ Screen-Reader-Unterstützung unklar

**Empfehlung:**
- ARIA-Labels auf allen interaktiven Elementen
- Vollständige Keyboard-Navigation
- Screen-Reader-Testing
- WCAG AA Compliance

## 4. Feature-Ausbaupotenziale

### 4.1 Erweiterte Filter- und Suchfunktionen

**Status:** 🟡 Teilweise vorhanden

**Vorhanden:**
- ✅ Basis-Suche in Listen
- ✅ Filter nach Status
- ✅ Filter nach Zeitraum

**Fehlend:**
- ❌ Erweiterte Suchfilter
- ❌ Multi-Select-Filter
- ❌ Gespeicherte Filter
- ❌ Schnellsuche (Global Search)

**Empfehlung:**
- Erweiterte Filter-Optionen
- Multi-Select-Filter
- Gespeicherte Filter (Favoriten)
- Global Search über alle Bereiche

### 4.2 Bulk-Operationen

**Status:** 🟠 Fehlend

**Fehlend:**
- ❌ Bulk-Löschung
- ❌ Bulk-Bearbeitung
- ❌ Bulk-Zuweisung
- ❌ Multi-Select

**Empfehlung:**
- Multi-Select in Listen
- Bulk-Operationen für häufige Aktionen
- Bestätigungs-Dialoge für Bulk-Operationen
- Progress-Indicator für Bulk-Operationen

### 4.3 Erweiterte Export-Formate

**Status:** 🟡 Teilweise vorhanden

**Vorhanden:**
- ✅ CSV Export
- ✅ Excel Export
- ✅ PDF Export

**Fehlend:**
- ❌ JSON Export
- ❌ XML Export
- ❌ Custom Export-Templates
- ❌ Scheduled Exports

**Empfehlung:**
- JSON/XML Export hinzufügen
- Custom Export-Templates
- Scheduled Exports (automatisch)
- Export-Historie

### 4.4 Benachrichtigungen und Reminder

**Status:** 🟡 Teilweise vorhanden

**Vorhanden:**
- ✅ Benachrichtigungen-Seite
- ✅ Erinnerungen senden (Admin)

**Fehlend:**
- ❌ Push-Benachrichtigungen
- ❌ E-Mail-Benachrichtigungen
- ❌ SMS-Benachrichtigungen
- ❌ Custom Reminder-Regeln

**Empfehlung:**
- Push-Benachrichtigungen (Browser/App)
- E-Mail-Benachrichtigungen
- SMS-Benachrichtigungen (optional)
- Custom Reminder-Regeln
- Benachrichtigungs-Präferenzen

### 4.5 Kalender-Integration

**Status:** 🟠 Fehlend

**Fehlend:**
- ❌ iCal/Google Calendar Export
- ❌ Kalender-Sync
- ❌ Termin-Import

**Empfehlung:**
- iCal/Google Calendar Export
- Kalender-Sync (bidirektional)
- Termin-Import aus Kalendern
- Kalender-View in App

### 4.6 Offline-Funktionalität

**Status:** 🟠 Fehlend

**Fehlend:**
- ❌ Offline-Modus
- ❌ Offline-Daten-Sync
- ❌ Service Worker

**Empfehlung:**
- Service Worker implementieren
- Offline-Modus für kritische Funktionen
- Offline-Daten-Sync
- Offline-Indicator

### 4.7 Erweiterte Reporting-Features

**Status:** 🟡 Teilweise vorhanden

**Vorhanden:**
- ✅ Basis-Reports
- ✅ Export-Funktionen

**Fehlend:**
- ❌ Custom Reports
- ❌ Report-Scheduler
- ❌ Report-Templates
- ❌ Report-Sharing

**Empfehlung:**
- Custom Report-Builder
- Report-Scheduler (automatisch)
- Report-Templates
- Report-Sharing (E-Mail, etc.)

## 5. Performance und Optimierung

### 5.1 Lazy Loading fehlend

**Status:** 🟡 Teilweise vorhanden

**Probleme:**
- ⚠️ Nicht alle Komponenten sind lazy-loaded
- ⚠️ Große Datenmengen werden sofort geladen
- ⚠️ Keine Code-Splitting-Strategie

**Empfehlung:**
- Lazy Loading für alle großen Komponenten
- Code-Splitting nach Routen
- Dynamic Imports für schwere Bibliotheken

### 5.2 Unoptimierte Datenabfragen

**Status:** 🟡 Teilweise optimiert

**Probleme:**
- ⚠️ N+1 Query-Probleme möglich
- ⚠️ Keine Query-Caching-Strategie
- ⚠️ Zu viele Daten werden geladen

**Empfehlung:**
- Query-Optimierung
- Caching-Strategie implementieren
- Pagination für große Listen
- Virtual Scrolling für große Listen

### 5.3 Fehlende Caching-Strategien

**Status:** 🟠 Fehlend

**Probleme:**
- ❌ Keine Client-seitige Caching-Strategie
- ❌ Keine Server-seitige Caching-Strategie
- ❌ Keine Cache-Invalidierung

**Empfehlung:**
- React Query Caching optimieren
- Service Worker Caching
- Cache-Invalidierung-Strategie
- Cache-Versionierung

## 6. Neue Feature-Vorschläge

### 6.1 Priorität: Hoch

1. **Dashboard-Widgets**
   - Customizable Dashboard
   - Drag-and-Drop Widgets
   - Widget-Konfiguration

2. **Erweiterte Suche**
   - Global Search
   - Volltext-Suche
   - Such-Historie

3. **Bulk-Operationen**
   - Multi-Select
   - Bulk-Actions
   - Progress-Tracking

### 6.2 Priorität: Mittel

4. **Kalender-Integration**
   - iCal Export
   - Google Calendar Sync
   - Termin-Import

5. **Benachrichtigungen**
   - Push-Benachrichtigungen
   - E-Mail-Benachrichtigungen
   - Benachrichtigungs-Präferenzen

6. **Offline-Modus**
   - Service Worker
   - Offline-Sync
   - Offline-Indicator

### 6.3 Priorität: Niedrig

7. **Custom Reports**
   - Report-Builder
   - Report-Templates
   - Report-Scheduler

8. **Erweiterte Export-Formate**
   - JSON/XML Export
   - Custom Templates
   - Scheduled Exports

9. **Analytics**
   - Nutzungs-Statistiken
   - Performance-Metriken
   - User-Behavior-Tracking

## 7. Production-Readiness

### 7.1 Kritische Lücken für Production

**Status:** 🔴 Nicht Production-Ready

**Kritische Lücken:**
1. ❌ Chat-System Backend fehlt
2. ❌ Employee Reports Daten fehlen
3. ❌ Payroll Unlock-Funktion fehlt
4. ⚠️ Error-Handling teilweise unvollständig
5. ⚠️ Validierung teilweise unvollständig

**Empfehlung:**
- Chat-System Backend implementieren
- Employee Reports Datenberechnungen implementieren
- Payroll Unlock-Funktion implementieren
- Error-Handling vervollständigen
- Validierung vervollständigen

### 7.2 Wichtige Verbesserungen für Production

**Status:** 🟡 Teilweise vorhanden

**Verbesserungen:**
1. ⚠️ Monitoring und Logging
2. ⚠️ Performance-Optimierung
3. ⚠️ Security-Audit
4. ⚠️ Testing (Unit, Integration, E2E)
5. ⚠️ Dokumentation

**Empfehlung:**
- Monitoring-System implementieren
- Performance-Optimierung durchführen
- Security-Audit durchführen
- Testing-Suite erweitern
- Dokumentation vervollständigen

### 7.3 Nice-to-Have für Production

**Status:** 🟢 Optional

**Features:**
1. ✅ Analytics
2. ✅ A/B Testing
3. ✅ Feature Flags
4. ✅ Multi-Language Support
5. ✅ Dark Mode (bereits vorhanden)

## 8. Priorisierte Empfehlungen

### 8.1 Sofort (Kritisch für Production)

1. **Chat-System Backend implementieren**
   - Impact: Hoch
   - Aufwand: Hoch
   - Priorität: Kritisch

2. **Employee Reports Datenberechnungen**
   - Impact: Hoch
   - Aufwand: Mittel
   - Priorität: Kritisch

3. **Payroll Unlock-Funktion**
   - Impact: Mittel
   - Aufwand: Niedrig
   - Priorität: Hoch

### 8.2 Kurzfristig (Wichtig für Production)

4. **Error-Handling vervollständigen**
   - Impact: Hoch
   - Aufwand: Mittel
   - Priorität: Hoch

5. **Validierung vervollständigen**
   - Impact: Mittel
   - Aufwand: Mittel
   - Priorität: Hoch

6. **Performance-Optimierung**
   - Impact: Mittel
   - Aufwand: Hoch
   - Priorität: Mittel

### 8.3 Mittelfristig (Verbesserungen)

7. **Bulk-Operationen**
   - Impact: Mittel
   - Aufwand: Mittel
   - Priorität: Mittel

8. **Erweiterte Suche**
   - Impact: Mittel
   - Aufwand: Mittel
   - Priorität: Mittel

9. **Benachrichtigungen erweitern**
   - Impact: Mittel
   - Aufwand: Hoch
   - Priorität: Mittel

### 8.4 Langfristig (Nice-to-Have)

10. **Kalender-Integration**
    - Impact: Niedrig
    - Aufwand: Hoch
    - Priorität: Niedrig

11. **Offline-Modus**
    - Impact: Niedrig
    - Aufwand: Hoch
    - Priorität: Niedrig

12. **Custom Reports**
    - Impact: Niedrig
    - Aufwand: Hoch
    - Priorität: Niedrig

## 9. Zusammenfassung

### 9.1 Kritische Funktionslücken

1. ❌ Chat-System Backend fehlt komplett
2. ❌ Employee Reports Datenberechnungen fehlen
3. ❌ Payroll Unlock-Funktion fehlt
4. ⚠️ Teilweise fehlende Validierungen
5. ⚠️ Teilweise fehlende Error-Handling

### 9.2 Ausbaupotenziale

1. ✅ Erweiterte Filter- und Suchfunktionen
2. ✅ Bulk-Operationen
3. ✅ Erweiterte Export-Formate
4. ✅ Benachrichtigungen erweitern
5. ✅ Kalender-Integration
6. ✅ Offline-Funktionalität
7. ✅ Erweiterte Reporting-Features

### 9.3 Production-Readiness

**Status:** 🟡 Nicht vollständig Production-Ready

**Geschätzte Zeit bis Production-Ready:** 4-6 Wochen (bei Vollzeit-Entwicklung)

**Kritische Aufgaben:**
- Chat-System Backend (2-3 Wochen)
- Employee Reports Datenberechnungen (1 Woche)
- Payroll Unlock-Funktion (1 Tag)
- Error-Handling & Validierung (1 Woche)
- Testing & Dokumentation (1 Woche)

### 9.4 Empfohlene Maßnahmen

**Sofort:**
1. Chat-System Backend implementieren
2. Employee Reports Datenberechnungen implementieren
3. Payroll Unlock-Funktion implementieren

**Kurzfristig:**
4. Error-Handling vervollständigen
5. Validierung vervollständigen
6. Performance-Optimierung

**Mittelfristig:**
7. Bulk-Operationen hinzufügen
8. Erweiterte Suche implementieren
9. Benachrichtigungen erweitern

**Langfristig:**
10. Kalender-Integration
11. Offline-Modus
12. Custom Reports


```

---

### 📄 ANALYSE_AGENT3_POTENZIALE.md

```markdown
# Agent 3: Funktionslücken und Ausbaupotenziale

**Datum:** 2025-01-27  
**Analysierter Bereich:** Fehlende Features, unvollständige Implementierungen, UX-Optimierungen, technische Verbesserungen

---

## Bekannte Probleme (aus BESTANDSAUFNAHME_EHRLICH.md)

### 1. Chat-System Backend fehlt komplett 🔴 KRITISCH

**Status:** UI vorhanden (100%), Backend fehlt (0%)

**Betroffen:**
- `/admin/chat` - 55% fertig
- `/employee/chat` - 55% fertig
- `/admin/chat/[channelId]` - Existiert, aber sehr einfach
- `/employee/chat/[channelId]` - Existiert, aber sehr einfach

**Problem:**
- Laut `.cursor/rules/07-todo-implementation.mdc` muss das Chat-System "komplett neu implementiert" werden
- Backend-Services fehlen komplett
- Channels/Messages Collections möglicherweise nicht vollständig implementiert

**Impact:** Hoch - Chat ist Kernfeature für Team-Kommunikation

**Empfehlung:**
- Real-time Chat Service mit Firebase Realtime Database oder Firestore
- 1:1 und Gruppen-Chat Interface
- Message-Encryption für DSGVO
- WhatsApp-ähnliche UI mit Typing-Indicators
- File-Sharing Funktionen
- Admin Broadcast-Nachrichten
- Rollen-basierte Kanäle

**Geschätzte Zeit:** 4-6 Wochen

---

### 2. Employee Reports Datenberechnungen fehlen 🔴 KRITISCH

**Status:** UI vorhanden (100%), Daten fehlen (40%)

**Betroffen:**
- `/employee/berichte`

**Problem:**
Viele Daten sind TODOs im Code:
```typescript
weeklyData: [], // TODO: Aus echten Timesheet-Daten berechnen
monthlyOvertime: [], // TODO: Aus echten Timesheet-Daten berechnen
worktimeDetails: [] as WorktimeDetail[], // TODO: Aus echten Timesheet-Daten laden
bonusDetails: [] as BonusDetail[], // TODO: Aus echten Surcharge-Daten laden
vacationDetails: [] as VacationDetail[] // TODO: Aus echten Vacation-Daten laden
```

**Impact:** Hoch - Reports zeigen keine echten Daten

**Empfehlung:**
- Alle Datenberechnungen in `lib/services/employeeReports.ts` implementieren
- Echte Daten aus Timesheets, Payroll, Assignments berechnen
- Performance-Optimierung für große Datenmengen

**Geschätzte Zeit:** 2-3 Wochen

---

### 3. Detail-Seiten fehlen komplett 🔴 KRITISCH

**Status:** Teilweise vorhanden, aber unvollständig

**Betroffen:**
- `/admin/mitarbeiter/[uid]` - ✅ Existiert jetzt (war vorher fehlend)
- `/admin/einrichtungen/[id]` - ✅ Existiert jetzt (war vorher fehlend)
- `/admin/chat/[channelId]` - ✅ Existiert, aber sehr einfach
- `/employee/chat/[channelId]` - ✅ Existiert, aber sehr einfach

**Problem:**
- Chat-Kanal-Seiten sind sehr einfache Wrapper
- Möglicherweise fehlen noch weitere Detail-Seiten

**Impact:** Mittel - Funktionalität vorhanden, aber ausbaufähig

**Empfehlung:**
- Chat-Kanal-Seiten erweitern
- Weitere Detail-Seiten prüfen

**Geschätzte Zeit:** 1-2 Wochen

---

### 4. Payroll Unlock-Funktion fehlt ⚠️ MITTEL

**Status:** TODO im Code vorhanden

**Betroffen:**
- `/admin/lohnabrechnung`
- `/admin/mitarbeiter/[uid]/gehalt`

**Problem:**
- `unlockPayroll()` Funktion fehlt komplett
- TODO: `// TODO: unlock function`

**Impact:** Mittel - Funktion zum Entsperren von Lohnabrechnungen fehlt

**Empfehlung:**
- `unlockPayroll()` Funktion implementieren
- Security-Checks hinzufügen (nur Admin)
- Audit-Logging hinzufügen

**Geschätzte Zeit:** 1-2 Tage

---

## Feature-Lücken

### 1. Fehlende CRUD-Operationen

**Problem:** Einige CRUD-Operationen fehlen oder sind unvollständig

**Betroffen:**
- Stationen-Verwaltung in Einrichtungen (nur Add/Update/Remove, keine Liste)
- Dokument-Typen-Verwaltung (möglicherweise unvollständig)

**Empfehlung:**
- Vollständige CRUD-Operationen für alle Entitäten
- Konsistente API-Struktur

**Geschätzte Zeit:** 1 Woche

---

### 2. Export-Funktionen teilweise TODOs

**Problem:** Einige Export-Funktionen sind TODOs

**Betroffen:**
- Einrichtungen-Export (TODO vorhanden)
- Verschiedene Report-Exports

**Empfehlung:**
- Alle Export-Funktionen implementieren
- CSV, Excel, PDF-Export für alle relevanten Daten

**Geschätzte Zeit:** 1-2 Wochen

---

### 3. Bulk-Operationen fehlen

**Problem:** Keine Bulk-Import/Export-Funktionen

**Betroffen:**
- Mitarbeiter-Import/Export
- Schichten-Import/Export
- Einrichtungen-Import/Export

**Empfehlung:**
- CSV/Excel Import für Mitarbeiter/Kunden
- Bulk-Update Operationen
- Datenbereinigung Tools

**Geschätzte Zeit:** 2-3 Wochen

---

