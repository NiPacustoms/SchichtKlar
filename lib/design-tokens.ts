/**
 * Schichtklar Design Tokens – Single Source of Truth
 * Genutzt von MUI-Theme (lib/theme.ts) und CSS (globals.css).
 *
 * Design-Sprache: „Clean & Flat" – ruhige, opake Flächen, feine Borders,
 * dezente Schatten. Farbwelt: frisches Teal-Grün mit warmen Neutraltönen
 * (Vertrauen + Klarheit; passend für Pflege/Gesundheit).
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

/** Eckenradien – Apple/iOS-HIG: großzügige, weiche Radien */
export const radius = {
  sm: 8,
  md: 12, // Buttons/Felder
  lg: 16, // Karten (iOS-Inset)
  xl: 22, // große/Hero-Karten
  hero: 24,
  pill: 999, // Pillen/Badges/Segmented
  dialog: 16,
} as const;

export const duration = {
  fast: 150,
  base: 200,
  smooth: 300,
} as const;

export const easing = 'cubic-bezier(0.4, 0, 0.2, 1)' as const;

// Brand (mode-invariant) – Teal-Grün (Primär) + warmes Amber (Akzent)
export const colors = {
  brand: '#0f766e', // Teal 700 – AA-konform mit weißem Text
  brandLight: '#14b8a6', // Teal 500
  brandLighter: '#99f6e4', // Teal 200
  brandDark: '#115e59', // Teal 800
  accent: '#d97706', // Amber 600 – warmer Kontrapunkt
  accentLight: '#f59e0b', // Amber 500
  accentDark: '#b45309', // Amber 700
  /** @deprecated Alte Markennamen – zeigen auf die neuen Teal-/Amber-Werte */
  petrol: '#0f766e',
  petrolLight: '#14b8a6',
  petrolLighter: '#99f6e4',
  petrolDark: '#115e59',
  mustard: '#d97706',
  mustardLight: '#f59e0b',
  mustardDark: '#b45309',
} as const;

// Semantic palette (shared)
export const semanticColors = {
  error: { main: '#ef4444', light: '#fee2e2', dark: '#dc2626' },
  warning: { main: '#f59e0b', light: '#fef3c7', dark: '#d97706' },
  info: { main: '#3b82f6', light: '#dbeafe', dark: '#2563eb' },
  success: { main: '#16a34a', light: '#dcfce7', dark: '#15803d' },
} as const;

/** Warme Neutraltöne (Stone) statt kühlem Slate */
export const grey = {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
} as const;

// Light theme surfaces & text – iOS „grouped": ruhige Flächen + Haarlinien
export const light = {
  background: {
    default: '#fafaf9',
    alt: '#f5f5f4',
    /** iOS „grouped background" für App-Bereiche (hinter Inset-Karten) */
    grouped: '#f2f2f7',
  },
  surface: {
    main: '#ffffff',
    hover: '#fafaf9',
    /** Feld-Grau (iOS Search/Segmented-Track) */
    field: '#e9e9ed',
    /** Teal-Tint-Fläche (aktive Zeile, Chips) */
    tint: 'rgba(15,118,110,0.10)',
  },
  border: {
    main: 'rgba(28,25,23,0.10)',
    hover: 'rgba(28,25,23,0.20)',
    /** iOS-Haarlinie (Listentrenner) */
    hairline: '#ececee',
  },
  text: {
    primary: '#1c1c1e', // iOS-Label
    secondary: '#8e8e93', // iOS Secondary Label
    tertiary: '#c7c7cc', // iOS Tertiary Label
    disabled: 'rgba(28,25,23,0.42)',
  },
  input: {
    bg: '#ffffff',
    bgHover: '#ffffff',
    bgFocused: '#ffffff',
  },
  appBar: '#fafaf9',
  tableHeaderBg: '#f5f5f4',
} as const;

// Dark theme surfaces & text – warme, opake Dunkelflächen (Stone-basiert)
export const dark = {
  background: {
    default: '#1c1917',
    alt: '#171412',
  },
  surface: {
    main: '#292524',
    hover: '#2f2b28',
  },
  border: {
    main: 'rgba(255,255,255,0.12)',
    hover: 'rgba(255,255,255,0.22)',
  },
  text: {
    primary: 'rgba(250,250,249,0.95)',
    secondary: 'rgba(250,250,249,0.72)', // ≥7:1 auf #1c1917
    disabled: 'rgba(250,250,249,0.48)',
  },
  input: {
    bg: 'rgba(255,255,255,0.05)',
    bgHover: 'rgba(255,255,255,0.08)',
    bgFocused: 'rgba(255,255,255,0.10)',
  },
  appBar: '#1c1917',
  tableHeaderBg: 'rgba(255,255,255,0.04)',
} as const;

