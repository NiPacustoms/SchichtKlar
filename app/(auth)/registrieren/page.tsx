'use client';

import Link from 'next/link';
import { Alert, Box, Button, Link as MuiLink, Paper, Typography } from '@mui/material';
import { Info } from '@mui/icons-material';

export default function RegisterPage() {
  return (
    <Box
      className="min-height-viewport"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        className="glass"
        sx={{
          p: 4,
          maxWidth: 520,
          width: '100%',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Info sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            Registrierung nicht verfügbar
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Die öffentliche Registrierung ist deaktiviert. Nur Administratoren können sich
            registrieren.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Als Administrator registrieren:</strong>
          </Typography>
          <Typography variant="body2">
            Wenn Sie eine Firma verwalten möchten, können Sie sich als Administrator registrieren
            und erhalten automatisch eine Company ID.
          </Typography>
        </Alert>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Als Mitarbeiter beitreten:</strong>
          </Typography>
          <Typography variant="body2">
            Mitarbeiter können sich nicht selbst registrieren. Sie benötigen eine Einladung von
            Ihrem Administrator.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            component={Link}
            href="/admin-registrieren"
            variant="contained"
            size="large"
            fullWidth
          >
            Als Administrator registrieren
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Bereits ein Konto?{' '}
              <MuiLink component={Link} href="/anmelden">
                Anmelden
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
