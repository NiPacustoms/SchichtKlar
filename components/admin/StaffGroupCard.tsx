'use client';

import { alpha, Card, CardContent, Typography, Box, Avatar, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface StaffGroupCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  subtitle?: string;
}

export function StaffGroupCard({ title, value, icon, color, subtitle }: StaffGroupCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette[color].main;

  return (
    <Card className="glass" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: subtitle ? 2 : 0 }}>
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
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
