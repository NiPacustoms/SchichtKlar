# JobFlow – Dokumentation Teil 135

*Zeichen 2662404–2682281 von 2862906*

---

- ✅ 20+ E2E-Test-Dateien vorhanden
- ✅ Playwright konfiguriert
- ✅ Test-Struktur gut organisiert (admin, dispatcher, nurse, shared)

**Coverage:**
- Admin-Tests: Dashboard, Mitarbeiter, Einrichtungen, Schichten, Berichte, Lohnabrechnung
- Dispatcher-Tests: Dashboard, Schicht-Zuweisung, Dokumente
- Nurse-Tests: Dashboard, Zeiterfassung, Dienstplan, Dokumente, Assignments
- Shared-Tests: Auth-Flow, Navigation

**Impact:** ✅ **POSITIV** - Gute Test-Abdeckung für kritische Flows

#### ❌ Keine Unit-Tests

**Status:**
- ❌ Keine Unit-Tests für Services
- ❌ Keine Unit-Tests für Hooks
- ❌ Keine Unit-Tests für Utils
- ❌ Keine Code-Coverage-Reports

**Impact:** 🟡 **HOCH** - Keine schnelle Feedback-Schleife für Entwickler

#### ⚠️ Test-Infrastruktur

**Status:**
- ✅ Playwright konfiguriert
- ⚠️ CI/CD Pipeline vorhanden, aber Tests schlagen wahrscheinlich fehl
- ⚠️ Keine automatische Test-Ausführung bei jedem Commit

**Impact:** 🟡 **MITTEL** - Tests müssen manuell ausgeführt werden

---

### 3. Features & Funktionalität

**Score: 25/30** 🟢

#### ✅ Vollständig implementiert

**Kern-Features:**
- ✅ Authentifizierung & RBAC (Admin, Dispatcher, Nurse)
- ✅ Kundenverwaltung (CRUD)
- ✅ Mitarbeiterverwaltung (CRUD)
- ✅ Auftragsverwaltung (Assignments)
- ✅ Arbeitszeiterfassung (mit GPS, Pausen, ArbZG-Compliance)
- ✅ Signatur-Workflow (digitale Unterschriften)
- ✅ Live-Überwachung (Admin-Dashboard)
- ✅ Lohnabrechnung (BMF-Lohnsteuertabelle 2025, GoBD-konform)
- ✅ Dokumentenverwaltung
- ✅ Berichte & Exporte (PDF, Excel)

**Impact:** ✅ **SEHR GUT** - Alle Features implementiert

#### ⚠️ Chat-System entfernt

**Status:**
- ⚠️ Chat-System aus UI entfernt (laut CHANGELOG)
- ⚠️ API-Endpunkte bleiben im Code, aber nicht erreichbar

**Impact:** 🟡 **NIEDRIG** - Feature entfernt, aber dokumentiert

---

### 4. Sicherheit & Compliance

**Score: 22/25** 🟢

#### ✅ Security-Audit: Gut

**Status (laut Production Readiness Audit):**
- ✅ Firestore Rules: Durchgängige Mandantenisolation
- ✅ RBAC: Rollenbasierte Zugriffskontrolle korrekt
- ✅ GoBD-Konformität: Approved Timesheets unveränderlich
- ✅ DSGVO-Compliance: Datenexport & -löschung implementiert
- ✅ Security Headers: CSP, HSTS, etc.
- ✅ Rate Limiting: Für API-Endpunkte

**Impact:** ✅ **SEHR GUT** - Sicherheit ist gut implementiert

#### ⚠️ Verbleibende Issues

**Status:**
- ⚠️ Storage Rules: Chat-Uploads nur server-side geprüft (nicht kritisch)
- ⚠️ Sentry DSN: Möglicherweise nicht gesetzt (dokumentiert)

**Impact:** 🟡 **NIEDRIG** - Nicht blockierend, aber sollte behoben werden

---

### 5. Legal & Rechtliches

**Score: 18/20** 🟢

#### ✅ DSGVO-Compliance

