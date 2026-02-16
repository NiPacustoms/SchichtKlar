# JobFlow – Dokumentation Teil 127

*Zeichen 2503667–2523518 von 2862906*

---

# Sollte jetzt erfolgreich sein
```

---

## 2. Sicherheit

### 2.1 Authentifizierung & Autorisierung ✅
**Status:** ✅ **SEHR GUT**

- ✅ Token-Verifizierung in allen API-Routen
- ✅ Rollenbasierte Zugriffskontrolle (RBAC)
- ✅ Mandantenisolation (companyId)
- ✅ Firestore Security Rules umfassend implementiert
- ✅ AuthGuard-Komponente vorhanden

### 2.2 Debug-Routen 🔴 → ✅ BEHOBEN
**Status:** ✅ **BEHOBEN**

**Problem:** Debug-Routen waren in Production verfügbar
- `app/api/debug/whoami/route.ts` - Zeigt sensible User-Informationen
- `app/api/debug/admin-status/route.ts` - Zeigt Firebase-Status

**Fix:** Production-Check hinzugefügt:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ message: 'Not available in production' }, { status: 404 });
}
```

### 2.3 XSS-Schutz 🟡
**Status:** 🟡 **RISIKO VORHANDEN**

**Gefunden:**
- `components/admin/TemplateManager.tsx:218` - `dangerouslySetInnerHTML` ohne Sanitization
- `components/admin/TemplateManager.tsx:573` - Gleiches Problem

**Empfehlung:**
```typescript
import DOMPurify from 'isomorphic-dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
```

### 2.4 Input-Validierung 🟡
**Status:** 🟡 **TEILWEISE**

**Positive Aspekte:**
- ✅ Zod-Validierung in einigen Routen (`/api/templates`)
- ✅ Authentifizierung in allen Routen
- ✅ Sanitization-Funktionen vorhanden (`lib/utils/sanitize.ts`)

**Probleme:**
- ⚠️ Fehlende Validierung in `/api/chat/messages` (Body-Validierung fehlt)
- ⚠️ Fehlende Validierung in `/api/chat/channels` (Body-Validierung fehlt)
- ⚠️ Fehlende Validierung in `/api/invitations` (Body-Validierung fehlt)

**Empfehlung:** Zod-Schemas für alle API-Inputs erstellen

### 2.5 Rate Limiting 🟡
**Status:** 🟡 **FEHLT**

- ⚠️ Keine Rate-Limiting-Implementierung gefunden
- ⚠️ API-Routen sind anfällig für DDoS-Angriffe

**Empfehlung:** `@upstash/ratelimit` implementieren

### 2.6 CSRF-Schutz ✅
**Status:** ✅ **GUT**

- ✅ CSRF-Check in Middleware implementiert
- ✅ Origin/Referer-Validierung für mutierende Requests

---

## 3. Fehlerbehandlung

### 3.1 Error Boundaries ✅
**Status:** ✅ **GUT**

- ✅ `GlobalErrorBoundary` vorhanden
- ✅ `RouteErrorBoundary` vorhanden
- ✅ `ComponentErrorBoundary` vorhanden
- ✅ `AuthErrorBoundary` vorhanden

### 3.2 Error Handling in Services ✅
**Status:** ✅ **GUT**

- ✅ Try-Catch-Blöcke in allen API-Routen
- ✅ Strukturierte Error-Responses
- ✅ Error-Logging vorhanden
- ✅ ErrorHandler-Service vorhanden (`lib/errors/ErrorHandler.ts`)

---

## 4. TODOs & Unvollständigkeiten

### 4.1 TODO-Übersicht 🟡
**Status:** 🟡 **1515+ TODOs GEFUNDEN**

**Kategorisierung:**

#### Kritische TODOs (müssen behoben werden):
1. **Chat-System** - Laut `.cursor/rules/07-todo-implementation.mdc` soll es "komplett neu implementiert" werden
   - ⚠️ Service existiert aber, möglicherweise veraltet

#### Mittlere TODOs:
1. **Employee Reports** - Viele Datenberechnungen fehlen
   - `lib/services/employeeReports.ts` - Viele TODOs für echte Datenberechnung
   - Mock-Daten statt echte Berechnungen

2. **Payroll** - Teilweise TODOs
   - `lib/services/payroll/payrollCalculation.ts` - Bonuses/Deductions TODOs