/** Schatten – Apple/iOS: Karten flach (Fläche+Haarlinie); Tiefe nur für CTAs/Overlays */
export const shadows = {
  soft: '0 1px 2px rgba(0,0,0,0.04)',
  medium: '0 2px 8px rgba(28,25,23,0.07)',
  large: '0 8px 24px rgba(28,25,23,0.12)',
  /** Primär-CTA (Teal) – dezenter farbiger Auftrieb */
  ctaPrimary: '0 10px 22px -8px rgba(15,118,110,0.45)',
  /** Primär-CTA im Hover – etwas höher angehoben (translateY-Lift) */
  ctaPrimaryHover: '0 14px 28px -8px rgba(15,118,110,0.5)',
  /** Sheet/Modal – stärker */
  sheet: '0 12px 40px -8px rgba(28,25,23,0.28)',
  // Dark mode (stärkere Schatten auf dunklem Grund)
  softDark: '0 1px 2px rgba(0,0,0,0.25)',
  mediumDark: '0 2px 8px rgba(0,0,0,0.3)',
  largeDark: '0 8px 24px rgba(0,0,0,0.45)',
} as const;

/** Elevation scale (0–4) für Karten und Overlays */
export const elevation = {
  0: 'none',
  1: '0 1px 2px rgba(28,25,23,0.05)',
  2: '0 1px 3px rgba(28,25,23,0.06)',
  3: '0 2px 8px rgba(28,25,23,0.07)',
  4: '0 8px 24px rgba(28,25,23,0.12)',
} as const;

export const elevationDark = {
  0: 'none',
  1: '0 1px 2px rgba(0,0,0,0.25)',
  2: '0 1px 3px rgba(0,0,0,0.28)',
  3: '0 2px 8px rgba(0,0,0,0.3)',
  4: '0 8px 24px rgba(0,0,0,0.45)',
} as const;

/** Assignment-Status-Farben (StatusBadge + AssignmentCard) – an semantische Palette angeglichen */
export const assignmentStatusColors: Record<string, string> = {
  requested: '#f59e0b',
  pending: '#f59e0b',
  published: '#f59e0b',
  accepted: '#16a34a',
  assigned: '#3b82f6',
  declined: '#ef4444',
  completed: '#3b82f6',
  done: '#3b82f6',
  cancelled: '#a8a29e',
  'pending-signature': '#a8a29e',
  secured: '#16a34a',
  besichert: '#16a34a',
};

/** Alias für Lesbarkeit (requested/accepted/declined) */
export const statusColors = assignmentStatusColors;

/**
 * Schichttyp-Farben – eine zentrale Zuordnung statt kopierter
 * Material-Farben in Karten und Hooks.
 * Morgen = Blau, Nachmittag = Amber, Nacht = Violett, Bereitschaft = Teal.
 */
export const shiftTypeColors: Record<string, string> = {
  Frühdienst: semanticColors.info.main,
  Spätdienst: semanticColors.warning.dark,
  Nachtdienst: '#7c3aed',
  'On-call': colors.brand,
};

/** Zentrale Schichttyp-Farbe; Fallback: neutrales Grau */
export function getShiftTypeColor(type?: string): string {
  return (type && shiftTypeColors[type]) || grey[500];
}

// Hintergrund-Verläufe – Clean & Flat: nur ein hauchzarter Teal-Schleier
export const gradients = {
  light: {
    brand:
      'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(20,184,166,0.06), transparent 60%), linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)',
    brandLight:
      'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(20,184,166,0.04), transparent 55%), linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)',
  },
  dark: {
    brand:
      'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(20,184,166,0.08), transparent 60%), linear-gradient(180deg, #1c1917 0%, #171412 100%)',
  },
} as const;

/** Shimmer-Gradient (dezentes Teal) für Skeleton-Loading – in CSS keyframes nutzen */
export const shimmerGradient =
  'linear-gradient(90deg, transparent 0%, rgba(15,118,110,0.08) 50%, transparent 100%)';

/** Mindest-Tap-Target (weltweit a11y): 48px */
export const minTouchTargetPx = 48;

/** BottomNav / iOS Tab Bar Höhe (px) – inkl. Label + Home-Indicator-Zone */
export const bottomNavHeightPx = 64;

/** Hero-Gradient (Teal) für Hauptaktions-Karten (Aktueller Einsatz, Berichte) */
export const heroGradient = 'linear-gradient(155deg, #127c73 0%, #0b5850 100%)';

export type ThemeMode = 'light' | 'dark';
