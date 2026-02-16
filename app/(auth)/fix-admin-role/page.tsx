'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * Einmal-Aktion: Setzt die Rolle des eingeloggten Benutzers auf Admin,
 * wenn seine E-Mail in der Bootstrap-Allow-Liste steht (ADMIN_BOOTSTRAP_EMAIL).
 * Danach Seite neu laden – dann wird zur Admin-Übersicht weitergeleitet.
 */
export default function FixAdminRolePage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace('/anmelden');
    }
  }, [loading, firebaseUser, router]);

  const handleSetAdminRole = async () => {
    if (!firebaseUser) return;
    setStatus('loading');
    setMessage('');
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/auth/ensure-admin-role', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setMessage(data?.message || 'Rolle auf Admin gesetzt. Bitte Seite neu laden.');
      } else {
        setStatus('error');
        setMessage(data?.message || `Fehler: ${res.status}`);
      }
    } catch (_e) {
      setStatus('error');
      setMessage(_e instanceof Error ? _e.message : 'Netzwerkfehler');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography>Wird geladen…</Typography>
      </Container>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon /> Admin-Rolle setzen
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Angemeldet als: <strong>{user?.email ?? firebaseUser.email}</strong>
          {user?.role && (
            <>
              {' '}
              · Aktuelle Rolle: <strong>{user.role}</strong>
            </>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Wenn du als Admin eingetragen bist, aber als Mitarbeiter weitergeleitet wirst, setzt
          dieser Button einmalig deine Rolle auf Admin (sofern in der Konfiguration erlaubt).
        </Typography>

        {status === 'success' && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            {message}
          </Typography>
        )}
        {status === 'error' && (
          <Typography color="error.main" sx={{ mb: 2 }}>
            {message}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleSetAdminRole}
            disabled={status === 'loading'}
            startIcon={<AdminPanelSettingsIcon />}
          >
            {status === 'loading' ? 'Wird ausgeführt…' : 'Als Admin aktivieren'}
          </Button>
          {status === 'success' && (
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Seite neu laden
            </Button>
          )}
          <Button variant="text" onClick={() => router.push('/employee/arbeitsplatz')}>
            Zurück zum Arbeitsplatz
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
