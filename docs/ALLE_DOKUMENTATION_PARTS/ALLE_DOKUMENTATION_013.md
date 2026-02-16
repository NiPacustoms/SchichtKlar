# JobFlow – Dokumentation Teil 13

*Zeichen 238369–258249 von 2862906*

---

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



---

## Quelle: docs/DESIGN_SYSTEM_2026.md

# JobFlow Design System 2026

## 1. Zielbild

- **Mobile-First, aber Desktop-stark**: Primär für Smartphones optimiert, mit vollwertigen Layouts für Tablet und Desktop (Admin-Command-Center).
- **Marktführer-Anmutung**: Warm-professioneller Look (ähnlich Notion/Slack), klares Branding, dezentes Glasmorphism.
- **Klarheit & Geschwindigkeit**: Fokus auf schnelle Erfassbarkeit von Informationen und wenigen, klaren Hauptaktionen pro Screen.

**Basis:** Dieses Dokument konsolidiert die Design-Guidelines aus `.cursor/rules/01-design-system.mdc` und definiert die konkreten Implementierungsstandards für das JobFlow Design System 2026.

---

### 2. Farb-System

Basierend auf den Vorgaben aus `.cursor/rules/01-design-system.mdc`, in Theme-Tokens gegossen.

#### 2.1 Brand-Farben (Primary & Secondary)

- **Primary (Petrol)**
  - `palette.primary.main` – Petrol `#005f73` (Haupt-Brand-Farbe)
  - `palette.primary.light` – `#0a9396` (hellere Variante für Hover/Background)
  - `palette.primary.dark` – `#003d47` (für aktive States, Fokus)
  - `palette.primary.contrastText` – `#ffffff` (Text auf Primary-Hintergrund)
- **Secondary (Mustard)**
  - `palette.secondary.main` – Mustard `#e8aa42` (Akzent-Farbe)
  - `palette.secondary.light` – `#f4c430` (hellere Variante)
  - `palette.secondary.dark` – `#c3842a` (dunklere Variante)

#### 2.2 Status-Farben

- `palette.success.main` – `#10b981` (Erfolg, Bestätigung)
  - `palette.success.light` – `#d1fae5` (Hintergrund)
  - `palette.success.dark` – `#059669` (dunklere Variante)
- `palette.info.main` – `#3b82f6` (Information)
  - `palette.info.light` – `#dbeafe` (Hintergrund)
  - `palette.info.dark` – `#2563eb` (dunklere Variante)
- `palette.warning.main` – `#f59e0b` (Warnung)
  - `palette.warning.light` – `#fef3c7` (Hintergrund)
  - `palette.warning.dark` – `#d97706` (dunklere Variante)
- `palette.error.main` – `#ef4444` (Fehler, Kritisch)
  - `palette.error.light` – `#fee2e2` (Hintergrund)
  - `palette.error.dark` – `#dc2626` (dunklere Variante)

#### 2.3 Hintergründe & Oberflächen

- `palette.background.default` – App-Hintergrund `#fafbfc` (helles, ruhiges Grau)
- `palette.background.paper` – Standard-Karten-Hintergrund `rgba(255,255,255,0.98)` (leicht abgesetzt)
- **Glasmorphism-Oberflächen** (via `GlassCard` Komponente):
  - `CARD_GLASS_LIGHT` – `rgba(255,255,255,0.98)` (Standard)
  - `CARD_GLASS_HOVER` – `rgba(255,255,255,1)` (Hover-State)
  - `CARD_BORDER_LIGHT` – `rgba(0,95,115,0.08)` (Standard-Border)
  - `CARD_BORDER_HOVER` – `rgba(0,95,115,0.16)` (Hover-Border)

#### 2.4 Text-Farben

- `palette.text.primary` – `rgba(15,23,42,0.95)` (hohe Lesbarkeit, Haupttext)
- `palette.text.secondary` – `rgba(15,23,42,0.65)` (abgeschwächte Texte, Labels)
- `palette.text.disabled` – `rgba(15,23,42,0.4)` (deaktivierte Elemente)

#### 2.5 States & Interaktionen

