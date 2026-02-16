'use client';

import React, { memo } from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
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
  ({ title, value, icon, color, subtitle, trend }) => {
    return (
      <Card className="glass" sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${color}.main 0%, ${color}.dark 100%)`,
                color: 'white',
                mr: 2,
                width: 48,
                height: 48,
                boxShadow: `0 4px 12px ${color}.main40`,
              }}
            >
              {icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, color: `${color}.main`, fontSize: '32px', mb: 0.5 }}
              >
                {value}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '14px', fontWeight: 500 }}
              >
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
