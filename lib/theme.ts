import { deDE as coreDeDE } from '@mui/material/locale';
import { createTheme, responsiveFontSizes, alpha, type PaletteMode } from '@mui/material/styles';
import {
  colors,
  light,
  dark,
  shadows,
  radius,
  spacing,
  duration,
  easing,
  semanticColors,
  grey,
} from '@/lib/design-tokens';

export type ThemeMode = 'light' | 'dark';

const transitionBase = `all ${duration.base}ms ${easing}`;
const transitionColors = `background-color ${duration.fast}ms ${easing}, border-color ${duration.fast}ms ${easing}, color ${duration.fast}ms ${easing}, box-shadow ${duration.fast}ms ${easing}`;

/**
 * Schichtklar Theme – „Clean & Flat"
 *
 * Grundsätze:
 * 1. Tiefe durch Borders und Tonwert-Stufen, nicht durch Blur oder große Schatten.
 * 2. Ein Akzent (Teal) trägt alle interaktiven Zustände; Amber nur als Sekundär-Akzent.
 * 3. Zustände sind Ton-Schichten: hover 4 %, selected 8 %, pressed 12 % der Markenfarbe.
 * 4. Bewegung ist funktional: 150–200 ms, nur Farbe/Schatten – keine Sprünge.
 * 5. Zahlen in Tabellen sind tabellarisch (font-variant-numeric) – Spalten fluchten.
 */