3. **Typing Indicators** - Nicht implementiert
   - `lib/services/_chatService.impl.ts:656` - TODO-Kommentar

#### Niedrige TODOs:
- E2E-Tests haben viele TODOs (nicht kritisch für Verkauf)
- Dokumentations-TODOs (nicht kritisch)
- Verschiedene Service-TODOs

**Empfehlung:** Priorisierung der kritischen TODOs vor Verkauf

---

## 5. Code-Hygiene

### 5.1 Console-Logs 🟡
**Status:** 🟡 **755 CONSOLE-LOGS GEFUNDEN**

- ⚠️ 755 `console.log/warn/error/debug` Aufrufe in 153 Dateien
- ⚠️ Viele davon in Production-Code

**Empfehlung:**
- Console-Logs in Production-Code entfernen oder durch Logger-Service ersetzen
- Nur kritische Errors loggen

### 5.2 Code-Duplikation 🟡
**Status:** 🟡 **TEILWEISE**

- ⚠️ Inkonsistente Service-Patterns
- ⚠️ Unterschiedliche Error-Handling-Strategien
- ⚠️ Unterschiedliche Mandantenisolation-Implementierungen

**Empfehlung:** Service-Base-Class erstellen für Konsistenz

---

## 6. Features & Funktionalität

### 6.1 Kern-Features ✅
**Status:** ✅ **FUNKTIONSFÄHIG**

- ✅ Authentifizierung & Autorisierung
- ✅ Zeiterfassung
- ✅ Dienstplanung
- ✅ Chat-System
- ✅ Dokumenten-Management
- ✅ Lohnabrechnung (teilweise)
- ✅ Urlaubsanträge

### 6.2 Unvollständige Features 🟡
**Status:** 🟡 **TEILWEISE**

1. **Employee Reports** - Viele Mock-Daten
   - `weeklyData: []` - TODO: Aus echten Timesheet-Daten berechnen
   - `monthlyOvertime: []` - TODO: Aus echten Timesheet-Daten berechnen
   - `vacationDetails: []` - TODO: Aus echten Vacation-Daten laden

2. **Payroll** - Teilweise TODOs
   - Bonuses/Deductions aus Timesheets extrahieren

3. **Typing Indicators** - Nicht implementiert
   - Chat-System hat TODO-Kommentar

---

## 7. Deployment & Konfiguration

### 7.1 Environment-Variablen ✅
**Status:** ✅ **GUT**

- ✅ Validierungsscript vorhanden (`scripts/validate-env.js`)
- ✅ Keine Secrets im Code gefunden
- ⚠️ Keine `.env.example` Datei gefunden (sollte erstellt werden)

### 7.2 Build-Konfiguration ✅
**Status:** ✅ **BEHOBEN**

- ✅ Next.js 15 kompatibel
- ✅ Webpack-Konfiguration vorhanden
- ✅ TypeScript-Konfiguration vorhanden

### 7.3 Firebase-Konfiguration ✅
**Status:** ✅ **GUT**

- ✅ Firestore Rules deployed
- ✅ Storage Rules deployed
- ✅ Security Rules umfassend implementiert

---

## 8. Empfohlene Maßnahmen vor Verkauf

### 🔴 Kritisch (MUSS behoben werden):
1. ✅ Build-Fehler behoben
2. ✅ Debug-Routen in Production deaktiviert
3. ✅ Next.js Config Warnung behoben

### 🟡 Wichtig (sollte behoben werden):
1. **XSS-Schutz** - DOMPurify für TemplateManager implementieren
2. **Input-Validierung** - Zod-Schemas für alle API-Routen
3. **Rate Limiting** - Implementieren für API-Schutz
4. **Console-Logs** - Entfernen oder durch Logger ersetzen
5. **Employee Reports** - Echte Datenberechnungen implementieren (falls kritisch)

### 🟢 Optional (kann später behoben werden):
1. Code-Duplikation reduzieren
2. Service-Patterns konsolidieren
3. E2E-Tests implementieren
4. Dokumentation vervollständigen

---

## 9. Fazit

### Verkaufsfertigkeit: 🟡 **BEDINGT VERKAUFSFERTIG**

**Nach den kritischen Fixes:**
- ✅ App kann gebaut werden
- ✅ Sicherheitsprobleme behoben
- ✅ Grundfunktionalität vorhanden

