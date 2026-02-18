'use client';

import { Card, CardProps, useTheme, alpha } from '@mui/material';
import {
  elevation,
  elevationDark,
  radius,
  duration,
  easing,
} from '@/lib/design-tokens';

type ElevationLevel = 0 | 1 | 2 | 3 | 4;

interface GlassCardProps extends CardProps {
  children: React.ReactNode;
  /** Hover: scale(1.02) + shadow lift – nur bei (hover: hover), reduced-motion beachtet */
  hover?: boolean;
  /** Elevation 0–4 (Shadow-Stufe); Standard 2 = weicher Schatten */
  elevation?: ElevationLevel;
}

const transitionBase = `all ${duration.base}ms ${easing}`;

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
  const shadowLift = elevationLevel < 4 ? elevationMap[(elevationLevel + 1) as ElevationLevel] : elevationMap[4];

  return (
    <Card
      {...props}
      sx={{
        background: theme.palette.background.paper,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: radius.lg,
        boxShadow: shadowCurrent,
        transition: transitionBase,
        position: 'relative',
        overflow: 'visible',
        ...(hover && {
          '@media (hover: hover)': {
            '&:hover': {
              borderColor: theme.palette.divider,
              boxShadow: shadowLift,
              transform: 'scale(1.02) translateY(-2px)',
            },
          },
          '@media (prefers-reduced-motion: reduce)': {
            '&:hover': {
              transform: 'none',
              boxShadow: shadowLift,
            },
          },
        }),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.12)}, transparent)`,
          opacity: 0,
          transition: `opacity ${duration.base}ms ${easing}`,
        },
        ...(hover && {
          '@media (hover: hover)': {
            '&:hover::before': { opacity: 1 },
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}