**Status:**
- ✅ Cookie-Banner implementiert
- ✅ Datenschutzerklärung DSGVO-konform
- ✅ Datenexport-API (Art. 15 DSGVO)
- ✅ Datenlöschung-API (Art. 17 DSGVO)

**Impact:** ✅ **SEHR GUT** - Rechtlich abgesichert

#### ⚠️ Impressum: Mock-Daten

**Status:**
- ⚠️ Impressum verwendet noch Mock-Daten als Default
- ✅ Konfigurierbar über ENV-Variablen
- ✅ Warnung wird angezeigt bei Mock-Daten

**Impact:** 🟡 **NIEDRIG** - Muss in Production konfiguriert werden

---

### 6. Performance & Optimierung

**Score: 12/20** 🟡

#### ⚠️ Performance-Metriken unbekannt

**Status:**
- ⚠️ Keine Lighthouse-Scores verfügbar
- ⚠️ Keine Performance-Metriken dokumentiert
- ✅ Code-Splitting vorhanden
- ✅ React Query Caching vorhanden

**Impact:** 🟡 **MITTEL** - Performance nicht verifiziert

#### ⚠️ Bundle-Größe unbekannt

**Status:**
- ⚠️ Keine Bundle-Analyse verfügbar
- ⚠️ Build schlägt fehl, daher keine Analyse möglich

**Impact:** 🟡 **MITTEL** - Kann nicht verifiziert werden

---

### 7. Dokumentation

**Score: 18/20** 🟢

#### ✅ Umfangreiche Dokumentation

**Status:**
- ✅ README.md vollständig
- ✅ API-Dokumentation vorhanden
- ✅ Admin-Guide vorhanden
- ✅ Deployment-Guide vorhanden
- ✅ Security-Audit-Reports vorhanden
- ✅ Production-Ready-Checklist vorhanden

**Impact:** ✅ **SEHR GUT** - Sehr gut dokumentiert

---

### 8. Deployment & Operations

**Score: 10/20** 🟡

#### ❌ Build schlägt fehl

**Status:**
- ❌ Production-Build nicht möglich
- ❌ Kein Deployment möglich
- ✅ Firebase-Konfiguration vorhanden
- ✅ CI/CD Pipeline vorhanden (aber schlägt fehl)

**Impact:** 🔴 **BLOCKER** - Kein Deployment möglich

#### ⚠️ Monitoring & Observability

**Status:**
- ✅ Health-Endpoint vorhanden (`/api/health`)
- ✅ Status-Seite vorhanden (`/status`)
- ⚠️ Sentry konfiguriert, aber DSN möglicherweise nicht gesetzt
- ⚠️ Keine Performance-Monitoring-Daten

**Impact:** 🟡 **MITTEL** - Grundlagen vorhanden, aber nicht vollständig

---

## 🎯 Zusammenfassung nach Kategorien

| Kategorie | Score | Status | Gewichtung | Gewichteter Score |
|-----------|-------|--------|------------|-------------------|
| Code-Qualität & Build | 15/30 | 🔴 | 30% | 4.5 |
| Testing & QA | 8/20 | 🟡 | 20% | 1.6 |
| Features & Funktionalität | 25/30 | 🟢 | 20% | 5.0 |
| Sicherheit & Compliance | 22/25 | 🟢 | 15% | 3.3 |
| Legal & Rechtliches | 18/20 | 🟢 | 5% | 0.9 |
| Performance | 12/20 | 🟡 | 5% | 0.6 |
| Dokumentation | 18/20 | 🟢 | 3% | 0.54 |
| Deployment & Operations | 10/20 | 🟡 | 2% | 0.2 |
| **GESAMT** | **128/185** | **🔴** | **100%** | **~16.6/30 = 55%** |

**Korrigierte Bewertung:** **~45-50% Marktreife** (wegen kritischer Blockierer)

---

## 🔴 KRITISCHE BLOCKIERER (MUSS behoben werden)

### 1. Build schlägt fehl ❌

**Problem:**
- Syntax-Fehler in mehreren Dateien
- Fehlende Module
- Unterminated regexp literal

