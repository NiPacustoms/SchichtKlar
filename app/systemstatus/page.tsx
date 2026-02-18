'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Box, Typography, Chip } from '@mui/material';

export default function StatusPage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'degraded'>('loading');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) {
          setStatus(res.ok ? 'ok' : 'degraded');
          setDetails(data?.error || '');
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setStatus('degraded');
          const message = e instanceof Error ? e.message : 'unknown';
          setDetails(message);
        }
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const statusColor = status === 'ok' ? 'success' : status === 'loading' ? 'default' : 'warning';
  const statusLabel = status === 'ok' ? 'Operational' : status === 'loading' ? 'Checking…' : 'Degraded';

  return (
    <PageContainer maxWidth="narrow">
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Systemstatus
      </Typography>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: status === 'ok' ? 'success.main' : status === 'loading' ? 'grey.500' : 'warning.main',
          }}
        />
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>
      {details && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {details}
        </Typography>
      )}
    </PageContainer>
  );
}
