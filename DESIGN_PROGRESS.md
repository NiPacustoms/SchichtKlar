# Design-Progress Schichtklar

## Status: DESIGN-MARATHON-ABGESCHLOSSEN

## Token-Entscheidungen
Alle Festlegungen leben in `lib/design-tokens.ts` (Single Source of Truth) + `lib/theme.ts` (MUI) + `app/globals.css` (CSS-Variablen, synchron gehalten).

1. **Typo-Skala (Apple HIG)**: h1 34/700/-0.02em · h2 28/600 · h3 22/600 · h4 20/600 · h5 17/600 · h6 15/600 · body1 16 · body2 14 · caption 13 · overline 12/600. Kein letterSpacing auf Body. Seitentitel = `variant="h2" component="h1"`. Zahlen: `.tabular-nums`-Utility für Zeiten/Beträge/Statistiken.
2. **Farbe**: Primär Petrol #005f73 (`petrolHover` #004d5c, active #003d47). Secondary Mustard mit dunklem contrastText (grey.900). Semantik WCAG-AA: error #dc2626, warning #b45309, info #2563eb, success #047857. `assignmentStatusColors` auf Semantikpalette. `shiftTypeColors` + `getShiftTypeColor()` zentral (Früh=info-Blau, Spät=warning-Amber, Nacht=#6d28d9, On-call=#0f766e, Fallback grey.500). Rollen-Chips primary/neutral (Rolle ist kein Status). Chart-Farben Petrol/PetrolLight + Semantik, Ziel-Balken slate.
3. **Schatten**: soft/medium/large weich+großflächig; Elevation-Map 1/2=soft, 3=medium, 4=large. Kopien via `var(--shadow-soft|medium|large)`.
4. **Glas**: `glassBlur = 'blur(20px) saturate(180%)'` überall. Dark-Border 0.14/0.24.
5. **Motion**: fast150/base200/smooth300; KEINE translateY/scale-Hovers; Hover = Farbe/Schatten; Transitions nur konkrete Properties; prefers-reduced-motion global; keine Dauer-Animationen (Auto-Karussell und Landing-Blob-Loops entfernt).
6. **Buttons**: flaches Petrol, minHeight 44, sizeSmall 36; EINE Contained-Primäraktion pro Kontext.
7. **Chips**: Pill (radius.pill 999), Höhe 28, fontSize 13 (keine lokalen 11/12px-Overrides).
8. **Tabellen**: Header 13/600 ohne Uppercase, 1px-Border; Scrollbars `var(--color-border-strong)`.
9. **Getönte Icon-Kreise** statt Gradient-Boxen: `alpha(accent, dark?0.24:0.1)` + Akzent als Icon-Farbe — Muster überall (EmptyState, AlertsPanel, KPI-/Staff-Karten, Dienstplan, Profil-Avatar).
10. **Progress-Bars**: Höhe 6–8, Pill-Radius, flache Semantikfarbe, Track alpha(accent, 0.12/0.2).
11. **Dark Mode**: `[data-theme='dark']`-Overrides schlagen `prefers-color-scheme` (body/.gradient-background); aktive Nav-Elemente nutzen primary.light.
12. **PWA theme-color** #005f73; ToggleButton-Selected = getöntes Petrol; Zustände: Skeleton statt Spinner auf Seitenebene.

## Bereiche
1. Foundation — **fertig 9/10** (f328386, 84697e3)
2. Kernkomponenten — **fertig 9/10** (9285faa)
3. Employee-Flows — **fertig 9/10** (fd897db)
4. Admin-Flows — **fertig 9/10** (df7c0ac)
5. Zustände — **fertig 9/10** (d48b791)
6. Abschluss-Pass — **fertig 9/10** (5061c3f, ba6a551 + Finalisierung): Dark-Mode-Bug behoben und verifiziert, Landing-Typografie/Motion, Registrieren-Lila entfernt, Chart-Farben, ungenutztes KPISlideshow entfernt, finale Screenshot-Runde (Landing, Employee 390 hell/dunkel, Admin 1440 hell/dunkel).