**Lösung:**
1. Alle Syntax-Fehler beheben
2. Fehlende Module erstellen oder Imports korrigieren
3. JSX-Struktur-Fehler beheben

**Aufwand:** 2-4 Stunden

**Priorität:** 🔴 **KRITISCH** - Blockiert alles

---

### 2. TypeScript-Fehler ❌

**Problem:**
- 50+ TypeScript-Fehler
- Parsing-Fehler
- JSX-Struktur-Fehler

**Lösung:**
1. Alle Parsing-Fehler beheben
2. JSX-Struktur korrigieren
3. Fehlende Types hinzufügen

**Aufwand:** 4-8 Stunden

**Priorität:** 🔴 **KRITISCH** - Blockiert Type-Safety

---

### 3. ESLint-Fehler ⚠️

**Problem:**
- Viele Warnungen (unused vars)
- Parsing-Fehler

**Lösung:**
1. Unused imports/variables entfernen
2. Parsing-Fehler beheben (durch TypeScript-Fixes)

**Aufwand:** 2-4 Stunden

**Priorität:** 🟡 **HOCH** - Nicht blockierend, aber wichtig

---

## 🟡 WICHTIGE VERBESSERUNGEN (SOLLTE behoben werden)

### 4. Unit-Tests fehlen ⚠️

**Problem:**
- Keine Unit-Tests für Services, Hooks, Utils
- Keine Code-Coverage

**Lösung:**
1. Unit-Tests für kritische Services schreiben
2. Code-Coverage auf ≥80% erhöhen

**Aufwand:** 1-2 Wochen

**Priorität:** 🟡 **HOCH** - Wichtig für Qualität

---

### 5. Performance nicht verifiziert ⚠️

**Problem:**
- Keine Lighthouse-Scores
- Keine Performance-Metriken

**Lösung:**
1. Lighthouse-Audit durchführen
2. Performance-Metriken dokumentieren
3. Optimierungen durchführen (falls nötig)

**Aufwand:** 1-2 Tage

**Priorität:** 🟡 **MITTEL** - Wichtig für UX

---

## 📈 Roadmap zur 100% Marktreife

### Phase 1: Build-Fähigkeit (KRITISCH) - 1-2 Tage

1. ✅ Syntax-Fehler beheben
2. ✅ TypeScript-Fehler beheben
3. ✅ ESLint-Fehler beheben
4. ✅ Fehlende Module erstellen/korrigieren
5. ✅ Build erfolgreich

**Ziel:** App kann gebaut werden

---

### Phase 2: Code-Qualität (HOCH) - 1 Woche

1. ✅ Unit-Tests für kritische Services
2. ✅ Code-Coverage auf ≥80%
3. ✅ Performance-Audit durchführen
4. ✅ Bundle-Größe optimieren

**Ziel:** Code-Qualität verbessert

---

### Phase 3: Production-Ready (MITTEL) - 1 Woche

1. ✅ Sentry DSN setzen
2. ✅ Impressum mit echten Daten konfigurieren
3. ✅ Monitoring & Alerts einrichten
4. ✅ Performance-Metriken dokumentieren
5. ✅ Go-Live-Checklist vollständig abarbeiten

**Ziel:** Production-Ready

---

## 🎯 Fazit

### Aktueller Status: 🔴 **NICHT MARKTREIF**

**Hauptprobleme:**
1. ❌ Build schlägt fehl - **BLOCKER**
2. ❌ TypeScript-Fehler - **BLOCKER**
3. ⚠️ Keine Unit-Tests - **WICHTIG**
4. ⚠️ Performance nicht verifiziert - **WICHTIG**

**Stärken:**
- ✅ Features vollständig implementiert
- ✅ Security gut implementiert
- ✅ DSGVO-Compliance vorhanden
- ✅ E2E-Tests vorhanden
- ✅ Gute Dokumentation

**Empfehlung:**

**NICHT verkaufsfertig.** Die App hat eine solide Basis, aber **kritische technische Blockierer** verhindern einen Produktionsbetrieb.

