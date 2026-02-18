'use client';

import { Alert, Button, Typography } from '@mui/material';
import Block from '@mui/icons-material/Block';
import type { WeeklyLimit } from '@/lib/types/weeklyLimit';

export interface LimitWarningBannerProps {
  limit: WeeklyLimit;
  onRequestIncrease: () => void;
  variant?: 'warning' | 'blocked';
}

export function LimitWarningBanner({ limit, onRequestIncrease, variant }: LimitWarningBannerProps) {
  const isBlocked = variant === 'blocked' || limit.status === 'blocked';

  return (
    <Alert
      variant="filled"
      severity={isBlocked ? 'error' : 'warning'}
      icon={<Block fontSize="small" />}
      sx={{
        borderRadius: 2,
        '& .MuiAlert-message': { width: '100%' },
      }}
      aria-label={isBlocked ? 'Wochenlimit überschritten' : 'Wochenlimit-Warnung'}
      data-testid={isBlocked ? 'limit-blocked' : 'limit-warning'}
    >
      <Typography variant="body2" fontWeight={600} component="span">
        {isBlocked
          ? `Wochenlimit (${limit.wochenstundenLimit}h) überschritten (${limit.ueberschreitung.toFixed(1)}h über Limit). `
          : `Wochenlimit (${limit.wochenstundenLimit}h) fast erreicht (${limit.aktuelleWochenstunden.toFixed(1)}h). `}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        onClick={onRequestIncrease}
        sx={{
          mt: 1,
          color: 'inherit',
          borderColor: 'currentColor',
          '&:hover': { borderColor: 'inherit', bgcolor: 'rgba(255,255,255,0.1)' },
        }}
      >
        Genehmigung beantragen
      </Button>
    </Alert>
  );
}
