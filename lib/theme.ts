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
          // Linear-scale: h1 32/40 700, h2 28/36 600, h3 24/32 600
          h1: { fontSize: 32, fontWeight: 700, lineHeight: 40 / 32, letterSpacing: '-0.02em' },
          h2: { fontSize: 28, fontWeight: 600, lineHeight: 36 / 28, letterSpacing: '-0.01em' },
          h3: { fontSize: 24, fontWeight: 600, lineHeight: 32 / 24, letterSpacing: '-0.01em' },
          h4: { fontSize: 20, fontWeight: 600, lineHeight: 1.35 },
          h5: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
          h6: { fontSize: 16, fontWeight: 600, lineHeight: 1.45 },
          body1: { fontSize: 16, lineHeight: 24 / 16, fontWeight: 400, letterSpacing: '0.01em' },
          body2: { fontSize: 14, lineHeight: 20 / 14, fontWeight: 400, letterSpacing: '0.01em' },
          button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
          caption: { fontSize: 12, lineHeight: 16 / 12, fontWeight: 400, letterSpacing: '0.02em' },
          subtitle1: { fontSize: 16, lineHeight: 24 / 16, fontWeight: 500 },
          subtitle2: { fontSize: 14, lineHeight: 20 / 14, fontWeight: 500 },
          overline: { fontSize: 13, lineHeight: 16 / 13, fontWeight: 500, letterSpacing: '0.05em' },
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
              // A11y AA++: Focus Visible 2px Petrol (weltweit)
              'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible': {
                outline: `2px solid ${colors.petrol}`,
                outlineOffset: 2,
                borderRadius: 4,
              },
              '.glass': {
                background: surf.surface.main,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: ({ theme }) => ({
                minWidth: 120,
                borderRadius: radius.md,
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                textTransform: 'none',
                transition: transitionBase,
                willChange: 'transform, box-shadow',
                '&:focus-visible': {
                  outline: `2px solid ${colors.petrol}`,
                  outlineOffset: 2,
                },
                '&:hover': { transform: 'translateY(-1px)' },
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                  '&:hover': { transform: 'none' },
                },
                [theme.breakpoints.down('sm')]: { minWidth: 'auto', width: '100%' },
              }),
              containedPrimary: {
                background: `linear-gradient(135deg, ${colors.petrol} 0%, ${colors.petrolLight} 100%)`,
                color: '#fff',
                boxShadow: shadowSoft,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colors.petrolLight} 0%, ${colors.petrol} 100%)`,
                  boxShadow: shadowMedium,
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)', boxShadow: shadowSoft },
                '&:disabled': {
                  background: alpha(colors.petrol, 0.3),
                  color: alpha('#fff', 0.5),
                },
              },
              outlinedPrimary: {
                borderWidth: 1.5,
                borderColor: alpha(colors.petrol, 0.3),
                color: colors.petrol,
                backgroundColor: 'transparent',
                '&:hover': {
                  borderColor: colors.petrol,
                  backgroundColor: alpha(colors.petrol, 0.06),
                  borderWidth: 1.5,
                },
                '&:active': {
                  transform: 'translateY(0)',
                  backgroundColor: alpha(colors.petrol, 0.1),
                },
              },
              textPrimary: {
                color: colors.petrol,
                '&:hover': { backgroundColor: alpha(colors.petrol, 0.08) },
              },
            },
            defaultProps: { disableElevation: true, variant: 'contained' },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                background: surf.surface.main,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
                transition: transitionBase,
                '&:hover': {
                  borderColor: surf.border.hover,
                  boxShadow: shadowMedium,
                },
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                background: surf.surface.main,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.lg,
                boxShadow: shadowSoft,
                transition: transitionBase,
                '&:hover': {
                  borderColor: surf.border.hover,
                  boxShadow: shadowMedium,
                  transform: 'translateY(-2px)',
                },
              },
            },
            defaultProps: { elevation: 0 },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: surf.appBar,
                borderBottom: `1px solid ${surf.border.main}`,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: shadowSoft,
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                background: surf.surface.main,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRight: `1px solid ${surf.border.main}`,
                boxShadow: shadowMedium,
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                background: surf.surface.main,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `1px solid ${surf.border.main}`,
                borderRadius: radius.dialog,
                boxShadow: shadowLarge,
              },
            },
            defaultProps: { maxWidth: 'md', fullWidth: true },
          },
          MuiTextField: {
            defaultProps: { size: 'medium', variant: 'outlined' },
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: radius.md,
                  backgroundColor: surf.input.bg,
                  transition: transitionBase,
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
              root: { marginLeft: 0, fontSize: '13px', marginTop: 6 },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                height: 56,
                transition: `background-color ${duration.fast}ms ${easing}`,
                '&:hover': { backgroundColor: alpha(colors.petrol, 0.04) },
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
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: surf.text.secondary,
                borderBottom: `2px solid ${surf.border.main}`,
                backgroundColor: surf.tableHeaderBg,
              },
              body: {
                borderBottom: `1px solid ${surf.border.main}`,
                fontSize: '14px',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: radius.sm,
                fontWeight: 500,
                fontSize: '13px',
                height: 28,
                '&:focus-visible': {
                  outline: `2px solid ${colors.petrol}`,
                  outlineOffset: 2,
                },
              },
              filledPrimary: {
                backgroundColor: colors.petrol,
                color: '#fff',
                '&:hover': { backgroundColor: colors.petrolLight },
              },
              outlinedSecondary: {
                borderColor: alpha(colors.mustard, 0.5),
                color: colors.mustard,
                '&:hover': {
                  borderColor: colors.mustard,
                  backgroundColor: alpha(colors.mustard, 0.08),
                },
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
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
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
    CARD_BORDER_LIGHT: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  };
}
