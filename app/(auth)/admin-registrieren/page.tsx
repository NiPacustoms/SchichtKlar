'use client';

import { useState } from 'react';
import { logger } from '@/lib/logging';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.companyName.trim() || !form.displayName.trim()) {
      setError('Firma und Name sind erforderlich');
      return;
    }
    if (form.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen enthalten');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    setLoading(true);
    try {
      if (!auth) throw new Error('Auth nicht initialisiert');
      const cred = await createUserWithEmailAndPassword(auth!, form.email, form.password);
      if (form.displayName) await updateProfile(cred.user, { displayName: form.displayName });

      // E-Mail-Verifizierung senden (nur einmal)
      try {
        const actionCodeSettings = {
          url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/anmelden`,
          handleCodeInApp: false,
        };
        await sendEmailVerification(cred.user, actionCodeSettings);
      } catch (emailError) {
        // E-Mail-Verifizierung ist nicht kritisch, nur loggen
        const errorCode = (emailError as { code?: string })?.code;
        if (errorCode === 'auth/too-many-requests') {
          logger.warn(
            'E-Mail-Verifizierung konnte nicht gesendet werden: Zu viele Anfragen. Bitte später erneut versuchen.',
            {},
            { error: emailError instanceof Error ? emailError.message : String(emailError) }
          );
        } else {
          logger.warn(
            'E-Mail-Verifizierung konnte nicht gesendet werden',
            {},
            { error: emailError instanceof Error ? emailError.message : String(emailError) }
          );
        }
      }

      // Firebase ID Token für Authorization-Header holen
      const idToken = await cred.user.getIdToken();

      // displayName in firstName und lastName aufteilen (falls möglich)
      const nameParts = form.displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: form.email,
          displayName: form.displayName,
          firstName: firstName || form.displayName,
          lastName: lastName || form.displayName,
          companyName: form.companyName,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Fehler bei Admin-Registrierung');
      }
      router.push('/admin/uebersicht');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="min-height-viewport"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}
    >
      <Paper className="glass" sx={{ p: 4, maxWidth: 520, width: '100%' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          Admin registrieren
        </Typography>
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
            label="Firmenname"
            value={form.companyName}
            onChange={e => setForm({ ...form, companyName: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Name"
            value={form.displayName}
            onChange={e => setForm({ ...form, displayName: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="E-Mail"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Passwort"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Passwort bestätigen"
            type="password"
            value={form.confirmPassword}
            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Wird erstellt...
              </>
            ) : (
              'Firma anlegen'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
