'use client';

import { Card, CardProps, useTheme } from '@mui/material';
import { elevation, elevationDark, radius, duration, easing } from '@/lib/design-tokens';

type ElevationLevel = 0 | 1 | 2 | 3 | 4;

interface GlassCardProps extends CardProps {
  children: React.ReactNode;
  /** Hover: Border betont + eine Schattenstufe höher – ruhig, ohne Sprünge */
  hover?: boolean;
  /** Elevation 0–4 (Shadow-Stufe); Standard 2 = feiner Schatten */
  elevation?: ElevationLevel;
}

const transitionBase = `border-color ${duration.base}ms ${easing}, box-shadow ${duration.base}ms ${easing}`;

/**
 * Flache Standard-Karte („Clean & Flat").
 * Name „GlassCard" bleibt aus API-Kompatibilität erhalten;
 * die Optik ist eine opake Fläche mit Border – Tiefe über Tonwerte statt Blur.
 */
export function GlassCard({
  children,
  sx = {},
  hover = true,
  elevation: elevationLevel = 2,
  ...props
}: GlassCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const elevationMap = isDark ? elevationDark : elevation;
  const shadowCurrent = elevationMap[elevationLevel];
  const shadowLift =
    elevationLevel < 4 ? elevationMap[(elevationLevel + 1) as ElevationLevel] : elevationMap[4];
  const borderHover = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(28,25,23,0.20)';

  return (
    <Card
      {...props}
      sx={{
        backgroundColor: theme.palette.background.paper,
        backgroundImage: 'none',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${radius.lg}px`,
        boxShadow: shadowCurrent,
        transition: transitionBase,
        position: 'relative',
        overflow: 'visible',
        ...(hover && {
          '@media (hover: hover)': {
            '&:hover': {
              borderColor: borderHover,
              boxShadow: shadowLift,
            },
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}