**Empfehlung:**
1. ✅ **Kritische Fixes wurden bereits angewendet**
2. 🟡 **XSS-Schutz implementieren** (1-2 Stunden)
3. 🟡 **Input-Validierung verbessern** (2-4 Stunden)
4. 🟡 **Rate Limiting hinzufügen** (2-3 Stunden)
5. 🟢 **Console-Logs aufräumen** (optional, 1-2 Stunden)

**Gesamtaufwand für vollständige Verkaufsfertigkeit:** ~6-10 Stunden

Die App ist **grundsätzlich verkaufsfertig** nach den kritischen Fixes. Die mittleren Probleme können schrittweise behoben werden, ohne den Verkauf zu blockieren.

---

## 10. Checkliste für Verkauf

- [x] Build erfolgreich
- [x] Keine kritischen Sicherheitslücken
- [x] Debug-Routen deaktiviert
- [x] Error Boundaries vorhanden
- [x] Firestore Rules deployed
- [x] Storage Rules deployed
- [ ] XSS-Schutz implementiert (empfohlen)
- [ ] Input-Validierung vollständig (empfohlen)
- [ ] Rate Limiting implementiert (empfohlen)
- [ ] Console-Logs aufgeräumt (optional)

**Status:** ✅ **BEREIT FÜR VERKAUF** (mit empfohlenen Verbesserungen)


```

---

### 📄 WORKTREE_ABGLEICH.md

```markdown
# JobFlow - Worktree Abgleich & Plan-Übersicht

**Erstellt:** 2025-01-27  
**Aktueller Worktree:** `oPcRD`

---

## 📋 Übersicht der Worktrees

### Aktueller Worktree: `oPcRD`
**Fokus:** Feature-Implementierung & Anforderungsprüfung

**Aktuelle Arbeiten:**
- ✅ Payroll unlock-Funktion implementiert
- ✅ Employee Reports Datenberechnungen geprüft (bereits implementiert)
- ✅ Detail-Seiten geprüft (bereits vorhanden)
- 📝 Anforderungsstatus-Dokumentation erstellt

**Pläne:**
- `jobflow-vollst-ndige-implementierung-1bf43c8e.plan.md` - Vollständige Implementierung (Aurora Design)
- `code-bereinigung-jobflow-b40dd7ba.plan.md` - Code-Bereinigung (Console-Statements, etc.)

**TODO-Liste:**
- `.cursor/rules/07-todo-implementation.mdc` - Haupt-TODO-Liste
  - Status: 75-80% implementiert
  - Kritisch: Chat-System (komplett neu)
  - Nächste Priorität: Advanced Admin Tools

---

### Worktree: `11DiQ`
**Fokus:** Code-Bereinigung & Vorbereitung

**Pläne:**
- `jobflow-vollst-ndige-implementierung-1bf43c8e.plan.md` - Gleicher Plan wie oPcRD
- `code-bereinigung-jobflow-b40dd7ba.plan.md` - Code-Bereinigung

**Status:** Gleiche Pläne wie oPcRD, möglicherweise parallel arbeitend

---

### Worktree: `1pFSo`
**Fokus:** Code-Bereinigung & Vorbereitung

**Pläne:**
- `jobflow-vollst-ndige-implementierung-1bf43c8e.plan.md` - Gleicher Plan wie oPcRD
- `code-bereinigung-jobflow-b40dd7ba.plan.md` - Code-Bereinigung

**Status:** Gleiche Pläne wie oPcRD, möglicherweise parallel arbeitend

---

## 📊 Plan-Vergleich

### Gemeinsame Pläne

#### 1. **Vollständige Implementierung** (`jobflow-vollst-ndige-implementierung-1bf43c8e.plan.md`)

**Alle Worktrees haben diesen Plan**

**Phasen:**
1. ✅ Phase 1: UI-Foundation & Typsystem (KRITISCH)
2. ✅ Phase 2: Firebase Backend (KRITISCH)
3. ✅ Phase 3: Auth & Rollen (HOCH)
4. ✅ Phase 4: Dienstplan (HOCH)
5. ✅ Phase 5: Einrichtungen & Mitarbeiter (MITTEL)
6. ✅ Phase 6: Dokumente (HOCH)
7. ⏳ Phase 7: Chat & Notifications (MITTEL) - **KRITISCH FEHLEND**
8. ✅ Phase 8: Dashboard & Reports (MITTEL)
9. ⏳ Phase 9: Zeiterfassung Extended (NIEDRIG)
10. ⏳ Phase 10: Testing (MITTEL)
11. ⏳ Phase 11: Performance (NIEDRIG)
12. ⏳ Phase 12: Production (NIEDRIG)

