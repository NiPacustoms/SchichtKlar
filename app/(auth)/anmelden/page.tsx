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
  Link,
  CircularProgress,
} from '@mui/material';
import { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { AppLogo } from '@/components/ui/AppLogo';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/logging';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/authForms';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import NextLink from 'next/link';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const { branding } = useBrandingSettings();
  const router = useRouter();
  const [oidcEnabled, setOidcEnabled] = useState(false);

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

  // SOTA: Optimierter Submit-Handler mit react-hook-form
  const onSubmit = async (data: LoginFormData) => {
    clearErrors();

    try {
      await signIn(data.email, data.password);
      // Die Weiterleitung erfolgt automatisch über den useEffect
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Ein Fehler ist aufgetreten';
      setError('root', { message: errorMessage });
    }
  };

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

  useEffect(() => {
    logger.debug('Login useEffect triggered', {}, { loading, userId: user?.id });

    if (!loading && user) {
      // Bereits eingeloggt → rollenbasiertes Redirect
      logger.debug('User logged in, redirecting based on role', {}, { role: user.role });

      // Verzögerung für bessere UX und um sicherzustellen, dass der State vollständig geladen ist
      const redirectTimer = setTimeout(() => {
        logger.debug('Executing redirect for role', {}, { role: user.role });

        if (user.role === 'admin' || user.role === 'dispatcher') {
          logger.debug('Redirecting to admin overview');
          router.replace('/admin/uebersicht');
        } else if (user.role === 'nurse') {
          logger.debug('Redirecting to employee workspace');
          router.replace('/employee/arbeitsplatz');
        } else {
          // Fallback für unbekannte Rollen
          logger.debug('Redirecting to employee workspace (fallback)');
          router.replace('/employee/arbeitsplatz');
        }
      }, 200); // Erhöhte Verzögerung für bessere Stabilität

      return () => clearTimeout(redirectTimer);
    }
  }, [user, loading, router]);

  return (
    <Box className="min-height-viewport" sx={{ position: 'relative' }}>
      {/* zentriertes, großes Logo wie auf der Landing */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 8, md: 12 },
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1,
        }}
      >
        <AppLogo
          branding={branding}
          showLogo={branding?.showLogo !== false}
          width={320}
          height={320}
          sx={{ width: { xs: 240, md: 320 }, height: { xs: 240, md: 320 } }}
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
            pt: { xs: 10, md: 16 },
            pb: 0,
          }}
        >
          {loading || user ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                gap: 2,
              }}
            >
              <InlineSpinner size={24} />
              <Typography variant="h6">{loading ? 'Lade...' : 'Weiterleitung...'}</Typography>
            </Box>
          ) : (
            <Stack
              alignItems="center"
              sx={{ mt: { xs: 16, md: 24 }, width: '100%', maxWidth: 460 }}
            >
              <Paper className="glass" sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                  Anmelden
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Melden Sie sich in Ihrem JobFlow-Konto an
                </Typography>

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
                    <Link
                      component={NextLink}
                      href="/passwort-vergessen"
                      sx={{
                        color: '#005f73',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Passwort vergessen?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{ py: 1.5, mb: 2 }}
                    aria-label="Anmelden"
                    data-testid="login-button"
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Anmelden...
                      </>
                    ) : (
                      'Anmelden'
                    )}
                  </Button>

                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Link component={NextLink} href="/passwort-vergessen" variant="body2">
                      Passwort vergessen?
                    </Link>
                  </Box>
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
          )}
        </Box>
      </Container>
    </Box>
  );
}
