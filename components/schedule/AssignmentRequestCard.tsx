'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { cloudFunctions } from '@/lib/services/cloudFunctions';
import { Assignment, Shift } from '@/lib/types';
import { Cancel, CheckCircle, Info, LocationOn, Schedule, School } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { firebaseStorageService } from '@/lib/services/firebaseStorage';
import { assignmentService } from '@/lib/services/assignments';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';
import { getShiftTypeColor as getShiftTypeColorToken } from '@/lib/design-tokens';

interface AssignmentRequestCardProps {
  assignment: Assignment;
  shift: Shift;
  onStatusChange?: () => void;
}

export function AssignmentRequestCard({
  assignment,
  shift,
  onStatusChange,
}: AssignmentRequestCardProps) {
  const queryClient = useQueryClient();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [signatureOpen, setSignatureOpen] = useState(false);

  // Assignment Status ändern
  const acceptMutation = useMutation({
    mutationFn: () => assignmentService.accept(assignment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      onStatusChange?.();
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (payload: {
      reason?: string;
      signatureDataUrl: string;
      signerName?: string;
    }) => {
      // 1) Signatur hochladen (muss zuerst erfolgreich sein, bevor Status geändert wird)
      const dataUrl = payload.signatureDataUrl;
      const res = await fetch(dataUrl);
      if (!res.ok) {
        throw new Error('Fehler beim Konvertieren der Signatur');
      }
      const blob = await res.blob();
      const file = new File([blob], 'employee-signature.png', { type: 'image/png' });
      const upload = await firebaseStorageService.uploadFile(
        file,
        `signatures/assignments/${assignment.id}/employee-signature.png`,
        { kind: 'assignment-decline', role: 'employee' }
      );

      if (!upload?.url) {
        throw new Error('Upload fehlgeschlagen - keine URL erhalten');
      }

      // 2) CF-Workflow anstoßen (Status -> pending-signature)
      await cloudFunctions.declineAssignment({
        assignmentId: assignment.id,
        declineType: 'nurse-initiated',
        declineReason: payload.reason,
      });

      // 3) Assignment mit Signature-URL anreichern
      await assignmentService.update(assignment.id, {
        employeeSignatureUrl: upload.url,
        employeeSignedAt: new Date(),
        ...(payload.signerName && { formSignatureName: payload.signerName }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      onStatusChange?.();
      setDeclineDialogOpen(false);
      setDeclineReason('');
    },
  });

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'requested':
        return 'info';
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      case 'assigned':
        return 'primary';
      case 'completed':
        return 'default';
      case 'pending-signature':
        return 'warning';
      default:
        return 'default';
    }
  };
  const handleDecline = () => {
    setDeclineDialogOpen(true);
  };

  const handleSignatureSave = async (dataUrl: string, signerName?: string) => {
    setSignatureOpen(false);
    try {
      await declineMutation.mutateAsync({
        reason: declineReason,
        signatureDataUrl: dataUrl,
        signerName,
      });
      // Erfolgreich - Dialog ist bereits geschlossen
    } catch (error) {
      // Bei Fehler Signatur-Dialog wieder öffnen
      setSignatureOpen(true);
      throw error;
    }
  };

  const getStatusLabel = (status: Assignment['status']) => {
    switch (status) {
      case 'requested':
        return 'Anfrage';
      case 'accepted':
        return 'Angenommen';
      case 'declined':
        return 'Abgelehnt';
      case 'assigned':
        return 'Zugewiesen';
      case 'completed':
        return 'Abgeschlossen';
      case 'pending-signature':
        return 'Unterschrift erforderlich';
      default:
        return 'Unbekannt';
    }
  };

  const getShiftTypeColor = (type: Shift['type']) => getShiftTypeColorToken(type);

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  // Bestätigung im Dialog öffnet die Signaturerfassung; Upload & Ablehnung erfolgt danach in handleSignatureSave

  const isPending = acceptMutation.isPending || declineMutation.isPending;
  const canRespond = assignment.status === 'requested';

  return (
    <>
      <GlassCard>
        <CardContent>
          {/* Header mit Status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Schicht
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Schedule sx={{ fontSize: 16, color: getShiftTypeColor(shift.type) }} />
                <Typography variant="body2" sx={{ color: getShiftTypeColor(shift.type) }}>
                  {format(shift.date, 'dd.MM.yyyy', { locale: de })} • {shift.startTime} -{' '}
                  {shift.endTime}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Station {shift.stationId}
                </Typography>
              </Box>
            </Box>

            <Chip
              label={getStatusLabel(assignment.status)}
              color={
                getStatusColor(assignment.status) as
                  | 'default'
                  | 'primary'
                  | 'secondary'
                  | 'error'
                  | 'info'
                  | 'success'
                  | 'warning'
              }
              size="small"
            />
          </Box>

          {/* Qualifikationen */}
          {shift.requiredQualifications.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Erforderliche Qualifikationen:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {shift.requiredQualifications.map(qualification => (
                  <Chip
                    key={qualification}
                    label={qualification}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Notizen */}
          {shift.notes && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Info sx={{ fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {shift.notes}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Assignment-spezifische Notizen */}
          {assignment.notes && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Nachricht:</strong> {assignment.notes}
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Ablehnungsgrund */}
          {assignment.declineReason && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Ablehnungsgrund:</strong> {assignment.declineReason}
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Unterschrifts-Status */}
          {assignment.requiresSignature && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Unterschrift erforderlich:</strong> Diese Ablehnung muss von einem Admin
                  bestätigt werden.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Penalty Flag */}
          {assignment.penaltyFlag && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>Hinweis:</strong> Diese Ablehnung wurde dokumentiert und kann Auswirkungen
                  auf die Abrechnung haben.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Actions */}
          {canRespond && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={handleDecline}
                disabled={isPending}
                size="small"
              >
                Ablehnen
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={handleAccept}
                disabled={isPending}
                size="small"
              >
                {acceptMutation.isPending ? 'Annehme...' : 'Annehmen'}
              </Button>
            </Box>
          )}

          {/* Signature Dialog */}
          <SignatureDialog
            open={signatureOpen}
            title="Unterschrift zur Ablehnung"
            onClose={() => setSignatureOpen(false)}
            onSave={handleSignatureSave}
            requireName={true}
            nameLabel="Ihr Name"
          />

          {/* Loading State */}
          {isPending && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <InlineSpinner size={24} />
            </Box>
          )}

          {/* Error States */}
          {acceptMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Fehler beim Annehmen: {acceptMutation.error.message}
              </Typography>
            </Alert>
          )}

          {declineMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Fehler beim Ablehnen: {declineMutation.error.message}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </GlassCard>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onClose={() => setDeclineDialogOpen(false)}>
        <DialogTitle>Schicht ablehnen</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Möchten Sie diese Schicht wirklich ablehnen? Diese Aktion kann nicht rückgängig gemacht
            werden.
          </Typography>

          <TextField
            fullWidth
            label="Grund für Ablehnung (optional)"
            multiline
            rows={3}
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
            placeholder="Bitte geben Sie einen Grund für die Ablehnung an..."
            sx={{ mt: 2 }}
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Hinweis:</strong> Die Ablehnung einer zugewiesenen Schicht kann Auswirkungen
              auf Ihre Abrechnung haben und erfordert eine Admin-Unterschrift.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeclineDialogOpen(false);
              setDeclineReason('');
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              setDeclineDialogOpen(false);
              setSignatureOpen(true);
            }}
            color="error"
            variant="contained"
            disabled={declineMutation.isPending}
          >
            {declineMutation.isPending ? 'Lehne ab...' : 'Ablehnen'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
