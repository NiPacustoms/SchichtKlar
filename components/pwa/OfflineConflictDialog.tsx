'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography, Box, Stack, Chip } from '@mui/material';
import { OfflineConflict } from '@/lib/services/offlineQueue';
import { ErrorOutline, Refresh, Delete } from '@mui/icons-material';

interface OfflineConflictDialogProps {
  open: boolean;
  conflict: OfflineConflict | null;
  onResolve: (deleteItem: boolean) => Promise<void>;
  onRetry: () => Promise<void>;
  loading?: boolean;
}

const conflictMessages: Record<string, { title: string; description: string; severity: 'error' | 'warning' }> = {
  not_found: {
    title: 'Daten nicht vorhanden',
    description: 'Der Eintrag existiert nicht mehr auf dem Server. Das kann passieren, wenn ein Admin die Daten gelöscht hat.',
    severity: 'error',
  },
  validation: {
    title: 'Validierungsfehler',
    description: 'Der Eintrag erfüllt nicht mehr die erforderlichen Bedingungen. Das kann sich durch Server-Änderungen ergeben haben.',
    severity: 'warning',
  },
  duplicate: {
    title: 'Duplikat erkannt',
    description: 'Ein ähnlicher Eintrag existiert bereits. Es könnte sich um ein Duplikat handeln.',
    severity: 'warning',
  },
  stale: {
    title: 'Daten veraltet',
    description: 'Die offline gespeicherten Daten stimmen nicht mehr mit dem aktuellen Zustand überein.',
    severity: 'warning',
  },
  unknown: {
    title: 'Synchronisierungsfehler',
    description: 'Der Eintrag konnte nicht synchronisiert werden. Versuchen Sie es später erneut.',
    severity: 'error',
  },
};

export function OfflineConflictDialog({
  open,
  conflict,
  onResolve,
  onRetry,
  loading = false,
}: OfflineConflictDialogProps) {
  if (!conflict) return null;

  const config = conflictMessages[conflict.type] || conflictMessages.unknown;

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorOutline color="error" />
        {config.title}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alert severity={config.severity}>
            {config.description}
          </Alert>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Fehlerdetails
            </Typography>
            <Stack spacing={0.5} direction="row" flexWrap="wrap" gap={1}>
              <Chip
                size="small"
                label={`Typ: ${conflict.type}`}
                variant="outlined"
              />
              {conflict.errorCode && (
                <Chip
                  size="small"
                  label={`Code: ${conflict.errorCode}`}
                  variant="outlined"
                />
              )}
              <Chip
                size="small"
                label={new Date(conflict.timestamp).toLocaleTimeString('de-DE')}
                variant="outlined"
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Fehlermeldung
            </Typography>
            <Typography
              variant="body2"
              sx={{
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                wordBreak: 'break-word',
              }}
            >
              {conflict.message}
            </Typography>
          </Box>

          <Alert severity="info">
            Sie können den Eintrag verwerfen oder versuchen, ihn neu zu synchronisieren, wenn der Fehler behoben wurde.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={() => onResolve(true)}
          disabled={loading}
          startIcon={<Delete />}
          color="error"
          variant="outlined"
        >
          Verwerfen
        </Button>
        <Button
          onClick={onRetry}
          disabled={loading}
          startIcon={<Refresh />}
          variant="contained"
          color="primary"
        >
          Erneut versuchen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