function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const surf = isDark ? dark : light;
  const shadowSoft = isDark ? shadows.softDark : shadows.soft;
  const shadowMedium = isDark ? shadows.mediumDark : shadows.medium;
  const shadowLarge = isDark ? shadows.largeDark : shadows.large;
  // Im Dark Mode braucht Teal mehr Leuchtkraft für Kontrast auf dunklem Grund
  const brand = isDark ? colors.brandLight : colors.brand;
  const brandHover = isDark ? colors.brand : colors.brandDark;

  return responsiveFontSizes(
    createTheme(
      {
        palette: {
          mode,
          primary: {
            main: brand,
            light: colors.brandLight,
            dark: colors.brandDark,
            contrastText: isDark ? '#0b2b28' : '#ffffff',
          },
          secondary: {
            main: colors.accent,
            light: colors.accentLight,
            dark: colors.accentDark,
            contrastText: '#ffffff',
          },
          error: semanticColors.error,
          warning: semanticColors.warning,
          info: semanticColors.info,
          success: semanticColors.success,
          background: {
            default: surf.background.default,
            paper: surf.surface.main,
          },
          text: {
            primary: surf.text.primary,
            secondary: surf.text.secondary,
            disabled: surf.text.disabled,
          },
          divider: surf.border.main,
          grey,
        },
        shape: { borderRadius: radius.md },
        spacing,
        typography: {
          fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
          // Präzise Skala: Headings eng gespannt (negatives Tracking), Body ruhig
          h1: { fontSize: 32, fontWeight: 700, lineHeight: 40 / 32, letterSpacing: '-0.022em' },
          h2: { fontSize: 26, fontWeight: 650, lineHeight: 34 / 26, letterSpacing: '-0.018em' },
          h3: { fontSize: 22, fontWeight: 650, lineHeight: 30 / 22, letterSpacing: '-0.014em' },
          h4: { fontSize: 19, fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.01em' },
          h5: { fontSize: 17, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.006em' },
          h6: { fontSize: 15.5, fontWeight: 600, lineHeight: 1.45 },
          body1: { fontSize: 15.5, lineHeight: 24 / 15.5, fontWeight: 400 },
          body2: { fontSize: 14, lineHeight: 21 / 14, fontWeight: 400 },
          button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.005em' },
          caption: { fontSize: 12.5, lineHeight: 17 / 12.5, fontWeight: 400, letterSpacing: '0.01em' },
          subtitle1: { fontSize: 15.5, lineHeight: 24 / 15.5, fontWeight: 550 },
          subtitle2: { fontSize: 14, lineHeight: 20 / 14, fontWeight: 550 },
          overline: {
            fontSize: 11.5,
            lineHeight: 16 / 11.5,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              '*, *::before, *::after': { boxSizing: 'border-box' },
              html: { height: '100%' },
              body: {
                height: '100%',
                backgroundColor: surf.background.default,
                color: surf.text.primary,
                fontFeatureSettings: '"cv11", "ss01"', // Inter: offenes g/a – freundlicher
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              },
              '#root': { minHeight: '100%' },
              '::selection': {
                backgroundColor: alpha(brand, 0.22),
              },
              // A11y AA++: sichtbarer 2px-Fokusring in Markenfarbe – überall
              'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible': {
                outline: `2px solid ${brand}`,
                outlineOffset: 2,
                borderRadius: radius.sm,
              },
              // Legacy-Klasse: früher Glassmorphism, jetzt flache Karte (API stabil)
              '.glass': {
                background: surf.surface.main,
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
              },
            },
          },

          // ——— Aktionen ———
          MuiButton: {
            styleOverrides: {
              root: ({ theme }) => ({
                minWidth: 104,
                minHeight: 40,
                borderRadius: radius.md,
                padding: '8px 18px',
                fontSize: '14.5px',
                fontWeight: 600,
                textTransform: 'none',
                transition: transitionColors,
                '&:focus-visible': {
                  outline: `2px solid ${brand}`,
                  outlineOffset: 2,
                },
                [theme.breakpoints.down('sm')]: { minWidth: 'auto', width: '100%' },
              }),
              // Primär: satte, flache Teal-Fläche; Hover = eine Tonstufe dunkler
              containedPrimary: {
                backgroundColor: brand,
                color: isDark ? '#0b2b28' : '#ffffff',
                boxShadow: 'none',
                '&:hover': { backgroundColor: brandHover, boxShadow: 'none' },
                '&:active': { backgroundColor: isDark ? colors.brand : '#0c4f4a' },
                '&:disabled': {
                  backgroundColor: alpha(brand, 0.28),
                  color: isDark ? alpha('#0b2b28', 0.6) : alpha('#ffffff', 0.7),
                },
              },
              outlinedPrimary: {
                borderWidth: 1,
                borderColor: alpha(brand, 0.4),
                color: brand,
                backgroundColor: 'transparent',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: brand,
                  backgroundColor: alpha(brand, 0.04),
                },
                '&:active': { backgroundColor: alpha(brand, 0.1) },
              },
              textPrimary: {
                color: brand,
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
                '&:active': { backgroundColor: alpha(brand, 0.12) },
              },
              containedSecondary: {
                backgroundColor: colors.accent,
                boxShadow: 'none',
                '&:hover': { backgroundColor: colors.accentDark, boxShadow: 'none' },
              },
              sizeSmall: { minHeight: 32, padding: '4px 12px', fontSize: '13.5px', minWidth: 72 },
              sizeLarge: { minHeight: 48, padding: '12px 24px', fontSize: '15.5px' },
            },
            defaultProps: { disableElevation: true, variant: 'contained' },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: radius.sm,
                transition: transitionColors,
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
                '&:focus-visible': { outline: `2px solid ${brand}`, outlineOffset: 2 },
              },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 550,
                borderColor: surf.border.main,
                '&.Mui-selected': {
                  backgroundColor: alpha(brand, 0.1),
                  color: brand,
                  '&:hover': { backgroundColor: alpha(brand, 0.16) },
                },
              },
            },
          },

          // ——— Flächen ———
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: surf.surface.main,
                backgroundImage: 'none',
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: 'none',
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundColor: surf.surface.main,
                backgroundImage: 'none',
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
                transition: transitionColors,
                '&:hover': { borderColor: surf.border.hover },
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: surf.appBar,
                backgroundImage: 'none',
                color: surf.text.primary,
                borderBottom: `1px solid ${surf.border.main}`,
                boxShadow: 'none',
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: surf.surface.main,
                backgroundImage: 'none',
                borderRight: `1px solid ${surf.border.main}`,
                borderRadius: 0,
                boxShadow: 'none',
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                backgroundColor: surf.surface.main,
                backgroundImage: 'none',
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.dialog,
                boxShadow: shadowLarge,
              },
            },
            defaultProps: { maxWidth: 'md', fullWidth: true },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.md,
                boxShadow: shadowMedium,
                marginTop: 4,
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                borderRadius: radius.sm,
                margin: '2px 6px',
                padding: '8px 10px',
                fontSize: '14px',
                transition: transitionColors,
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
                '&.Mui-selected': {
                  backgroundColor: alpha(brand, 0.1),
                  '&:hover': { backgroundColor: alpha(brand, 0.14) },
                },
              },
            },
          },
          MuiPopover: {
            styleOverrides: {
              paper: { boxShadow: shadowMedium },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: isDark ? grey[100] : grey[900],
                color: isDark ? grey[900] : grey[50],
                fontSize: '12.5px',
                fontWeight: 500,
                borderRadius: radius.sm,
                padding: '6px 10px',
                boxShadow: shadowMedium,
              },
              arrow: { color: isDark ? grey[100] : grey[900] },
            },
          },

          // ——— Navigation ———
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: radius.md,
                margin: '2px 8px',
                transition: transitionColors,
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
                '&.Mui-selected': {
                  backgroundColor: alpha(brand, 0.1),
                  color: brand,
                  fontWeight: 600,
                  '&:hover': { backgroundColor: alpha(brand, 0.14) },
                  '& .MuiListItemIcon-root': { color: brand },
                },
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              root: { minHeight: 44 },
              indicator: {
                backgroundColor: brand,
                height: 2,
                borderRadius: 1,
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 550,
                fontSize: '14.5px',
                minHeight: 44,
                color: surf.text.secondary,
                transition: transitionColors,
                '&:hover': { color: surf.text.primary },
                '&.Mui-selected': { color: brand, fontWeight: 600 },
              },
            },
          },

          // ——— Formulare ———
          MuiTextField: {
            defaultProps: { size: 'medium', variant: 'outlined' },
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: radius.md,
                  backgroundColor: surf.input.bg,
                  transition: transitionColors,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(brand, 0.45),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: brand,
                    borderWidth: 2,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: surf.border.main,
                    borderWidth: 1,
                  },
                },
              },
            },
          },
          MuiFormHelperText: {
            styleOverrides: {
              root: { marginLeft: 0, fontSize: '13px', marginTop: 6 },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              root: {
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: brand,
                  '& + .MuiSwitch-track': { backgroundColor: brand, opacity: 0.55 },
                },
              },
            },
          },
          MuiCheckbox: {
            styleOverrides: {
              root: {
                color: surf.text.secondary,
                '&.Mui-checked': { color: brand },
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
              },
            },
          },
          MuiRadio: {
            styleOverrides: {
              root: {
                color: surf.text.secondary,
                '&.Mui-checked': { color: brand },
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
              },
            },
          },

          // ——— Daten ———
          MuiTableRow: {
            styleOverrides: {
              root: {
                height: 52,
                transition: `background-color ${duration.fast}ms ${easing}`,
                '&:hover': { backgroundColor: alpha(brand, 0.03) },
                '&.Mui-selected': {
                  backgroundColor: alpha(brand, 0.07),
                  '&:hover': { backgroundColor: alpha(brand, 0.1) },
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 16,
                paddingRight: 16,
                borderBottom: `1px solid ${surf.border.main}`,
                fontVariantNumeric: 'tabular-nums', // Zahlenspalten fluchten
              },
              head: {
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: surf.text.secondary,
                borderBottom: `1px solid ${surf.border.main}`,
                backgroundColor: surf.tableHeaderBg,
              },
              body: { fontSize: '14px' },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 999, // Pill – ruhiger als eckige Chips im flachen Layout
                fontWeight: 550,
                fontSize: '12.5px',
                height: 26,
                transition: transitionColors,
                '&:focus-visible': { outline: `2px solid ${brand}`, outlineOffset: 2 },
              },
              // Getönte Chips statt Vollfarbe – flacher, lesbarer
              filledPrimary: {
                backgroundColor: alpha(brand, isDark ? 0.22 : 0.12),
                color: isDark ? colors.brandLighter : colors.brandDark,
                '&:hover': { backgroundColor: alpha(brand, isDark ? 0.3 : 0.18) },
              },
              filledSecondary: {
                backgroundColor: alpha(colors.accent, isDark ? 0.24 : 0.14),
                color: isDark ? colors.accentLight : colors.accentDark,
                '&:hover': { backgroundColor: alpha(colors.accent, isDark ? 0.32 : 0.2) },
              },
              outlinedPrimary: {
                borderColor: alpha(brand, 0.4),
                color: brand,
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
              },
              outlinedSecondary: {
                borderColor: alpha(colors.accent, 0.5),
                color: colors.accentDark,
                '&:hover': {
                  borderColor: colors.accent,
                  backgroundColor: alpha(colors.accent, 0.06),
                },
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: { borderRadius: radius.md, border: '1px solid transparent' },
              standardSuccess: { borderColor: alpha(semanticColors.success.main, 0.3) },
              standardError: { borderColor: alpha(semanticColors.error.main, 0.3) },
              standardWarning: { borderColor: alpha(semanticColors.warning.main, 0.3) },
              standardInfo: { borderColor: alpha(semanticColors.info.main, 0.3) },
            },
          },
          MuiSkeleton: {
            styleOverrides: {
              root: {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.06)',
                borderRadius: radius.sm,
              },
            },
            defaultProps: { animation: 'wave' },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 999,
                height: 6,
                backgroundColor: alpha(brand, 0.12),
              },
              bar: { borderRadius: 999, backgroundColor: brand },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: { borderColor: surf.border.main },
            },
          },
          MuiAvatar: {
            styleOverrides: {
              root: {
                backgroundColor: alpha(brand, isDark ? 0.3 : 0.14),
                color: isDark ? colors.brandLighter : colors.brandDark,
                fontWeight: 600,
              },
            },
          },
          MuiBadge: {
            styleOverrides: {
              colorPrimary: { backgroundColor: brand },
            },
          },
        },
      },
      coreDeDE
    )
  );
}

