'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { getAppLogoAlt, getAppLogoUrl } from '@/lib/config/logo';
import type { BrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { Box } from '@mui/material';

export interface AppLogoProps {
  /** Branding (companyLogo, companyName). Wenn nicht gesetzt, wird Fallback-Logo + "JobFlow" genutzt. */
  branding?: Pick<BrandingSettings, 'companyLogo' | 'companyName'> | null;
  /** Logo anzeigen nur wenn true (z.B. branding?.showLogo). Default: true */
  showLogo?: boolean;
  width?: number;
  height?: number;
  /** MUI sx für den Container (z.B. für Header-Größe) */
  sx?: object;
  /** OptimizedImage: showSkeleton, fallbackBgColor, priority */
  showSkeleton?: boolean;
  fallbackBgColor?: string;
  priority?: boolean;
}

/**
 * Einheitliche App-Logo-Darstellung (Branding oder Fallback).
 * Nutzt zentrale Logo-Konfiguration aus lib/config/logo.ts.
 */
export function AppLogo({
  branding,
  showLogo = true,
  width = 96,
  height = 64,
  sx = {},
  showSkeleton = false,
  fallbackBgColor = 'transparent',
  priority = false,
}: AppLogoProps) {
  if (showLogo === false) return null;

  const src = getAppLogoUrl(branding?.companyLogo);
  const alt = getAppLogoAlt(branding?.companyName);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...sx }}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        sx={{ width: '100%', height: '100%', borderRadius: 0 }}
        showSkeleton={showSkeleton}
        fallbackBgColor={fallbackBgColor}
        priority={priority}
      />
    </Box>
  );
}
