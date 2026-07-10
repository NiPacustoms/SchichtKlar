# Design-Progress Schichtklar

## Status: IN ARBEIT | Bereich 1, Schritt „Streu-Hexes in Schedule-/Admin-Komponenten migrieren"

## Token-Entscheidungen

**Wichtig – Abweichung vom Marathon-Briefing (dokumentiert, vom Eigentümer am 10.07.2026 explizit gewählt):**
Das Briefing nennt „Glassmorphism beibehalten" und „#005f73 verfeinern". Der Eigentümer hat
am selben Tag per expliziter Auswahl **„Frisches Teal-Grün" + „Clean & Flat"** festgelegt;
dieses Design ist deployed. Der Marathon führt DIESE Design-Sprache auf Apple-Niveau weiter.
NICHT zu Glassmorphism zurückkehren.

1. **Farbwelt** (`lib/design-tokens.ts` = Single Source of Truth):
   - Marke: Teal `#0f766e` (brand), `#14b8a6` (brandLight, Dark-Mode-Primär), `#115e59` (brandDark)
   - Akzent: Amber `#d97706` (sparsam; Sekundär-Aktionen/Highlights)
   - Neutral: warme Stone-Skala (`grey.50 #fafaf9` … `grey.900 #1c1917`) – KEIN kühles Slate
   - Semantik: success `#16a34a`, warning `#f59e0b`, error `#ef4444`, info `#3b82f6` – NUR für Status
2. **Flächen**: opak, flach. Tiefe über 1px-Borders (`light.border.main rgba(28,25,23,0.10)`)
   + dezente Schatten (`shadows.soft/medium/large`). Kein `backdrop-filter`, keine Verläufe auf
   Bedienelementen. `.glass`/`GlassCard`-API bleibt (Namen), Optik ist flach.
3. **Zustands-Systematik** (Tonschichten der Markenfarbe): hover 4–6 %, selected 8–10 %,
   pressed 12 %. In Komponenten als `alpha(brand, 0.04/0.08/0.12)` bzw. `rgba(15, 118, 110, x)`.
4. **Typografie**: Inter (einzige Familie), Skala 32/26/22/19/17/15.5/14/12.5,
   Headings mit negativem Tracking, `fontFeatureSettings 'cv11','ss01'`,
   **tabular-nums** in Tabellen (`MuiTableCell`) und Metriken (`.metric-value`).
5. **Radii**: sm 6 / md 8 / lg 12 / xl 16 / dialog 12. **Spacing**: 8er-Grid (`spacingScale`).
6. **Motion**: duration 150/200/300 ms, easing `cubic-bezier(0.4,0,0.2,1)`, nur Farbe/Schatten
   (keine Transform-Sprünge auf Karten), `prefers-reduced-motion` global respektiert (globals.css).
7. **Chips** = getönte Pills (alpha-Fläche + dunkle Textfarbe), keine Vollfarb-Chips.
8. **Fokus**: 2px-Ring in Markenfarbe, `outlineOffset 2`, überall (MuiCssBaseline + globals.css).
9. **PDF-Dokumente** teilen die Design-Sprache: `lib/services/pdf/brandedPdf.ts`
   (Briefkopf mit Logo, Teal-Tabellenkopf, Zebra `#fafaf9`, Fußzeile mit Seitenzahlen).
10. **Logo**: `public/logo-default.png` (hell) / `logo-default-dark.png` (Dark Mode; AppLogo
    wählt automatisch). Assets reproduzierbar via `node scripts/generate-brand-assets.mjs`.

## Bereiche

1. **Foundation** — in Arbeit (8/10). Erledigt: Token-Datei komplett neu (Teal/Stone/flat),
   MUI-Theme durchkomponiert (Buttons/Cards/Tables/Tabs/Menu/Tooltip/Forms/Chips/Alerts/
   Skeleton/Avatar/ListItemButton), globals.css migriert, Alt-Marken-rgba (Petrol) vollständig
   entfernt, OpenShiftCard-Verläufe → Semantikfarben. **Offen:** Streu-Hexes in
   `components/schedule/*` (Schichttyp-Farben ED6C02/2E7D32/0288D1/7B1FA2 → Token-Map),
   `components/admin/StaffGroupDialog.tsx` (13 Hexes), `app/(admin)/admin/berichte/page.tsx` (9),
   `app/(employee)/employee/berichte/page.tsx` (8), `StatisticsChart/Tabs`, `ProfileStats`;
   23 Inline-`transition:`-Strings → Token. (`app/debug/token/page.tsx` ist Debug-Seite – ok.)
2. **Kernkomponenten** — teilweise über Theme abgedeckt (9/10 Theme-Ebene); Einzeldurchsicht offen
   (GlassCard ✓ flach, AlertsPanel/Navigation/Listen noch nicht einzeln auditiert).
3. **Employee-Flows** — offen. Mobile-first prüfen: Stempeln, Dienstplan, Zeiten, Profil, Dokumente.
4. **Admin-Flows** — offen. Dashboard, Einsatzplanung, Einrichtungen, Reports.
5. **Zustände** — offen. Skeletons statt Spinner (LoadingSpinner nutzt noch Spinner+Puls),
   EmptyState ✓ vorhanden (Avatar jetzt flach), Fehler-/Erfolgs-Feedback sichten.
6. **Abschluss-Pass** — offen.

## Verifikations-Setup (für Screenshot-Schritte)

- Testzugänge (Staging): `schichtklar-admin@example.com` / `Schichtklar-Admin-2026!` (admin),
  `schichtklar-mitarbeiter@example.com` / `Schichtklar-Test-2026!` (nurse).
- Lokal: `npm run build && npm run start`, Playwright mit `executablePath:
  '/opt/pw-browsers/chromium'`, Viewports 390/768/1440. Live-Alternative:
  https://schichtklar.web.app (Container-Proxy blockt *.web.app – Screenshots daher lokal).

## Nächster Schritt

Bereich 1 abschließen: (a) In `lib/design-tokens.ts` eine `shiftTypeColors`-Map ergänzen
(früh/spät/nacht → semantisch sinnvolle, flache Farben aus der bestehenden Palette) und
`components/schedule/{ShiftList,AssignmentCard,AssignmentRequestCard,AdminListView,OpenShiftCard}.tsx`
darauf umstellen. (b) `StaffGroupDialog.tsx`, beide `berichte/page.tsx`, `StatisticsChart/Tabs.tsx`,
`ProfileStats.tsx`: Hexes → `theme.palette`/Tokens. (c) Inline-`transition:`-Strings auf
`duration/easing`-Tokens umstellen (grep `transition: '`). Danach `npm run build` + Screenshots
(Setup oben) für Dashboard + Dienstplan in 390/768/1440, Selbstbewertung, Commit
`design: foundation — Streu-Hexes und Transitions auf Tokens`, DESIGN_PROGRESS.md aktualisieren,
dann Bereich 2 (Kernkomponenten-Einzelaudit: AlertsPanel, AppSidebar, BottomNavigation, Listen).
