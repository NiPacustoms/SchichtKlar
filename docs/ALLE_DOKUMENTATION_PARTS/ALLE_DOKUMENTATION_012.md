# JobFlow – Dokumentation Teil 12

*Zeichen 218604–238368 von 2862906*

---

  - Registrierung von `/sw.js` (Haupt‑Service Worker) und `/firebase-messaging-sw.js`.
  - Übergabe der Firebase‑Konfiguration per `postMessage` an den Service Worker.
  - Retry‑Logik und Logging für SW‑Registrierung.

## 7. Qualitätssicherung & Tests

- **Linting**: `npm run lint` / `lint:ci` mit strikten Regeln.
- **Typecheck**: `npm run typecheck` / `typecheck:ci`.
- **Static Scan**: `node scripts/static-scan.js` (Sicherheits‑/Qualitäts‑Heuristiken).
- **E2E-Tests**: Playwright‑Suites für verschiedene Rollen/Flows (`tests/e2e/...`).

## 8. Wie man im Code navigiert

- Einstiegspunkte:
  - UI‑Flow: `app/page.tsx` → `(auth)` / `(admin)` / `(employee)`‑Pages → zugehörige Komponenten in `components/`.
  - Layout/Theming: `app/layout.tsx`, `components/layout/*`, `components/ThemeProvider.tsx`.
  - Auth/RBAC: `contexts/AuthContext.tsx`, `components/auth/*`, `middleware.ts`.
  - Geschäftslogik / Backend: `app/api/*`, `functions/`, relevante Services unter `lib/`.
- Für neue Features:
  - Passende Route unter `app/` anlegen/erweitern.
  - UI-Komponenten in `components/` (ggf. Unterordner für Admin/Employee).
  - Backend‑Logik in `app/api/...` bzw. in `functions/` kapseln.

Diese Übersicht soll als Startpunkt dienen, um sich im Code zurechtzufinden. Für tiefere Details zu einzelnen Domänen (z.B. Payroll, Chat, Zeiterfassung) können die jeweiligen `app/`‑Routen und spezialisierten Komponenten/Services direkt verfolgt werden.



---

## Quelle: docs/DEPENDENCY_CHECK_REPORT.md

# Dependency-Check Report - JobFlow

**Datum:** $(date)  
**Version:** 0.1.0  
**Prüfungsart:** Vollständige Dependency-Verifikation

---

## Executive Summary

✅ **Alle benötigten Dependencies sind installiert und funktionsfähig.**

Das Projekt verwendet zwei separate Package-Management-Bereiche:

1. **Root-Projekt** (Next.js App)
2. **Functions-Projekt** (Firebase Cloud Functions)

---

## 1. Root-Projekt Dependencies ✅

### Status: ✅ **VOLLSTÄNDIG INSTALLIERT**

**Verzeichnisse:**

- ✅ `node_modules/` existiert
- ✅ `package-lock.json` existiert

**Dependencies (35 Pakete):**

- ✅ Alle Production Dependencies installiert
- ✅ Alle Development Dependencies installiert
- ✅ Keine fehlenden Pakete

**Installierte Production Dependencies:**

- @emotion/react@11.14.0
- @emotion/styled@11.14.1
- @hookform/resolvers@5.2.2
- @mui/icons-material@7.3.5
- @mui/material@7.3.5
- @mui/x-date-pickers@8.18.0
- @react-pdf/renderer@3.4.5
- @sentry/nextjs@8.55.0
- @tanstack/react-query@5.90.9
- @types/crypto-js@4.2.2
- @types/jspdf@1.3.3
- @types/lodash@4.17.20
- @types/react@18.3.26
- @types/react-dom@18.3.7
- crypto-js@4.2.0
- date-fns@4.1.0
- exceljs@4.4.0
- isomorphic-dompurify@2.32.0
- jspdf@3.0.3
- jspdf-autotable@5.0.2
- lodash@4.17.21
- nanoid@5.1.6
- next@15.5.6
- react@18.3.1
- react-dom@18.3.1
- react-hook-form@7.66.0
- recharts@3.4.1
- typescript@5.9.3
- zod@4.1.12

**Installierte Dev Dependencies:**

- @firebase/rules-unit-testing@5.0.0
- @types/\* (verschiedene Type-Definitionen)
- @typescript-eslint/eslint-plugin@7.18.0
- @typescript-eslint/parser@7.18.0
- autoprefixer@10.4.21
- dotenv@17.2.3
- eslint@8.57.1
- eslint-config-next@15.5.6
- eslint-config-prettier@9.1.0
- firebase@12.6.0
- postcss@8.5.6
- prettier@3.3.3
- tailwindcss@3.4.18
- vitest@2.1.9

---

## 2. Functions-Projekt Dependencies ✅

### Status: ✅ **VOLLSTÄNDIG INSTALLIERT**

**Verzeichnisse:**

- ✅ `functions/node_modules/` existiert
- ✅ `functions/package-lock.json` existiert

**Installierte Dependencies:**

