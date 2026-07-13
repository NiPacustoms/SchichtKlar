'use client';

import { TimeConflict } from '@/lib/types';
import {
  AccessTime,
  Close,
  ExpandLess,
  ExpandMore,
  LocationOn,
  Person,
  Schedule,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';

interface ConflictBannerProps {
  conflicts: TimeConflict[];
  onResolveConflict?: (conflict: TimeConflict) => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export function ConflictBanner({
  conflicts,
  onResolveConflict,
  onDismiss,
  showDetails = false,
}: ConflictBannerProps) {
  const [expanded, setExpanded] = useState(showDetails);
  const [dismissed, setDismissed] = useState(false);

  if (conflicts.length === 0 || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleResolveConflict = (conflict: TimeConflict) => {
    onResolveConflict?.(conflict);
  };

  const getConflictSeverity = (conflict: TimeConflict) => {
    const conflictDuration = conflict.conflictEnd.getTime() - conflict.conflictStart.getTime();
    const hours = conflictDuration / (1000 * 60 * 60);

    if (hours >= 4) return 'error';
    if (hours >= 2) return 'warning';
    return 'info';
  };

  const getConflictSeverityLabel = (conflict: TimeConflict) => {
    const conflictDuration = conflict.conflictEnd.getTime() - conflict.conflictStart.getTime();
    const hours = conflictDuration / (1000 * 60 * 60);

    if (hours >= 4) return 'Kritisch';
    if (hours >= 2) return 'Hoch';
    return 'Niedrig';
  };

  const formatConflictTime = (conflict: TimeConflict) => {
    return `${format(conflict.conflictStart, 'HH:mm', { locale: de })} - ${format(conflict.conflictEnd, 'HH:mm', { locale: de })}`;
  };

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          >
            {expanded ? 'Weniger' : 'Details'}
          </Button>
          <IconButton size="small" aria-label="Schließen" onClick={handleDismiss}>
            <Close />
          </IconButton>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Warning />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {conflicts.length} Zeitkonflikt{conflicts.length > 1 ? 'e' : ''} erkannt
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Es wurden Überschneidungen in den Schichtzeiten gefunden. Bitte überprüfe die Details und
        löse die Konflikte auf.
      </Typography>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {conflicts.map((conflict, index) => (
              <Grid key={index} size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderColor: 'warning.main' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="medium">
                        Konflikt #{index + 1}
                      </Typography>
                      <Chip
                        label={getConflictSeverityLabel(conflict)}
                        color={getConflictSeverity(conflict) as 'error' | 'warning' | 'info'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {formatConflictTime(conflict)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {conflict.facilityName} - {conflict.stationName}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Assignment ID: {conflict.assignmentId}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {format(conflict.conflictStart, 'dd.MM.yyyy', { locale: de })}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => handleResolveConflict(conflict)}
                      >
                        Konflikt auflösen
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {conflicts.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Hinweis:</strong> Zeitkonflikte entstehen, wenn ein Mitarbeiter mehreren
                Schichten zugewiesen ist, die sich zeitlich überschneiden. Klicke auf &quot;Konflikt
                auflösen&quot;, um die Zuweisung zu entfernen.
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Alert>
  );
}
