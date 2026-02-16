'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Box, LinearProgress, Typography } from '@mui/material';
import React, { ReactNode } from 'react';

interface AdminKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  onClick?: () => void;
}

function AdminKPICardBase({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  progress,
  onClick,
}: AdminKPICardProps) {
  return (
    <GlassCard
      hover={!!onClick}
      aria-label={`KPI ${title}`}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Box
        sx={{
          p: 3,
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : -1}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                fontSize: '13px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color,
                fontWeight: 800,
                fontSize: { xs: '28px', sm: '32px' },
                lineHeight: 1.2,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  fontSize: '13px',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: `0 4px 12px ${color}40`,
              transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
              },
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
              sx={{
                color: trend.isPositive ? 'success.main' : 'error.main',
                fontWeight: 700,
                fontSize: '12px',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: trend.isPositive
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.isPositive ? '+' : ''}
              {trend.value}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
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
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                  borderRadius: 4,
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 1,
                fontSize: '12px',
                display: 'block',
              }}
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
