'use client';

import { logger } from '@/lib/logging';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { DocumentType, DocumentGenerationOptions } from '@/lib/services/documentGeneration';
import { documentGenerationService } from '@/lib/services/documentGeneration';
import { sendDocumentEmail } from '@/lib/services/email';
import { toast } from '@/lib/utils/toast';
import { Close, Description, Email, CheckCircle } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';

interface DocumentGeneratorProps {
  open: boolean;
  onClose: () => void;
  onDocumentGenerated?: (url: string, fileName: string) => void;
}

interface GeneratedResult {
  url: string;
  fileName: string;
  pdfBlob?: Blob;
}

export function DocumentGenerator({ open, onClose, onDocumentGenerated }: DocumentGeneratorProps) {
  const { user } = useAuth();
  const { branding } = useBrandingSettings(user?.id);
  const [documentType, setDocumentType] = useState<DocumentType>('timesheet-report');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [assignmentId, setAssignmentId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleGenerate = async () => {
    if (!documentType) {
      setError('Bitte wählen Sie einen Dokumenttyp aus');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError('Das Enddatum muss nach dem Startdatum liegen');
      return;
    }

    if (!user?.id) {
      setError('Bitte melden Sie sich an, um Dokumente zu erstellen');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const options: DocumentGenerationOptions = {
        type: documentType,
        title: title || undefined,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
        userId: user.id,
        assignmentId: assignmentId || undefined,
        includeSignatures: true,
        companyLegalInfo: branding ? {
          companyName: branding.companyName,
          companyLogo: branding.companyLogo,
          street: branding.legalStreet,
          postalCode: branding.legalPostalCode,
          city: branding.legalCity,
          phone: branding.legalPhone,
          email: branding.legalEmail,
          web: branding.legalWeb,
          registerCourt: branding.legalRegisterCourt,
          registerNumber: branding.legalRegisterNumber,
          managingDirectors: branding.legalManagingDirectors,
          vatId: branding.legalVatId,
          auegPermit: branding.legalAuegPermit,
        } : undefined,
      };

      const result = await documentGenerationService.generateDocument(options);

      toast.success('Dokument erfolgreich erstellt!');

      if (onDocumentGenerated) {
        onDocumentGenerated(result.url, result.fileName);
      }

      setGeneratedResult({ url: result.url, fileName: result.fileName, pdfBlob: result.pdfBlob });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Erstellen des Dokuments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    if (
      generatedResult.url.startsWith('https://firebasestorage.googleapis.com') ||
      generatedResult.url.startsWith('http://localhost')
    ) {
      window.open(generatedResult.url, '_blank', 'noopener,noreferrer');
    } else {
      logger.warn('Unerwartete URL für Dokument:', generatedResult.url);
      const link = document.createElement('a');
      link.href = generatedResult.url;
      link.download = generatedResult.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSendEmail = async () => {
    if (!generatedResult?.pdfBlob || !recipientEmail) return;
    setIsSendingEmail(true);
    try {
      await sendDocumentEmail({
        to: recipientEmail,
        subject: `Dokument: ${generatedResult.fileName}`,
        pdfBlob: generatedResult.pdfBlob,
        fileName: generatedResult.fileName,
      });
      toast.success('E-Mail erfolgreich versendet!');
      handleClose();
    } catch {
      toast.error('Fehler beim Senden der E-Mail');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleClose = () => {
    setDocumentType('timesheet-report');
    setTitle('');
    setStartDate(null);
    setEndDate(null);
    setAssignmentId('');
    setError(null);
    setGeneratedResult(null);
    setShowEmailForm(false);
    setRecipientEmail('');
    onClose();
  };

  const documentTypeLabels: Record<DocumentType, string> = {
    'timesheet-report': 'Zeiterfassungsbericht',
    'assignment-confirmation': 'Einsatzbestätigung',
    'shift-summary': 'Schichtzusammenfassung',
    'monthly-report': 'Monatsbericht',
    'custom-report': 'Benutzerdefinierter Bericht',
    'assignment-notification': 'Einsatzmitteilung',
    'assignment-signatures': 'Einsatz mit Signaturen',
    'admin-report': 'Bericht',
  };

  const documentTypeDescriptions: Record<DocumentType, string> = {
    'timesheet-report':
      'Erstellt einen detaillierten Bericht über Ihre Zeiterfassungen für einen bestimmten Zeitraum',
    'assignment-confirmation': 'Generiert eine Bestätigung für einen abgeschlossenen Einsatz',
    'shift-summary': 'Erstellt eine Zusammenfassung aller Schichten für einen Tag',
    'monthly-report': 'Generiert einen umfassenden Monatsbericht mit Statistiken und Übersichten',
    'custom-report': 'Erstellt einen benutzerdefinierten Bericht mit eigenen Daten',
    'assignment-notification': 'Einsatzmitteilung nach § 11 Absatz 2 Satz 4 AÜG',
    'assignment-signatures': 'Generiert ein Dokument mit allen Signaturen eines Einsatzes',
    'admin-report': 'Admin-Bericht (High-End-PDF mit Firmenlogo)',
  };

  const requiresDateRange = ['timesheet-report', 'shift-summary', 'monthly-report'].includes(
    documentType
  );
  const requiresAssignmentId = documentType === 'assignment-confirmation';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Dokument erstellen
            </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={handleClose} startIcon={<Close />}>
            Schließen
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {generatedResult ? (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="body2" fontWeight={600}>
                Dokument erfolgreich erstellt
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {generatedResult.fileName}
              </Typography>
            </Alert>

            {showEmailForm && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Per E-Mail versenden
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Empfänger-E-Mail"
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="empfaenger@beispiel.de"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleSendEmail(); }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !recipientEmail}
                    startIcon={isSendingEmail ? <CircularProgress size={16} /> : <Email />}
                    sx={{ minWidth: 110, flexShrink: 0 }}
                  >
                    {isSendingEmail ? 'Sende...' : 'Senden'}
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Dokumenttyp Auswahl */}
            <FormControl fullWidth>
              <InputLabel>Dokumenttyp</InputLabel>
              <Select
                value={documentType}
                label="Dokumenttyp"
                onChange={e => setDocumentType(e.target.value as DocumentType)}
              >
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {documentTypeDescriptions[documentType]}
              </Typography>
            </FormControl>

            {/* Titel (optional) */}
            {documentType === 'custom-report' && (
              <TextField
                label="Titel"
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
                placeholder="Titel des Berichts"
              />
            )}

            {/* Datumsbereich */}
            {requiresDateRange && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Zeitraum
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <DatePicker
                      label="Von"
                      value={startDate}
                      onChange={newValue => setStartDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                    <DatePicker
                      label="Bis"
                      value={endDate}
                      onChange={newValue => setEndDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                  </Stack>
                </LocalizationProvider>
              </Box>
            )}

            {/* Assignment ID */}
            {requiresAssignmentId && (
              <TextField
                label="Einsatz-ID"
                value={assignmentId}
                onChange={e => setAssignmentId(e.target.value)}
                fullWidth
                placeholder="ID des Einsatzes"
                helperText="Geben Sie die ID des Einsatzes ein, für den Sie eine Bestätigung erstellen möchten"
              />
            )}

            {/* Info Box */}
            <Alert severity="info">
              <Typography variant="body2">
                Das Dokument wird als PDF generiert und kann nach der Erstellung heruntergeladen
                oder per E-Mail versendet werden.
              </Typography>
            </Alert>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {generatedResult ? (
          <>
            <Button onClick={handleClose}>Schließen</Button>
            <Button
              variant="outlined"
              onClick={handleDownload}
              startIcon={<Description />}
            >
              Herunterladen
            </Button>
            {generatedResult.pdfBlob && (
              showEmailForm ? (
                <Button
                  onClick={() => { setShowEmailForm(false); setRecipientEmail(''); }}
                  disabled={isSendingEmail}
                >
                  E-Mail abbrechen
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setShowEmailForm(true)}
                  startIcon={<Email />}
                >
                  Per E-Mail senden
                </Button>
              )
            )}
          </>
        ) : (
          <>
            <Button onClick={handleClose} disabled={isGenerating}>
              Abbrechen
            </Button>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                !documentType ||
                (requiresDateRange && (!startDate || !endDate)) ||
                (requiresAssignmentId && !assignmentId)
              }
              startIcon={isGenerating ? <CircularProgress size={16} /> : <Description />}
              sx={{ minWidth: 150 }}
            >
              {isGenerating ? 'Erstelle...' : 'Dokument erstellen'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
