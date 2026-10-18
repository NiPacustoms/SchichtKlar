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

  // factor 3: Headings schrumpfen auf kleinen Screens moderater – bessere Lesbarkeit mobil
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
        shape: { borderRadius: 10 },
        spacing,
        typography: {
          fontFamily: ['var(--font-geist)', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'].join(','),
          // Arbeitsoberfläche: kompakte, klare Skala (Body 14) statt iOS-Large-Titles
          h1: { fontSize: 28, fontWeight: 650, lineHeight: 1.15, letterSpacing: '-0.025em' },
          h2: { fontSize: 24, fontWeight: 650, lineHeight: 1.2, letterSpacing: '-0.022em' },
          h3: { fontSize: 20, fontWeight: 650, lineHeight: 1.25, letterSpacing: '-0.018em' },
          h4: { fontSize: 17, fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.012em' },
          h5: { fontSize: 15.5, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.008em' },
          h6: { fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, letterSpacing: '-0.004em' },
          body1: { fontSize: 14.5, lineHeight: 1.55, fontWeight: 400 },
          body2: { fontSize: 13.5, lineHeight: 1.5, fontWeight: 400 },
          button: { textTransform: 'none', fontWeight: 550, letterSpacing: '-0.003em' },
          caption: { fontSize: 12, lineHeight: 1.45, fontWeight: 400 },
          subtitle1: { fontSize: 14.5, lineHeight: 1.5, fontWeight: 550 },
          subtitle2: { fontSize: 13.5, lineHeight: 1.45, fontWeight: 550 },
          // Kein Versal-Label-Stil mehr: Bereichstitel in normaler Schreibweise
          overline: {
            fontSize: 12.5,
            lineHeight: 1.4,
            fontWeight: 600,
            letterSpacing: 0,
            textTransform: 'none',
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
                fontFeatureSettings: '"ss01"',
                textRendering: 'optimizeLegibility',
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
                minWidth: 0,
                minHeight: 36,
                borderRadius: radius.md,
                padding: '7px 14px',
                fontSize: '14px',
                fontWeight: 550,
                whiteSpace: 'nowrap',
                textTransform: 'none',
                transition: `${transitionColors}, transform ${duration.fast}ms ${easing}, box-shadow ${duration.fast}ms ${easing}`,
                '& .MuiButton-startIcon': { marginRight: 6, '& > *:nth-of-type(1)': { fontSize: 18 } },
                '& .MuiButton-endIcon': { marginLeft: 6, '& > *:nth-of-type(1)': { fontSize: 18 } },
                '@media (prefers-reduced-motion: reduce)': {
                  transition: transitionColors,
                  '&:active': { transform: 'none' },
                  '&:hover': { transform: 'none' },
                },
                '&:focus-visible': {
                  outline: `2px solid ${brand}`,
                  outlineOffset: 2,
                },
                [theme.breakpoints.down('sm')]: { minHeight: 40 },
              }),
              // Primär: satte Teal-Fläche mit dezentem farbigem Auftrieb (iOS-CTA)
              containedPrimary: {
                backgroundColor: brand,
                color: isDark ? '#0b2b28' : '#ffffff',
                boxShadow: isDark ? 'none' : shadows.ctaPrimary,
                '&:hover': {
                  backgroundColor: brandHover,
                  boxShadow: isDark ? 'none' : shadows.ctaPrimaryHover,
                },
                '&:active': { backgroundColor: isDark ? colors.brand : '#0c4f4a' },
                '&:disabled': {
                  backgroundColor: alpha(brand, 0.28),
                  color: isDark ? alpha('#0b2b28', 0.6) : alpha('#ffffff', 0.7),
                  boxShadow: 'none',
                },
              },
              // Sekundär: neutraler Rahmen-Button (wie in Linear/Attio) – Farbe bleibt der Hauptaktion vorbehalten
              outlinedPrimary: {
                borderWidth: 1,
                borderColor: surf.border.main,
                color: surf.text.primary,
                backgroundColor: surf.surface.main,
                boxShadow: isDark ? 'none' : '0 1px 1px rgba(16,37,35,0.04)',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: surf.border.hover,
                  backgroundColor: surf.surface.hover,
                },
                '&:active': { backgroundColor: alpha(brand, 0.06) },
              },
              textPrimary: {
                color: isDark ? brand : colors.brandDark,
                '&:hover': { backgroundColor: alpha(brand, 0.06) },
                '&:active': { backgroundColor: alpha(brand, 0.12) },
              },
              containedSecondary: {
                backgroundColor: colors.accent,
                boxShadow: 'none',
                '&:hover': { backgroundColor: colors.accentDark, boxShadow: 'none' },
              },
              sizeSmall: { minHeight: 30, padding: '4px 10px', fontSize: '13px' },
              sizeLarge: { minHeight: 44, padding: '10px 20px', fontSize: '15px' },
            },
            defaultProps: { disableElevation: true, variant: 'contained' },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: radius.md,
                color: surf.text.secondary,
                transition: transitionColors,
                '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,37,35,0.05)', color: surf.text.primary },
                '&:focus-visible': { outline: `2px solid ${brand}`, outlineOffset: 2 },
              },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 550,
                fontSize: 13.5,
                color: surf.text.secondary,
                borderColor: surf.border.main,
                padding: '6px 12px',
                '&.Mui-selected': {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                  color: surf.text.primary,
                  boxShadow: isDark ? 'none' : 'inset 0 0 0 1px ' + surf.border.hover,
                  '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#ffffff' },
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
                boxShadow: 'none',
                transition: transitionColors,
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: surf.appBar,
                backdropFilter: 'saturate(180%) blur(12px)',
                backgroundImage: 'none',
                color: surf.text.primary,
                borderBottom: `1px solid ${surf.border.main}`,
                // MuiPaper setzt Rahmen + Radius für Karten – die Kopfleiste ist keine Karte
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: 0,
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
                fontSize: '14px',
                minHeight: 44,
                paddingLeft: 12,
                paddingRight: 12,
                minWidth: 0,
                color: surf.text.secondary,
                transition: transitionColors,
                '&:hover': { color: surf.text.primary },
                '&.Mui-selected': { color: brand, fontWeight: 600 },
              },
            },
          },

          // ——— Formulare ———
          MuiTextField: {
            // Dichte Arbeitsoberfläche: 40 px hohe Felder (passend zu 36-px-Buttons)
            defaultProps: { size: 'small', variant: 'outlined' },
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: radius.md,
                  backgroundColor: surf.input.bg,
                  transition: transitionColors,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: surf.border.hover,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: brand,
                    borderWidth: 1,
                  },
                  '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(brand, 0.14)}` },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: surf.border.main,
                    borderWidth: 1,
                  },
                },
              },
            },
          },
          MuiFormControl: { defaultProps: { size: 'small' } },
          MuiAutocomplete: { defaultProps: { size: 'small' } },
          // Labels klar lesbar (statt blassem Sekundärgrau) + eindeutiger Fokus.
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: alpha(surf.text.primary, 0.72),
                fontWeight: 500,
                '&.Mui-focused': { color: brand },
                '&.Mui-error': { color: undefined },
              },
            },
          },
          // Platzhalter voll deckend und in mittlerem Grau (statt 0.42-Opacity),
          // damit sie lesbar bleiben, sich aber klar vom eingegebenen Text abheben.
          MuiOutlinedInput: {
            styleOverrides: {
              input: {
                '&::placeholder': { color: surf.text.secondary, opacity: 1 },
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              input: {
                '&::placeholder': { color: surf.text.secondary, opacity: 1 },
              },
            },
          },
          MuiFormHelperText: {
            styleOverrides: {
              root: { marginLeft: 0, fontSize: '13px', marginTop: 6 },
            },
          },
          // iOS-Switch: 51×31-Track, 27px weißer Knopf, Teal an / Grau aus
          MuiSwitch: {
            styleOverrides: {
              root: {
                width: 51,
                height: 31,
                padding: 0,
                overflow: 'visible',
                '& .MuiSwitch-switchBase': {
                  padding: 2,
                  '&.Mui-checked': {
                    transform: 'translateX(20px)',
                    color: '#fff',
                    '& + .MuiSwitch-track': { backgroundColor: brand, opacity: 1 },
                  },
                  '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.4 },
                },
                '& .MuiSwitch-thumb': {
                  width: 27,
                  height: 27,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  color: '#fff',
                },
                '& .MuiSwitch-track': {
                  borderRadius: 999,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : '#e3e3e8',
                  opacity: 1,
                  transition: `background-color ${duration.base}ms ${easing}`,
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
                height: 48,
                transition: `background-color ${duration.fast}ms ${easing}`,
                '&:last-of-type td': { borderBottom: 'none' },
                '&.MuiTableRow-hover:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fbfb' },
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
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 16,
                paddingRight: 16,
                borderBottom: `1px solid ${isDark ? surf.border.main : light.border.hairline}`,
                fontVariantNumeric: 'tabular-nums', // Zahlenspalten fluchten
              },
              head: {
                fontWeight: 550,
                fontSize: '12.5px',
                textTransform: 'none',
                letterSpacing: 0,
                color: surf.text.secondary,
                whiteSpace: 'nowrap',
                borderBottom: `1px solid ${surf.border.main}`,
                backgroundColor: surf.tableHeaderBg,
              },
              body: { fontSize: '14px' },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                // Status-Badges: kompakt, leicht gerundet, getönt – Lesbarkeit vor Signalfarbe
                borderRadius: radius.sm,
                fontWeight: 550,
                fontSize: '12px',
                height: 22,
                '& .MuiChip-label': { paddingLeft: 8, paddingRight: 8 },
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
              outlined: {
                borderColor: surf.border.main,
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
            // Getönte Status-Badges (MUI 7: Farb-Overrides über variants)
            variants: (['success', 'warning', 'error', 'info'] as const).flatMap(c => [
              {
                props: { variant: 'filled' as const, color: c },
                style: {
                  backgroundColor: alpha(semanticColors[c].main, isDark ? 0.22 : 0.12),
                  color: isDark ? semanticColors[c].light : semanticColors[c].dark,
                },
              },
              {
                props: { variant: 'outlined' as const, color: c },
                style: {
                  borderColor: alpha(semanticColors[c].main, 0.35),
                  backgroundColor: alpha(semanticColors[c].main, isDark ? 0.1 : 0.05),
                  color: isDark ? semanticColors[c].light : semanticColors[c].dark,
                },
              },
            ]),
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
    ),
    { factor: 3 }
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
