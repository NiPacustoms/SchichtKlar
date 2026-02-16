'use client';

import { Card, CardProps, useTheme, alpha } from '@mui/material';
import { shadows } from '@/lib/design-tokens';

interface GlassCardProps extends CardProps {
  children: React.ReactNode;
  hover?: boolean;
}

export function GlassCard({ children, sx = {}, hover = true, ...props }: GlassCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const shadowSoft = isDark ? shadows.softDark : shadows.soft;
  const shadowMedium = isDark ? shadows.mediumDark : shadows.medium;

  return (
    <Card
      {...props}
      sx={{
        background: theme.palette.background.paper,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 16,
        boxShadow: shadowSoft,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        ...(hover && {
          '&:hover': {
            borderColor: theme.palette.divider,
            boxShadow: shadowMedium,
            transform: 'translateY(-2px)',
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
          transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        ...(hover && {
          '&:hover::before': { opacity: 1 },
        }),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}