**Hover-States:**

- Buttons: `palette.primary.light` für Primary, `palette.secondary.light` für Secondary
- Cards: `translateY(-2px)`, intensiverer Shadow (`SHADOW_MEDIUM`), Border-Hervorhebung

**Active-States:**

- Buttons: `palette.primary.dark` für Primary
- Cards: Border `2px solid ${palette.primary.main}`

**Disabled-States:**

- Buttons: `alpha(palette.primary.main, 0.3)` Hintergrund, `alpha('#fff', 0.5)` Text
- Inputs: `palette.text.disabled` für Text und Border

**Elevated-States:**

- Cards mit erhöhter Priorität: `SHADOW_LARGE` statt `SHADOW_SOFT`

#### 2.6 Shadow-Definitionen

- `SHADOW_SOFT` – `0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)` (Standard)
- `SHADOW_MEDIUM` – `0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.1)` (Hover)
- `SHADOW_LARGE` – `0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.15)` (Elevated)

#### 2.7 Border-Radius

- `shape.borderRadius` – Standard `12px` (Buttons, Inputs)
- Cards: `16px` (via `GlassCard` Komponente)
- Chips/Badges: `8px`

---

### 3. Typografie

Basis: **Inter** (oder System-Fallback), konsistent in MUI `typography` hinterlegt.

- **Headlines**
  - `h1` – 32/40, `fontWeight: 700` (nur auf wenigen, wichtigen Seiten).
  - `h2` – 24/32, `fontWeight: 600`.
  - `h3` – 20/28, `fontWeight: 600`.
- **Body**
  - `body1` – 14/20, Standard-Fließtext.
  - `body2` – 13/18, sekundäre Informationen.
- **UI-Text**
  - `button` – 14/20, `fontWeight: 600`, **kein All-Caps**.
  - `caption` – 12/16, Labels, Hilfstexte.

Prinzipien:

- Maximal zwei Schriftgrößen pro Bereich (z.B. Titel + Body).
- Wichtige Zahlen/KPIs immer mit `fontWeight: 700` und ausreichend Kontrast.

---

### 4. Layout & Spacing

#### 4.1 Grid & Spacing

- **8px-Grid als Basis**
  - Alle Abstände sind Vielfache von 8px: 8, 16, 24, 32, 40, 48px
  - MUI `spacing` ist auf 8px konfiguriert: `theme.spacing(1) = 8px`
- **Container-Breiten**
  - Mobile (XS): Vollbreite mit Innenabstand `px: { xs: 2, sm: 3 }`
  - Tablet (SM-MD): max. 1200px zentriert
  - Desktop (LG+): max. 1440px zentriert (siehe `AppLayout`)

- **Vertikale Abstände**
  - Zwischen Sektionen: 24px (`spacing={3}`)
  - Zwischen Cards: 16px (`spacing={2}`)
  - Innerhalb Cards: 8-16px (`spacing={1}` oder `spacing={2}`)

#### 4.2 Shell-Komponenten

**AppLayout** (`components/layout/AppLayout.tsx`)

- Verantwortlich für:
  - Hintergrund (`gradient-background` CSS-Klasse)
  - MaxWidth-Container (1440px)
  - Responsive Padding (`pt: { xs: 2, sm: 3 }`, `px: { xs: 2, sm: 3 }`)
  - Bottom-Padding für BottomNav (`pb: 'calc(env(safe-area-inset-bottom) + 72px)'`)
- Verwendung: Wrapper für alle Seiten-Inhalte

**GlobalHeader** (`components/layout/GlobalHeader.tsx`)

- Globale Topbar mit:
  - Branding/Logo (zentriert)
  - User-Info (links)
  - NotificationBell + Dashboard-Button + Logout (rechts)
- Glasmorphism-Styling: `rgba(255,255,255,0.85)`, `backdropFilter: blur(20px)`
- Sticky am oberen Rand, zIndex: 1000

**BottomNavigation** (`components/layout/BottomNavigation.tsx`)