- ✅ date-fns-tz@3.2.0
- ✅ firebase-admin@11.11.1
- ✅ firebase-functions@4.9.0
- ✅ nodemailer@6.10.1
- ✅ pdf-lib@1.17.1
- ✅ puppeteer@22.15.0

**Installierte Dev Dependencies:**

- ✅ @types/node@18.19.130
- ✅ typescript@5.9.3

---

## 3. Extraneous Packages (Optional Cleanup)

Die folgenden Pakete sind installiert, aber nicht explizit in `package.json` aufgeführt. Diese sind meist transitive Dependencies (Abhängigkeiten von anderen Paketen) und können normalerweise ignoriert werden:

**Root-Projekt:**

- @eslint/eslintrc
- @humanwhocodes/config-array
- @isaacs/cliui
- @vitest/mocker
- eslint-import-resolver-node
- eslint-module-utils
- eslint-plugin-import
- eslint-plugin-jsx-a11y
- eslint-plugin-react
- fast-glob
- micromatch
- rimraf
- string-width-cjs
- string-width
- sucrase
- tsconfig-paths
- vite

**Hinweis:** Diese Pakete werden von anderen Dependencies benötigt (z.B. eslint, vitest, next) und sollten **NICHT** manuell entfernt werden.

---

## 4. Veraltete Pakete (Optional Updates)

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

## Quelle: docs/DEPENDENCY_MAINTENANCE_PLAN.md

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

## Quelle: docs/DESIGN_NEXT_LEVEL_PLAN.md

# JobFlow Design – Plan „Nächstes Level“

Dieser Plan baut auf dem bestehenden Design-System (`.cursor/rules/01-design-system.mdc`, `docs/DESIGN_SYSTEM_2026.md`) und der aktuellen Implementierung (`lib/theme.ts`, `globals.css`, GlassCard, etc.) auf. Ziel ist eine spürbare Qualitätssteigerung bei gleichbleibender Markenidentität und technischer Stabilität.

---

## 1. Ausgangslage (Kurz)

| Bereich | Stand | Lücke |
|--------|--------|--------|
| **Theme** | Light-Theme in MUI, Petrol/Mustard, Glasmorphism | Dark Mode im ThemeModeContext vorhanden, aber **nicht** in MUI angebunden |
| **Tokens** | Farben/Shadows in `lib/theme.ts`, zusätzlich CSS-Variablen in `globals.css` | Doppelte Pflege, keine zentrale Token-Datei für beide Welten |
| **Komponenten** | GlassCard, StatCard, MUI-Overrides | Teilweise Hardcode-Farben (z. B. StatCard teal/rose/amber), keine durchgängige Nutzung von `theme.palette` |
| **Motion** | Einheitliche Transitions (200ms ease) | Kaum Stagger, keine Page-Transitions, Skeleton/Loading uneinheitlich |
| **Leere Zustände** | Vereinzelt | Kein einheitliches Pattern (Illustration + Text + CTA) |
| **A11y** | Grundlagen (Fokus, Hit-Areas) | Keine systematische Kontrast- und Fokus-Audits |

---

## 2. Vision „Nächstes Level“

- **Weniger „Template“, mehr Marke**: JobFlow wirkt bewusst als eigene Produktmarke (Petrol/Mustard, Glasmorphism) statt generisches Admin-UI.
- **Dark Mode als gleichwertige Option**: Nutzer:innen können zwischen Hell/Dunkel wählen; beide Modi sind voll durchdesigned.
- **Ein Token-System**: Eine Quelle für Farben, Abstände, Schatten, Radius – genutzt von MUI und CSS.
- **Konsistente Interaktion**: Jede Aktion hat klares Feedback (Hover, Focus, Loading, Success/Error); wo sinnvoll dezente Animation.
- **Klare leere Zustände**: Keine nackten „Keine Daten“-Flächen; kurzer Text + klare Primäraktion.
- **Barrierefreiheit als Standard**: WCAG AA durchgängig, Fokus sichtbar, Touch-Ziele eingehalten.

---

## 3. Phasen-Übersicht

| Phase | Fokus | Dauer (Orientierung) |
|-------|--------|------------------------|
| **A** | Foundation: Dark Mode + Token-Konsolidierung | 1–2 Wochen |
| **B** | Komponenten & Konsistenz | 1–2 Wochen |
| **C** | Motion, Loading, leere Zustände | ca. 1 Woche |
| **D** | Feinschliff & A11y | fortlaufend |

---

## 4. Phase A – Foundation

### A1. Dark Mode vollständig anbinden