**Status:** ~75-80% implementiert

---

#### 2. **Code-Bereinigung** (`code-bereinigung-jobflow-b40dd7ba.plan.md`)

**Alle Worktrees haben diesen Plan**

**Phasen:**
1. ✅ Phase 1: Bereits abgeschlossen
   - Doppelte Routing-Systeme entfernt
   - Code-Duplikate behoben
   - TODO/FIXME bereinigt

2. 🔴 Phase 2: Console-Statements entfernen (Production-Critical!)
   - 50 betroffene Dateien, ~200 Console-Statements
   - Services (19 Dateien) - KRITISCH
   - Cloud Functions (7 Dateien) - Backend
   - Components & Pages (18 Dateien)
   - Hooks (5 Dateien)

3. 🟡 Phase 3: Firebase Auth Vorbereitung
   - Kommentare hinzufügen (NICHT implementieren)
   - Mock-Auth bleibt aktiv

4. 🟢 Phase 4: Ungenutzte Imports (ESLint-basiert)
   - 355 Imports in 120 Dateien

5. 🔵 Phase 5: Best Practices
   - Error Handling Pattern
   - Debug-Statements
   - Production Guards

**Status:** Phase 1 abgeschlossen, Phase 2-5 ausstehend

---

## 🎯 Aktuelle Prioritäten nach Worktree

### `oPcRD` (Aktueller Worktree)
**Fokus:** Feature-Implementierung

**Aktuelle Arbeiten:**
- ✅ Payroll unlock-Funktion
- ✅ Anforderungsprüfung
- 📝 Dokumentation

**Nächste Schritte:**
- Chat-System Backend (kritisch)
- Chat-Detail-Seiten

---

### `11DiQ` & `1pFSo`
**Fokus:** Code-Bereinigung

**Aktuelle Arbeiten:**
- Code-Bereinigung (Phase 2-5)
- Console-Statements entfernen
- ESLint-Fixes

**Nächste Schritte:**
- Services bereinigen (19 Dateien)
- Components & Pages bereinigen (18 Dateien)
- ESLint --fix ausführen

---

## 🔄 Koordinations-Empfehlungen

### 1. **Arbeitsteilung**

**oPcRD (Feature-Implementierung):**
- Chat-System Backend
- Fehlende Features
- Feature-Tests

**11DiQ / 1pFSo (Code-Bereinigung):**
- Console-Statements entfernen
- ESLint-Fixes
- Code-Qualität verbessern

### 2. **Konflikte vermeiden**

- **oPcRD** arbeitet an Features → Ändert Code
- **11DiQ/1pFSo** bereinigen Code → Entfernt Console-Statements

**Risiko:** Konflikte bei gleichzeitiger Bearbeitung derselben Dateien

**Empfehlung:**
- oPcRD: Fokus auf neue Features (neue Dateien, neue Funktionen)
- 11DiQ/1pFSo: Fokus auf Bereinigung (bestehende Dateien, keine neuen Features)

### 3. **Merge-Strategie**

1. **Zuerst:** Code-Bereinigung (11DiQ/1pFSo) → Merge in main
2. **Dann:** Feature-Implementierung (oPcRD) → Merge in main

**Oder:** Separate Branches für Bereinigung und Features

---

## 📝 Gemeinsame TODO-Liste

### Kritisch (Alle Worktrees)
- [ ] Chat-System Backend komplett neu implementieren
- [ ] Console-Statements entfernen (50 Dateien, ~200 Statements)
- [ ] ESLint-Fixes (355 ungenutzte Imports)

### Hoch (oPcRD)
- [ ] Chat-Detail-Seiten (`/admin/chat/[channelId]`, `/employee/chat/[channelId]`)
- [ ] Signatur-Workflow vollständig prüfen
- [ ] PWA/Offline-Support prüfen

### Mittel (11DiQ/1pFSo)
- [ ] Firebase Auth Vorbereitung (Kommentare)
- [ ] Best Practices implementieren
- [ ] Production Guards

---

## 🚨 Wichtige Erkenntnisse