**Nächste Schritte:**
1. **Sofort:** Build-Fehler beheben (1-2 Tage)
2. **Diese Woche:** TypeScript-Fehler beheben (2-3 Tage)
3. **Nächste Woche:** Unit-Tests hinzufügen (1 Woche)
4. **Dann:** Performance-Audit & Optimierung (1 Woche)

**Geschätzter Aufwand bis 100% Marktreife:** **3-4 Wochen** bei fokussierter Arbeit

---

**Erstellt:** 27. Januar 2026  
**Nächste Prüfung:** Nach Behebung der Build-Fehler



---

## Quelle: docs/NOTEBOOKLM_APP_DOKUMENTATION.md

# JobFlow - Vollständige App-Dokumentation für NotebookLM

**Stand:** 2025-01-27  
**Version:** 0.1.0  
**Status:** Production-Ready

---

## 1. PROJEKTÜBERSICHT

### 1.1 Was ist JobFlow?

JobFlow ist eine moderne, DSGVO-konforme Webanwendung für die Verwaltung von Zeitarbeitsfirmen im medizinischen Bereich. Die App ermöglicht die vollständige Verwaltung von Personal, Schichten, Zeiterfassung, Lohnabrechnung und Kommunikation.

### 1.2 Kernzweck

- **Personalplanung** für medizinisches Personal (Pflegekräfte, Ärzte, etc.)
- **Zeiterfassung** mit GPS-Tracking und ArbZG-Compliance
- **Lohnabrechnung** nach deutschem Steuerrecht (BMF-Lohnsteuertabelle 2025)
- **Schichtverwaltung** mit Konfliktprüfung und Verfügbarkeitsmanagement
- **Dokumentenverwaltung** für Qualifikationen und Nachweise

### 1.3 Zielgruppe

- **Administratoren:** Vollzugriff auf alle Funktionen
- **Disponenten:** Eingeschränkter Admin-Zugriff
- **Mitarbeiter (Nurse):** Zeiterfassung, Dokumente, eigene Daten

---

## 2. TECHNOLOGIE-STACK

### 2.1 Frontend-Technologien

**Framework & Core:**
- Next.js 15.5.6 (App Router) - React-Framework mit Server-Side Rendering
- React 18.3.1 - UI-Library
- TypeScript 5.0.0 (strict mode) - Typsichere Entwicklung

**UI & Styling:**
- Material-UI (MUI) 7.3.4 - Komponenten-Bibliothek
- Tailwind CSS 4.1.17 - Utility-First CSS
- Glasmorphism Design - Moderne UI-Ästhetik
- Dark Mode Support - Vollständiger Dark Mode

**State Management & Daten:**
- TanStack Query (React Query) 5.90.5 - Server-State Management
- React Hook Form 7.65.0 - Formular-Handling
- Zod 4.1.12 - Schema-Validierung

### 2.2 Backend & Services

**Firebase-Services:**
- Firestore (NoSQL-Datenbank) - Hauptdatenbank
- Firebase Auth - Authentifizierung
- Firebase Storage - Datei-Speicherung
- Firebase Functions (Node.js 20) - Serverless Functions
- Firebase Cloud Messaging (FCM) - Push-Notifications

**Runtime:**
- Node.js 20 - Server-Runtime

### 2.3 Entwicklung & Testing

- Playwright 1.56.1 - E2E-Testing
- ESLint 8.57.1 - Code-Linting
- Prettier 3.3.3 - Code-Formatierung
- Sentry 8.30.0 (optional) - Error-Tracking

### 2.4 PWA & Offline

- Service Worker - Offline-Funktionalität
- PWA Manifest - Installierbare App
- Lokale Zwischenspeicherung - Offline-Support

---

## 3. ROLLEN & BERECHTIGUNGEN

### 3.1 Admin (Administrator)

