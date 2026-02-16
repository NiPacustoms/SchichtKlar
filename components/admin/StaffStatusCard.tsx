'use client';

import React, { memo } from 'react';
import { Card, CardContent, Typography, Box, Avatar, LinearProgress } from '@mui/material';
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
  ({ title, value, total, icon, color, subtitle }) => {
    const percentage = (total || 0) > 0 ? Math.round(((value || 0) / (total || 1)) * 100) : 0;

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

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                von {total} insgesamt
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              color={color}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${color}.main 0%, ${color}.dark 100%)`,
                  borderRadius: 4,
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
