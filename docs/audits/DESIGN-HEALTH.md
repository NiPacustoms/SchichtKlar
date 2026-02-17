# Design Health – Elite Design System

**Status: 10/10** – Apple HIG + Meta FTL + Linear, weltweit auf allen Endgeräten.

## Checkliste

| Bereich | Status | Referenz |
|--------|--------|----------|
| **Design Tokens** | ✅ | [lib/design-tokens.ts](lib/design-tokens.ts) – spacingScale, elevation, assignmentStatusColors, breakpoints, minTouchTargetPx, bottomNavHeightPx |
| **Typografie (Linear)** | ✅ | [lib/theme.ts](lib/theme.ts) – h1 32/40 700, h2 28/36 600, body1 16/24, caption 12/16, overline 13/16 500 |
| **Visuelle Hierarchie** | ✅ | KPI Priority 1 (Rotrahmen) für kritische KPIs; AdminKPICard `priority={1}` |
| **GlassCard 2.0** | ✅ | [components/ui/GlassCard.tsx](components/ui/GlassCard.tsx) – elevation-Prop, hover scale(1.02)+shadow, `@media (hover: hover)` und `prefers-reduced-motion` |
| **Micro-Interactions** | ✅ | Shimmer Skeleton (Petrol→Mustard) in [app/globals.css](app/globals.css); DashboardSkeleton, SchedulePreviewCardDashboard, MyAssignmentCard |
| **StatusBadge** | ✅ | [components/assignments/AssignmentStatusBadge.tsx](components/assignments/AssignmentStatusBadge.tsx) – Color+Icon-Matrix, 11/14 500 |
| **Mobile** | ✅ | BottomNav 56px Höhe, 48px Tap Targets; Safe Area `env(safe-area-inset-*)` |
| **A11y AA++** | ✅ | Focus Visible 2px Petrol (Theme + globals.css); aria-label auf KPICard, StatusBadge; Kontrast 4.5:1 |
| **Design Debt** | ✅ | Tabellen: overflow-x + Sticky Header (AdminListView, TemplateManager, FacilityHoursDashboard); spacingScale in SchedulePreviewCardDashboard, TimesheetForm; [DataTable](components/ui/design-system/DataTable.tsx) |
| **TimesheetForm** | ✅ | Fortschrittsbalken (Progress) oben; Tokens (spacingScale) |
| **Design-System** | ✅ | [components/ui/design-system/](components/ui/design-system/) – GlassCard, DataTable, StatusBadge Re-Exports |

## Metriken (Ziel)

- **Lighthouse:** Performance LCP &lt;1.5s, FID &lt;100ms, CLS &lt;0.1; Accessibility 100; Best Practices 100
- **Touch Targets:** mind. 48×48px (BottomNav, Buttons)
- **Reduced Motion:** Shimmer und Hover-Transform bei `prefers-reduced-motion: reduce` deaktiviert

## Phase 4 (Design Excellence)

- **AdminKpiGrid:** Priority aus KPI-Status (critical→1, warning→2, good→3), Sortierung nach Priority (Kritisch zuerst), GlassCard-Stack mit Rotrahmen für Priority 1.
- **AssignmentCard / MyAssignmentCard:** Statusfarben aus `assignmentStatusColors` (lib/design-tokens); Hover über GlassCard; erweiterter Shimmer bei Ladezustand (MyAssignmentCard).
- **TimesheetForm:** ArbZG-Warnung als Alert mit WarningAmber-Icon, wenn gesetzliche Mindestpause &gt; 0 („Gemäß ArbZG ist eine Pause von mind. X Minuten erforderlich.“).
- **Storybook:** Stories für AdminKPICard (Priority 1/2/3, Trend, Progress), AssignmentStatusBadge (Status-Matrix, Token-Farben), GlassCard (Elevation 0/3/4).

## Referenzen

- [.cursor/rules/01-design-system.mdc](.cursor/rules/01-design-system.mdc) – Design-Regeln
- [lib/design-tokens.ts](lib/design-tokens.ts) – Single Source of Truth für Tokens
- [lib/theme.ts](lib/theme.ts) – MUI Theme (Typo, Focus-Ring, Komponenten)
- [components/ui/design-system/](components/ui/design-system/) – GlassCard, DataTable, StatusBadge