**Vollzugriff auf alle Funktionen:**
- Mitarbeiterverwaltung (CRUD)
- Einrichtungsverwaltung (CRUD)
- Schichtverwaltung (Erstellen, Zuweisen, Verwalten)
- Lohnabrechnung (Berechnung, Genehmigung, Export)
- Berichte & Exporte (PDF, Excel, DATEV)
- Systemeinstellungen (Firmendaten, Branding, Feature-Flags)
- Audit-Logs (Vollständige Protokollierung)
- Dokumentenverwaltung (Verifizierung, Ablaufverfolgung)

**Zugriffspfade:**
- `/admin/uebersicht` - Dashboard
- `/admin/mitarbeiter` - Mitarbeiterverwaltung
- `/admin/einrichtungen` - Einrichtungsverwaltung
- `/admin/schichten` - Schichtverwaltung
- `/admin/dienstplan` - Dienstplan
- `/admin/stunden` - Stundenübersicht
- `/admin/lohnabrechnung` - Lohnabrechnung
- `/admin/berichte` - Berichte
- `/admin/einstellungen` - Systemeinstellungen
- `/admin/audit-logs` - Audit-Logs

### 3.2 Dispatcher (Disponent)

**Eingeschränkter Admin-Zugriff:**
- Schichtverwaltung (Erstellen, Zuweisen)
- Mitarbeiterübersicht (Lesen)
- Stundenübersicht (Lesen, Export)
- Dokumentenverwaltung (Verifizierung)
- **KEIN Zugriff auf:**
  - Lohnabrechnung
  - Systemeinstellungen
  - Audit-Logs (nur Lesen)

**Zugriffspfade:**
- `/admin/schichten` - Schichtverwaltung
- `/admin/mitarbeiter` - Mitarbeiterübersicht (nur Lesen)
- `/admin/stunden` - Stundenübersicht
- `/admin/dokumenttypen` - Dokumentenverwaltung

### 3.3 Nurse (Mitarbeiter)

**Eingeschränkter Zugriff:**
- Eigene Zeiterfassung (Start/Stop/Pause)
- Eigene Schichten einsehen
- Eigene Dokumente hochladen
- Eigene Berichte anzeigen
- Profil verwalten
- Gehaltsabrechnungen anzeigen

**Zugriffspfade:**
- `/employee/arbeitsplatz` - Dashboard
- `/employee/dienstplan` - Dienstplan
- `/employee/zeiterfassung` - Zeiterfassung
- `/employee/zeiten` - Zeiten-Historie
- `/employee/dokumente` - Dokumente
- `/employee/einsaetze` - Einsätze
- `/employee/berichte` - Berichte
- `/employee/profil` - Profil
- `/employee/gehaltsabrechnungen` - Gehaltsabrechnungen

---

## 4. AUTHENTIFIZIERUNG & SICHERHEIT

### 4.1 Authentifizierung

**Login-Methoden:**
- E-Mail/Passwort-Login (Firebase Auth)
- Optional: OIDC-SSO (wenn `NEXT_PUBLIC_OIDC_PROVIDER_ID` konfiguriert)

**Features:**
- Session-Persistierung mit automatischer Weiterleitung
- Passwort-Reset per E-Mail
- E-Mail-Verifizierung
- Account-Deaktivierung für inaktive Benutzer

**Implementierung:**
- `contexts/AuthContext.tsx` - Authentifizierungs-Context
- `lib/services/authService.ts` - Auth-Service
- `app/api/auth/` - Auth-API-Endpunkte

### 4.2 Sicherheitsfeatures

**RBAC (Role-Based Access Control):**
- Rollenbasierte Navigation
- Route-Guards (`components/auth/RoleGuard.tsx`)
- Server-seitige Validierung

**Mandanten-Isolation:**
- `companyId` - Mandantenzugehörigkeit
- `tenantId` - Tenant-Isolation
- Firestore Security Rules mit Mandanten-Prüfung

**Sicherheitsregeln:**
- Firestore Security Rules (`firestore.rules`)
- Storage Security Rules (`storage.rules`)
- Rate Limiting für API-Endpunkte
- Security Headers (CSP, HSTS, etc.)

**Verschlüsselung:**
- Sensible Daten (Steuer-ID, IBAN, etc.) werden verschlüsselt gespeichert
- `lib/services/encryption/` - Verschlüsselungs-Service

