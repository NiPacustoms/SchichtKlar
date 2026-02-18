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
  - Optional: Stagger bei Listen (z. B. `.animate-fade-in` mit `animation-delay` pro Kind) für Dashboard-Karten oder Activity-Listen.
  - `prefers-reduced-motion: reduce` weiter strikt beachten (Bereits in theme.ts bei Buttons; global in globals.css).
  - Keine Page-Transitions erzwingen – nur wo UX-Gewinn (z. B. Modals/Drawer) bereits umgesetzt.

### C2. Loading-States vereinheitlichen

- **Ziel**: Klare Regel „Toolbar = LinearProgress, Tabellen/Cards = Skeleton“.
- **Schritte**:
  1. `LoadingStates.tsx` und alle Verwendungen prüfen: Skeleton-Layouts an echte Inhaltsstruktur anpassen (z. B. Karten-Grid als Skeleton-Grid).
  2. Ein gemeinsames Pattern für „Toolbar mit Progress“ (z. B. `ToolbarWithProgress` oder Slot in AppLayout) definieren und nutzen.
  3. Buttons: Loading-State (disabled + Spinner oder Loading-Indikator) wo sinnvoll einbauen.

### C3. Leere Zustände (Empty States)

- **Ziel**: Keine nackten „Keine Daten“-Meldungen; kurzer Erklärungstext + eine Primäraktion.
- **Schritte**:
  1. Komponente `EmptyState.tsx`: Props `title`, `description?`, `action?` (Button/Link), optional `illustration` (SVG oder Bild).
  2. Einheitliches Layout: zentriert, max. Breite, klare Typografie-Hierarchie.
  3. In allen relevanten Listen/Ansichten (Aufträge, Mitarbeiter, Dokumente, Chat, etc.) einbauen und alte Platzhalter ersetzen.

---

## 7. Phase D – Feinschliff & Barrierefreiheit

### D1. A11y-Audit

- **Ziel**: WCAG AA sicherstellen, Fokus und Kontrast prüfen.
- **Maßnahmen**:
  - Kontrast-Checks für Text und Buttons in Light und Dark (z. B. mit axe DevTools oder Lighthouse).
  - Alle IconButtons mit `aria-label` versehen (bereits in Rules; durchgehen und fehlende ergänzen).
  - Fokus-Ringe einheitlich (z. B. `outline: 2px solid theme.palette.primary.main`, `outline-offset: 2px`) und in globals.css für `:focus-visible` abdecken.
  - Touch-Ziele mind. 44x44px (bereits in globals.css; prüfen ob alle relevanten Komponenten erfasst sind).

### D2. Feinschliff

- **Optional**:
  - Illustrationen oder Icons für Empty States und Onboarding (ein Stil, z. B. line/outline).
  - Leichte Verfeinerung der Gradient-Hintergründe (z. B. Dark Mode mit dezentem Petrol-Gradient).
  - Einmalige Überarbeitung der wichtigsten User-Flows (Login, erste Schritte, Dashboard) aus reiner UI-Perspektive.

---

## 8. Priorisierung & Quick Wins

| Priorität | Maßnahme | Aufwand | Impact |
|-----------|----------|--------|--------|
| Hoch | A1 Dark Mode anbinden | mittel | Sehr hoch (erwartete Funktion) |
| Hoch | A2 Tokens konsolidieren | mittel | Hoch (Wartbarkeit, Dark Mode) |
| Hoch | B1 Theme in GlassCard/StatCard/Header | gering | Hoch (Konsistenz, Dark) |
| Mittel | B2 PageHeader-Komponente | gering | Mittel |
| Mittel | C3 EmptyState-Komponente + Einbau | gering | Mittel (Wahrnehmung) |
| Mittel | C2 Loading vereinheitlichen | gering | Mittel |
| Niedrig | B3 DataGrid-Standard | mittel | Mittel |
| Niedrig | C1 Stagger/Motion | gering | Niedrig |
| Niedrig | D1 A11y-Audit | mittel | Hoch langfristig |

**Sinnvoller Einstieg**: A1 (Dark Mode) + B1 (Tokens in GlassCard/StatCard/Header) parallel angehen; danach A2 Token-Konsolidierung, dann Empty States und PageHeader.

---

## 9. Technische Ankerpunkte

- **MUI 5** bleibt Basis; keine zusätzliche UI-Bibliothek.
- **Theme**: Eine Factory `createAppTheme(mode)` in `lib/theme.ts`; ThemeProvider reagiert auf `useThemeMode().mode`.
- **CSS**: Glasmorphism und Layout weiter in `globals.css`, aber Farben/Shadows nur noch über Variablen, die aus Tokens gespeist werden.
- **Komponenten**: Neue/geänderte Komponenten nur mit Theme-Tokens und benannten Exporten; Mobile-First und 8px-Grid beibehalten.

---

## 10. Erfolgskriterien

- Nutzer:innen können zwischen Light und Dark wechseln und erhalten eine vollständige, konsistente Darstellung.
- Keine doppelten Definitionen für Farben/Shadows; Änderungen an einer Stelle wirken überall.
- Leere Listen/Ansichten zeigen ein einheitliches Empty-State-Pattern mit klarer Handlungsoption.
- WCAG AA bei Kontrast und Fokus erfüllt; alle IconButtons mit ARIA-Label.
- Das Design wirkt bewusster „JobFlow“ (Marke, Glasmorphism, Petrol/Mustard) und nicht wie ein generisches Template.

---

*Stand: Februar 2026. Bei Umsetzung die bestehenden Rules (01-design-system.mdc, 02-frontend.mdc) und DESIGN_SYSTEM_2026.md weiter beachten und bei Abweichungen aktualisieren.*