## Finale Verifikation
- `npm run build` ✓, `npm run lint` ✓ (--max-warnings=0), `tsc --noEmit` ✓
- Unit-Tests: 24 passed / 21 failed — **identisch zur unveränderten Baseline** (Business-Logik-Tests, z. B. shiftTimeUtils; auf main gegengetestet), keine neuen Fehler
- E2E (Playwright, chromium): **33/34 passed**; der eine Fehler (dispatcher redirect-param) schlägt **auf dem unveränderten main-Stand identisch fehl** (in Worktree-Baseline verifiziert) — vorbestehend, proxy.ts wurde nie angefasst
- Screens per Screenshot geprüft: 390/768/1440, Light + Dark, Employee- und Admin-Flows
- PR: https://github.com/NiPacustoms/SchichtKlar/pull/9 (Draft), Branch gepusht

## Bekannte Restpunkte (bewusst dokumentiert, kein Blocker)
- Du/Sie-Mischung in Microcopy (z. B. zeiten „Verwalten Sie“, dienstplan „deiner“) — Textfrage, nicht Design-System
- BottomNav erscheint auch auf Desktop — bewusste Alt-Entscheidung der App; keine Sidebar im Layout eingebunden; ohne Ersatz nicht entfernen
- StaffGroupDialog: 10-Farben-Auswahlpalette (funktional — Nutzer wählt Gruppenfarbe) belassen
- Recharts braucht Farb-Literale — Werte entsprechen den Token-Werten
- Debug-Seiten (app/debug*) mit Inline-Styles — nicht produktrelevant
- Landing-Features erscheinen erst beim Scrollen (IntersectionObserver) — in Fullpage-Screenshots unsichtbar, im Browser korrekt
- E2E dispatcher/assignment-workflow „redirect param is preserved“: vorbestehend rot (auch auf main)

## Folgearbeit nach Abschluss
- **Landing-Page neu (Nutzerwunsch, nach Marathon-Abschluss)**: High-End-cleane Startseite für den Pflegebereich — ruhige Kopfzeile (kleines Logo + Login), zentrierter Hero (Overline, H1 34/48, eine Primäraktion), sachliche Vertrauens-Hinweise (DSGVO, § 11 AÜG, digitale Signatur — nur real vorhandene Funktionen, keine erfundenen Claims), 6er-Feature-Grid im Icon-Kreis-Muster, 3-Schritte-Ablauf, zwei Zielgruppen-Karten, getöntes CTA-Band, Footer mit Hairline. Statische Deko-Blobs und IO-Scroll-Animation entfernt. Hero-Zweitaktion als Text-Button „Ich habe bereits ein Konto“ (behebt zugleich Playwright-Strict-Mode bei doppeltem „Login“). Verifiziert 390/768/1440 + e2e home.spec 2/2. Bewertung 9/10.

## Screenshot-/Emulator-Setup (für Folge-Sessions)
- Firebase-Emulator: `cd <scratchpad>/emu && <repo>/node_modules/.bin/firebase emulators:start --only auth,firestore --project demo-schichtklar` (Hintergrund; Minimal-firebase.json nötig, Repo-Config scheitert am Hosting-Framework)
- Seed: `node <scratchpad>/seed-emulator.mjs` (admin@demo.de/admin123, nurse@demo.de/nurse123)
- Server: `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-schichtklar FIREBASE_PROJECT_ID=demo-schichtklar npm run start` — nach JEDEM Build neu starten (sonst 400er auf alte Chunks)
- Screenshots: `WIDTHS=390,1440 node <scratchpad>/shoot-auth.mjs <outdir> <email> <pw> <pfade...>` (bypassCSP, Cookie-Consent via initScript); Dark Mode: `shoot-auth-dark.mjs`; öffentlich: `shoot.mjs`
- `.env.local` (gitignored) nötig für Build (Legal-ENV-Validierung)
