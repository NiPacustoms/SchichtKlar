# JobFlow – Dokumentation Teil 6

*Zeichen 99400–119279 von 2862906*

---

Die folgenden Pakete haben neuere Versionen verfügbar, sind aber aktuell auf der gewünschten Version:

| Paket               | Aktuell  | Gewünscht | Neueste | Status                    |
| ------------------- | -------- | --------- | ------- | ------------------------- |
| @react-pdf/renderer | 3.4.5    | 3.4.5     | 4.3.1   | ⚠️ Major Update verfügbar |
| @sentry/nextjs      | 8.55.0   | 8.55.0    | 10.25.0 | ⚠️ Major Update verfügbar |
| @types/node         | 20.19.25 | 20.19.25  | 24.10.1 | ⚠️ Major Update verfügbar |
| @types/react        | 18.3.26  | 18.3.26   | 19.2.5  | ⚠️ Major Update verfügbar |
| @types/react-dom    | 18.3.7   | 18.3.7    | 19.2.3  | ⚠️ Major Update verfügbar |
| next                | 15.5.6   | 15.5.6    | 16.0.3  | ⚠️ Major Update verfügbar |
| react               | 18.3.1   | 18.3.1    | 19.2.0  | ⚠️ Major Update verfügbar |
| react-dom           | 18.3.1   | 18.3.1    | 19.2.0  | ⚠️ Major Update verfügbar |

**Empfehlung:**

- ⚠️ **NICHT automatisch updaten** - Major Updates können Breaking Changes enthalten
- ✅ Aktuelle Versionen sind stabil und funktionsfähig
- 📋 Updates sollten in separaten Branches getestet werden

---

## 5. Sicherheitsprüfung

**Empfehlung:** Führe regelmäßig `npm audit` aus:

```bash
# Root-Projekt
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
npm audit

# Functions-Projekt
cd functions
npm audit
```

---

## 6. Fazit

### ✅ **Alle Dependencies sind installiert**

**Keine Maßnahmen erforderlich** - Das Projekt ist bereit für:

- ✅ Development (`npm run dev`)
- ✅ Building (`npm run build`)
- ✅ Testing (`npm run test`)
- ✅ Deployment

### Optional: Wartungsaufgaben

1. **Regelmäßige Sicherheitsprüfung:**

   ```bash
   npm audit
   npm audit fix
   ```

2. **Dependency-Updates (vorsichtig):**

   ```bash
   npm outdated
   # Manuell prüfen und updaten
   ```

3. **Bereinigung (nur bei Problemen):**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 7. Nächste Schritte

**Sofort umsetzbar:**

- ✅ Projekt kann sofort verwendet werden
- ✅ Alle Dependencies sind installiert

**Optional (Wartung):**

- 📋 Regelmäßige `npm audit` Prüfungen
- 📋 Geplante Dependency-Updates in separaten Branches
- 📋 Monitoring von Sicherheitslücken

---

**Report erstellt:** $(date)  
**Status:** ✅ Alle Dependencies installiert und funktionsfähig



---

## Quelle: DEPENDENCY_MAINTENANCE_PLAN.md

# Dependency Maintenance Plan - JobFlow

**Erstellt:** $(date)  
**Zweck:** Plan zur Wartung und Aktualisierung von Dependencies

---

## 📋 Übersicht

Dieser Plan beschreibt die empfohlenen Schritte zur Wartung der Projekt-Dependencies.

---

## ✅ Aktueller Status

**Alle Dependencies sind installiert und funktionsfähig.**

- ✅ Root-Projekt: Alle 35 Dependencies installiert
- ✅ Functions-Projekt: Alle 8 Dependencies installiert
- ✅ Keine fehlenden Pakete
- ✅ Keine kritischen Sicherheitslücken (empfohlen: regelmäßige Prüfung)

---

## 🔧 Wartungsaufgaben

### 1. Regelmäßige Sicherheitsprüfung (Empfohlen: Monatlich)

**Zweck:** Identifikation und Behebung von Sicherheitslücken

**Schritte:**

```bash
# 1. Root-Projekt prüfen
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
npm audit

# 2. Automatische Fixes (wenn möglich)
npm audit fix

# 3. Manuelle Fixes (bei kritischen Lücken)
npm audit fix --force  # ⚠️ Vorsicht: Kann Breaking Changes verursachen

# 4. Functions-Projekt prüfen
cd functions
npm audit
npm audit fix
```

**Wann ausführen:**

- ✅ Vor jedem Release
- ✅ Monatlich als Wartungsaufgabe
- ✅ Bei Bekanntwerden von Sicherheitslücken

---

### 2. Dependency-Updates (Empfohlen: Quartalweise)

**Zweck:** Aktualisierung auf neuere Versionen (mit Vorsicht)

**Schritte:**

#### 2.1 Veraltete Pakete identifizieren

```bash
# Root-Projekt
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
npm outdated

# Functions-Projekt
cd functions
npm outdated
```

#### 2.2 Update-Strategie

**⚠️ WICHTIG:** Major Updates (z.B. React 18 → 19) erfordern umfangreiche Tests!

**Empfohlener Workflow:**

1. **Branch erstellen:**

   ```bash
   git checkout -b dependency-updates-$(date +%Y%m%d)
   ```