- **Ziel**: `ThemeModeContext` steuert das MUI-Theme; Nutzer:innen sehen echte Dark-Variante.
- **Schritte**:
  1. In `lib/theme.ts` eine zweite Theme-Factory einführen (z. B. `createAppTheme(mode: 'light' | 'dark')`) mit Dark-Palette:
     - `background.default` → `#252422` (wie in 01-design-system.mdc)
     - `background.paper` / Cards → `rgba(255,255,255,0.08)`, Border `rgba(255,255,255,0.2)`, `backdropFilter: blur(12px)`
     - `text.primary` → `rgba(255,255,255,0.92)`, Secondary/Muted anpassen
     - Primary/Secondary beibehalten (Petrol/Mustard), ggf. leichte Aufhellung für Kontrast auf Dark
  2. `ThemeProvider.tsx`: `useThemeMode()` nutzen, `createAppTheme(mode)` aufrufen, bei Mode-Wechsel Theme neu erzeugen (oder mit `useMemo`/`key` neu mounten).
  3. `globals.css`: Unter `[data-theme="dark"]` (bzw. `.dark`) die CSS-Variablen für `.gradient-background`, `--color-background`, `--color-surface`, `--glass-panel`, Text- und Border-Farben setzen, damit alle Stellen, die CSS-Variablen nutzen, automatisch umschalten.
  4. GlassCard (und alle direkten Glasmorphism-Stile): Auf Theme-Tokens umstellen (z. B. `theme.palette.background.paper`, `theme.palette.divider`), damit sie in beiden Modi korrekt aussehen.
- **Erfolg**: Toggle Light/Dark wechselt gesamtes UI inkl. Header, Cards, Tabellen, Formulare.

### A2. Design-Tokens konsolidieren

- **Ziel**: Eine führende Quelle für Farben, Spacing, Radius, Shadows; MUI und CSS beziehen sich darauf.
- **Schritte**:
  1. **Option A (empfohlen)**: Tokens in TypeScript halten, CSS generieren.
     - Datei `lib/design-tokens.ts`: Objekt mit allen Werten (z. B. `colors`, `spacing`, `radius`, `shadows`, `duration`).
     - Beim App-Start oder per kleinem Script: Tokens als CSS Custom Properties in `:root` und `[data-theme="dark"]` injizieren (z. B. in `layout.tsx` oder einer „TokenProvider“-Komponente, die ein `<style>` mit den Variablen rendert).
     - `lib/theme.ts` liest dieselben Tokens (oder re-exportiert sie) für `createTheme()`.
  2. **Option B**: CSS als Single Source, MUI-Theme liest wo nötig aus getComputedStyle – aufwendiger und weniger typensicher.
  3. `globals.css` schlank halten: Nur noch Referenzen auf CSS-Variablen (z. B. `var(--color-background)`), keine doppelten Hex-Werte.
  4. `.cursor/rules/01-design-system.mdc` und `DESIGN_SYSTEM_2026.md` um Verweis auf `lib/design-tokens.ts` ergänzen.
- **Erfolg**: Änderung einer Farbe oder eines Radius an einer Stelle wirkt in MUI und CSS.

---

## 5. Phase B – Komponenten & Konsistenz

### B1. Theme-Tokens in allen Core-Komponenten

- **Ziel**: Keine Hardcode-Hex mehr in sichtbaren UI-Komponenten.
- **Betroffen (Beispiele)**:
  - `GlassCard`: Hintergrund, Border, Shadow aus `theme.palette` / `theme.shadows` / eigene Theme-Erweiterung (z. B. `theme.glass`).
  - `StatCard`: `colorThemes` auf `theme.palette.success`, `theme.palette.error`, `theme.palette.warning`, `theme.palette.grey` umstellen (oder semantische Tokens wie `kpi.teal`, `kpi.rose` im Theme definieren).
  - `GlobalHeader`: Alle `rgba(...)` durch Theme-Tokens ersetzen.
- **Regel**: In neuen und geänderten Komponenten nur noch `theme.palette.*`, `theme.shape`, `theme.shadows` bzw. CSS `var(--...)` verwenden.

### B2. Einheitliche Page-Header-Komponente

- **Ziel**: Jede Seite nutzt dasselbe Page-Header-Pattern (Titel, optional Untertitel, Aktionen rechts).
- **Schritte**:
  1. Gemeinsame Komponente z. B. `components/common/PageHeader.tsx`: Props `title`, `subtitle?`, `actions?` (ReactNode), optional `tabs?` oder `filter?`.
  2. Layout und Typografie wie in `DESIGN_SYSTEM_2026.md` (h4, body1 secondary, Stack für Buttons).
  3. Nach und nach bestehende Seiten auf `PageHeader` umstellen.
- **Erfolg**: Einheitlicher Look und einfachere Wartung.

### B3. DataGrid/Tabellen-Standard

- **Ziel**: Überall dense, Sticky Header, einheitliche Toolbar (Suche, Filter, Export).
- **Schritte**:
  1. Wiederverwendbare Wrapper-Komponente oder Hook (z. B. `DataTableToolbar`, `useTableState`) für Suche/Filter/Export.
  2. MUI DataGrid-Konfiguration (RowHeight 40–44px, Sticky Header) im Theme oder in einer gemeinsamen `JobFlowDataGrid`-Komponente bündeln.
  3. Bestehende Tabellen-Views prüfen und angleichen.

---

## 6. Phase C – Motion, Loading, leere Zustände

### C1. Motion-Richtlinien

- **Ziel**: Dezente, einheitliche Animation; keine Ablenkung, bessere Orientierung.
- **Maßnahmen**:
  - Bestehende `transition: 200ms cubic-bezier(0.4, 0, 0.2, 1)` als Standard beibehalten.
