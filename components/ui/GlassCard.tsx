'use client';

import { Card, CardProps, useTheme } from '@mui/material';
import { elevation, elevationDark, radius, duration, easing, glassBlur } from '@/lib/design-tokens';

type ElevationLevel = 0 | 1 | 2 | 3 | 4;

interface GlassCardProps extends CardProps {
  children: React.ReactNode;
  /**
   * Interaktive Karte: Hover hebt den Schatten eine Stufe an (nur bei (hover: hover)).
   * Kein transform – Tiefe entsteht allein über Licht.
   */
  hover?: boolean;
  /** Elevation 0–4 (Shadow-Stufe); Standard 2 = weicher Ruhe-Schatten */
  elevation?: ElevationLevel;
}

const transition = `box-shadow ${duration.base}ms ${easing}, border-color ${duration.base}ms ${easing}`;

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

  return (
    <Card
      {...props}
      sx={{
        background: theme.palette.background.paper,
        backdropFilter: glassBlur,
        WebkitBackdropFilter: glassBlur,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${radius.lg}px`,
        boxShadow: shadowCurrent,
        transition,
        position: 'relative',
        overflow: 'visible',
        ...(hover && {
          '@media (hover: hover)': {
            '&:hover': {
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