2. **Patch & Minor Updates (sicherer):**

   ```bash
   # Automatische Updates für Patch/Minor
   npm update
   ```

3. **Major Updates (vorsichtig):**

   ```bash
   # Einzelne Pakete manuell updaten
   npm install package-name@latest

   # Oder spezifische Version
   npm install package-name@x.y.z
   ```

4. **Tests ausführen:**

   ```bash
   npm run test
   npm run typecheck
   npm run lint
   npm run build
   ```

5. **Manuelle Tests:**
   - ✅ Development-Server starten
   - ✅ Kritische Features testen
   - ✅ UI-Komponenten prüfen

6. **Commit & Merge:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: update dependencies"
   git push origin dependency-updates-$(date +%Y%m%d)
   # Pull Request erstellen und reviewen
   ```

---

### 3. Bereinigung (Nur bei Problemen)

**Wann nötig:**

- ❌ Dependency-Konflikte
- ❌ Fehlerhafte Installationen
- ❌ Inkonsistente node_modules

**Schritte:**

```bash
# 1. Backup erstellen (optional)
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# 2. Root-Projekt bereinigen
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
rm -rf node_modules package-lock.json
npm install

# 3. Functions-Projekt bereinigen
cd functions
rm -rf node_modules package-lock.json
npm install

# 4. Verifizieren
npm list --depth=0
npm run typecheck
npm run build
```

---

### 4. Dependency-Audit (Empfohlen: Vor jedem Release)

**Zweck:** Vollständige Analyse der Dependency-Struktur

**Schritte:**

```bash
# 1. Dependency-Tree analysieren
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
npm list --depth=0 > dependency-tree.txt

# 2. Unbenutzte Dependencies identifizieren
# (Manuell prüfen, welche Pakete tatsächlich verwendet werden)

# 3. Extraneous Packages prüfen
npm list --depth=0 | grep extraneous

# 4. Bundle-Größe analysieren (Next.js)
npm run build
# Prüfe .next/analyze/ für Bundle-Analyse
```

---

## 🚨 Wichtige Hinweise

### Major Updates - Breaking Changes

Die folgenden Pakete haben Major Updates verfügbar, die Breaking Changes enthalten können:

1. **React 18 → 19**
   - ⚠️ Breaking Changes in React 19
   - ⚠️ TypeScript-Typen müssen angepasst werden
   - ⚠️ Umfangreiche Tests erforderlich

2. **Next.js 15 → 16**
   - ⚠️ Neue Features und mögliche Breaking Changes
   - ⚠️ React 19 Kompatibilität prüfen

3. **@sentry/nextjs 8 → 10**
   - ⚠️ API-Änderungen möglich
   - ⚠️ Konfiguration prüfen

**Empfehlung:**

- ✅ Zuerst in separatem Branch testen
- ✅ Changelogs gründlich lesen
- ✅ Schrittweise vorgehen (nicht alle auf einmal)

---

## 📅 Wartungszeitplan

### Monatlich

- [ ] `npm audit` ausführen
- [ ] Sicherheitslücken beheben
- [ ] Dependency-Status dokumentieren

### Quartalweise

- [ ] `npm outdated` prüfen
- [ ] Patch/Minor Updates durchführen
- [ ] Major Updates evaluieren

### Vor jedem Release

- [ ] Vollständige Dependency-Prüfung
- [ ] Sicherheitsaudit
- [ ] Build-Tests
- [ ] Dokumentation aktualisieren

---

## 🔍 Monitoring

### Tools & Commands

```bash
# Dependency-Status
npm list --depth=0

# Veraltete Pakete
npm outdated

# Sicherheitsprüfung
npm audit

# Bundle-Analyse (Next.js)
ANALYZE=true npm run build

# Type-Checking
npm run typecheck

# Linting
npm run lint
```

---

## ✅ Checkliste: Dependency-Wartung

**Vor Updates:**

- [ ] Backup von package.json und package-lock.json
- [ ] Git-Branch erstellen
- [ ] Aktuelle Tests laufen lassen (Baseline)
- [ ] Changelogs der zu updatenden Pakete lesen

**Während Updates:**

- [ ] Schrittweise vorgehen (nicht alle auf einmal)
- [ ] Nach jedem Update Tests ausführen
- [ ] Build erfolgreich
- [ ] Type-Check erfolgreich

**Nach Updates:**

- [ ] Alle Tests bestehen
- [ ] Manuelle Tests durchführen
- [ ] Dokumentation aktualisieren
- [ ] Commit & Pull Request erstellen
- [ ] Code Review durchführen

---

## 📚 Ressourcen

- [npm Documentation](https://docs.npmjs.com/)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Semantic Versioning](https://semver.org/)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19)
- [Next.js Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)

---

**Plan erstellt:** $(date)  
**Nächste Prüfung empfohlen:** $(date -v+1m +%Y-%m-%d)



---

## Quelle: NOTEBOOKLM_APP_DOKUMENTATION.md

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

### 5.9 Dokumentenverwaltung (`/admin/dokumenttypen`)

**Funktionen:**
- Dokumenttypen: Verwaltung von Dokumentenkategorien
- Ablaufverfolgung: Automatische Warnung bei ablaufenden Dokumenten
- Verifizierung: Admin-Verifizierung von Dokumenten
- Templates: Vorlagen für Dokumente

