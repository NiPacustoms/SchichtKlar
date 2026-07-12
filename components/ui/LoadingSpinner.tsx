'use client';

import { Box, CircularProgress, Skeleton, Typography, useTheme } from '@mui/material';
import { AppLogo } from '@/components/ui/AppLogo';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';

export type LoadingSpinnerSize = 'small' | 'medium' | 'large' | number;
export type LoadingSpinnerVariant = 'spinner' | 'skeleton' | 'fullscreen' | 'inline';

interface LoadingSpinnerProps {
  message?: string;
  size?: LoadingSpinnerSize;
  variant?: LoadingSpinnerVariant;
  showLogo?: boolean;
  color?: 'primary' | 'inherit' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  /** Für Screenreader; falls nicht gesetzt, wird `message` verwendet. */
  'aria-label'?: string;
}

/**
 * Einheitliche LoadingSpinner Komponente (A11y, Reduced Motion)
 *
 * - Verwendet konsistentes Branding und einheitliches Design
 * - Accessibility: role="status", aria-live="polite", aria-label (aus message oder aria-label)
 * - Inline/Button: aria-hidden (dekorativ, Button-Text wird angesagt)
 * - prefers-reduced-motion: Puls/Breathe aus, MUI-Rotation verlangsamt
 *
 * @param message - Optionaler Text unter dem Spinner (wird auch für aria-label genutzt)
 * @param size - Größe: 'small' (24px), 'medium' (40px), 'large' (64px) oder Zahl
 * @param variant - Variante: 'spinner' (Standard), 'skeleton', 'fullscreen', 'inline' (für Buttons)
 * @param showLogo - Logo im fullscreen Modus anzeigen
 * @param color - MUI Theme-Farbe (Standard: 'primary' = #0f766e)
 * @param aria-label - Überschreibt message für Screenreader
 */
const DEFAULT_LOADING_LABEL = 'Wird geladen';

export function LoadingSpinner({
  message = 'Schichtklar wird geladen...',
  size = 'medium',
  variant = 'spinner',
  showLogo = true,
  color = 'primary',
  'aria-label': ariaLabel,
}: LoadingSpinnerProps) {
  const { branding } = useBrandingSettings();
  const theme = useTheme();
  const statusLabel = ariaLabel ?? message ?? DEFAULT_LOADING_LABEL;

  // Größe berechnen
  const getSizeValue = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 64;
      case 'medium':
      default:
        return 40;
    }
  };

  const sizeValue = getSizeValue();

  // Einheitliche Spinner-Farben basierend auf Branding
  const spinnerColor = color === 'primary' ? theme.palette.primary.main : undefined;
  const textColor = color === 'primary' ? theme.palette.primary.main : theme.palette.text.secondary;

  // Fullscreen Variante
  if (variant === 'fullscreen') {
    const shouldShowLogo = showLogo && branding?.showLogo !== false;

    return (
      <Box
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          zIndex: 9999,
        }}
      >
        <Box sx={{ mb: 4 }}>
          <AppLogo
            branding={branding}
            showLogo={shouldShowLogo}
            width={240}
            height={240}
            sx={{ width: 240, height: 240 }}
            showSkeleton={false}
            fallbackBgColor="transparent"
            priority
          />
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress
            size={sizeValue}
            thickness={4}
            sx={{
              color: spinnerColor,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            className="loading-spinner-pulse loading-spinner-breathe"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: sizeValue * 0.4,
              height: sizeValue * 0.4,
              borderRadius: '50%',
              background: `${spinnerColor}`,
            }}
          />
        </Box>

        {message && (
          <Typography
            variant="body1"
            sx={{
              color: textColor,
              fontWeight: 500,
              textAlign: 'center',
              mt: 3,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  // Skeleton Variante
  if (variant === 'skeleton') {
    return (
      <Box role="status" aria-live="polite" aria-label={statusLabel} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
          <Box>
            <Skeleton variant="text" width={120} height={24} />
            <Skeleton variant="text" width={80} height={16} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  // Inline Variante (für Buttons und kleine Bereiche) – dekorativ, Button-Text wird angesagt
  if (variant === 'inline') {
    return (
      <CircularProgress
        size={sizeValue}
        thickness={4}
        color={color}
        aria-hidden
        sx={{
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
    );
  }

  // Standard Spinner Variante
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
        minHeight: '200px',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={sizeValue}
          thickness={4}
          color={color}
          sx={{
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          className="loading-spinner-pulse loading-spinner-breathe"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: sizeValue * 0.3,
            height: sizeValue * 0.3,
            borderRadius: '50%',
            background: `${spinnerColor}`,
          }}
        />
      </Box>

      {message && (
        <Typography
          variant="body1"
          sx={{
            color: textColor,
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Kleine Inline-Spinner Variante für Buttons
 *
 * Verwendung: <Button startIcon={<InlineSpinner />}>Speichern</Button>
 */
export function InlineSpinner({
  size = 20,
  color = 'inherit',
}: {
  size?: number;
  color?: 'primary' | 'inherit' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}) {
  return (
    <CircularProgress
      size={size}
      thickness={4}
      color={color}
      aria-hidden
      sx={{
        '& .MuiCircularProgress-circle': {
          strokeLinecap: 'round',
        },
      }}
    />
  );
}
