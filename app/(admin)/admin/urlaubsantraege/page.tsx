'use client';

import { useState } from 'react';
import { logger } from '@/lib/logging';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { timesService, type TimeEntry } from '@/lib/services/times';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Person,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { firebaseStorageService } from '@/lib/services/firebaseStorage';
import { toast } from '@/lib/utils/toast';

interface VacationRequestDetailDialogProps {
  open: boolean;
  onClose: () => void;
  request: TimeEntry | null;
  onApprove: (id: string, signatureUrl: string, adminName: string) => void;
  onReject: (id: string, signatureUrl: string, adminName: string, reason: string) => void;
  isLoading?: boolean;
}

function VacationRequestDetailDialog({
  open,
  onClose,
  request,
  onApprove,
  onReject,
  isLoading = false,
}: VacationRequestDetailDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const { user } = useAuth();

  if (!request) return null;

  const handleSignatureSave = async (dataUrl: string, signerName?: string) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' });
      
      const uploadResult = await firebaseStorageService.uploadFile(
        file,
        `signatures/vacation/admin/${user?.id || 'unknown'}/${Date.now()}.png`
      );
      
      setSignatureDataUrl(uploadResult.url);
      setSignatureOpen(false);

      if (action === 'approve') {
        onApprove(request.id, uploadResult.url, signerName || user?.displayName || 'Admin');
      } else if (action === 'reject') {
        onReject(request.id, uploadResult.url, signerName || user?.displayName || 'Admin', rejectionReason);
      }
    } catch (error) {
      logger.error('Fehler beim Speichern der Unterschrift', error instanceof Error ? error : new Error(String(error)));
      toast.error('Fehler beim Speichern der Unterschrift');
    }
  };

  const handleApprove = () => {
    if (!signatureDataUrl) {
      setAction('approve');
      setSignatureOpen(true);
    } else {
      onApprove(request.id, signatureDataUrl, user?.displayName || 'Admin');
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Bitte geben Sie einen Ablehnungsgrund ein');
      return;
    }
    if (!signatureDataUrl) {
      setAction('reject');
      setSignatureOpen(true);
    } else {
      onReject(request.id, signatureDataUrl, user?.displayName || 'Admin', rejectionReason);
    }
  };

  const handleClose = () => {
    setAction(null);
    setRejectionReason('');
    setSignatureDataUrl(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Urlaubsantrag bearbeiten
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Mitarbeiter
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {request.employeeName || 'Unbekannt'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Von
              </Typography>
              <Typography variant="body1">
                {request.startDate ? format(request.startDate, 'dd.MM.yyyy', { locale: de }) : '-'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Bis
              </Typography>
              <Typography variant="body1">
                {request.endDate ? format(request.endDate, 'dd.MM.yyyy', { locale: de }) : '-'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Urlaubstage
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {request.days || 0} Tag{request.days !== 1 ? 'e' : ''}
              </Typography>
            </Grid>

            {request.reason && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Grund
                </Typography>
                <Typography variant="body1">{request.reason}</Typography>
              </Grid>
            )}

            {request.employeeSignatureUrl && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Mitarbeiter-Unterschrift
                </Typography>
                <Box
                  component="img"
                  src={request.employeeSignatureUrl}
                  alt="Mitarbeiter-Unterschrift"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                />
                {request.employeeSignedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Unterschrieben am: {format(request.employeeSignedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </Typography>
                )}
              </Grid>
            )}

            {action === 'reject' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Ablehnungsgrund"
                  multiline
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="outlined"
            disabled={isLoading || action === 'reject' && !rejectionReason.trim()}
            startIcon={<Cancel />}
          >
            Ablehnen
          </Button>
          <Button
            onClick={handleApprove}
            color="success"
            variant="contained"
            disabled={isLoading}
            startIcon={<CheckCircle />}
          >
            Genehmigen
          </Button>
        </DialogActions>
      </Dialog>

      <SignatureDialog
        open={signatureOpen}
        title={action === 'approve' ? 'Genehmigung unterschreiben' : 'Ablehnung unterschreiben'}
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        requireName={true}
        nameLabel="Ihr Name"
        initialName={user?.displayName || ''}
      />
    </>
  );
}

export default function VacationRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<TimeEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['vacation-requests', 'pending'],
    queryFn: () => timesService.getPendingVacationRequests(),
    refetchInterval: 30000, // Alle 30 Sekunden aktualisieren
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, signatureUrl, adminName }: { id: string; signatureUrl: string; adminName: string }) => {
      if (!user?.id) throw new Error('Kein Admin-Benutzer gefunden');
      await timesService.approveRejectVacation(id, 'approved', user.id, adminName, signatureUrl);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['times'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Invalidiere auch die berechneten Urlaubstage
      queryClient.invalidateQueries({ queryKey: ['usedVacationDays'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Urlaubsantrag wurde genehmigt');
      setDetailDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Genehmigen: ' + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, signatureUrl, adminName, reason }: { id: string; signatureUrl: string; adminName: string; reason: string }) => {
      if (!user?.id) throw new Error('Kein Admin-Benutzer gefunden');
      await timesService.approveRejectVacation(id, 'rejected', user.id, adminName, signatureUrl, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['times'] });
      // Invalidiere auch die berechneten Urlaubstage (falls bereits genehmigte Anträge vorhanden)
      queryClient.invalidateQueries({ queryKey: ['usedVacationDays'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Urlaubsantrag wurde abgelehnt');
      setDetailDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Ablehnen: ' + error.message);
    },
  });

  const handleViewDetails = async (request: TimeEntry) => {
    // Lade zusätzliche User-Daten falls nötig
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  if (isLoading) return <LoadingSpinner message="Urlaubsanträge werden geladen..." />;
  if (error) return <ErrorDisplay error={error as Error} />;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Urlaubsanträge
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {requests?.length || 0} ausstehende Anträge
        </Typography>
      </Box>

      {requests && requests.length === 0 ? (
        <Card className="glass">
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Keine ausstehenden Urlaubsanträge
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Alle Urlaubsanträge wurden bearbeitet.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} className="glass">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mitarbeiter</TableCell>
                <TableCell>Zeitraum</TableCell>
                <TableCell>Tage</TableCell>
                <TableCell>Eingereicht am</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.map((request: TimeEntry) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2">
                        {request.employeeName || 'Unbekannt'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {request.startDate && request.endDate ? (
                      <Box>
                        <Typography variant="body2">
                          {format(request.startDate, 'dd.MM.yyyy', { locale: de })} - {format(request.endDate, 'dd.MM.yyyy', { locale: de })}
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${request.days || 0} Tag${request.days !== 1 ? 'e' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {request.createdAt ? (
                      <Typography variant="body2">
                        {format(request.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Details anzeigen">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <VacationRequestDetailDialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onApprove={(id, signatureUrl, adminName) => {
          approveMutation.mutate({ id, signatureUrl, adminName });
        }}
        onReject={(id, signatureUrl, adminName, reason) => {
          rejectMutation.mutate({ id, signatureUrl, adminName, reason });
        }}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </Box>
  );
}