**Audit-Logging:**
- Vollständige Protokollierung aller kritischen Aktionen
- `/admin/audit-logs` - Audit-Log-Viewer
- `lib/services/auditLogService.ts` - Audit-Log-Service

---

## 5. ADMIN-FUNKTIONEN (DETAILIERT)

### 5.1 Dashboard (`/admin/uebersicht`)

**Komponenten:**
- KPIs: Mitarbeiter, Schichten, Stunden, Auslastung
- Alerts: Fehlende Dokumente, Konflikte, Warnungen
- Aktuelle Aktivitäten: Live-Überblick über laufende Sessions
- Quick Actions: Schnellzugriff auf häufig genutzte Funktionen
- Charts: Wöchentliche/Monatliche Stunden, Auslastung

**Implementierung:**
- `app/(admin)/admin/uebersicht/page.tsx`
- `lib/hooks/useAdminDashboard.ts`
- `components/dashboard/` - Dashboard-Komponenten

### 5.2 Mitarbeiterverwaltung (`/admin/mitarbeiter`)

**Funktionen:**
- **Übersicht:** Liste aller Mitarbeiter mit Filtern (Name, E-Mail, Rolle, Status)
- **Detailansicht:** Vollständiges Profil mit allen Daten
- **Stammdaten:** Name, E-Mail, Telefon, Adresse
- **Qualifikationen:** Verwaltung von Zertifikaten und Nachweisen
- **Dokumente:** Upload, Preview, Ablaufverfolgung
- **Gehaltsdaten:** Mehrstufiges Formular:
  - Schritt 1: Vertragsdaten (Beschäftigungsart, Arbeitsstunden)
  - Schritt 2: Gehaltsdaten (Zahlungsart, Grundgehalt, Stundensatz)
  - Schritt 3: Steuerdaten (Steuer-ID, Steuerklasse, Kirchensteuer)
  - Schritt 4: Sozialversicherung (SV-Nummer, Krankenkasse)
  - Schritt 5: Bankdaten (IBAN, BIC - verschlüsselt)
  - Schritt 6: Zuschläge (Nacht, Wochenende, Feiertag)
- **Aktivitätsstatus:** Aktiv/Inaktiv, Urlaub, Krank
- **Berechtigungen:** Rollen, Facility-Zugriffe

**Implementierung:**
- `app/(admin)/admin/mitarbeiter/page.tsx`
- `app/(admin)/admin/mitarbeiter/[uid]/page.tsx`
- `app/(admin)/admin/mitarbeiter/[uid]/gehalt/page.tsx`
- `lib/services/users.ts`
- `lib/services/payroll.ts`

### 5.3 Einrichtungsverwaltung (`/admin/einrichtungen`)

**Funktionen:**
- CRUD-Operationen: Anlegen, Bearbeiten, Löschen
- Standortverwaltung: Vollständige Adressdaten
- Kontaktpersonen: Name, E-Mail, Telefon
- Stationen: Verwaltung von Stationen pro Einrichtung
- Abrechnungsdaten: Debitornummer, Rechnungsadresse, Steuernummer
- Status: Aktiv/Inaktiv mit Konfliktprüfung

**Implementierung:**
- `app/(admin)/admin/einrichtungen/page.tsx`
- `app/(admin)/admin/einrichtungen/[id]/page.tsx`
- `lib/services/facilities.ts`

### 5.4 Schichtverwaltung (`/admin/schichten`)

**Funktionen:**
- Schicht-Erstellung: Datum, Zeit, Typ (Früh/Spät/Nacht/On-call)
- Kapazitätsverwaltung: Max. Mitarbeiter pro Schicht
- Qualifikationsanforderungen: Erforderliche Qualifikationen
- Zuweisungen: Mitarbeiter zu Schichten zuweisen
- Konfliktprüfung: Automatische Prüfung auf Überlappungen
- Status-Workflow: Offen → Zugewiesen → Bestätigt/Abgelehnt
- Bulk-Aktionen: Mehrere Schichten gleichzeitig verwalten

