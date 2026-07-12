/**
 * Schichtklar Design Tokens – Single Source of Truth
 * Genutzt von MUI-Theme (lib/theme.ts) und CSS (globals.css).
 * Maßstab: Apple Human Interface Guidelines – Klarheit, Zurückhaltung, Konsistenz.
 */

export const spacing = 8;

/** Spacing scale (8px grid) – ersetzt Magic Numbers (4, 8, 16, 24, 32) */
export const spacingScale = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Breakpoints (px) – 320px Handys bis 4K; Desktop-First ab xl (1280) */
export const breakpoints = {
  xs: 0,
  sm: 360,
  md: 600,
  lg: 900,
  xl: 1280,
  xxl: 1920,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  dialog: 20,
  /** Pill-Form für Chips/Badges */
  pill: 999,
} as const;

export const duration = {
  fast: 150,
  base: 200,
  smooth: 300,
} as const;

export const easing = 'cubic-bezier(0.4, 0, 0.2, 1)' as const;

/** Einheitlicher Glas-Effekt – überall derselbe Blur-Wert */
export const glassBlur = 'blur(20px) saturate(180%)' as const;

// Brand (mode-invariant)
export const colors = {
  petrol: '#005f73',
  petrolLight: '#0a9396',
  petrolLighter: '#94d2bd',
  petrolDark: '#003d47',
  /** Hover-Abdunklung für flache Petrol-Buttons */
  petrolHover: '#004d5c',
  mustard: '#e8aa42',
  mustardLight: '#f4c430',
  mustardDark: '#c3842a',
} as const;

/**
 * Semantic palette (shared) – main/dark erfüllen WCAG AA auf Weiß,
 * light ist eine blasse Fläche für Hintergründe/Badges.
 */
export const semanticColors = {
  error: { main: '#dc2626', light: '#fee2e2', dark: '#991b1b' },
  warning: { main: '#b45309', light: '#fef3c7', dark: '#92400e' },
  info: { main: '#2563eb', light: '#dbeafe', dark: '#1d4ed8' },
  success: { main: '#047857', light: '#d1fae5', dark: '#065f46' },
} as const;

export const grey = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
} as const;

// Light theme surfaces & text
export const light = {
  background: {
    default: '#fafbfc',
    alt: '#f5f7fa',
  },
  surface: {
    main: 'rgba(255,255,255,0.98)',
    hover: 'rgba(255,255,255,1)',
  },
  border: {
    main: 'rgba(0,95,115,0.08)',
    hover: 'rgba(0,95,115,0.16)',
  },
  text: {
    primary: 'rgba(15,23,42,0.95)',
    // 0.72 statt 0.65: bessere Lesbarkeit von Sekundärtext (≈6,7:1 auf Hell)
    secondary: 'rgba(15,23,42,0.72)',
    disabled: 'rgba(15,23,42,0.4)',
  },
  input: {
    bg: 'rgba(255,255,255,0.8)',
    bgHover: 'rgba(255,255,255,0.95)',
    bgFocused: 'rgba(255,255,255,1)',
  },
  appBar: 'rgba(255,255,255,0.85)',
  tableHeaderBg: 'rgba(0,95,115,0.02)',
} as const;

// Dark theme surfaces & text (App #252422, Cards rgba(255,255,255,0.08))
export const dark = {
  background: {
    default: '#252422',
    alt: '#1e1d1b',
  },
  surface: {
    main: 'rgba(255,255,255,0.08)',
    hover: 'rgba(255,255,255,0.12)',
  },
  border: {
    main: 'rgba(255,255,255,0.14)',
    hover: 'rgba(255,255,255,0.24)',
  },
  text: {
    primary: 'rgba(255,255,255,0.92)',
    secondary: 'rgba(255,255,255,0.7)',
    disabled: 'rgba(255,255,255,0.5)',
  },
  input: {
    bg: 'rgba(255,255,255,0.06)',
    bgHover: 'rgba(255,255,255,0.1)',
    bgFocused: 'rgba(255,255,255,0.12)',
  },
  appBar: 'rgba(37,36,34,0.85)',
  tableHeaderBg: 'rgba(255,255,255,0.04)',
} as const;

/**
 * Schatten – weich und großflächig statt hart und klein.
 * Drei Stufen: soft (ruhend), medium (angehoben/hover), large (Overlays).
 */
