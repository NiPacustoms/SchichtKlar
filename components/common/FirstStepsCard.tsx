'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
import { Close, ArrowForward } from '@mui/icons-material';

const STORAGE_PREFIX = 'jobflow-firststeps-dismissed';

export type FirstStepItem = { label: string; href: string };

type FirstStepsCardProps = {
  storageKey: string;
  title: string;
  steps: FirstStepItem[];
};

export function FirstStepsCard({ storageKey, title, steps }: FirstStepsCardProps) {
  const key = `${STORAGE_PREFIX}-${storageKey}`;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(Boolean(typeof window !== 'undefined' && window.localStorage?.getItem(key)));
    } catch {
      setDismissed(false);
    }
  }, [key]);

  const handleDismiss = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, '1');
        setDismissed(true);
      }
    } catch {
      setDismissed(true);
    }
  };

  if (dismissed) return null;

  return (
    <Card variant="outlined" sx={{ mb: 2, borderColor: 'primary.main', borderWidth: 1 }}>
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {title}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
              {steps.map((s, i) => (
                <li key={i}>
                  <Link
                    href={s.href}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {s.label}
                    <ArrowForward sx={{ fontSize: 16 }} />
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
          <IconButton size="small" onClick={handleDismiss} aria-label="Erste Schritte ausblenden">
            <Close />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
