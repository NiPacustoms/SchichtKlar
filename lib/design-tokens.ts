/**
 * JobFlow Design Tokens – Single Source of Truth
 * Genutzt von MUI-Theme (lib/theme.ts) und CSS (globals.css / TokenInjector).
 * Siehe docs/DESIGN_NEXT_LEVEL_PLAN.md und .cursor/rules/01-design-system.mdc
 */

export const spacing = 8;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  dialog: 20,
} as const;

export const duration = {
  fast: 150,
  base: 200,
  smooth: 300,
} as const;

export const easing = 'cubic-bezier(0.4, 0, 0.2, 1)' as const;

// Brand (mode-invariant)
export const colors = {
  petrol: '#005f73',
  petrolLight: '#0a9396',
  petrolLighter: '#94d2bd',
  petrolDark: '#003d47',
  mustard: '#e8aa42',
  mustardLight: '#f4c430',
  mustardDark: '#c3842a',
} as const;

// Semantic palette (shared)
export const semanticColors = {
  error: { main: '#ef4444', light: '#fee2e2', dark: '#dc2626' },
  warning: { main: '#f59e0b', light: '#fef3c7', dark: '#d97706' },
  info: { main: '#3b82f6', light: '#dbeafe', dark: '#2563eb' },
  success: { main: '#10b981', light: '#d1fae5', dark: '#059669' },
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
    secondary: 'rgba(15,23,42,0.65)',
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

// Dark theme surfaces & text (01-design-system: App #252422, Cards rgba(255,255,255,0.08))
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
    main: 'rgba(255,255,255,0.2)',
    hover: 'rgba(255,255,255,0.3)',
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

export const shadows = {
  soft: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
  medium: '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.1)',
  large: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.15)',
  // Dark mode (stärkere Schatten auf dunklem Grund)
  softDark: '0 2px 8px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.25)',
  mediumDark: '0 4px 16px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.3)',
  largeDark: '0 12px 32px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.4)',
} as const;

// Gradient definitions (CSS-ready)
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

export type ThemeMode = 'light' | 'dark';
