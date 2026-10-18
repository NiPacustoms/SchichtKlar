'use client';

import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Container,
  Stack,
  Fade,
  Link as MuiLink,
} from '@mui/material';
import { AppLogo } from '@/components/ui/AppLogo';
import React, { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logging';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/authForms';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import NextLink from 'next/link';

export default function LoginPage() {
  const { user, loading, authError, signIn } = useAuth();
  const { canAccessAdminArea, isLoading: permissionsLoading } = usePermissions();
  const { branding } = useBrandingSettings();
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const redirectFormRef = useRef<HTMLFormElement>(null);

  // SOTA: react-hook-form mit Zod-Resolver
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearErrors();
    setJustSubmitted(true);
    try {
      await signIn(data.email, data.password);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Ein Fehler ist aufgetreten';
      setError('root', { message: errorMessage });
      setJustSubmitted(false);
    }
  };

  // Nach erfolgreichem Login: "justSubmitted" zurücksetzen, sobald user oder authError da ist
  useEffect(() => {
    if (user || authError) setJustSubmitted(false);
  }, [user, authError]);

  // Dynamisch prüfen ob OIDC verfügbar ist (Client-Side)
  useEffect(() => {
    setOidcEnabled(Boolean(process.env.NEXT_PUBLIC_OIDC_PROVIDER_ID));
  }, []);

  // Handler für OIDC-Login (dynamischer Import)
  const handleOidcLogin = async () => {
    try {
      const { signInWithOidc } = await import('@/lib/services/oidcAuth');
      await signInWithOidc();
    } catch (error) {
      logger.error('OIDC login failed', error instanceof Error ? error : new Error(String(error)));
    }
  };

  // Rolle kommt aus dem Konto (Firestore): Admin-Registrierung oder Einladung als Mitarbeiter
  const redirectTarget =
    user && !loading && !permissionsLoading
      ? (canAccessAdminArea ? '/admin/uebersicht' : '/employee/arbeitsplatz')
      : null;

  // Sofort-Redirect (Cookie ist bereits gesetzt, da User erst nach setSessionCookie gesetzt wird). Zusätzlich Zeitgeber als Fallback.
  useEffect(() => {
    if (!redirectTarget || typeof window === 'undefined') return;
    const go = () => window.location.assign(redirectTarget);
    go(); // sofort, damit kein Effect-Cleanup (z. B. React Strict Mode) den Redirect verhindert
    const fallback = setTimeout(go, 600);
    return () => clearTimeout(fallback);
  }, [redirectTarget]);

  return (
    <Box className="min-height-viewport" sx={{ position: 'relative' }}>
      {/* Verstecktes Formular als Fallback-Redirect */}
      {redirectTarget && (
        <form
          ref={redirectFormRef}
          method="GET"
          action={redirectTarget}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}
      {/* Logo im Fluss über der Anmeldekarte */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          pt: { xs: 6, md: 10 },
          pointerEvents: 'none',
          userSelect: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AppLogo
          branding={branding}
          showLogo={branding?.showLogo !== false}
          width={200}
          height={50}
          sx={{ width: 200, height: 50 }}
          showSkeleton={false}
          fallbackBgColor="transparent"
          priority
        />
      </Box>

      {/* Hero-Bereich analog Landing */}
      <Container maxWidth="xl" sx={{ maxWidth: '1280px', position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 6,
            alignItems: 'center',
            justifyItems: 'center',
            pt: 0,
            pb: 8,
          }}
        >
          {(loading || user || justSubmitted) ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                gap: 3,
              }}
            >
              <Typography variant="h6" aria-live="polite">
                {loading ? 'Lade...' : user ? 'Weiterleitung...' : 'Anmeldung wird geprüft...'}
              </Typography>
              {redirectTarget && (
                <>
                  <Button
                    component="a"
                    href={redirectTarget}
                    variant="contained"
                    size="large"
                    sx={{ minWidth: 220 }}
                  >
                    Zum Dashboard
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Falls die Weiterleitung nicht startet, auf den Button klicken.
                  </Typography>
                </>
              )}
              {justSubmitted && !user && !authError && !loading && (
                <Typography variant="body2" color="text.secondary">
                  Bitte einen Moment warten…
                </Typography>
              )}
            </Box>
          ) : (
            <Fade in timeout={500}>
            <Stack
              alignItems="center"
              sx={{ mt: { xs: 3, md: 4 }, width: '100%', maxWidth: 400 }}
            >
              <Paper className="glass" sx={{ p: { xs: 3, sm: 4 }, width: '100%', textAlign: 'left' }}>
                <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em', mb: 0.5 }}>
                  Anmelden
                </Typography>
                <Typography sx={{ fontSize: 14.5, color: 'text.secondary', mb: 3 }}>
                  Disposition und Mitarbeitende nutzen denselben Zugang – Sie landen automatisch im richtigen Bereich.
                </Typography>

                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Typography variant="caption" component="div" sx={{ mb: 1, fontFamily: 'monospace', color: 'text.secondary' }}>
                      Dev: loading={String(loading)} user={user != null ? (user as { email?: string }).email ?? '—' : '—'} authError={authError ? 'ja' : '—'}
                    </Typography>
                    {!loading && !user && !authError && (
                      <Typography variant="caption" component="div" sx={{ mb: 1, color: 'text.secondary' }}>
                        Nach Anmelden: Session wird sofort gesetzt; bei Fehler erscheint hier eine Meldung oder unter F12 → Network: POST /api/auth/session
                      </Typography>
                    )}
                  </>
                )}

                {authError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {authError}
                  </Alert>
                )}
                {/* SOTA: Error-Display mit react-hook-form */}
                {errors.root && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.root.message}
                  </Alert>
                )}

                {/* SOTA: Form mit Controller-Komponenten */}
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="E-Mail"
                        type="email"
                        autoComplete="username"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        sx={{ mb: 2 }}
                        inputProps={{ 'aria-label': 'E-Mail', 'data-testid': 'email-input' }}
                      />
                    )}
                  />

                  <Controller
                    name="password"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Passwort"
                        type="password"
                        autoComplete="current-password"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        sx={{ mb: 1 }}
                        inputProps={{ 'aria-label': 'Passwort', 'data-testid': 'password-input' }}
                      />
                    )}
                  />

                  <Box sx={{ textAlign: 'right', mb: 3 }}>
                    <MuiLink
                      component={NextLink}
                      href="/passwort-vergessen"
                      underline="hover"
                      sx={{ fontSize: '0.875rem', color: 'primary.main', fontWeight: 500 }}
                    >
                      Passwort vergessen?
                    </MuiLink>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{ py: 1.5, mb: 1 }}
                    aria-label="Anmelden"
                    aria-busy={isSubmitting}
                    data-testid="login-button"
                  >
                    {isSubmitting ? 'Anmelden...' : 'Anmelden'}
                  </Button>
                </Box>

                {oidcEnabled && (
                  <Button
                    onClick={handleOidcLogin}
                    fullWidth
                    variant="outlined"
                    sx={{ py: 1.5, mt: 2 }}
                    aria-label="Mit SSO anmelden"
                  >
                    Mit SSO anmelden
                  </Button>
                )}
              </Paper>
            </Stack>
            </Fade>
          )}
        </Box>
      </Container>
    </Box>
  );
}