- Mobile-First Navigation:
  - Max. 4-5 Haupt-Tabs (Employee: Arbeitsplatz, Dienstplan, Zeit, Profil)
  - "Mehr"-Button für zusätzliche Links (via Menu)
- Sticky am unteren Rand mit Safe-Area-Padding
- Glasmorphism-Styling wie GlobalHeader
- Icons + Labels für klare Erkennbarkeit

#### 4.3 Page-Header Pattern

**Standard-Page-Header** (keine dedizierte Komponente, aber konsistentes Pattern):

```tsx
<Box sx={{ mb: 4 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
    <Typography variant="h4" sx={{ fontWeight: 700 }}>
      Seitentitel
    </Typography>
    <Stack direction="row" spacing={1}>
      <Button variant="outlined">Sekundäre Aktion</Button>
      <Button variant="contained">Primäre Aktion</Button>
    </Stack>
  </Box>
  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
    Optionaler Untertitel oder Beschreibung
  </Typography>
  {/* Optional: Filter/Tabs darunter */}
</Box>
```

**Verwendung:**

- Titel: `Typography variant="h4"` mit `fontWeight: 700`
- Untertitel: `Typography variant="body1"` mit `color: 'text.secondary'`
- Aktionen: Rechts ausgerichtet, `Stack direction="row"` mit `spacing={1}`
- Filter: Optional darunter (DateRange, Tabs, etc.)

---

### 5. Glasmorphism & Oberflächen

Glasmorphism wird gezielt und sparsam eingesetzt (primär für Cards und Overlays).

- **GlassCard-Basis**
  - Heller, halbtransparenter Hintergrund (`surface.main` + Alpha).
  - Weiche Schatten, dezente Border mit Brand-Tönung.
  - Hover-State: leichte Erhöhung (`translateY(-2px)`), intensiverer Shadow, Border leicht betont.
- **Verwendung**
  - KPI-Kacheln im Admin-Dashboard.
  - Hero-Karten (z.B. heutiger Einsatz im Employee-Home).
  - Wichtigere Panels wie Action Center, Benachrichtigungen.
- **Nicht verwenden für**
  - Lange Formulare oder Tabellenkörper.
  - Vollflächige Hintergründe.

---

### 6. Mobile-First Patterns

- **Bottom Navigation (Mitarbeitende)**
  - Max. 4–5 Haupt-Tabs (z.B. Arbeitsplatz, Dienstplan, Zeit, Chat, Profil).
  - Sticky, mit Safe-Area-Padding (`env(safe-area-inset-bottom)`).
  - Klare Icons + Labels (kein Rätselraten).
- **Toolbars & Actions**
  - Auf XS: `Stack direction=\"column\"`, Buttons `fullWidth`.
  - Auf SM+: `Stack direction=\"row\"`, Buttons in einer Zeile.
- **Tabellen-Fallback**
  - Auf kleinen Screens werden Tabellen durch Card-Listen ersetzt:
    - Wichtigste Kennzahl/Infos oben.
    - Sekundäre Infos und Actions darunter (IconButtons oder kleine Buttons).

---

### 7. Admin vs. Employee UI-Patterns

- **Mitarbeitende (Employee)**
  - Fokus auf wenige, klar priorisierte Aktionen:
    - „Zeit starten/stoppen“, „Schicht annehmen“, „Nachricht senden“, „Dokument ansehen“.
  - Hero-Screens (z.B. `Arbeitsplatz`):
    - Above-the-fold: heutiger/nächster Einsatz + Hauptaktion.
    - Darunter: „Heute wichtig“ (Zeiten, Dokumente, Nachrichten) und nächste Einsätze.
  - Navigation über BottomNav, große Touch-Flächen, verständliche Status-Badges.

- **Admins**
  - Höhere Informationsdichte, aber klare visuelle Hierarchie.
  - Dashboard als „Command Center“:
    - KPI-Grid, Action Center, Planungs-Preview, Activity-Feed.
  - Desktop-first Layouts, die sinnvoll auf Tablet/kleinere Screens umbrechen.

---

### 8. Komponenten-Bausteine (Patterns)