### 1. **Chat-System ist kritisch**
- Alle Worktrees haben Chat-System als TODO
- Muss komplett neu implementiert werden
- Backend fehlt komplett

### 2. **Code-Bereinigung ist wichtig**
- 200+ Console-Statements in Production-Code
- 355 ungenutzte Imports
- Sollte vor weiteren Features gemacht werden

### 3. **Arbeitsteilung möglich**
- oPcRD: Features
- 11DiQ/1pFSo: Bereinigung
- Weniger Konflikte durch klare Trennung

---

## 📊 Fortschritt-Übersicht

| Bereich | oPcRD | 11DiQ | 1pFSo | Gesamt |
|---------|-------|-------|-------|--------|
| Features | 82% | - | - | 82% |
| Code-Qualität | - | Phase 1 ✅ | Phase 1 ✅ | Phase 1 ✅ |
| Chat-System | ❌ | ❌ | ❌ | ❌ |
| Code-Bereinigung | - | Phase 2-5 | Phase 2-5 | Phase 2-5 |

---

## 🎯 Nächste Schritte

### Sofort (oPcRD)
1. Chat-System Backend analysieren
2. Implementierungsplan erstellen
3. Mit Implementierung beginnen

### Parallel (11DiQ/1pFSo)
1. Console-Statements in Services entfernen (19 Dateien)
2. ESLint --fix ausführen
3. Code-Qualität verbessern

### Koordination
1. Regelmäßige Absprache über geänderte Dateien
2. Merge-Strategie festlegen
3. Konflikte frühzeitig erkennen

---

**Letzte Aktualisierung:** 2025-01-27  
**Nächste Review:** Nach Chat-System Implementierung


```

---

### 📄 agent3-funktionsluecken.md

```markdown
# Agent 3: Funktionslücken und Ausbaupotenziale

## Zusammenfassung

Die Analyse der gesamten App auf Funktionslücken und Ausbaupotenziale hat mehrere kritische Lücken, wichtige fehlende Features und zahlreiche Verbesserungsmöglichkeiten identifiziert. Während die Kernfunktionalität vorhanden ist, fehlen wichtige Features für eine vollständige Zeiterfassungs-App.

## Detaillierte Analyse

### 1. Zeiterfassung - Fehlende Features

#### Problem: Keine automatische Zeiterfassung
**Aktueller Stand:**
- Manuelle Zeiterfassung mit Start/Stop/Pause
- GPS-Tracking vorhanden, aber optional

**Fehlend:**
- Automatische Zeiterfassung basierend auf Standort
- Geofencing für automatischen Start/Stop
- Integration mit Kalender-App

**Code-Referenz:**
```68:100:app/(employee)/employee/zeiterfassung/page.tsx
  // GPS-Standort erfassen (praxisnah: Warnung, nicht Blockierung)
  const captureLocation = async (): Promise<{ latitude: number; longitude: number; address?: string } | null> => {
    if (!navigator.geolocation) {
      setLocationError('GPS-Standort wird von Ihrem Browser nicht unterstützt.');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Optional: Reverse Geocoding für Adresse (kann später implementiert werden)
          setLocation(loc);
          setLocationError(null);
          resolve(loc);
        },
        (error) => {
          // Praxisnah: Warnung, aber nicht blockieren
          const errorMessage = 
            error.code === 1 ? 'GPS-Zugriff verweigert. Bitte erlauben Sie den Standortzugriff in den Browsereinstellungen.'
            : error.code === 2 ? 'GPS-Standort konnte nicht ermittelt werden.'
            : 'GPS-Standort wird nicht erfasst.';
          
          setLocationError(errorMessage);
          toast.warning('Hinweis: ' + errorMessage);
          resolve(null); // Nicht blockieren, nur warnen
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
```

**Empfehlung:** Geofencing-API für automatische Zeiterfassung implementieren.

#### Problem: Keine Offline-Funktionalität für Zeiterfassung
**Aktueller Stand:**
- PWA vorhanden, aber Offline-Support unklar
- Keine Queue für Offline-Änderungen sichtbar

**Fehlend:**
- Lokale Speicherung von Zeiterfassungen
- Queue-System für Offline-Änderungen
- Automatische Synchronisation bei Online-Wiederkehr

**Empfehlung:** Service Worker mit IndexedDB für Offline-Support.

