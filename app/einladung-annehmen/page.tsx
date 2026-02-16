'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ emailMasked: string; companyName: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) {
        setError('Kein Einladungstoken angegeben');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || 'Einladung ungültig');
        }
        const data = await res.json();
        if (mounted) setMeta(data);
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen enthalten');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Fehler bei der Einladung');
      }
      router.push('/employee/arbeitsplatz');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        className="min-height-viewport"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      className="min-height-viewport"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}
    >
      <Paper className="glass" sx={{ p: 4, maxWidth: 480, width: '100%' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Einladung annehmen
        </Typography>
        {meta && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            Einladung für {meta.emailMasked} von {meta.companyName}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Passwort"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Passwort bestätigen"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Wird erstellt...' : 'Konto erstellen'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <Box
          className="min-height-viewport"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