- **Page Header**
  - `Typography variant=\"h4\"` für Titel.
  - Untertitel in `body1` für Beschreibung.
  - Rechts `Stack` mit 1–2 Hauptaktionen (Primary/Secondary Button).
- **KPI-Karte (AdminKPICard)**
  - Wert (groß, fett), Label (klein, sekundär), Icon (Brand-Farbe).
  - Optionaler Trend (% vs. Vortag/Vorwoche).
- **Action Center**
  - Liste von To-dos mit Schweregrad und Direktlink zu Detailseiten.
- **Listen-/Card-Pattern**
  - Hauptzeile: Titel + Status/Chip.
  - Unterzeile: kombinierte Infos (Datum, Zeit, Ort usw.) in `body2`.

---

### 9. Barrierefreiheit & Feedback

- **A11y-Grundsätze**
  - Mindestens WCAG AA-Kontrast für Text & UI-Elemente.
  - Deutliche Fokuszustände (sichtbarer Rahmen oder Schatten).
  - ARIA-Labels für IconButtons ohne Text.
  - Hit-Area ≥ 40x40px für alle interaktiven Elemente.
- **Feedback**
  - Positive/Fehler-Meldungen per Snackbar unten rechts (max. 1 sichtbar, autoHide 4–6s).
  - Leere Zustände mit Erklärung + klarer Primäraktion.

---

### 10. Implementierungsregeln (für Entwickler:innen)

- **Theme nutzen, keine „rohen“ Farben**
  - Keine harten Hex-Werte in Komponenten – stattdessen `theme.palette.*` bzw. `theme.*`-Erweiterungen.
- **Konsistente Layouts**
  - Page-Header + Content-Bereich + optionale rechte Spalte (Context/KPIs) als Standard.
- **Mobile-First denken**
  - Zuerst XS/SM-Layout definieren, dann auf MD/LG erweitern.
- **Kein endloses Scrolling**
  - Tabellen/Listen paginieren oder mit „Load more“-Mechanik versehen.



---

## Quelle: docs/DISASTER_RECOVERY.md

# Disaster Recovery Runbook

Ziel: Wiederherstellung der Kernfunktionen (Auth, Firestore, Storage) innerhalb RTO <= 2h bei RPO <= 24h.

## Backup-Quelle

- Firestore: `scripts/firestore-backup.sh` exportiert nach `gs://<BACKUP_BUCKET>/firestore/<PROJECT>/<YYYYMMDD-HHMMSS>`
- Storage: `scripts/storage-backup.sh` kopiert nach `gs://<BACKUP_BUCKET>/storage/<PROJECT>/<YYYYMMDD-HHMMSS>/`

## Wiederherstellung Firestore

1. Projekt setzen: `gcloud config set project <PROJECT_ID>`
2. Letztes Backup finden: `gsutil ls gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/`
3. Restore: `gcloud firestore import gs://<BACKUP_BUCKET>/firestore/<PROJECT_ID>/<STAMP>`
4. Indexe prüfen: `node scripts/create-firestore-indexes.js`

## Wiederherstellung Storage

1. Prüfe Zielbucket (Produktion): `gs://<PROJECT_ID>.appspot.com`
2. Sync: `gsutil -m rsync -r gs://<BACKUP_BUCKET>/storage/<PROJECT_ID>/<STAMP>/ gs://<PROJECT_ID>.appspot.com`

## Secrets & Konfiguration

- `.env` und Firebase-Konsole prüfen (API Keys, OAuth Redirects, Auth-Domains)
- Service Accounts: Zugriff auf Backup-Bucket (Storage Admin, Firestore Admin)

## Smoke Tests (nach Restore)

- Login (Admin & Mitarbeiter)
- Schichtliste laden (Filter)
- Dokumente anzeigen/Download
- Timesheet erstellen
- Admin: Einrichtung ändern

## Rollen & Regeln

- `firestore.rules` neu deployen und Querzugriff-Tests durchführen

## Protokollierung

- Zeiten dokumentieren: Start, Ende, Dauer
- Datenstand dokumentieren: Backup-Stempel (RPO)

## Drill-Frequenz

- Quartalsweise durchführen, Ergebnisse im Repo dokumentieren

