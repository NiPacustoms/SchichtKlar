'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: ReactNode;
  colorTheme: 'teal' | 'rose' | 'amber' | 'slate';
  active?: boolean;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  trend,
  icon,
  colorTheme,
  active = false,
  onClick,
}: StatCardProps) {
  const theme = useTheme();
  const palette = theme.palette;

  const colorThemes = {
    teal: {
      bg: alpha(palette.success.main, 0.1),
      color: palette.success.main,
      border: alpha(palette.success.main, 0.2),
    },
    rose: {
      bg: alpha(palette.error.main, 0.1),
      color: palette.error.main,
      border: alpha(palette.error.main, 0.2),
    },
    amber: {
      bg: alpha(palette.warning.main, 0.1),
      color: palette.warning.main,
      border: alpha(palette.warning.main, 0.2),
    },
    slate: {
      bg: alpha(palette.grey[500], 0.1),
      color: palette.grey[600],
      border: alpha(palette.grey[500], 0.2),
    },
  };

  const themeColors = colorThemes[colorTheme] ?? colorThemes.slate;

  return (
    <GlassCard
      hover
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        ...(active && {
          border: `2px solid ${themeColors.color}`,
          boxShadow: `0 4px 16px ${alpha(themeColors.color, 0.2)}`,
        }),
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: themeColors.bg,
            color: themeColors.color,
            border: `1px solid ${themeColors.border}`,
          }}
        >
          {icon}
        </Box>
        {trend && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '11px',
            }}
          >
            {trend}
          </Typography>
        )}
      </Box>
      <Box>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            mb: 0.5,
            transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.05)',
              transformOrigin: 'left center',
            },
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          {label}
        </Typography>
      </Box>
    </GlassCard>
  );
}
