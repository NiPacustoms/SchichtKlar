'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export function KPICard({ title, value, icon, color }: KPICardProps) {
  return (
    <GlassCard>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color, fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: color,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {icon}
          </Box>
        </Box>
      </Box>
    </GlassCard>
  );
}
