'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { alpha, Box, LinearProgress, Typography, useTheme } from '@mui/material';
import React, { ReactNode } from 'react';

interface AdminKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  /** Semantische Akzentfarbe des Icons, z. B. 'info.main' oder 'success.main' */
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  onClick?: () => void;
  /** Priority 1 = kritisch (Error-Rahmen); 2 = Standard; 3 = dezent */
  priority?: 1 | 2 | 3;
}

type PaletteKey = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

function AdminKPICardBase({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  progress,
  onClick,
  priority = 2,
}: AdminKPICardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  // 'info.main' → Palette-Farbe auflösen (Icon-Tönung); Fallback: Primärfarbe
  const paletteKey = color.split('.')[0] as PaletteKey;
  const accent = theme.palette[paletteKey]?.main ?? theme.palette.primary.main;

  return (
    <GlassCard
      hover={!!onClick}
      aria-label={`KPI ${title}`}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        ...(priority === 1 && {
          borderColor: 'error.main',
        }),
      }}
    >
      <Box
        sx={{ p: 3 }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : -1}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {title}
            </Typography>
            <Typography
              variant="h2"
              component="p"
              className="tabular-nums"
              sx={{
                color: 'text.primary',
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: alpha(accent, isDark ? 0.24 : 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              flexShrink: 0,
              ml: 2,
            }}
          >
            {icon}
          </Box>
        </Box>

        {trend && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: progress !== undefined ? 2 : 0,
              mt: 1,
            }}
          >
            <Typography
              variant="caption"
              className="tabular-nums"
              sx={{
                color: trend.isPositive ? 'success.main' : 'error.main',
                fontWeight: 600,
                px: 1,
                py: 0.25,
                borderRadius: '999px',
                backgroundColor: alpha(
                  trend.isPositive ? theme.palette.success.main : theme.palette.error.main,
                  isDark ? 0.2 : 0.1
                ),
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.isPositive ? '+' : ''}
              {trend.value}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs. letzte Woche
            </Typography>
          </Box>
        )}

        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: '999px',
                backgroundColor: alpha(accent, isDark ? 0.2 : 0.12),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: accent,
                  borderRadius: '999px',
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              {progress}% des Ziels erreicht
            </Typography>
          </Box>
        )}
      </Box>
    </GlassCard>
  );
}

export const AdminKPICard = React.memo(AdminKPICardBase);