export const shadows = {
  soft: '0 1px 2px rgba(15,23,42,0.04), 0 2px 12px rgba(15,23,42,0.05)',
  medium: '0 2px 4px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.08)',
  large: '0 4px 8px rgba(15,23,42,0.06), 0 16px 48px rgba(15,23,42,0.14)',
  // Dark mode (stärkere Schatten auf dunklem Grund)
  softDark: '0 1px 2px rgba(0,0,0,0.2), 0 2px 12px rgba(0,0,0,0.22)',
  mediumDark: '0 2px 4px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.28)',
  largeDark: '0 4px 8px rgba(0,0,0,0.25), 0 16px 48px rgba(0,0,0,0.4)',
} as const;

/**
 * Elevation scale (0–4) für GlassCard – diszipliniert auf die drei
 * Schatten-Stufen gemappt (1/2 = ruhend, 3 = angehoben, 4 = Overlay).
 */
export const elevation = {
  0: 'none',
  1: shadows.soft,
  2: shadows.soft,
  3: shadows.medium,
  4: shadows.large,
} as const;

export const elevationDark = {
  0: 'none',
  1: shadows.softDark,
  2: shadows.softDark,
  3: shadows.mediumDark,
  4: shadows.largeDark,
} as const;

/**
 * Assignment-Status-Farben (StatusBadge + AssignmentCard) –
 * auf die Semantikpalette gemappt: offen = warning, bestätigt = success,
 * zugewiesen/abgeschlossen = info, abgelehnt = error, neutral = grau.
 */
export const assignmentStatusColors: Record<string, string> = {
  requested: semanticColors.warning.main,
  pending: semanticColors.warning.main,
  published: semanticColors.warning.main,
  accepted: semanticColors.success.main,
  assigned: semanticColors.info.main,
  declined: semanticColors.error.main,
  completed: semanticColors.info.main,
  done: semanticColors.info.main,
  cancelled: grey[500],
  'pending-signature': grey[500],
  secured: semanticColors.success.main,
  besichert: semanticColors.success.main,
};

/** Alias für Lesbarkeit (requested/accepted/declined) */
export const statusColors = assignmentStatusColors;

/**
 * Schichttyp-Farben – eine zentrale Zuordnung statt vierfach
 * kopierter Material-Farben in Karten und Hooks.
 * Morgen = Blau, Nachmittag = Amber, Nacht = Violett, Bereitschaft = Teal.
 */
export const shiftTypeColors: Record<string, string> = {
  Frühdienst: semanticColors.info.main,
  Spätdienst: semanticColors.warning.main,
  Nachtdienst: '#6d28d9',
  'On-call': '#0f766e',
};

/** Zentrale Schichttyp-Farbe; Fallback: neutrales Grau */
export function getShiftTypeColor(type?: string): string {
  return (type && shiftTypeColors[type]) || grey[500];
}

// Gradient definitions (CSS-ready) – nur für App-Hintergründe, nie für Flächen
export const gradients = {
  light: {
    brand:
      'radial-gradient(ellipse 120% 100% at 50% 0%, rgba(148, 210, 189, 0.15), transparent 70%), radial-gradient(ellipse 80% 80% at 20% 50%, rgba(0, 95, 115, 0.08), transparent 60%), linear-gradient(180deg, rgba(250, 251, 252, 1) 0%, rgba(245, 247, 250, 1) 100%)',
    brandLight:
      'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(148, 210, 189, 0.12), transparent 65%), radial-gradient(ellipse 70% 70% at 20% 50%, rgba(0, 95, 115, 0.06), transparent 55%), linear-gradient(180deg, rgba(250, 251, 252, 1) 0%, rgba(245, 247, 250, 1) 100%)',
  },
  dark: {
    brand:
      'radial-gradient(ellipse 120% 100% at 50% 0%, rgba(0, 95, 115, 0.15), transparent 70%), radial-gradient(ellipse 80% 80% at 20% 50%, rgba(148, 210, 189, 0.06), transparent 60%), linear-gradient(180deg, #252422 0%, #1e1d1b 100%)',
  },
} as const;

/** Shimmer-Gradient für Skeleton-Loading – dezent, einfarbig (Petrol) */
export const shimmerGradient =
  'linear-gradient(90deg, transparent 0%, rgba(0,95,115,0.08) 50%, transparent 100%)';

/** Mindest-Tap-Target (weltweit a11y): 48px */
export const minTouchTargetPx = 48;

/** BottomNav Höhe (px) */
export const bottomNavHeightPx = 56;

export type ThemeMode = 'light' | 'dark';
