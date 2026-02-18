'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { firebaseStorageService } from '@/lib/services/firebaseStorage';
import { assignmentService, Assignment } from '@/lib/services/assignments';
import { timesheetService, Timesheet } from '@/lib/services/timesheets';
import { toast } from '@/lib/utils/toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RelievingPersonnelSignatureDialogProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string;
  timesheetId?: string; // Optional: Wenn für ein spezifisches Timesheet
  date: Date;
  onSuccess?: () => void;
}

export function RelievingPersonnelSignatureDialog({
  open,
  onClose,
  assignmentId,
  timesheetId,
  date,
  onSuccess,
}: RelievingPersonnelSignatureDialogProps) {
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('');
  const [, setAssignment] = useState<Assignment | null>(null);
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !assignmentId) return;

    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Load assignment
        const assignmentData = await assignmentService.getById(assignmentId);
        if (!isMounted) return;
        if (!assignmentData) {
          setError('Assignment nicht gefunden');
          setLoading(false);
          return;
        }
        setAssignment(assignmentData);

        // Load timesheet if provided
        if (timesheetId) {
          const timesheetData = await timesheetService.getById(timesheetId);
          if (isMounted) {
            setTimesheet(timesheetData);
          }
        } else {
          // Try to find today's timesheet for this assignment
          const shift = await (
            await import('@/lib/services/shifts')
          ).shiftService.getById(assignmentData.shiftId);
          if (shift) {
            const todayTimesheet = await timesheetService.getByDate(assignmentData.userId, date);
            if (isMounted) {
              setTimesheet(todayTimesheet);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [open, assignmentId, timesheetId, date]);

  const handleSign = () => {
    if (!signerName.trim()) {
      setError('Bitte geben Sie Ihren Namen ein');
      return;
    }
    setSignatureOpen(true);
  };

  const handleSaveSignature = async (dataUrl: string, dialogSignerName?: string) => {
    setSignatureOpen(false);
    setIsSubmitting(true);
    setError(null);

    try {
      if (!assignmentId) {
        throw new Error('Assignment-ID fehlt');
      }

      const finalSignerName = dialogSignerName || signerName;
      if (!finalSignerName.trim()) {
        throw new Error('Name der unterschreibenden Person ist erforderlich');
      }

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      if (!res.ok) {
        throw new Error('Fehler beim Konvertieren der Signatur');
      }
      const blob = await res.blob();
      const file = new File([blob], 'relieving-signature.png', { type: 'image/png' });

      // Upload signature
      const dateStr = date.toISOString().split('T')[0];
      const upload = await firebaseStorageService.uploadFile(
        file,
        `signatures/assignments/${assignmentId}/relieving/${dateStr}.png`,
        {
          kind: 'assignment-relieving',
          role: 'relieving-personnel',
          date: date.toISOString(),
          signerName: finalSignerName,
          ...(signerRole ? { signerRole } : {}),
        }
      );

      if (!upload?.url) {
        throw new Error('Upload fehlgeschlagen - keine URL erhalten');
      }

      // Prepare verified times from timesheet
      const verifiedTimes = timesheet
        ? {
            startTime: timesheet.startTime,
            endTime: timesheet.endTime,
            breakMinutes: timesheet.breakMinutes || 0,
            totalHours: timesheet.totalHours || 0,
          }
        : undefined;

      // Add relieving signature to assignment
      await assignmentService.addRelievingSignature(assignmentId, {
        date: dateStr,
        signerName: finalSignerName,
        signerRole: signerRole || undefined,
        signatureUrl: upload.url,
        signedAt: new Date(),
        timesheetId: timesheetId || timesheet?.id,
        verifiedTimes,
      });

      toast.success('Signatur erfolgreich gespeichert');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Speichern der Signatur';
      setError(errorMessage);
      toast.error(errorMessage);
      setSignatureOpen(true); // Reopen signature dialog
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Lade Daten...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open && !signatureOpen} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Signatur durch ablösendes Personal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Datum: {format(date, 'dd.MM.yyyy', { locale: de })}
                </Typography>

                {timesheet ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Erfasste Zeiten zur Verifizierung:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Startzeit"
                          value={timesheet.startTime}
                          size="small"
                          fullWidth
                          disabled
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Endzeit"
                          value={timesheet.endTime}
                          size="small"
                          fullWidth
                          disabled
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Pausen (Minuten)"
                          value={timesheet.breakMinutes || 0}
                          size="small"
                          fullWidth
                          disabled
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Gesamtstunden"
                          value={`${timesheet.totalHours || 0}h`}
                          size="small"
                          fullWidth
                          disabled
                        />
                      </Grid>
                    </Grid>
                    {timesheet.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Notizen: {timesheet.notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">
                    Keine Zeiterfassung für heute gefunden. Bitte verifizieren Sie die Zeiten
                    manuell.
                  </Alert>
                )}
              </CardContent>
            </Card>

            <TextField
              label="Name der unterschreibenden Person"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              fullWidth
              required
              error={!signerName.trim()}
              helperText={!signerName.trim() ? 'Bitte geben Sie Ihren Namen ein' : ''}
            />

            <FormControl fullWidth>
              <InputLabel>Rolle/Funktion (optional)</InputLabel>
              <Select
                value={signerRole}
                onChange={e => setSignerRole(e.target.value)}
                label="Rolle/Funktion (optional)"
              >
                <MenuItem value="">Keine Angabe</MenuItem>
                <MenuItem value="Pflegekraft">Pflegekraft</MenuItem>
                <MenuItem value="Schichtleitung">Schichtleitung</MenuItem>
                <MenuItem value="Stationsleitung">Stationsleitung</MenuItem>
                <MenuItem value="Einrichtungsleitung">Einrichtungsleitung</MenuItem>
                <MenuItem value="Andere">Andere</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              Bitte verifizieren Sie die oben angezeigten Zeiten. Wenn die Zeiten korrekt sind,
              bestätigen Sie dies mit Ihrer Unterschrift.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSign}
            variant="contained"
            disabled={isSubmitting || !signerName.trim()}
            data-testid="relieving-signature-submit"
            aria-label="Unterschrift durch ablösendes Personal abgeben"
          >
            Unterschreiben
          </Button>
        </DialogActions>
      </Dialog>

      <SignatureDialog
        open={signatureOpen}
        title="Unterschrift durch ablösendes Personal"
        onClose={() => setSignatureOpen(false)}
        onSave={handleSaveSignature}
        requireName={!signerName.trim()}
        nameLabel="Name der unterschreibenden Person"
        initialName={signerName}
      />
    </>
  );
}
