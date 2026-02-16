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
  CircularProgress,
  Link,
} from '@mui/material';
import { AppLogo } from '@/components/ui/AppLogo';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetSchema, type PasswordResetFormData } from '@/lib/validations/authForms';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import NextLink from 'next/link';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const { branding } = useBrandingSettings();
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    clearErrors();

    try {
      await sendPasswordReset(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Ein Fehler ist aufgetreten';
      setError('root', { message: errorMessage });
    }
  };

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
          <Stack alignItems="center" sx={{ mt: { xs: 16, md: 24 }, width: '100%', maxWidth: 460 }}>
            <Paper className="glass" sx={{ p: 4, width: '100%', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                Passwort zurücksetzen
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen
                Ihres Passworts.
              </Typography>

              {success ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Passwort-Reset-E-Mail wurde gesendet! Bitte überprüfen Sie Ihr Postfach.
                  </Alert>
                  <Button
                    component={NextLink}
                    href="/anmelden"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Zurück zur Anmeldung
                  </Button>
                </Box>
              ) : (
                <>
                  {/* Error-Display */}
                  {errors.root && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.root.message}
                    </Alert>
                  )}

                  {/* Form */}
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
                          autoComplete="email"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          sx={{ mb: 3 }}
                          inputProps={{ 'aria-label': 'E-Mail' }}
                        />
                      )}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ py: 1.5, mb: 2 }}
                      aria-label="Passwort zurücksetzen"
                    >
                      {isSubmitting ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Wird gesendet...
                        </>
                      ) : (
                        'Passwort zurücksetzen'
                      )}
                    </Button>
                  </Box>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Link component={NextLink} href="/anmelden" variant="body2">
                      Zurück zur Anmeldung
                    </Link>
                  </Box>
                </>
              )}
            </Paper>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
