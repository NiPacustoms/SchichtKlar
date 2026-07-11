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
  glassBlur,
  semanticColors,
  grey,
} from '@/lib/design-tokens';

export type ThemeMode = 'light' | 'dark';

const transitionColors = `background-color ${duration.base}ms ${easing}, border-color ${duration.base}ms ${easing}, box-shadow ${duration.base}ms ${easing}, color ${duration.base}ms ${easing}`;

function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const surf = isDark ? dark : light;
  const shadowSoft = isDark ? shadows.softDark : shadows.soft;
  const shadowMedium = isDark ? shadows.mediumDark : shadows.medium;
  const shadowLarge = isDark ? shadows.largeDark : shadows.large;

  return responsiveFontSizes(
    createTheme(
      {
        palette: {
          mode,
          primary: {
            main: colors.petrol,
            light: colors.petrolLight,
            dark: colors.petrolDark,
            contrastText: '#ffffff',
          },
          secondary: {
            main: colors.mustard,
            light: colors.mustardLight,
            dark: colors.mustardDark,
            contrastText: grey[900],
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
          // Apple-HIG-Skala: 34/28/22/20/17/15/13 – Hierarchie über Größe + Gewicht + Farbe
          h1: { fontSize: 34, fontWeight: 700, lineHeight: 40 / 34, letterSpacing: '-0.02em' },
          h2: { fontSize: 28, fontWeight: 600, lineHeight: 36 / 28, letterSpacing: '-0.015em' },
          h3: { fontSize: 22, fontWeight: 600, lineHeight: 28 / 22, letterSpacing: '-0.01em' },
          h4: { fontSize: 20, fontWeight: 600, lineHeight: 28 / 20, letterSpacing: '-0.01em' },
          h5: { fontSize: 17, fontWeight: 600, lineHeight: 24 / 17 },
          h6: { fontSize: 15, fontWeight: 600, lineHeight: 20 / 15 },
          body1: { fontSize: 16, lineHeight: 24 / 16, fontWeight: 400 },
          body2: { fontSize: 14, lineHeight: 20 / 14, fontWeight: 400 },
          button: { textTransform: 'none', fontWeight: 600, fontSize: 15, letterSpacing: 0 },
          caption: { fontSize: 13, lineHeight: 16 / 13, fontWeight: 400 },
          subtitle1: { fontSize: 16, lineHeight: 24 / 16, fontWeight: 500 },
          subtitle2: { fontSize: 14, lineHeight: 20 / 14, fontWeight: 500 },
          overline: { fontSize: 12, lineHeight: 16 / 12, fontWeight: 600, letterSpacing: '0.06em' },
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
              },
              '#root': { minHeight: '100%' },
              // A11y: sichtbarer Fokus-Ring für Tastatur (weltweit)
              'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible': {
                outline: `2px solid ${colors.petrol}`,
                outlineOffset: 2,
                borderRadius: 4,
              },
              '.glass': {
                background: surf.surface.main,
                backdropFilter: glassBlur,
                WebkitBackdropFilter: glassBlur,
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
              },
              // Zahlen in Zeiterfassung/Beträgen: gleichbreite Ziffern
              '.tabular-nums': { fontVariantNumeric: 'tabular-nums' },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: radius.md,
                padding: '10px 20px',
                minHeight: 44,
                fontSize: 15,
                fontWeight: 600,
                textTransform: 'none',
                transition: transitionColors,
                '&:focus-visible': {
                  outline: `2px solid ${colors.petrol}`,
                  outlineOffset: 2,
                },
              },
              sizeSmall: { minHeight: 36, padding: '6px 14px', fontSize: 14 },
              containedPrimary: {
                backgroundColor: colors.petrol,
                color: '#fff',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: colors.petrolHover,
                  boxShadow: 'none',
                },
                '&:active': { backgroundColor: colors.petrolDark },
                '&.Mui-disabled': {
                  backgroundColor: alpha(colors.petrol, isDark ? 0.24 : 0.16),
                  color: isDark ? 'rgba(255,255,255,0.4)' : alpha(colors.petrol, 0.5),
                },
              },
              outlinedPrimary: {
                borderWidth: 1.5,
                borderColor: alpha(colors.petrol, isDark ? 0.5 : 0.3),
                color: isDark ? colors.petrolLight : colors.petrol,
                backgroundColor: 'transparent',
                '&:hover': {
                  borderColor: isDark ? colors.petrolLight : colors.petrol,
                  backgroundColor: alpha(colors.petrol, isDark ? 0.16 : 0.06),
                  borderWidth: 1.5,
                },
                '&:active': {
                  backgroundColor: alpha(colors.petrol, isDark ? 0.24 : 0.1),
                },
              },
              textPrimary: {
                color: isDark ? colors.petrolLight : colors.petrol,
                '&:hover': { backgroundColor: alpha(colors.petrol, isDark ? 0.16 : 0.08) },
              },
            },
            defaultProps: { disableElevation: true, variant: 'contained' },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                background: surf.surface.main,
                backdropFilter: glassBlur,
                WebkitBackdropFilter: glassBlur,
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                background: surf.surface.main,
                backdropFilter: glassBlur,
                WebkitBackdropFilter: glassBlur,
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: surf.appBar,
                borderBottom: `1px solid ${surf.border.main}`,
                backdropFilter: glassBlur,
                WebkitBackdropFilter: glassBlur,
                boxShadow: 'none',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                background: surf.surface.main,
                backdropFilter: glassBlur,
                WebkitBackdropFilter: glassBlur,
                borderRight: `1px solid ${surf.border.main}`,
                boxShadow: 'none',
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                background: surf.surface.main,
                backdropFilter: glassBlur,
                WebkitBackdropFilter: glassBlur,
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
                boxShadow: shadowMedium,
                borderRadius: radius.md,
              },
            },
          },
          MuiTextField: {
            defaultProps: { size: 'medium', variant: 'outlined' },
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: radius.md,
                  backgroundColor: surf.input.bg,
                  transition: transitionColors,
                  '&:hover': {
                    backgroundColor: surf.input.bgHover,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(colors.petrol, 0.4),
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: surf.input.bgFocused,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.petrol,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: surf.border.main,
                    borderWidth: 1.5,
                  },
                },
              },
            },
          },
          MuiFormHelperText: {
            styleOverrides: {
              root: { marginLeft: 0, fontSize: 13, marginTop: 6 },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                height: 56,
                transition: `background-color ${duration.fast}ms ${easing}`,
                '&:hover': { backgroundColor: alpha(colors.petrol, isDark ? 0.08 : 0.04) },
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
              },
              head: {
                fontWeight: 600,
                fontSize: 13,
                color: surf.text.secondary,
                borderBottom: `1px solid ${surf.border.main}`,
                backgroundColor: surf.tableHeaderBg,
              },
              body: {
                borderBottom: `1px solid ${surf.border.main}`,
                fontSize: 14,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: radius.pill,
                fontWeight: 500,
                fontSize: 13,
                height: 28,
                '&:focus-visible': {
                  outline: `2px solid ${colors.petrol}`,
                  outlineOffset: 2,
                },
              },
              filledPrimary: {
                backgroundColor: colors.petrol,
                color: '#fff',
                '&:hover': { backgroundColor: colors.petrolHover },
              },
              outlinedSecondary: {
                borderColor: alpha(colors.mustard, 0.5),
                color: colors.mustardDark,
                '&:hover': {
                  borderColor: colors.mustard,
                  backgroundColor: alpha(colors.mustard, 0.08),
                },
              },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                color: surf.text.secondary,
                borderColor: surf.border.main,
                transition: transitionColors,
                '&.Mui-selected': {
                  backgroundColor: alpha(colors.petrol, isDark ? 0.24 : 0.1),
                  color: isDark ? colors.petrolLight : colors.petrol,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: alpha(colors.petrol, isDark ? 0.3 : 0.16),
                  },
                },
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                fontSize: 13,
                borderRadius: radius.sm,
                padding: '6px 10px',
              },
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

// Theme-basierte Utility (nutzt aktuelles Theme; für useTheme()-Komponenten)
export function glassStyle(theme: {
  palette: { background: { paper: string }; divider: string; mode?: 'light' | 'dark' };
  shape: { borderRadius: number };
}) {
  const isDark = theme.palette.mode === 'dark';
  return {
    background: theme.palette.background.paper,
    backdropFilter: glassBlur,
    WebkitBackdropFilter: glassBlur,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius ?? radius.lg,
    boxShadow: isDark ? shadows.softDark : shadows.soft,
    transition: transitionColors,
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
    CARD_BORDER_LIGHT: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  };
}
