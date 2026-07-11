# Design-Progress Schichtklar

## Status: IN ARBEIT | Bereich 1, Schritt: Foundation umgesetzt, Build-Verifikation läuft

## Token-Entscheidungen
Alle Festlegungen leben in `lib/design-tokens.ts` (Single Source of Truth) + `lib/theme.ts` (MUI) + `app/globals.css` (CSS-Variablen, synchron gehalten).

1. **Typo-Skala (Apple HIG)**: h1 34/700/-0.02em · h2 28/600 · h3 22/600 · h4 20/600 · h5 17/600 · h6 15/600 · body1 16 · body2 14 · caption 13 · overline 12/600. Kein letterSpacing auf Body (Inter braucht keins). Zahlen: `.tabular-nums`-Utility (globals.css + MuiCssBaseline) für Zeiten/Beträge.
2. **Farbe**: Primär Petrol #005f73 (hover #004d5c = `colors.petrolHover`, active #003d47). Secondary Mustard mit **dunklem contrastText (grey.900)** statt Weiß (AA). Semantik AA-fest: error #dc2626, warning #b45309, info #2563eb, success #047857 (light-Werte bleiben blasse Flächen). `assignmentStatusColors` auf Semantikpalette gemappt (kein rohes Material-Orange/Grün/Blau mehr). NEU: `shiftTypeColors`-Token (früh=info, spät=warning, nacht=#6d28d9) für die 3x duplizierte getShiftTypeColor-Logik (Umbau in Bereich 2/3).
3. **Schatten**: weich + großflächig. soft `0 1px 2px …0.04, 0 2px 12px …0.05`, medium, large; Dark-Varianten. Elevation-Map 0–4 → auf 3 echte Stufen diszipliniert (1/2=soft ruhend, 3=medium, 4=large Overlay).
4. **Glas**: EIN Blur-Wert überall: `glassBlur = 'blur(20px) saturate(180%)'` (Token). Dark-Border auf 0.14/0.24 reduziert (war 0.2/0.3 — zu laut).
5. **Motion**: fast150/base200/smooth300, ease-out-artiges cubic-bezier(0.4,0,0.2,1). **Keine translateY/scale-Hovers auf Buttons/Paper/Card mehr** — Hover = Farb-/Schattenwechsel. Transitions nur auf konkrete Properties (`transitionColors`), kein `all`. prefers-reduced-motion: globale Abschaltung bleibt.
6. **Buttons**: flaches Petrol statt Gradient, minHeight 44, Padding 10/20, radius md12, sizeSmall 36. **Global-Full-Width auf Mobile ENTFERNT** (Theme + globals.css) — Buttons hüllen Inhalt, Screens können gezielt fullWidth setzen.
7. **Chips**: Pill-Form (`radius.pill=999`), Höhe 28, fontSize 13.
8. **Tabellen**: Header 13/600 **ohne Uppercase** (Apple-like, war Enterprise-Uppercase), sekundäre Farbe, 1px-Border statt 2px.
9. **Radii**: sm8 md12 lg16 xl24 dialog20 + pill999 (unverändert + pill neu).
10. **PWA theme-color**: #4CAF50 → #005f73 (app/layout.tsx).
11. **globals.css**: doppelte `@keyframes shimmer` entfernt; Shimmer einfarbig Petrol (kein Mustard-Regenbogen); Landing-Dauer-Animationen (blob/gradient-drift) entfernt — Klassen bleiben, statisch; Link-Hover petrol-700 statt petrol-400 (Kontrast!); Dark-Mode-Links petrol-300; scroll-behavior nur bei no-preference; body line-height 1.5; .glass-card ohne translateY-Hover; .metric-value 34px/tabular-nums.

## Bereiche
1. Foundation — in Arbeit: Umsetzung fertig, Build läuft, danach Screenshots (Landing/Anmelden 390/768/1440) + Commit
2. Kernkomponenten — offen
3. Employee-Flows — offen
4. Admin-Flows — offen
5. Zustände — offen
6. Abschluss-Pass — offen

## Nächster Schritt
1. Build-Ergebnis prüfen (läuft im Hintergrund), bei Grün: `npm run start` + Screenshots von `/`, `/anmelden` in 390/768/1440 (Skript: Scratchpad `shoot.mjs`), Sichtprüfung.
2. Commit Bereich 1: `design: Foundation — HIG-Typo-Skala, AA-Semantikfarben, weiche Schatten, flache Buttons, Motion-Disziplin`.
3. Danach Bereich 2 (Kernkomponenten): GlassCard (Default-Hover scale(1.02) entschärfen → nur Schatten; `interactive`-Fälle prüfen), BottomNavigation (#005f73 6x → primary.main), boxShadow-Copy-Paste in 13 Dateien → Token, getShiftTypeColor-Duplikate → `shiftTypeColors`, EmptyState/LoadingSpinner-Gradienten, Gradient-Header (AdminKPICard, StaffStatsCard, StaffStatusCard, TopPerformers, QuickActions, NurseScheduleView #006d77-Gradient).

## Wichtige Umgebungs-/Arbeitsnotizen
- **Unit-Tests sind auf dem Basis-Stand bereits rot** (10/12 Dateien, 21 Tests, u.a. shiftTimeUtils) — vorbestehend, NICHT durch Design-Arbeit. Maßstab: keine NEUEN Fehler.
- `.env.local` (gitignored) mit Demo-Werten angelegt — nötig, sonst bricht `next build` (Legal-ENV-Validierung). NEXT_PUBLIC_APP_ENV=development, NEXT_PUBLIC_USE_EMULATOR=true.
- Screenshots: `node <scratchpad>/shoot.mjs <outdir> <urls...>`; Chromium unter /opt/pw-browsers/chromium. Authentifizierte Screens brauchen Firebase-Emulator (Java vorhanden; firebase.json Ports: auth 9099, firestore 8080) + eigenen Seed über connectAuthEmulator — für Bereich 3 geplant.
- Audit-Befunde (Session 1, Explore-Agent): ~120 Hex-Farben in 28 Dateien; 59 fontSize-px in 23 Dateien; 26 boxShadow-Kopien; 19 Gradient-Flächen; CircularProgress in 33 Dateien vs. Skeleton in 14; KEINE Storybook-Stories im Projekt (nur node_modules) — „Stories aktualisieren“ entfällt daher; Auth-Register-Seite nutzt Lila-Gradient #667eea→#764ba2 (Fremdfarbe!); Employee-Hauptscreens unter app/(employee)/employee/* (zeiten 1326 Z., profil 1107 Z., zeiterfassung 597 Z., arbeitsplatz 427 Z.); Admin unter app/(admin)/admin/* (einstellungen 1645 Z., mitarbeiter 1112 Z.).
- Branch: `claude/schichtklar-design-marathon-le1kgg`, KEIN git push (harte Regel).
