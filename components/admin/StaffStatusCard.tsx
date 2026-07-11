'use client';

import React, { memo } from 'react';
import {
  alpha,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { ReactNode } from 'react';

interface StaffStatusCardProps {
  title?: string;
  value?: number;
  total?: number;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  subtitle?: string;
  staff?: Array<{ id: string; active: boolean }>;
}

export const StaffStatusCard = memo<StaffStatusCardProps>(
  ({ title, value, total, icon, color = 'primary', subtitle }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const accent = theme.palette[color].main;
    const percentage = (total || 0) > 0 ? Math.round(((value || 0) / (total || 1)) * 100) : 0;

    return (
      <Card className="glass" sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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

          <Box sx={{ mb: subtitle ? 2 : 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                von {total} insgesamt
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                className="tabular-nums"
                sx={{ fontWeight: 600 }}
              >
                {percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
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
          </Box>

          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }
);

StaffStatusCard.displayName = 'StaffStatusCard';
