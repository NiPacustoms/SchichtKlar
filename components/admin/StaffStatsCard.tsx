'use client';

import React, { memo } from 'react';
import { alpha, Card, CardContent, Typography, Box, Avatar, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface StaffStatsCardProps {
  title?: string;
  value?: number;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  staff?: Array<{ id: string; displayName: string; role: string; active: boolean }>;
}

export const StaffStatsCard = memo<StaffStatsCardProps>(
  ({ title, value, icon, color = 'primary', subtitle, trend }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const accent = theme.palette[color].main;

    return (
      <Card className="glass" sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: trend || subtitle ? 2 : 0 }}>
            <Avatar
              sx={{
                backgroundColor: alpha(accent, isDark ? 0.24 : 0.1),
                color: accent,
                mr: 2,
                width: 44,
                height: 44,
              }}
            >
              {icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h3" className="tabular-nums" sx={{ color: 'text.primary', mb: 0.25 }}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
            </Box>
          </Box>

          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}

          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                className="tabular-nums"
                color={trend.direction === 'up' ? 'success.main' : 'error.main'}
                sx={{ fontWeight: 600 }}
              >
                {trend.direction === 'up' ? '↗' : '↘'} {Math.abs(trend.value)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs. letzter Monat
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }
);

StaffStatsCard.displayName = 'StaffStatsCard';