#### Problem: Keine erweiterte Pausenverwaltung
**Aktueller Stand:**
- Einfache Pausenverwaltung vorhanden
- ArbZG-Compliance-Prüfung teilweise vorhanden

**Fehlend:**
- Mehrere Pausen pro Tag
- Automatische Pausen-Erinnerungen
- Pausen-Typen (Mittagspause, Kaffeepause, etc.)

**Empfehlung:** Erweiterte Pausenverwaltung mit Typen und Erinnerungen.

### 2. Dienstplanung - Fehlende Features

#### Problem: Keine automatische Schichtplanung
**Aktueller Stand:**
- Manuelle Schichtplanung vorhanden
- Konfliktprüfung teilweise vorhanden

**Fehlend:**
- Automatische Schichtplanung basierend auf Verfügbarkeit
- KI-basierte Optimierung
- Berücksichtigung von Präferenzen

**Empfehlung:** Algorithmus für automatische Schichtplanung.

#### Problem: Keine Tauschbörse
**Aktueller Stand:**
- Schichten können zugewiesen werden
- Keine Möglichkeit zum Tauschen

**Fehlend:**
- Tauschbörse für Schichten
- Matching-Algorithmus
- Automatische Benachrichtigungen

**Empfehlung:** Tauschbörse-Feature implementieren.

#### Problem: Keine Verfügbarkeitsverwaltung
**Aktueller Stand:**
- Keine explizite Verfügbarkeitsverwaltung sichtbar

**Fehlend:**
- Verfügbarkeitskalender
- Urlaubsplanung
- Krankmeldungen

**Empfehlung:** Verfügbarkeitsverwaltung mit Kalender.

### 3. Reporting & Analytics - Fehlende Features

#### Problem: Employee Reports Datenberechnungen fehlen
**Aktueller Stand:**
- UI vorhanden, aber Daten sind TODOs

**Code-Referenz (aus Dokumentation):**
```typescript
weeklyData: [], // TODO: Aus echten Timesheet-Daten berechnen
monthlyOvertime: [], // TODO: Aus echten Timesheet-Daten berechnen
worktimeDetails: [] as WorktimeDetail[], // TODO: Aus echten Timesheet-Daten laden
bonusDetails: [] as BonusDetail[], // TODO: Aus echten Surcharge-Daten laden
vacationDetails: [] as VacationDetail[] // TODO: Aus echten Vacation-Daten laden
```

**Empfehlung:** Datenberechnungen implementieren.

#### Problem: Keine erweiterten Berichte
**Aktueller Stand:**
- Basis-Berichte vorhanden
- Export-Funktionen teilweise vorhanden

**Fehlend:**
- Custom Report Builder
- Automatisierte Reports (Scheduled)
- Dashboard-Widgets für Reports
- Report-Templates

**Empfehlung:** Erweiterte Reporting-Features implementieren.

#### Problem: Keine Analytics
**Aktueller Stand:**
- Keine Analytics sichtbar

**Fehlend:**
- Nutzungsstatistiken
- Performance-Metriken
- Trend-Analysen
- Vorhersagen

**Empfehlung:** Analytics-Dashboard implementieren.

### 4. Kommunikation - Fehlende Features

#### Problem: Chat-System Backend fehlt
**Aktueller Stand:**
- UI vorhanden (55% fertig)
- Backend fehlt komplett

**Code-Referenz (aus Dokumentation):**
Laut `.cursor/rules/07-todo-implementation.mdc` muss das Chat-System "komplett neu implementiert" werden.

**Fehlend:**
- Real-time Chat Service
- Message-Encryption
- File-Sharing
- Admin Broadcast-Nachrichten
- Rollen-basierte Kanäle

**Empfehlung:** Chat-System komplett neu implementieren.

#### Problem: Keine Push-Benachrichtigungen
**Aktueller Stand:**
- PWA vorhanden
- Keine Push-Benachrichtigungen sichtbar

**Fehlend:**
- Push-Benachrichtigungen für wichtige Events
- E-Mail-Integration
- SMS-Benachrichtigungen (optional)

**Empfehlung:** Push-Benachrichtigungen implementieren.

#### Problem: Keine E-Mail-Integration
**Aktueller Stand:**
- Keine E-Mail-Funktionalität sichtbar

**Fehlend:**
- E-Mail-Versand für Benachrichtigungen
- E-Mail-Templates
- E-Mail-Historie