**Implementierung:**
- `app/(admin)/admin/schichten/page.tsx`
- `lib/services/shifts.ts`
- `lib/services/assignments.ts`
- `components/schedule/` - Schicht-Komponenten

### 5.5 Dienstplan (`/admin/dienstplan`)

**Funktionen:**
- Kalenderansicht: Monats-/Wochenansicht
- Schichtübersicht: Alle Schichten mit Zuweisungen
- Drag & Drop: Zuweisungen per Drag & Drop verschieben
- Filter: Nach Einrichtung, Station, Mitarbeiter
- Export: PDF/Excel-Export

**Implementierung:**
- `app/(admin)/admin/dienstplan/page.tsx`
- `components/schedule/` - Kalender-Komponenten

### 5.6 Stundenübersicht (`/admin/stunden`)

**Funktionen:**
- Live-Überwachung: Aktuelle laufende Sessions
- ArbZG-Compliance: Automatische Prüfung von:
  - Pausenzeiten (30min nach 6h, 45min nach 9h)
  - Arbeitszeitgrenzen (max. 10h/Tag)
  - Ruhezeiten (11h zwischen Schichten)
- Warnungen: Fehlende GPS-Daten, fehlende Pausen, Überlappungen
- Historie: Alle erfassten Zeiten mit Filtern
- Export: PDF/Excel für Abrechnungen

**Implementierung:**
- `app/(admin)/admin/stunden/page.tsx`
- `lib/services/timesheets.ts`
- `lib/services/payroll/arbzgValidation.ts`

### 5.7 Lohnabrechnung (`/admin/lohnabrechnung`)

**Funktionen:**
- Abrechnungsperioden: Monatliche Abrechnungsperioden
- Automatische Berechnung: Basierend auf approved Timesheets
- BMF-Lohnsteuertabelle 2025: Korrekte Steuerberechnung
- Sozialversicherung: Mit Beitragsbemessungsgrenzen 2025
- Kirchensteuer: 8%/9% je nach Bundesland
- Solidaritätszuschlag: 5,5%
- MiLoG-Compliance: Mindestlohn-Prüfung (12,82 €/h)
- ArbZG-Validierung: Arbeitszeiten, Ruhezeiten, Pausen
- Minijob/Midijob: Unterstützung für 556 € / 556,01-2000 €
- Status-Workflow: Open → Calculating → Ready → Approved → Paid → Locked
- PDF-Export: Mit §108 GewO Pflichtangaben
- DATEV-Export: Für Buchhaltung
- Lohnnebenkosten-Report: AG-Anteile, Unfallversicherung, Insolvenzgeldumlage
- GoBD-konform: Unveränderliche Berechnungen, Audit-Logging

**Performance:**
- Client-seitige Berechnung für < 50 Mitarbeiter (< 30s)
- Cloud Function für ≥ 50 Mitarbeiter (< 5min)
- Batch-Processing für Firestore-Writes (max 500 pro Batch)

**Implementierung:**
- `app/(admin)/admin/lohnabrechnung/page.tsx`
- `lib/services/payroll/` - Lohnabrechnungs-Services:
  - `payrollCalculation.ts` - Hauptberechnung
  - `taxCalculation.ts` - Steuerberechnung
  - `socialSecurityCalculation.ts` - Sozialversicherung
  - `arbzgValidation.ts` - ArbZG-Validierung
  - `pdfGeneration.tsx` - PDF-Generierung
  - `datevExport.ts` - DATEV-Export

### 5.8 Berichte (`/admin/berichte`)

**Funktionen:**
- Statistiken: Mitarbeiter, Schichten, Stunden, Kosten
- Charts: Wöchentliche/Monatliche Trends
- Export: PDF, Excel, CSV
- Filter: Nach Zeitraum, Einrichtung, Mitarbeiter
- Scheduled Reports: Automatisierte Berichte (geplant)

**Implementierung:**
- `app/(admin)/admin/berichte/page.tsx`
- `lib/services/reports.ts`
- `lib/services/exportService.ts`