---

## Deployed Version zurück ins Git (welcher Commit liegt live?)

**Wichtig:** Auf Firebase liegt nur der **Build** (kompilierte App), nicht der Quellcode. Quellcode lebt in Git. Wenn ihr den deployten Stand wiederherstellen wollt, braucht ihr den **Commit**, der zuletzt erfolgreich deployed wurde.

### Option 1: Letzten deployten Commit ermitteln (GitHub Actions)

Der Production-Deploy (`.github/workflows/firebase-hosting.yml`) baut bei jedem Push auf `main`. Der **Commit, der den Lauf ausgelöst hat, ist der deployte Stand.**

- **Manuell:** GitHub → Repo → Actions → Workflow „Deploy to Firebase Hosting“ → letzten **erfolgreichen** Run auf `main` öffnen → oben steht der Commit (z. B. „abc123“). Lokal: `git fetch origin && git checkout abc123`.
- **Per Script:** Im Projektroot ausführen:
  ```bash
  ./scripts/get-deployed-commit.sh
  ```
  Das Script gibt die Commit-SHA des letzten erfolgreichen Production-Deploys aus (falls GitHub API erreichbar). Dann: `git fetch origin && git checkout <ausgegebene-SHA>`.

### Option 2: Release-Tags setzen (empfohlen für später)

Bei jedem Production-Deploy einen Tag setzen, damit ihr jederzeit den live-Stand checkouten könnt:

- Nach erfolgreichem Deploy: `git tag release-$(date +%Y%m%d-%H%M) main && git push origin --tags`
- Wiederherstellen: `git fetch origin && git checkout release-20250215-1200` (Beispiel).

Ihr könnt das in der GitHub Action nach dem Deploy automatisch machen (z. B. mit `actions/github-script`).

### Option 3: Repo komplett verloren – was geht, was nicht

- **Von Firebase „Quellcode zurückholen“:** Nicht möglich. Hosting liefert nur die **deployten Dateien** (HTML, JS-Bundles, CSS). Das ist kompiliert/minifiziert, kein editierbarer TypeScript/React-Code.
- **Build-Artefakte als Notfall-Backup:** Man könnte die Live-Site per `wget`/Crawler herunterladen – das ist nur ein Snapshot der **gebauten** App, kein Ersatz für Git.
- **Fazit:** Git (oder ein Mirror/Backup des Repos) ist die einzige Quelle für den echten Quellcode. Repo regelmäßig sichern und bei jedem Live-Release den zugehörigen Commit dokumentieren oder taggen.



---

## Quelle: docs/DSGVO_PROZESSE.md

# DSGVO Prozesse (JobFlow)

Dieses Dokument beschreibt die datenschutzrelevanten Prozesse: Auftragsverarbeitung (AVV), Technische und organisatorische Maßnahmen (TOMs), Datenfluss, sowie Lösch- und Exportprozesse.

## 1. Auftragsverarbeitung (AVV) – Checkliste

- Parteien: Verantwortlicher (Kunde), Auftragsverarbeiter (JobFlow), Unterauftragsverarbeiter (Google/Firebase)
- Gegenstand/Zweck: Personal-/Einsatzplanung, Zeiterfassung, Dokumente
- Dauer: Vertragslaufzeit + gesetzliche Aufbewahrung
- Art/Umfang der Daten: Konto-, Kontakt-, Beschäftigungs- und Dokumentdaten
- Betroffene: Mitarbeiter, Disponenten, Administratoren
- TOMs: siehe Abschnitt 2
- Unterauftragsverarbeiter: Firebase/Google Cloud (Standorte EU/EEA bevorzugt)
- Weisungsrecht, Unterstützung Betroffenenrechte, Löschkonzept, Audit-Rechte
- Übermittlungen in Drittländer: SCCs/Transfer Impact Assessment falls nötig

## 2. Technische und organisatorische Maßnahmen (TOMs)

- Zugriffskontrolle: RBAC, Least Privilege, MFA für Admins
- Mandantenisolation: Firestore-Rules mit `tenantId`-Abgleich