export { createAppTheme };

/** @deprecated Use createAppTheme(mode). Kept for backwards compatibility; defaults to light. */
export function createAppThemeLegacy() {
  return createAppTheme('light');
}

/**
 * Flache Karten-Optik (ehemals Glass-Effekt; Name aus Kompatibilitätsgründen erhalten).
 * Für useTheme()-Komponenten.
 */
export function glassStyle(theme: {
  palette: { background: { paper: string }; divider: string; mode?: 'light' | 'dark' };
  shape: { borderRadius: number };
}) {
  const isDark = theme.palette.mode === 'dark';
  return {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius ?? radius.lg,
    boxShadow: isDark ? shadows.softDark : shadows.soft,
    transition: transitionBase,
  };
}

export const THEME_CONSTANTS = {
  SHADOW_SOFT: shadows.soft,
  SHADOW_MEDIUM: shadows.medium,
  SHADOW_LARGE: shadows.large,
  radius,
  duration,
  easing,
};

export function getThemeConstants(mode: ThemeMode) {
  const isDark = mode === 'dark';
  return {
    ...THEME_CONSTANTS,
    SHADOW_SOFT: isDark ? shadows.softDark : shadows.soft,
    CARD_BORDER_LIGHT: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(28,25,23,0.10)',
  };
}
